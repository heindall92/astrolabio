// Historias de prueba: una buena y una mala por ruta. Redacción propia.
export const BUENAS = {
  red: {
    titulo: 'La inyección que nadie veía',
    s: 'En mis prácticas en una consultora de seguridad, el equipo hacía una auditoría web para un cliente de logística con dos semanas de plazo y un alcance de tres aplicaciones.',
    t: 'Me tocó revisar el portal de proveedores y explicar los hallazgos al responsable de operaciones, que no era técnico.',
    a: 'Primero mapeé todas las rutas del portal con el proxy y prioricé los formularios que tocaban datos de pago. Detecté que un filtro de búsqueda devolvía errores de base de datos y reproduje una inyección SQL en un entorno de pruebas sin tocar producción. Documenté cada paso con capturas, validé el impacto con mi tutor y calculé cuántos registros quedaban expuestos. Después preparé una explicación de una página con una analogía de una puerta mal cerrada y la presenté yo mismo en la reunión con operaciones. Propuse una corrección con consultas parametrizadas y acordé con el desarrollador una fecha para volver a probar.',
    r: 'El cliente corrigió el fallo en 4 días en lugar de las 3 semanas habituales y la nueva prueba confirmó que los 12.000 registros de proveedores ya no estaban expuestos.',
    l: 'Aprendí que un hallazgo crítico solo sirve si la otra persona entiende el riesgo, así que ahora siempre preparo la versión no técnica antes que el informe.',
  },
  blue: {
    titulo: 'La alerta de las 3:00',
    s: 'Trabajaba de analista junior en un SOC de un banco mediano durante una guardia nocturna, con un único compañero y más de 200 alertas abiertas en la cola.',
    t: 'Tenía que decidir qué alertas atender primero y si alguna justificaba despertar al responsable de incidentes.',
    a: 'Clasifiqué la cola por criticidad del activo y aislé una alerta de inicio de sesión que el sistema marcaba como falso positivo. Correlacioné los registros del proxy y del directorio y detecté que la misma cuenta había entrado desde dos países en diez minutos. Bloqueé la sesión según el procedimiento, avisé al responsable con un resumen de tres líneas y documenté la cronología mientras él llegaba. Después revisé la regla de detección y propuse un umbral nuevo que tuviera en cuenta los viajes imposibles.',
    r: 'Contuvimos el acceso en 18 minutos, antes de cualquier transferencia, y con la regla nueva los falsos positivos de esa familia bajaron un 35 % el mes siguiente.',
    l: 'La próxima vez documentaría la cronología desde el primer minuto: me habría ahorrado media hora en el informe.',
  },
  grc: {
    titulo: 'El control que nadie quería',
    s: 'En una aseguradora preparábamos la auditoría anual y el área comercial se negaba a aplicar la revisión trimestral de accesos porque decía que le quitaba tiempo de ventas.',
    t: 'Mi responsabilidad era conseguir que el control se aplicara antes de la auditoría, en seis semanas.',
    a: 'Analicé los permisos del área y detecté 40 cuentas con acceso de administración que nadie usaba. Preparé una propuesta sencilla: en lugar de revisar todo, el responsable comercial solo validaría una lista corta que yo generaba cada trimestre. Me reuní con él, le expliqué el riesgo con un ejemplo de su propio sector y negocié un piloto de un mes. Automaticé la lista con una hoja de cálculo y documenté el procedimiento en una página.',
    r: 'La revisión pasó de 6 horas a 25 minutos por trimestre, eliminamos 40 cuentas sobrantes y la auditoría cerró el punto sin hallazgos.',
    l: 'Aprendí que un control se acepta antes cuando se diseña desde el tiempo de quien lo tiene que aplicar.',
  },
  data: {
    titulo: 'El panel que cambió la campaña',
    s: 'En mi máster colaboré con una ONG que repartía alimentos en cinco barrios y decidía las rutas de reparto de memoria, sin mirar datos.',
    t: 'Me encargué de analizar seis meses de entregas y proponer un reparto mejor antes de la campaña de invierno.',
    a: 'Recopilé las hojas de cálculo de cada voluntario, limpié más de 3.000 filas con fechas en formatos distintos y unifiqué los nombres de los barrios. Analicé la demanda por semana y comparé las entregas con el padrón municipal. Detecté que dos barrios recibían la mitad de lo que necesitaban. Diseñé un panel sencillo con tres gráficos y lo presenté a la junta con una recomendación concreta. Después formé a dos voluntarias para que lo actualizaran solas.',
    r: 'La ONG cambió las rutas, las entregas en los dos barrios subieron un 60 % y el tiempo de planificación pasó de un día a dos horas por semana.',
    l: 'Aprendí a empezar por la decisión que hay que tomar y no por el gráfico.',
  },
};

export const MALAS = {
  red: { titulo: 'Un pentest', s: 'Básicamente estábamos haciendo un pentest para un cliente bastante grande, un poco complicado, con muchas cosas y muchos temas que había que mirar y tal, en un proyecto que duró más o menos varios meses y en el que había mucha gente de distintos equipos y departamentos implicados.', t: 'Teníamos que encontrar cosas.', a: 'Hicimos un escaneo y encontramos algo.', r: 'Fue bien.' },
  blue: { titulo: 'Una alerta', s: 'Estaba en el SOC.', t: 'Había alertas.', a: 'Estuve mirando cosas. Estaba revisando algo. Estuve un poco con eso y lo miramos entre todos.', r: 'Se solucionó más o menos.' },
  grc: { titulo: 'Auditoría', s: 'Teníamos una auditoría.', t: 'Había que preparar cosas.', a: 'Nosotros revisamos los documentos y preparamos todo. Hicimos reuniones y tuvimos que hablar con muchos.', r: 'La pasamos.' },
  data: { titulo: 'Un informe', s: 'En la empresa había datos.', t: 'Había que hacer un informe.', a: 'Intenté hacer algo con los datos. Intenté limpiarlos un poco.', r: 'Quedó bastante bien.' },
};

export const BUENA_EN = {
  titulo: 'The 3 a.m. alert',
  s: 'I was a junior analyst in the security operations centre of a mid-sized bank, on a night shift with one colleague and more than 200 open alerts in the queue.',
  t: 'I had to decide which alerts to handle first and whether any of them justified waking up the incident manager.',
  a: 'I triaged the queue by asset criticality and isolated a login alert that the tool had flagged as a false positive. I correlated the proxy and directory logs and detected that the same account had signed in from two countries within ten minutes. I blocked the session following the runbook, warned the manager with a three-line summary and documented the timeline while he was on his way. Afterwards I reviewed the detection rule and proposed a new threshold that accounted for impossible travel.',
  r: 'The access was contained in 18 minutes, before any transfer, and the new rule reduced false positives in that family by 35 percent the following month.',
  l: 'I learned to write the timeline from minute one; next time it would save half an hour on the report.',
};

export const BUENA_EN_GRC = {
  titulo: 'The access review nobody wanted',
  s: 'At an insurance company we were preparing the annual audit, and the sales department refused to run the quarterly access review because it took them a whole afternoon.',
  t: 'I was responsible for getting the control applied before the audit, within six weeks.',
  a: 'I analysed the permissions of the department and found 40 administrator accounts that nobody used. I scripted a report that pre-filled the review, so managers only had to confirm or reject each line. I met the sales director, showed him the risk with two real examples and agreed a fifteen-minute slot each quarter. I documented the procedure, trained two team leads and scheduled reminders in their calendars.',
  r: 'The review went from 6 hours to 25 minutes per quarter, we removed 40 unused accounts and the audit closed that control with no findings.',
  l: 'I learned that a control is accepted faster when it is designed around the time of the people who have to apply it.',
};
export const MALA_EN = {
  titulo: 'An audit',
  s: 'We had an audit.', t: 'There were things to prepare.',
  a: 'We basically reviewed stuff and kind of fixed some things. There was a meeting. We did the report.',
  r: 'It went well.', l: '',
};
