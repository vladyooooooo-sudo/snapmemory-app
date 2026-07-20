export const QUESTIONS = [
  "Cosa ti ha fatto sorridere oggi?",
  "Chi hai incontrato che vuoi ricordare?",
  "Cosa non vuoi assolutamente dimenticare di oggi?",
  "Qual è stata la cosa più buona che hai mangiato?",
  "Un'idea che ti è passata per la testa?",
  "Dove sei stato oggi per la prima volta?",
  "Cosa diresti al te stesso di domani?",
] as const;

export const questionOfDay = (d: Date = new Date()): string =>
  QUESTIONS[d.getDate() % QUESTIONS.length];
