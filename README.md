# Klusjes

PWA mobile-first in olandese, React + Tailwind + Supabase. Senza configurazione parte in modalità locale **vuota**, con salvataggio nel browser. I dati locali non vengono importati automaticamente nell'account cloud.

## Avvio

Richiede Node.js 22 o successivo.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Apri l'indirizzo mostrato da Vite. Per provare la modalità locale lascia vuote le variabili, oppure non creare `.env.local`.

## Configurazione Supabase

1. Crea un progetto Supabase.
2. Esegui `supabase/schema.sql` una sola volta nel SQL Editor. Crea tabelle, isolamento dei dati tramite Row Level Security e pubblicazione Realtime.
3. In Authentication → Users crea **un solo utente** con email e password. Conferma l'email dal dashboard se necessario. Disattiva le registrazioni pubbliche: l'app prevede solo accesso a un account esistente.
4. Inserisci in `.env.local` l'URL del progetto e la chiave **publishable** (oppure anon legacy), disponibili nelle impostazioni API. Non usare mai la chiave secret/service_role nel frontend.
5. Riavvia Vite. In Instellingen accedi con lo stesso account su entrambi i dispositivi.
6. Imposta in Authentication → URL Configuration il dominio di produzione come Site URL. Distribuisci `npm run build` → cartella `dist` su un hosting HTTPS con fallback verso `index.html`. Le variabili VITE vengono incorporate durante la build: ricompila dopo ogni modifica.

Auth password: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
Realtime: https://supabase.com/docs/guides/realtime/postgres-changes

## Comportamento

- Vista giornaliera iniziale; frecce e swipe orizzontale; settimana da lunedì a domenica.
- Nessun limite applicativo al numero di klusjes per giorno; elenchi scorrevoli.
- Ricorrenze giornaliere, settimanali, mensili; personalizzate ogni N giorni/settimane/mesi e scelta dei giorni settimanali.
- Il 29/30/31 viene adattato all'ultimo giorno dei mesi brevi, tornando alla data originale nei mesi successivi.
- Modifica singola: cambia solo titolo (la data identifica l'occorrenza). Modifica future: nuova versione della regola dalla data scelta, con storico precedente intatto. Si può anche cancellare la singola occorrenza o terminare tutte le future.
- Completamento e titolo eccezionale sono salvati per coppia serie/data. I completamenti non migrano su date diverse dopo una modifica della ricorrenza. Le eccezioni già scritte per una data hanno precedenza sul titolo della serie.
- Nessun riporto automatico dei klusjes incompleti.
- Il tasto in Alle klusjes apre il calendario; per modificare una ricorrenza apri un'occorrenza nel calendario.
- Le scritture cloud attendono la conferma del server. In assenza di rete l'app mostra errore e non finge un salvataggio; non c'è una coda offline. L'interfaccia installata è disponibile offline dopo il primo caricamento della build. I dati cloud non vengono persistiti offline per evitare di conservarli dopo logout.
- Modifiche simultanee alla stessa serie/occorrenza: prevale l'ultima scrittura; modifiche a occorrenze diverse restano indipendenti.
- PWA installabile da menu browser su HTTPS (o localhost). Su iOS usa Condividi → Aggiungi a Home.

## Verifica

```powershell
npm test
npm run build
```

Per la verifica reale: accedi su due dispositivi con lo stesso account, crea un klusje, spuntalo sul secondo e controlla l'aggiornamento sul primo; modifica una sola occorrenza e poi quelle future. Verifica con un altro account che le tabelle non restituiscano dati del primo.

La sincronizzazione end-to-end richiede credenziali Supabase effettive e non è stata dichiarata verificata senza di esse.
