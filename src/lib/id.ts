/** crypto.randomUUID() invece di Date.now(): niente rischio di collisioni. */
export const newId = (): string => crypto.randomUUID();
