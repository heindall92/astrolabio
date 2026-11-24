"""Genera los CV de ejemplo (ficticios) en varios formatos para probar el lector de documentos.
Uso: python3 tests/fixtures/cv/generar.py   (necesita pandoc, LibreOffice y Playwright con Chromium)
Los archivos se versionan: las pruebas no dependen de estas herramientas.
"""
import pathlib
import shutil
import subprocess
import tempfile

AQUI = pathlib.Path(__file__).resolve().parent

CV_ES = """# Marta Vidal Soler

Analista SOC junior · Valencia · marta.vidal@example.com · +34 600 000 000

## Perfil

Analista SOC junior con dos años en monitorización y respuesta a incidentes. Me especializo en EDR/XDR y en reducir falsos positivos.

## Experiencia

**Analista SOC N1** · Ciberdefensa Levante (ficticia) · 03/2024 – actualidad

- Triaje de 40 alertas diarias en Wazuh y CrowdStrike Falcon (EDR).
- Reduje un 30 % los falsos positivos ajustando 12 reglas de correlación.
- Escribí 8 playbooks de respuesta a phishing alineados con MITRE ATT&CK.

**Técnica de soporte IT** · Hotel Mediterráneo (ficticio) · 06/2022 – 02/2024

- Atendí 25 incidencias semanales de usuarios y redes.
- Migré 60 equipos a Microsoft 365 sin parada del servicio.

## Formación

Técnico Superior en Administración de Sistemas en Red (ASIR) · 2020 – 2022

## Certificaciones

- eJPT (eLearnSecurity Junior Penetration Tester) · 2024
- CompTIA Security+ · 2025

## Proyectos

- Laboratorio de detección con Wazuh y Sysmon en casa: 15 reglas propias.

## Habilidades

Wazuh, Splunk, CrowdStrike, Microsoft Defender, Python, Linux, MITRE ATT&CK, Wireshark.

## Idiomas

Español nativo · Inglés B2
"""

CV_EN = """# Daniel Ortega

Junior Cloud Engineer · Madrid · daniel.ortega@example.com

## Summary

Junior cloud engineer with three years of experience automating infrastructure on AWS and Azure.

## Experience

**Cloud Support Engineer** · Nimbus Data (fictitious) · Jan 2023 – Present

- Automated 45 deployments with Terraform and GitHub Actions.
- Cut monthly cloud costs by 18% by rightsizing 70 instances.

**IT Technician** · City Library (fictitious) · Sep 2021 – Dec 2022

- Supported 120 users across Windows and Linux.

## Education

BSc Computer Engineering · 2017 – 2021

## Certifications

- AWS Certified Solutions Architect – Associate · 2024

## Skills

AWS, Azure, Terraform, Docker, Kubernetes, Python, Bash, Linux.

## Languages

English C1 · Spanish native
"""


def html(md):
    return subprocess.run(['pandoc', '-f', 'markdown', '-t', 'html', '-s', '--metadata', 'pagetitle=CV'], input=md, capture_output=True, text=True, check=True).stdout


def main():
    from playwright.sync_api import sync_playwright
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        for nombre, md in (('cv-es', CV_ES), ('cv-en', CV_EN)):
            (AQUI / f'{nombre}.txt').write_text(md, encoding='utf-8')
            src = tmp / f'{nombre}.md'
            src.write_text(md, encoding='utf-8')
            subprocess.run(['pandoc', str(src), '-o', str(AQUI / f'{nombre}.docx')], check=True)
            subprocess.run(['pandoc', str(src), '-o', str(AQUI / f'{nombre}.odt')], check=True)
            # PDF de LibreOffice (fuentes TrueType con ToUnicode y flujos de objetos).
            subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', str(tmp), str(AQUI / f'{nombre}.docx')], check=True, capture_output=True)
            shutil.copy(tmp / f'{nombre}.pdf', AQUI / f'{nombre}-libreoffice.pdf')
        # PDF de Chromium (como «Imprimir en PDF» desde el navegador o Google Docs).
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page()
            pg.set_content(html(CV_ES))
            pg.pdf(path=str(AQUI / 'cv-es-chromium.pdf'), format='A4')
            b.close()
    print('CV de ejemplo generados en', AQUI)


if __name__ == '__main__':
    main()
