// Tu marca fuera de la entrevista: kit de LinkedIn, CV de resultados, bóveda y plan de contenido «Field Notes».
// Redacción propia. Las ideas de candidaturas, fórmula XYZ y calendario vienen de ai-job-search-es (del mismo autor).

/**
 * Límites del editor de LinkedIn (titular 220 caracteres, «Acerca de» 2.600 y publicación 3.000), según varias
 * fuentes consultadas el 24-11-2026; LinkedIn no los publica en una página de ayuda accesible y puede cambiarlos.
 */
export const LINKEDIN_LIMITES = { titular: 220, acerca: 2600, post: 3000, pliegue: 210 };

export const LINKEDIN_TXT = {
  es: {
    titularA: '{titular} | {tecs} | {frase}',
    titularB: '{rol} · {ventaja}',
    titularC: '{puesto}{empresa} · {hilo}',
    gancho: '{frase}',
    quien: 'Soy {titular}{anos}. {hilo}',
    quienHilo: 'Mi camino: {hilo}.',
    ventaja: 'Lo que me diferencia: {ventaja}.',
    logros: 'Algunos resultados:',
    puntoVista: 'Lo que pienso: {punto}.',
    tecs: 'Trabajo con: {lista}.',
    cta: 'Si buscas a alguien para {rol}, escríbeme.',
    anos: ', con {n} años de experiencia',
    ctaGenerico: 'Si crees que puedo encajar en tu equipo, escríbeme.',
    recomendacion: 'Hola, {nombre}:\n\nEspero que estés bien. Estoy actualizando mi perfil de LinkedIn y me ayudaría mucho una recomendación tuya. Trabajamos juntos en {proyecto} y, si te encaja, me gustaría que contaras {destacar}.\n\nNo hace falta que sea larga: tres o cuatro frases con algo concreto que recuerdes valen más que un texto genérico. Si prefieres, te devuelvo el favor con una recomendación para ti.\n\nGracias de antemano,\n{yo}',
    recNombre: '[nombre]',
    recProyecto: '[el proyecto o el equipo]',
    recDestacar: '[qué quieres que destaque: un logro o cómo trabajas]',
    recYo: '[tu nombre]',
    y: 'y',
  },
  en: {
    titularA: '{titular} | {tecs} | {frase}',
    titularB: '{rol} · {ventaja}',
    titularC: '{puesto}{empresa} · {hilo}',
    gancho: '{frase}',
    quien: 'I am a {titular}{anos}. {hilo}',
    quienHilo: 'My path: {hilo}.',
    ventaja: 'What sets me apart: {ventaja}.',
    logros: 'Some results:',
    puntoVista: 'What I believe: {punto}.',
    tecs: 'I work with: {lista}.',
    cta: 'If you are looking for someone for {rol}, message me.',
    anos: ' with {n} years of experience',
    ctaGenerico: 'If you think I could fit your team, message me.',
    recomendacion: 'Hi {nombre},\n\nI hope you are well. I am updating my LinkedIn profile and a recommendation from you would help a lot. We worked together on {proyecto} and, if you are happy to, I would like you to mention {destacar}.\n\nIt does not need to be long: three or four sentences with something specific you remember are worth more than a generic text. If you like, I will return the favour with a recommendation for you.\n\nThanks in advance,\n{yo}',
    recNombre: '[name]',
    recProyecto: '[the project or team]',
    recDestacar: '[what you want them to highlight: an achievement or how you work]',
    recYo: '[your name]',
    y: 'and',
  },
};

/** Verbos de acción en primera persona del pasado (para la fórmula XYZ). */
export const VERBOS_XYZ = {
  es: ['administré', 'automaticé', 'analicé', 'aislé', 'audité', 'bajé', 'coordiné', 'configuré', 'construí', 'contuve', 'creé', 'definí', 'desplegué', 'detecté', 'diseñé', 'documenté', 'escribí', 'formé', 'gestioné', 'implanté', 'implementé', 'integré', 'investigué', 'lideré', 'logré', 'mejoré', 'migré', 'monté', 'monitoricé', 'optimicé', 'organicé', 'presenté', 'prioricé', 'reduje', 'resolví', 'revisé', 'subí', 'triplé', 'dupliqué', 'atendí', 'desarrollé', 'lancé', 'negocié', 'redacté', 'ahorré', 'aumenté', 'corregí', 'parcheé', 'endurecí', 'cerré'],
  en: ['administered', 'automated', 'analysed', 'analyzed', 'isolated', 'audited', 'cut', 'coordinated', 'configured', 'built', 'contained', 'created', 'defined', 'deployed', 'detected', 'designed', 'documented', 'wrote', 'trained', 'managed', 'implemented', 'integrated', 'investigated', 'led', 'achieved', 'improved', 'migrated', 'monitored', 'optimised', 'optimized', 'organised', 'presented', 'prioritised', 'reduced', 'resolved', 'reviewed', 'raised', 'tripled', 'doubled', 'supported', 'developed', 'launched', 'negotiated', 'drafted', 'saved', 'increased', 'fixed', 'patched', 'hardened', 'closed'],
};
/** Sustantivo de acción al inicio de una viñeta → verbo en primera persona («Administración de…» → «Administré…»). */
export const A_VERBO = {
  'administracion': 'Administré', 'gestion': 'Gestioné', 'implantacion': 'Implanté', 'implementacion': 'Implementé', 'despliegue': 'Desplegué',
  'configuracion': 'Configuré', 'mantenimiento': 'Mantuve', 'monitorizacion': 'Monitoricé', 'desarrollo': 'Desarrollé', 'analisis': 'Analicé',
  'elaboracion': 'Elaboré', 'coordinacion': 'Coordiné', 'atencion': 'Atendí', 'migracion': 'Migré', 'automatizacion': 'Automaticé',
  'revision': 'Revisé', 'creacion': 'Creé', 'diseno': 'Diseñé', 'soporte': 'Di soporte a', 'triaje': 'Hice el triaje de', 'participacion': 'Participé en',
  'responsable': 'Fui responsable de', 'apoyo': 'Apoyé', 'realizacion': 'Realicé', 'investigacion': 'Investigué', 'documentacion': 'Documenté',
};
/** «Cómo»: herramienta o método (con, mediante, usando…). */
export const COMO_XYZ = {
  es: ['con ', 'mediante', 'usando', 'gracias a', 'a través de', 'ajustando', 'aplicando', 'creando', 'automatizando', 'implantando', 'migrando', 'escribiendo'],
  en: ['with ', 'using', 'by ', 'through', 'via ', 'thanks to', 'leveraging', 'applying'],
};

/** Señales de texto genérico o con piloto automático en un borrador (listas propias, minúsculas y sin tildes). */
export const AUDITORIA = {
  es: {
    relleno: ['en el panorama actual', 'en el mundo de hoy', 'sin lugar a dudas', 'cabe destacar', 'es crucial', 'es fundamental', 'en la era digital', 'no es solo', 'mas que nunca', 'un viaje', 'navegar el', 'desbloquear', 'potenciar', 'sinergia', 'revolucionar', 'game changer', 'apasionado por', 'me complace anunciar', 'emocionado de compartir', 'te cuento un secreto', 'nadie te dice'],
    cebo: ['comenta si', 'dale like', 'comparte si', 'escribe si en los comentarios', 'etiqueta a'],
  },
  en: {
    relleno: ['in today\'s landscape', 'in today\'s world', 'without a doubt', 'it\'s worth noting', 'it is crucial', 'in the digital age', 'not just', 'more than ever', 'a journey', 'navigate the', 'unlock', 'leverage', 'synergy', 'revolutionise', 'revolutionize', 'game changer', 'passionate about', 'thrilled to announce', 'excited to share', 'nobody tells you'],
    cebo: ['comment yes', 'like if', 'share if', 'type yes', 'tag someone'],
  },
};

/** Reglas del borrador de post (las muestra la ayuda). */
export const POST_REGLAS = { min: 600, max: 1300, gancho: 140, hashtags: 3 };

/** Plantillas del borrador de un post «Field Notes» a partir de una nota del Baúl. */
export const POST_TXT = {
  es: {
    serie: 'Field Notes #{n}',
    ganchoCifra: '{cifra}',
    ganchoPunto: '{punto}',
    ganchoTitulo: 'Lo que he aprendido de {titulo}, en pocas líneas.',
    herramienta: '{titulo}, en una frase: {definicion}\n\nQué hice con ella: {uso}',
    concepto: '{titulo}, explicado sin jerga: {sencillo}\n\nPara quien quiera el detalle técnico: {tecnico}\n\nUn ejemplo: {ejemplo}',
    proyecto: 'El objetivo: {objetivo}\n\nLo que hice: {hice}\n\nEl resultado: {resultado}',
    certificacion: 'Lo que aprendí con {titulo} y uso cada semana: {aprendi}\n\nQué demuestra: {demuestra}',
    idea: '{texto}',
    leccion: 'La lección: [qué harías distinto o qué recomiendas].',
    cierre: '¿Cómo lo hacéis en vuestro equipo?',
  },
  en: {
    serie: 'Field Notes #{n}',
    ganchoCifra: '{cifra}',
    ganchoPunto: '{punto}',
    ganchoTitulo: 'What I have learned about {titulo}, in a few lines.',
    herramienta: '{titulo}, in one sentence: {definicion}\n\nWhat I did with it: {uso}',
    concepto: '{titulo}, explained without jargon: {sencillo}\n\nFor those who want the technical detail: {tecnico}\n\nAn example: {ejemplo}',
    proyecto: 'The goal: {objetivo}\n\nWhat I did: {hice}\n\nThe result: {resultado}',
    certificacion: 'What I learned with {titulo} and use every week: {aprendi}\n\nWhat it proves: {demuestra}',
    idea: '{texto}',
    leccion: 'The lesson: [what you would do differently or recommend].',
    cierre: 'How does your team do it?',
  },
};
