const responses: Record<string, string[]> = {
  saludo: [
    "¡Buu! 👻 ¡Hola! Soy IAFantasma, tu asistente espectral. ¿En qué puedo ayudarte hoy?",
    "¡Aparecí justo a tiempo! Soy IAFantasma. ¿Qué necesitas saber?",
    "¡Guuu! ¡Me alegra que hayas llegado! ¿Cómo puedo asistirte?",
  ],
  despedida: [
    "¡Hasta pronto! Recuerda que siempre estaré en las sombras si me necesitas. 👻",
    "¡Adiós! Volveré a aparecer cuando me llames. ¡Cuídate!",
    "Me desvanezco por ahora... ¡pero siempre regreso! 🌙",
  ],
  nombre: [
    "Me llaman IAFantasma 👻 — ¡un espíritu digital aquí para ayudarte!",
    "Soy IAFantasma, el asistente más cool del mundo sobrenatural. 😎",
  ],
  ayuda: [
    "Puedo ayudarte con preguntas, conversación, consejos y mucho más. ¡Solo pregunta!",
    "Estoy aquí para charlar, informarte y hacerte compañía. ¿Por dónde empezamos?",
  ],
  gracias: [
    "¡De nada! Es un placer ser tu fantasma de confianza. 💫",
    "¡Para eso estoy! No dudes en volver cuando necesites algo. 👻",
    "¡Con mucho gusto! Los fantasmas somos más amigables de lo que parecemos. 😄",
  ],
  chiste: [
    "¿Por qué los fantasmas nunca mienten? ¡Porque son transparentes! 😄",
    "¿Qué hace un fantasma cuando se equivoca? ¡Se desaparece de vergüenza! 👻",
    '¿Cuál es el deporte favorito de los fantasmas? ¡El "boo"-ling! 🎳',
  ],
  default: [
    "Hmm, interesante pregunta... déjame pensarlo con mis poderes espectrales. 🔮",
    "Eso es algo que los fantasmas también nos preguntamos. ¿Quieres explorar el tema juntos?",
    "Mi sentido sobrenatural me dice que hay mucho que aprender sobre eso. 🌟",
    "Buena observación. Los espíritus tenemos mucho tiempo para reflexionar sobre esas cosas. 💭",
    "Como fantasma que soy, he visto muchas cosas... y sobre eso puedo decirte: ¡es fascinante!",
  ],
};

export function chatCategory(message: string): keyof typeof responses {
  const l = message.toLowerCase();
  if (/hola|buenos|buenas|hey|hi|saludos/.test(l)) return "saludo";
  if (/adios|adiós|chao|hasta|bye|nos vemos/.test(l)) return "despedida";
  if (/como te llamas|quien eres|quién eres|tu nombre|eres/.test(l)) return "nombre";
  if (/ayuda|ayudar|puedes|qué haces|que haces|capacidades/.test(l)) return "ayuda";
  if (/gracias|thank|agradec/.test(l)) return "gracias";
  if (/chiste|broma|joke|risa|divertido/.test(l)) return "chiste";
  return "default";
}

export function localReply(message: string): string {

  const list = responses[chatCategory(message)] ?? [];
  return list[Math.floor(Math.random() * list.length)] ?? "";
}
