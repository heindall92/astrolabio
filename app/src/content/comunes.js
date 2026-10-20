// Preguntas comunes a todas las rutas, incluidas las preguntas trampa. Redacción propia.
// Las preguntas con «guia» no se responden con STAR: llevan una guía de respuesta.

export const COMUNES = [
  { id: 'c-error', comp: ['aprendizaje', 'etica'], es: 'Cuéntame tu mayor error profesional y qué hiciste después.', en: 'Tell me about your biggest professional mistake and what you did afterwards.' },
  { id: 'c-conflicto', comp: ['conflictos', 'equipo'], es: 'Háblame de un conflicto con un compañero. ¿Cómo lo resolviste?', en: 'Tell me about a conflict with a colleague. How did you resolve it?' },
  { id: 'c-opinion', comp: ['aprendizaje', 'analisis'], es: 'Una vez que cambiaste de opinión gracias a los datos o a otra persona.', en: 'A time you changed your mind because of data or someone else.' },
  { id: 'c-objetivo', comp: ['resultados', 'aprendizaje'], es: 'Un objetivo que no cumpliste. ¿Qué pasó y qué aprendiste?', en: 'A goal you did not meet. What happened and what did you learn?' },
  { id: 'c-presion', comp: ['presion', 'resultados'], es: 'La vez que trabajaste con más presión. ¿Cómo organizaste el trabajo?', en: 'The time you worked under the most pressure. How did you organise your work?' },
  { id: 'c-iniciativa', comp: ['iniciativa'], es: 'Algo que mejoraste sin que nadie te lo pidiera.', en: 'Something you improved without anyone asking you to.' },
  { id: 'c-aprender', comp: ['aprendizaje', 'problemas'], es: 'Una tecnología o tema que tuviste que aprender en muy poco tiempo.', en: 'A technology or topic you had to learn in very little time.' },
  { id: 'c-cliente', comp: ['cliente', 'comunicacion'], es: 'Una vez que un cliente o usuario estaba muy descontento. ¿Qué hiciste?', en: 'A time a customer or user was very unhappy. What did you do?' },
  { id: 'c-motivo', comp: ['iniciativa'], trampa: true, es: '¿Por qué quieres este puesto?', en: 'Why do you want this role?',
    guia: { es: 'No es STAR. Une tres cosas en un minuto: qué te atrae del trabajo concreto, qué has hecho ya que lo demuestra (una historia corta) y qué quieres aprender aquí. Evita hablar solo del sueldo o de la marca.', en: 'Not STAR. Link three things in one minute: what attracts you to this specific work, what you have already done that proves it (a short story) and what you want to learn here. Avoid talking only about salary or brand.' } },
  { id: 'c-hueco', comp: ['etica', 'aprendizaje'], trampa: true, es: 'Veo un hueco en tu CV. ¿Qué hiciste durante ese tiempo?', en: 'I see a gap in your CV. What did you do during that time?',
    guia: { es: 'Sé breve y honesto: la razón en una frase, lo que hiciste o aprendiste en ese tiempo y por qué ahora estás listo. No te justifiques de más.', en: 'Be brief and honest: the reason in one sentence, what you did or learned during that time and why you are ready now. Do not over-justify.' } },
  { id: 'c-defecto', comp: ['aprendizaje', 'etica'], trampa: true, es: '¿Cuál es tu mayor defecto?', en: 'What is your greatest weakness?',
    guia: { es: 'Elige un defecto real que no sea clave para el puesto, explica cómo te afectó una vez y qué haces ahora para compensarlo. Evita los falsos defectos como «soy perfeccionista».', en: 'Choose a real weakness that is not key to the role, explain how it affected you once and what you do now to compensate. Avoid fake weaknesses like “I am a perfectionist”.' } },
  { id: 'c-salario', comp: ['etica'], trampa: true, es: '¿Cuáles son tus expectativas salariales?', en: 'What are your salary expectations?',
    guia: { es: 'Investiga antes la banda del mercado para tu rol, nivel y ciudad. Da un rango razonable, di que lo valoras junto al resto de condiciones (formación, teletrabajo, guardias) y pregunta por la banda del puesto si aún no la conoces.', en: 'Research the market band for your role, level and city beforehand. Give a reasonable range, say you weigh it together with other conditions (training, remote work, on-call) and ask about the role band if you do not know it.' } },
];

// Glosario general (las rutas añaden el suyo).
export const GLOSARIO = [
  { id: 'g-star', termino: { es: 'Método STAR', en: 'STAR method' }, def: { es: 'Forma de contar una vivencia en cuatro partes: Situación, Tarea, Acción y Resultado.', en: 'A way to tell an experience in four parts: Situation, Task, Action and Result.' } },
  { id: 'g-starl', termino: { es: 'STAR-L', en: 'STAR-L' }, def: { es: 'STAR con una quinta parte opcional: lo que aprendiste (Learning).', en: 'STAR with an optional fifth part: what you learned.' } },
  { id: 'g-conductual', termino: { es: 'Entrevista por competencias', en: 'Behavioural interview' }, def: { es: 'Entrevista que pide ejemplos reales del pasado para predecir cómo trabajarás.', en: 'An interview that asks for real past examples to predict how you will work.' } },
  { id: 'g-repregunta', termino: { es: 'Repregunta', en: 'Follow-up question' }, def: { es: 'Pregunta que hace el entrevistador para comprobar los detalles de tu respuesta.', en: 'A question the interviewer asks to check the details of your answer.' } },
  { id: 'g-recruiter', termino: { es: 'Recruiter', en: 'Recruiter' }, def: { es: 'Persona que selecciona candidatos. Puede ser de recursos humanos o de una agencia.', en: 'Person who selects candidates, from HR or an agency.' } },
  { id: 'g-hiring', termino: { es: 'Hiring manager', en: 'Hiring manager' }, def: { es: 'La persona que será tu responsable y decide la contratación.', en: 'The person who will be your manager and makes the hiring decision.' } },
  { id: 'g-competencia', termino: { es: 'Competencia', en: 'Competency' }, def: { es: 'Habilidad de comportamiento que busca la empresa, como la comunicación o el trabajo bajo presión.', en: 'A behavioural skill the company looks for, such as communication or working under pressure.' } },
  { id: 'g-muletilla', termino: { es: 'Muletilla', en: 'Filler word' }, def: { es: 'Palabra que se repite sin aportar, como «básicamente» o «un poco».', en: 'A word repeated without adding meaning, such as “basically” or “a bit”.' } },
  { id: 'g-ensayo', termino: { es: 'Historia de ensayo', en: 'Practice story' }, def: { es: 'Historia inventada para practicar la estructura. En una entrevista de verdad usa siempre vivencias reales.', en: 'A made-up story to practise the structure. In a real interview always use real experiences.' } },
  { id: 'g-conviccion', termino: { es: 'Convicción', en: 'Conviction' }, def: { es: 'En la Arena, cuánto se ha convencido el recruiter. A 100 pasas de fase.', en: 'In the Arena, how convinced the recruiter is. At 100 you move on.' } },
];
