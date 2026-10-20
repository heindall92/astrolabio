// Las 12 competencias genéricas de Astrolabio y su correspondencia orientativa con
// los nombres públicos de los Leadership Principles de Amazon. Descripciones de redacción propia.

export const COMPETENCIAS = [
  { id: 'iniciativa', icono: 'flame', es: 'Iniciativa y responsabilidad', en: 'Initiative and ownership',
    des: { es: 'Actúas sin esperar a que te lo pidan y respondes por el resultado de principio a fin.', en: 'You act without being asked and answer for the outcome from start to finish.' } },
  { id: 'cliente', icono: 'users', es: 'Orientación al cliente', en: 'Customer focus',
    des: { es: 'Partes de lo que necesita quien usa tu trabajo, aunque sea un compañero de otro equipo.', en: 'You start from what the people using your work need, even if they are colleagues.' } },
  { id: 'aprendizaje', icono: 'book-open', es: 'Aprendizaje continuo', en: 'Continuous learning',
    des: { es: 'Buscas lo que no sabes, lo estudias y lo aplicas rápido.', en: 'You look for what you do not know, study it and apply it quickly.' } },
  { id: 'analisis', icono: 'search', es: 'Análisis y detalle', en: 'Analysis and attention to detail',
    des: { es: 'Bajas a los datos, compruebas las suposiciones y detectas lo que otros pasan por alto.', en: 'You dig into the data, check assumptions and spot what others miss.' } },
  { id: 'problemas', icono: 'lightbulb', es: 'Resolución de problemas', en: 'Problem solving',
    des: { es: 'Divides un problema difícil en partes y encuentras una salida práctica.', en: 'You break a hard problem into parts and find a practical way out.' } },
  { id: 'comunicacion', icono: 'message-square-quote', es: 'Comunicación', en: 'Communication',
    des: { es: 'Explicas lo técnico con claridad y adaptas el mensaje a quien escucha.', en: 'You explain technical matters clearly and adapt the message to the listener.' } },
  { id: 'equipo', icono: 'users', es: 'Trabajo en equipo', en: 'Teamwork',
    des: { es: 'Colaboras, compartes lo que sabes y haces que el equipo rinda más.', en: 'You collaborate, share what you know and help the team perform better.' } },
  { id: 'liderazgo', icono: 'target', es: 'Liderazgo e influencia', en: 'Leadership and influence',
    des: { es: 'Convences sin imponer y mueves a otros hacia un objetivo común.', en: 'You persuade without imposing and move others towards a shared goal.' } },
  { id: 'conflictos', icono: 'scale', es: 'Gestión de conflictos', en: 'Conflict management',
    des: { es: 'Afrontas los desacuerdos con respeto y buscas una solución que funcione para todos.', en: 'You face disagreements respectfully and look for a solution that works.' } },
  { id: 'presion', icono: 'timer', es: 'Trabajo bajo presión', en: 'Working under pressure',
    des: { es: 'Mantienes la calma, priorizas y entregas con plazos ajustados o en plena crisis.', en: 'You stay calm, prioritise and deliver under tight deadlines or in a crisis.' } },
  { id: 'etica', icono: 'shield-check', es: 'Ética y confianza', en: 'Ethics and trust',
    des: { es: 'Dices la verdad aunque sea incómoda, cumples lo que prometes y proteges los datos.', en: 'You tell the truth even when it is uncomfortable, keep promises and protect data.' } },
  { id: 'resultados', icono: 'trophy', es: 'Resultados', en: 'Delivering results',
    des: { es: 'Te fijas metas claras, mides el impacto y cumples aunque haya obstáculos.', en: 'You set clear goals, measure impact and deliver despite obstacles.' } },
];

export const COMPETENCIA_IDS = COMPETENCIAS.map(c => c.id);
