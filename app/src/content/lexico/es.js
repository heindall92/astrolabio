// Léxico en español para el analizador STAR. Redacción propia.

export const LEX_ES = {
  verbosAccion: [
    'analicé', 'prioricé', 'automaticé', 'escalé', 'negocié', 'diseñé', 'implanté', 'implementé', 'documenté',
    'investigué', 'propuse', 'convencí', 'reduje', 'mejoré', 'detecté', 'corregí', 'coordiné', 'lideré', 'organicé',
    'expliqué', 'presenté', 'construí', 'desarrollé', 'programé', 'configuré', 'revisé', 'audité', 'medí',
    'comparé', 'decidí', 'planifiqué', 'monté', 'creé', 'escribí', 'contacté', 'pregunté', 'aislé', 'contuve',
    'bloqueé', 'reproduje', 'validé', 'probé', 'simplifiqué', 'formé', 'enseñé', 'resolví', 'identifiqué',
    'calculé', 'limpié', 'cuantifiqué', 'recopilé', 'elaboré', 'redacté', 'acordé', 'asumí', 'reorganicé',
    'optimicé', 'migré', 'desplegué', 'parcheé', 'monitoricé', 'correlacioné', 'triagé', 'clasifiqué', 'dividí',
    'delegué', 'pedí', 'llamé', 'reuní', 'preparé', 'entrevisté', 'mapeé', 'rediseñé', 'sustituí', 'eliminé',
    'aprendí', 'estudié', 'practiqué', 'saqué', 'logré', 'conseguí', 'evité', 'abrí', 'cerré', 'informé', 'avisé',
  ],
  // Arranques de frase débiles: describen estados, no acciones.
  arranquesDebiles: ['estuve', 'estaba', 'había', 'hubo', 'se hizo', 'se hicieron', 'tenía', 'era'],
  muletillas: [
    'básicamente', 'un poco', 'cosas', 'algo', 'intenté', 'más o menos', 'digamos', 'o sea', 'en plan',
    'tipo', 'como que', 'bastante', 'varias cosas', 'temas', 'etcétera', 'etc',
  ],
  // Marcas de primera persona del plural (nosotros).
  plural: [
    'nosotros', 'hicimos', 'decidimos', 'analizamos', 'trabajamos', 'logramos', 'conseguimos', 'resolvimos',
    'nuestro equipo', 'el equipo hizo', 'montamos', 'creamos', 'implantamos', 'revisamos', 'detectamos',
    'propusimos', 'planificamos', 'desarrollamos', 'tuvimos', 'fuimos', 'estuvimos', 'pusimos',
  ],
  // Marcas de primera persona del singular además de los verbos de acción.
  singular: ['yo', 'me encargué', 'hice', 'tuve', 'fui', 'puse', 'dije', 'vi', 'traje', 'supe', 'quise', 'pude', 'di'],
  // Palabras terminadas en é/í que no son verbos en primera persona.
  noVerbos: ['qué', 'aquí', 'allí', 'así', 'sí', 'mí', 'ahí', 'café', 'bebé', 'jacuzzi', 'esquí', 'rubí', 'maní', 'josé', 'fue', 'tí', 'ti', 'él', 'hé', 'bambú', 'ok'],
  aprendizaje: ['aprendí', 'la próxima vez', 'ahora siempre', 'desde entonces', 'cambiaría', 'haría distinto', 'me llevé', 'lección'],
  cifrasPalabras: ['doble', 'triple', 'mitad', 'cero', 'ninguna', 'todas', 'antes', 'después', 'por ciento', 'horas', 'minutos', 'días', 'semanas', 'euros'],
};
