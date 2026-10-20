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

// Correspondencia orientativa con los 16 Leadership Principles de Amazon: solo los nombres públicos.
// Las descripciones son de redacción propia y no reproducen los textos oficiales.
export const PRINCIPIOS = [
  { nombre: 'Customer Obsession', comp: ['cliente'], des: { es: 'Empezar por la persona a la que sirves.', en: 'Start from the person you serve.' } },
  { nombre: 'Ownership', comp: ['iniciativa', 'resultados'], des: { es: 'Responder por el resultado más allá de tu tarea.', en: 'Answer for the outcome beyond your own task.' } },
  { nombre: 'Invent and Simplify', comp: ['problemas', 'iniciativa'], des: { es: 'Buscar la solución más sencilla que funcione.', en: 'Look for the simplest solution that works.' } },
  { nombre: 'Are Right, A Lot', comp: ['analisis'], des: { es: 'Decidir bien a menudo, contrastando con otras opiniones.', en: 'Decide well often, checking against other views.' } },
  { nombre: 'Learn and Be Curious', comp: ['aprendizaje'], des: { es: 'Aprender siempre y explorar lo que no conoces.', en: 'Keep learning and explore what you do not know.' } },
  { nombre: 'Hire and Develop the Best', comp: ['liderazgo', 'equipo'], des: { es: 'Ayudar a que otras personas crezcan.', en: 'Help other people grow.' } },
  { nombre: 'Insist on the Highest Standards', comp: ['analisis', 'resultados'], des: { es: 'No conformarse con un trabajo a medias.', en: 'Do not settle for half-done work.' } },
  { nombre: 'Think Big', comp: ['liderazgo', 'iniciativa'], des: { es: 'Proponer metas ambiciosas y explicarlas.', en: 'Propose ambitious goals and explain them.' } },
  { nombre: 'Bias for Action', comp: ['presion', 'iniciativa'], des: { es: 'Actuar con rapidez cuando el riesgo es asumible.', en: 'Act quickly when the risk is acceptable.' } },
  { nombre: 'Frugality', comp: ['problemas', 'resultados'], des: { es: 'Conseguir más con menos recursos.', en: 'Achieve more with fewer resources.' } },
  { nombre: 'Earn Trust', comp: ['etica', 'comunicacion'], des: { es: 'Escuchar, ser honesto y reconocer errores.', en: 'Listen, be honest and admit mistakes.' } },
  { nombre: 'Dive Deep', comp: ['analisis'], des: { es: 'Bajar a los detalles y comprobar los datos.', en: 'Go into the details and check the data.' } },
  { nombre: 'Have Backbone; Disagree and Commit', comp: ['conflictos', 'etica'], des: { es: 'Discrepar con respeto y apoyar la decisión final.', en: 'Disagree respectfully, then back the final decision.' } },
  { nombre: 'Deliver Results', comp: ['resultados', 'presion'], des: { es: 'Cumplir lo importante a pesar de los obstáculos.', en: 'Deliver what matters despite obstacles.' } },
  { nombre: 'Strive to be Earth’s Best Employer', comp: ['equipo', 'liderazgo'], des: { es: 'Cuidar el entorno de trabajo de quienes te rodean.', en: 'Care for the work environment of those around you.' } },
  { nombre: 'Success and Scale Bring Broad Responsibility', comp: ['etica'], des: { es: 'Pensar en el efecto de tu trabajo más allá de la empresa.', en: 'Think about the effect of your work beyond the company.' } },
];
