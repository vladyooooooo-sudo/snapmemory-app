# Changelog

## 2.0 — «Iris vede davvero» (visione AI + funzioni da spot)

### Novità per il marketing

| Funzione | La frase da spot |
|---|---|
| **Visione AI vera** — chip di intento prima dello scatto («Cosa c'è nella foto?», «Leggi il testo», «Dove l'ho messo», «Scadenza», domanda libera); la foto va a Claude e torna un ricordo già compilato, sempre correggibile | *«Non descrivi più la foto: Iris la guarda.»* |
| **Dove l'ho messo?** — fotografi dove riponi le cose, mesi dopo chiedi a Iris e lei ti risponde con posto e data | *«Non perdere mai più niente.»* |
| **Scadenze automatiche** — ogni foto con una data di scadenza alimenta il widget «In scadenza», e Iris ti avvisa quando manca poco | *«Il latte, la garanzia, il bollo: ci pensa Iris.»* |
| **Cattura vocale** — tieni premuto il microfono e detti il ricordo (italiano, zero digitazione) | *«Un pensiero al volo? Diglielo e basta.»* |
| **Report mensile** — spese per categoria, umore prevalente, persone, luoghi e il momento più bello del mese, condivisibile come immagine per i social | *«Il tuo mese, raccontato da chi c'era.»* |
| **Eventi → calendario vero** — i ricordi-evento generano un file .ics che si apre in Google/Apple Calendar con un tap | *«Da foto a promemoria in tre secondi.»* |

### Come funziona la visione (architettura)

- La foto va a una Vercel Serverless Function (`api/vision.ts`) che chiama
  l'API Anthropic (`claude-sonnet-5`, input immagine, output JSON
  strutturato con schema rigido) con un prompt specifico per il chip
  scelto. La chiave API vive SOLO nella variabile d'ambiente
  `ANTHROPIC_API_KEY` su Vercel, mai nel client.
- Privacy: la foto è usa-e-getta — analizzata e mai salvata su server.
- Fallback a catena: API non raggiungibile o limite esaurito → OCR locale
  (Tesseract) → testo manuale. L'app non si blocca mai.
- La proposta di Iris passa SEMPRE da una schermata di revisione
  modificabile (titolo, categoria, descrizione, importo, scadenza, tag)
  prima del salvataggio.
- Freemium: Free 10 analisi AI al giorno / Pro illimitate (`LIMITS.ts`) —
  che è anche la protezione dai costi API.

### Design & mobile

- Bottom sheet trascinabili per chiudere (pointer events, maniglia visibile).
- Feedback aptico (`navigator.vibrate`) su scatto, salvataggio, selezioni.
- Safe area iOS, input ≥16px su mobile (niente zoom accidentale),
  pull-to-refresh disattivato, chip scorrevoli raggiungibili col pollice.
- Scorciatoie PWA (long-press sull'icona → «Scatta» / «Cerca»).
- Nuova categoria «Posizione» (dove sono riposte le cose) e ricerca
  dedicata «dove ho messo…» nella barra di Iris.

---

# 1.0 — da prototipo a app production-ready

Questa versione riscrive `SnapMemory.jsx` (un file, ~900 righe, stato in-memory)
in un progetto React + TypeScript multi-file (Vite, Tailwind, `@dnd-kit`,
`tesseract.js`, PWA, Vitest), mantenendo intatta l'identità visiva: palette
scura, accent ambra unico per il piano Free, scala di raggi 16/24, spaziature
4/8/12/16/24/32/48, personalità e animazioni di Iris, tono di voce italiano.

## 1. Bug corretti (rispetto al file originale allegato)

| # | Bug | Dove si trovava | Correzione |
|---|-----|------------------|------------|
| 1 | "Salta tutto" non funzionava a nome vuoto | `setObName("Tu")` + `setTimeout(finishOnboarding, 0)` leggeva `obName` stantio per closure | `src/components/Onboarding.tsx`: `finish()` calcola il nome finale nello stesso render e lo passa come argomento, nessuna lettura di stato stantio |
| 2 | Riordino widget non funzionava su mobile (drag&drop HTML5 nativo) | `draggable`/`onDragStart` sui widget | `src/components/WidgetGrid.tsx`: `@dnd-kit/core` con `PointerSensor` (touch-friendly) + `KeyboardSensor` |
| 3 | Conflitto tra drag import file e drag riordino widget | listener `dragover/drop` globali senza controllo `dataTransfer.types` | `src/hooks/useFileDropImport.ts` controlla `types.includes("Files")`; il riordino ora usa pointer events di `@dnd-kit`, non le API HTML5 native, quindi i due sistemi non si intersecano più |
| 4 | Statistiche mensili ignoravano l'anno | `new Date(m.date).getMonth() === new Date().getMonth()` | `src/lib/date.ts` → `isThisMonth()` confronta anche `getFullYear()`; usato in `src/lib/derived.ts` |
| 5 | Nessuna modifica/eliminazione dei singoli ricordi | — | `src/components/modals/MemoryDetailModal.tsx`: modifica titolo/categoria/tag/importo ed eliminazione con conferma, sempre disponibili in entrambi i piani |
| 6 | Nessuna vista "tutti i ricordi" | — | `src/components/modals/ArchiveModal.tsx`: archivio completo con filtri per categoria, intervallo date, importo minimo; richiamabile dal tasto "Ricordi" nel dock |
| 7 | Persistenza fuorviante (commento suggeriva `localStorage` senza `JSON.parse`) | commento nel file originale | `src/lib/storage.ts`: adapter reale con `JSON.parse`/`JSON.stringify`, fallback a stato vuoto su dati corrotti (mai crash), `removeItem` per il reset |
| 8 | Toast senza gestione del timer | `setTimeout` non salvato in `react()` | `src/hooks/useToast.ts`: timer sempre in un `ref` dedicato, pulito prima di ogni nuovo `show()` e allo smontaggio |
| 9 | Menu widget (•••) non si chiudeva al click fuori | solo Escape lo chiudeva | `src/hooks/useOnClickOutside.ts`, usato in `WidgetGrid.tsx` |
| 10 | `useState(store.load())` ricalcolava il load ad ogni render | — | `src/store/useAppStore.ts`: tutti gli state derivati dal salvataggio usano un initializer lazy `useState(() => ...)` |
| 11 | ID dei ricordi con `Date.now()` (rischio di collisione) | — | `src/lib/id.ts` → `crypto.randomUUID()` |
| 12 | Widget "Un anno fa" vuoto senza invito, incoerente con gli altri widget vuoti | — | **Scelta esplicita** (vedi §4 Conflitti): il widget viene nascosto dalla dashboard finché non ha un'anniversario da mostrare, invece di mostrare una card vuota senza invito. Filtro in `src/App.tsx` (`visibleWidgets`) |
| 13 | `EmptyHint` renderizzava Iris come `<button>` anche senza `onClick`, focus a vuoto da tastiera | — | `src/components/Iris.tsx`: se non è passato `onClick`, Iris renderizza un `<div aria-hidden>`, mai un `<button>` vuoto |
| 14 | `setTimeout` non puliti in `runCapture`/`saveFrase`/`pushPin` allo smontaggio | — | `src/App.tsx` (`captureTimers` ref) e `src/components/modals/PinModal.tsx` (`timers` ref): ogni timer è tracciato e pulito in `useEffect` di cleanup |
| 15 | Mood di Iris incoerente negli stati vuoti (`sad` in alcuni, `idle` in altri) | — | `src/components/EmptyHint.tsx`: default uniformato a `idle` — uno stato vuoto non è triste, è in attesa |

## 2. Sicurezza e privacy

- **PIN mai in chiaro**: `src/lib/pin.ts` usa `SubtleCrypto.digest("SHA-256")` con salt casuale per utente (`crypto.getRandomValues`); solo hash e salt sono persistiti.
- **Rate limiting sui tentativi di PIN**: `src/hooks/usePinLockout.ts` — lockout progressivo (30s → 2min → 10min) dopo tentativi falliti ripetuti, persistito anche tra reload.
- **Auto-blocco della cassaforte**: `src/hooks/useVaultAutoLock.ts` — si blocca dopo 90s di inattività e immediatamente quando la tab passa in background (`visibilitychange`).
- **Backup/esportazione**: `src/lib/storage.ts` (`exportToJSON`/`importFromJSON`) + UI in Impostazioni → Backup, con validazione del file importato (niente crash su JSON non valido).

## 3. Accessibilità (WCAG 2.1 AA)

- `aria-label` su tutti i bottoni solo-icona (chiudi, menu •••, drag handle, backspace del PIN, cifre del pad, toggle testo grande, ecc.).
- Contrasti di testo tenue (`text-white/25`, `/30`) portati almeno a `/45`–`/60` su fondo `#08080A` per il testo che comunica informazioni (label, hint, timestamp); i decorativi puri restano più tenui.
- `<label>` reali (anche `sr-only`) associati a nome, nickname, testo dello scatto, domanda del giorno, ricerca, campi di modifica ricordo, filtri archivio.
- Focus trap nei modali (`src/hooks/useFocusTrap.ts`), con richiusura del focus precedente alla chiusura; Escape già presente e mantenuto.
- Alternativa da tastiera al riordino widget: bottoni "sposta su/giù" sempre visibili in ogni widget, oltre al `KeyboardSensor` di `@dnd-kit`.

## 4. Conflitti tra requisiti — scelte fatte e perché

- **"Un file" vs "struttura multi-file professionale"**: il prompt stesso lo segnala come possibile conflitto. Scelta: struttura multi-file (componenti, hook, store, lib, costanti) perché un'app da portare in produzione — con test, TypeScript, piani Free/Pro, PWA — è ingestibile e non revisionabile in un unico file da 900+ righe. La coerenza visiva è garantita da costanti condivise (`constants/`), non dalla compattezza del file.
- **Widget "Un anno fa" vuoto (bug #12)**: due comportamenti possibili — mostrare un `EmptyHint` come gli altri, oppure nascondere il widget. Scelta: nasconderlo (comportamento originale, ma ora esplicito e commentato) perché un invito tipo "scatta qualcosa un anno fa" non ha senso quando il tempo non è ancora passato; è l'unico widget la cui esistenza dipende dal calendario, non dalle azioni dell'utente.
- **"Pagina 'Il tuo piano'" vs "nessuna schermata superflua"**: implementata come sezione scorrevole dentro il modale Impostazioni già esistente (non una nuova rotta/schermata), per rispettare il vincolo di non aggiungere schermate incoerenti con lo stile a modali.
- **Personalizzazione colore accento**: per non snaturare l'identità visiva "un accent ambra unico" anche nel piano Pro, la scelta colore è applicata solo a Iris (glow di lavoro/ricerca/scatto) tramite `AccentContext`, non riscrivendo ogni classe Tailwind ambra dell'app. È il compromesso più coerente tra "personalizzazione Pro" e "vincolo di identità visiva".

## 5. Funzionalità aggiunte

- Cattura fotografica reale (`getUserMedia`) con OCR client-side (`tesseract.js`, `src/lib/ocr.ts`), con fallback sempre disponibile alla descrizione testuale e alla stessa euristica `parseCapture` (ora anche testata con Vitest).
- Correzione manuale di categoria/titolo/tag/importo proposti da Iris, prima e dopo il salvataggio (`MemoryDetailModal`), **sempre gratuita in entrambi i piani**.
- Persistenza reale su `localStorage` con gestione errori/quota.
- Suite di test (Vitest + React Testing Library): euristica di parsing, calcolo streak (inclusi milestone e reset), onboarding (incluso il bug del nome vuoto), flusso PIN (creazione, sblocco, rate limiting).
- Migrazione completa a TypeScript, con tipi per `Memory`, `WidgetInstance`, `CategoryId`, `Plan`, props di ogni componente.
- Suddivisione in moduli: `components/`, `components/modals/`, `hooks/`, `store/`, `lib/`, `constants/`, `context/`.
- Supporto PWA (`vite-plugin-pwa`): manifest, service worker, funzionamento offline dei file statici.

## 6. Piani Free/Pro

Filosofia: il Free è un piano vero, non una demo — nessuna funzione è nascosta,
solo limitata con un numero ragionevole; nessun dark pattern (niente countdown
finti, niente popup ripetuti — un solo prompt di upgrade per feature al giorno,
sempre in un modale non bloccante con l'opzione "va bene, aspetto").

| Funzione | Free | Pro |
|---|---|---|
| Ricordi salvati al giorno | 5 | Illimitati |
| Widget in dashboard | 6 | 12 |
| Domande a Iris al giorno | 10 | Illimitate |
| Cassaforte (ricordi riservati) | 10 elementi | Illimitata |
| Export/backup JSON | 1 a settimana | Illimitati + backup automatico locale |
| "Un anno fa" | solo anniversario a 1 anno | anche 2°–5° anniversario |
| Umore del mese | ultimi 30 giorni | ultimi 365 giorni |
| Colore accento di Iris | ambra fisso | 5 colori a scelta |
| Onboarding, streak, PIN, fotocamera/OCR, modifica/elimina ricordi, correzione manuale | ✅ sempre incluso | ✅ sempre incluso |

Configurazione centralizzata in `src/constants/LIMITS.ts` (un solo file, ben
commentato: cambiare i numeri lì aggiorna automaticamente badge, modali di
upgrade e pagina "Il tuo piano"). Il piano è mock (`plan: "pro"` impostato
localmente in Impostazioni) — l'integrazione di un pagamento reale
(Stripe/RevenueCat) resta un passo successivo esplicitamente fuori scope.
