// Contenido por ruta, normalizado: { preguntas, modelos, glosario }.
import { RED_Q, RED_MODELOS, RED_GLOSARIO } from './red.js';
import { BLUE_Q, BLUE_MODELOS, BLUE_GLOSARIO } from './blue.js';
import { GRC_Q, GRC_MODELOS, GRC_GLOSARIO } from './grc.js';
import { DATA_Q, DATA_MODELOS, DATA_GLOSARIO } from './data.js';
import { CLOUD_Q, CLOUD_MODELOS, CLOUD_GLOSARIO } from './cloud.js';
import { DEV_Q, DEV_MODELOS, DEV_GLOSARIO } from './dev.js';
import { APPSEC_Q, APPSEC_MODELOS, APPSEC_GLOSARIO } from './appsec.js';
import { IA_Q, IA_MODELOS, IA_GLOSARIO } from './ia.js';
import { SOPORTE_Q, SOPORTE_MODELOS, SOPORTE_GLOSARIO } from './soporte.js';
import { PM_Q, PM_MODELOS, PM_GLOSARIO } from './pm.js';
import { UX_Q, UX_MODELOS, UX_GLOSARIO } from './ux.js';
import { PREVENTA_Q, PREVENTA_MODELOS, PREVENTA_GLOSARIO } from './preventa.js';
import { CAMBIO_Q, CAMBIO_MODELOS, CAMBIO_GLOSARIO } from './cambio.js';

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
  cloud: buildRole('cloud', CLOUD_Q, CLOUD_MODELOS, CLOUD_GLOSARIO),
  dev: buildRole('dev', DEV_Q, DEV_MODELOS, DEV_GLOSARIO),
  appsec: buildRole('appsec', APPSEC_Q, APPSEC_MODELOS, APPSEC_GLOSARIO),
  ia: buildRole('ia', IA_Q, IA_MODELOS, IA_GLOSARIO),
  soporte: buildRole('soporte', SOPORTE_Q, SOPORTE_MODELOS, SOPORTE_GLOSARIO),
  pm: buildRole('pm', PM_Q, PM_MODELOS, PM_GLOSARIO),
  ux: buildRole('ux', UX_Q, UX_MODELOS, UX_GLOSARIO),
  preventa: buildRole('preventa', PREVENTA_Q, PREVENTA_MODELOS, PREVENTA_GLOSARIO),
  cambio: buildRole('cambio', CAMBIO_Q, CAMBIO_MODELOS, CAMBIO_GLOSARIO),
};

export function allQuestions() {
  return Object.values(ROLE_CONTENT).flatMap(r => r.preguntas);
}
