# SnapMemory

Uno scatto al giorno. Iris lo trasforma in un ricordo — privato, calmo, tuo.

App React + TypeScript (Vite, Tailwind, `@dnd-kit`, `tesseract.js`, PWA).
Vedi [CHANGELOG.md](./CHANGELOG.md) per la storia completa del progetto,
i bug corretti rispetto al prototipo originale e il dettaglio dei piani
Free/Pro.

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo
npm run typecheck  # controllo tipi
npm run test       # suite di test (Vitest + React Testing Library)
npm run build      # build di produzione
```

## Struttura

```
src/
  components/     componenti UI (Iris, Onboarding, dashboard, modali)
  hooks/          logica riutilizzabile (limiti, focus trap, lockout PIN...)
  store/          stato applicativo persistito (useAppStore)
  lib/            funzioni pure (parsing, date, storage, OCR, colore...)
  constants/      categorie, mood, domande, limiti Free/Pro
  context/        colore accento (personalizzazione Pro)
```
