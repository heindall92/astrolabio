// Baúl de notas («field notes»): lo que sabes, guardado con formularios para usarlo en el guion de una
// entrevista. Cada tipo tiene sus campos; los textos de ayuda son de redacción propia.

/** Categorías de herramienta y la etiqueta del léxico de tecnologías con la que se cruzan. */
export const BAUL_CATEGORIAS = [
  ['edr', 'EDR'], ['xdr', 'EDR'], ['siem', 'SIEM'], ['soar', null], ['firewall', 'Firewalls'], ['ids', 'IDS/IPS'],
  ['vuln', 'Gestión de vulnerabilidades'], ['iam', 'IAM'], ['cloud', null], ['red', 'Redes'], ['ofensiva', 'Pentesting'],
  ['forense', 'Análisis forense'], ['scripting', null], ['datos', null], ['grc', 'Análisis de riesgos'], ['desarrollo', null], ['otra', null],
];
export const BAUL_NIVELES = ['laboratorio', 'formacion', 'produccion'];

/**
 * Tipos de nota. Cada campo: [id, tipo de control, máximo de caracteres]. El primero es el título.
 * Controles: 'linea' (una línea), 'texto' (varias líneas), 'claves' (separadas por comas), 'categoria', 'nivel'.
 */
export const BAUL_TIPOS = [
  { id: 'herramienta', icono: 'wrench', campos: [['nombre', 'linea', 80], ['categoria', 'categoria', 20], ['definicion', 'texto', 400], ['uso', 'texto', 800], ['nivel', 'nivel', 20], ['cifra', 'linea', 200], ['claves', 'claves', 200]] },
  { id: 'concepto', icono: 'lightbulb', campos: [['termino', 'linea', 80], ['sencillo', 'texto', 400], ['tecnico', 'texto', 800], ['ejemplo', 'texto', 600], ['claves', 'claves', 200]] },
  { id: 'proyecto', icono: 'flask-conical', campos: [['nombre', 'linea', 100], ['objetivo', 'texto', 400], ['hice', 'texto', 800], ['stack', 'claves', 200], ['resultado', 'linea', 240], ['claves', 'claves', 200]] },
  { id: 'certificacion', icono: 'badge-check', campos: [['nombre', 'linea', 100], ['entidad', 'linea', 80], ['fecha', 'linea', 20], ['aprendi', 'texto', 600], ['demuestra', 'texto', 400]] },
  { id: 'empresa', icono: 'building-2', campos: [['nombre', 'linea', 80], ['hace', 'texto', 400], ['noticia', 'texto', 400], ['encaje', 'texto', 400], ['valores', 'linea', 200], ['pregunta', 'linea', 240]] },
  { id: 'idea', icono: 'notebook-pen', campos: [['titulo', 'linea', 100], ['texto', 'texto', 2000], ['claves', 'claves', 200]] },
];

export const BAUL_LIMITES = { notas: 300 };
