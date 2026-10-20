// Constantes del analizador STAR, de la puntuación y del juego.
// La ayuda «Método STAR» se genera a partir de este archivo: no escribas cifras a mano en otro sitio.

export const VERSION = '0.1.0';

/** Reparto ideal de palabras por bloque (porcentaje mínimo y máximo). */
export const REPARTO = {
  s: { min: 15, max: 20 },
  t: { min: 10, max: 15 },
  a: { min: 50, max: 60 },
  r: { min: 15, max: 20 },
};
/** Margen de tolerancia, en puntos porcentuales, antes de dar un bloque por desequilibrado. */
export const REPARTO_TOLERANCIA = 7;

/** Longitud de la respuesta hablada. */
export const DURACION = { minPalabras: 150, maxPalabras: 350, palabrasPorMinuto: 140 };

/** Porcentaje mínimo de verbos en primera persona del singular dentro de la acción. */
export const YO_MINIMO = 60;

/** Verbos de acción distintos que se esperan en el bloque Acción. */
export const VERBOS_MINIMOS = 3;

/** Muletillas toleradas antes de restar. */
export const MULETILLAS_TOLERADAS = 1;

/** Peso de cada criterio en la nota final (suman 100). */
export const PESOS = {
  reparto: 25,
  duracion: 10,
  yo: 20,
  cifra: 20,
  verbos: 10,
  muletillas: 10,
  aprendizaje: 5,
};

/** Penalización por cada dato sensible detectado y tope. */
export const SENSIBLE = { penalizacion: 10, tope: 20 };

/** Umbrales de estado por nivel del perfil. */
export const UMBRALES = {
  'sin-experiencia': { lista: 55, brillante: 82 },
  junior: { lista: 60, brillante: 85 },
  mid: { lista: 65, brillante: 88 },
  senior: { lista: 70, brillante: 90 },
};

/** Estados de una historia. */
export const ESTADOS = ['borrador', 'lista', 'brillante'];

/** Límites de saneado al importar o cargar datos. */
export const LIMITES = {
  titulo: 120,
  bloque: 4000,
  historias: 300,
  duelos: 2000,
  competenciasPorHistoria: 6,
  insignias: 100,
  nombre: 60,
  sensibles: 30,
  sensible: 60,
  diasHistorial: 1000,
};

/** Valores admitidos en el perfil. */
export const ROLES = ['red', 'blue', 'grc', 'data'];
export const NIVELES = ['sin-experiencia', 'junior', 'mid', 'senior'];
export const EMPRESAS = ['consultora', 'banca', 'tecnologica', 'startup', 'publica', 'industria'];
export const IDIOMAS = ['es', 'en'];
export const TIPOS = ['real', 'ensayo'];
