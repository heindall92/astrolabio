// Contenido por ruta, normalizado: { preguntas, modelos, glosario }.
import { RED_Q, RED_MODELOS, RED_GLOSARIO } from './red.js';
import { BLUE_Q, BLUE_MODELOS, BLUE_GLOSARIO } from './blue.js';
import { GRC_Q, GRC_MODELOS, GRC_GLOSARIO } from './grc.js';
import { DATA_Q, DATA_MODELOS, DATA_GLOSARIO } from './data.js';

function buildRole(rol, qs, modelos, glosario) {
  return {
    preguntas: qs.map(([id, comp, es, en]) => ({ id, rol, comp, es, en })),
    modelos,
    glosario: glosario.map(([id, tes, ten, des, den]) => ({ id, termino: { es: tes, en: ten }, def: { es: des, en: den } })),
  };
}

export const ROLE_CONTENT = {
  red: buildRole('red', RED_Q, RED_MODELOS, RED_GLOSARIO),
  blue: buildRole('blue', BLUE_Q, BLUE_MODELOS, BLUE_GLOSARIO),
  grc: buildRole('grc', GRC_Q, GRC_MODELOS, GRC_GLOSARIO),
  data: buildRole('data', DATA_Q, DATA_MODELOS, DATA_GLOSARIO),
};

export function allQuestions() {
  return Object.values(ROLE_CONTENT).flatMap(r => r.preguntas);
}
