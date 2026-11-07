# Design e verifica

Direzione: calendario domestico essenziale, fondo #fbfaf8, selezione #f1dedf, completamenti #dee5d9 con checkbox #819780, testo #353b35. Font di sistema sans-serif. Checklist con bordo sottile, spazi regolari, raggi 12px, selettore Dag/Week e navigazione a tre voci. Nessuna immagine decorativa. Il concept locale è `design-concept.png`, creato con Image Gen integrato a partire dalle specifiche italiane. Il riferimento originale della conversazione non era disponibile come allegato.

Brief usato: UI mockup Klusjes in olandese; due schermate mobile complete, calendario e editor; warm white, blush, sage; titolo Klusjes/Thuis; Dag/Week; frecce, Vandaag, strip settimanale; checklist con completate barrate; Nieuw klusje con nome, data, ricorrenza; nessun orario o assegnazione.

Verifica eseguita con Playwright Chromium headless: il browser integrato non raggiungeva il server locale. Viewport 390×844 e 1280×900; screenshot full-page. Il concept è una composizione di due telefoni, quindi la dimensione raster complessiva non equivale a un viewport CSS: verificata la schermata mobile a 390px. Concept e render mobile/desktop ispezionati con view_image, anche a risoluzione originale.

| Punto | Confronto e risultato |
|---|---|
| Struttura | Header, Dag/Week, data, settimana, checklist, aggiunta e tre sezioni mantenuti. |
| Palette | Fondo caldo, rosa selezione e salvia completamento rispettati, senza gradienti. |
| Tipografia | Gerarchia coerente; titolo 24px, righe 16px, controlli espliciti. Ridotta proporzionalmente rispetto alla composizione del concept. |
| Checklist | Checkbox arrotondate, righe bordate, completate barrate in fondo. |
| Spazi e contenitori | Lista aperta e spazi generosi; nessuna griglia di card aggiunta. |
| Icone | Icone outline coerenti per casa, calendario, lista, impostazioni e frecce. |
| Mobile | Nessun overflow orizzontale; corretto footer che poteva coprire l'aggiunta; ora tutto scorre naturalmente. |
| Copy | Nomi di navigazione e azioni rispettati. Differenze intenzionali: stato sincronizzazione, frequenza sotto i klusjes ricorrenti, menu modifica e stato vuoto necessari al funzionamento. |

L'implementazione è stata verificata visivamente rispetto al concept e alle specifiche. Differenze intenzionali: Thuis è testo (non selettore, perché c'è un solo account domestico), ordinamento alfabetico tra incompleti/completi, contenuti iniziali vuoti, adattamento desktop centrato, barra inferiore nel flusso per supportare elenchi illimitati. Nessun difetto visivo materiale residuo osservato.

Verifica funzionale passata: autocomplete, creazione multipla, spunta/riattivazione, indipendenza delle occorrenze, modifica singola/futura, storico, persistenza dopo reload, Dag/Week, ricerca, impostazioni, assenza errori JavaScript. Test unitari di fine mese, intervalli settimanali a cavallo d'anno e storico passati. Build PWA generata.

Limiti: login, RLS e Realtime non provati contro un progetto Supabase reale, perché non configurato. Swipe implementato via touchstart/touchend ma non verificato su dispositivo fisico. Installazione PWA su telefono da verificare dopo hosting HTTPS. Nessuna coda di scritture offline. `npm audit` segnala 6 avvisi nelle dipendenze di sviluppo transitive di Workbox (2 low, 4 moderate); `npm audit fix` non li risolve con le versioni compatibili correnti. Non sono dipendenze di runtime Supabase/React.

Per ripetere i test browser: `npx playwright install chromium`, avvia `npm run dev`, poi `node tests/browser.mjs`. Variabili opzionali `BASE_URL` e `PLAYWRIGHT_EXECUTABLE_PATH`. I test usano un nuovo profilo locale isolato; richiedono modalità locale senza Supabase configurato.
