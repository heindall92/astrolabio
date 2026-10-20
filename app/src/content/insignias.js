// Insignias de Astrolabio. Las secretas no se muestran hasta conseguirlas.
// check(ctx): ctx = { state, scores, duel, lang, hour, competencias }. duel = { registro, detalle } solo al terminar un duelo.

const B = (id, icono, es, en, des, den, check, secreta = false) => ({ id, icono, secreta, nombre: { es, en }, desc: { es: des, en: den }, check });
const n = (ctx, f) => ctx.scores.filter(f).length;
const ganados = ctx => ctx.state.duelos.filter(d => d.superado);
const HOSTELERIA = /\b(bar|restaurante|camarer[oa]s?|hosteler[ií]a|cocina|terraza|barra|waiter|waitress|kitchen|hospitality)\b/i;

export const INSIGNIAS = [
  B('primera-historia', 'feather', 'Primer trazo', 'First stroke', 'Guarda tu primera historia.', 'Save your first story.', c => c.state.historias.length >= 1),
  B('primera-estrella', 'star', 'Primera estrella', 'First star', 'Una historia llega a «Lista».', 'A story reaches “Ready”.', c => n(c, s => s.estado !== 'borrador') >= 1),
  B('brillante', 'sparkles', 'Brillo propio', 'Shining', 'Una historia llega a «Brillante».', 'A story reaches “Brilliant”.', c => n(c, s => s.estado === 'brillante') >= 1),
  B('cinco-historias', 'library', 'Repertorio', 'Repertoire', 'Cinco historias guardadas.', 'Five stories saved.', c => c.state.historias.length >= 5),
  B('diez-historias', 'book-open', 'Biblioteca', 'Library', 'Diez historias guardadas.', 'Ten stories saved.', c => c.state.historias.length >= 10),
  B('veinte-historias', 'archive', 'Archivo vivo', 'Living archive', 'Veinte historias guardadas.', 'Twenty stories saved.', c => c.state.historias.length >= 20),
  B('cinco-listas', 'list-checks', 'Banco listo', 'Bank ready', 'Cinco historias en «Lista» o mejor.', 'Five stories “Ready” or better.', c => n(c, s => s.estado !== 'borrador') >= 5),
  B('sin-nosotros', 'user-round-check', 'Sin «nosotros»', 'No “we”', 'Una acción entera en primera persona, sin ningún «nosotros».', 'A whole action in the first person, with no “we”.', c => c.scores.some(s => !s.analisis.yo.vacio && s.analisis.yo.plural === 0 && s.analisis.duracion.words >= 100)),
  B('cifra-en-mano', 'chart-no-axes-column-increasing', 'Cifra en mano', 'Numbers in hand', 'Cinco historias con un resultado medible.', 'Five stories with a measurable result.', c => n(c, s => s.analisis.cifra.ok) >= 5),
  B('aprendiz', 'graduation-cap', 'Siempre aprendiendo', 'Always learning', 'Tres historias que cierran con un aprendizaje.', 'Three stories that close with a lesson.', c => n(c, s => s.analisis.aprendizaje.ok) >= 3),
  B('sin-muletillas', 'message-circle', 'Al grano', 'Straight to the point', 'Una historia completa sin una sola muletilla.', 'A full story without a single filler word.', c => c.scores.some(s => s.analisis.muletillas.total === 0 && s.analisis.duracion.words >= 150)),
  B('equilibrio', 'scale', 'Equilibrio', 'Balance', 'Una historia con el reparto S/T/A/R perfecto.', 'A story with a perfect S/T/A/R balance.', c => c.scores.some(s => s.criterios.find(x => x.id === 'reparto').ok && s.analisis.duracion.words >= 150)),
  B('media-constelacion', 'moon-star', 'Media constelación', 'Half a constellation', 'Seis competencias cubiertas.', 'Six competencies covered.', c => c.competencias >= 6),
  B('constelacion-completa', 'orbit', 'Constelación completa', 'Full constellation', 'Las doce competencias cubiertas con historias listas.', 'All twelve competencies covered with ready stories.', c => c.competencias >= 12),
  B('primer-duelo', 'swords', 'Primer duelo', 'First duel', 'Termina tu primer duelo en la Arena.', 'Finish your first duel in the Arena.', c => c.state.duelos.length >= 1),
  B('primera-victoria', 'trophy', 'Primera victoria', 'First win', 'Supera tu primer duelo.', 'Pass your first duel.', c => ganados(c).length >= 1),
  B('diez-duelos', 'shield', 'Curtido', 'Seasoned', 'Diez duelos terminados.', 'Ten duels finished.', c => c.state.duelos.length >= 10),
  B('todos-convencidos', 'users', 'Todos convencidos', 'Everyone convinced', 'Supera a los cuatro recruiters antes del jefe.', 'Pass all four recruiters before the boss.', c => ['rita', 'manager', 'banca', 'startup'].every(r => ganados(c).some(d => d.recruiter === r))),
  B('panel-banca', 'landmark', 'Unanimidad', 'Unanimous', 'Convence al Panel de Banca.', 'Convince the Banking Panel.', c => ganados(c).some(d => d.recruiter === 'banca')),
  B('subeliston', 'crown', 'Sobreviviste al Subelistón', 'You survived the Bar-Raiser Boss', 'Vence al jefe final en una ruta.', 'Beat the final boss on one path.', c => ganados(c).some(d => d.recruiter === 'subeliston')),
  B('subeliston-todas', 'gem', 'Leyenda de las cuatro rutas', 'Legend of the four paths', 'Vence al jefe final en cuatro rutas distintas.', 'Beat the final boss on four different paths.', c => new Set(ganados(c).filter(d => d.recruiter === 'subeliston').map(d => d.ruta)).size >= 4),
  B('contrarreloj', 'timer', 'Contra el reloj', 'Against the clock', 'Supera un duelo en contrarreloj.', 'Pass a timed duel.', c => ganados(c).some(d => d.modo === 'contrarreloj')),
  B('voz-alta', 'mic', 'En voz alta', 'Out loud', 'Termina un duelo contándolo en voz alta.', 'Finish a duel telling it aloud.', c => c.state.duelos.some(d => d.modo === 'voz')),
  B('sorpresa', 'shuffle', 'Sin red', 'No safety net', 'Supera un duelo sorpresa.', 'Pass a surprise duel.', c => ganados(c).some(d => d.modo === 'sorpresa')),
  B('racha-3', 'flame', 'Tres días seguidos', 'Three days in a row', 'Racha de 3 días.', 'A 3-day streak.', c => c.state.racha >= 3),
  B('racha-7', 'flame-kindling', 'Una semana', 'One week', 'Racha de 7 días.', 'A 7-day streak.', c => c.state.racha >= 7),
  B('racha-30', 'calendar-check', 'Un mes de constancia', 'A month of consistency', 'Racha de 30 días.', 'A 30-day streak.', c => c.state.racha >= 30),
  B('meta-diaria', 'target', 'Meta cumplida', 'Goal reached', 'Cumple la meta diaria de XP.', 'Reach the daily XP goal.', c => Object.values(c.state.historialXp).some(v => v >= c.meta)),
  B('bilingue', 'languages', 'Bilingüe', 'Bilingual', 'Termina una entrevista en inglés en la Arena.', 'Finish an English interview in the Arena.', c => !!c.duel && (c.lang === 'en' || c.duel.registro.ingles === true)),
  B('ensayo-general', 'drama', 'Ensayo general', 'Dress rehearsal', 'Tres historias de ensayo para practicar.', 'Three rehearsal stories for practice.', c => c.state.historias.filter(h => h.tipo === 'ensayo').length >= 3),
  B('madrugador', 'sunrise', 'Madrugador', 'Early bird', 'Practicar antes de las 7:00.', 'Practise before 7 a.m.', c => c.hour < 7, true),
  B('hosteleria', 'coffee', 'De la hostelería al SOC', 'From hospitality to the SOC', 'Una historia lista que nace en la hostelería.', 'A ready story born in hospitality.', c => c.state.historias.some((h, i) => c.scores[i] && c.scores[i].estado !== 'borrador' && HOSTELERIA.test([h.s, h.t, h.a, h.r].join(' '))), true),
  B('remontada', 'trending-up', 'Remontada', 'Comeback', 'Gana un duelo después de bajar de 30 de convicción.', 'Win a duel after dropping below 30 conviction.', c => !!c.duel && c.duel.registro.superado && c.duel.detalle.rondas.some(r => r.conviccion < 30), true),
  B('por-los-pelos', 'hourglass', 'Por los pelos', 'By a whisker', 'Supera un duelo con la convicción justa.', 'Pass a duel with just enough conviction.', c => !!c.duel && c.duel.registro.superado && c.duel.registro.conviccion <= 72, true),
];
