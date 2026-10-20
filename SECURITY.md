# Seguridad

## Modelo de amenazas

Astrolabio guarda **datos personales**: vivencias laborales que pueden mencionar clientes, compañeros o incidentes. El objetivo es que esos datos no salgan nunca del dispositivo y que un archivo importado no pueda ejecutar código.

| Amenaza | Mitigación |
|---|---|
| Fuga de datos por red | No hay servidor ni analítica. CSP con `connect-src 'none'`: el navegador bloquea cualquier petición. |
| Ejecución de código inyectado (XSS) | Todo el texto del usuario entra al DOM con `textContent`. CSP con `script-src` y `style-src` limitados a los hashes del build; sin `unsafe-inline` ni `unsafe-eval`. |
| JSON importado malicioso | `safeParse` descarta `__proto__`, `constructor` y `prototype`; `sanitizeState` reconstruye campo a campo con límites de longitud y número de elementos. Máximo 5 MB. |
| Datos de clientes en las historias | Detector de IP, correos, dominios internos, CVE y nombres marcados como confidenciales. |
| Datos dañados en `localStorage` | Se guarda una copia aparte (`astrolabio-estado-corrupto`) y la app arranca con un estado vacío. |
| Voz | El reconocimiento de voz del navegador puede enviar audio a servidores externos: va desactivado por defecto y avisado. |

## Política de seguridad de contenido

```
default-src 'none'; script-src 'sha256-…'; style-src 'sha256-…'; font-src data:; img-src data:;
media-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'
```

## Informar de una vulnerabilidad

Escribe a yoandyramirezdelgado@gmail.com con los pasos para reproducirla. No abras una incidencia pública.
