# Controlli del progetto online

Verificati il 13 ottobre 2026 sul progetto Supabase `love`, riferimento `fpkhmzmmlvdwaxgyycdh`, organizzazione `th1sable's Org`, regione `eu-central-1`.

## Installato

- Schema iniziale `initial_couple_sync`.
- Aggiornamento `explicit_private_access_and_indexes` con divieto esplicito di accesso alle tabelle interne e indici per le relazioni.
- RLS su tutte e sei le tabelle.
- Tabelle `entries` e `couple_members` incluse nella pubblicazione Realtime.
- Configurazione dell'app con URL e sola chiave publishable. Nessuna chiave amministrativa nel client.

## Verifiche sul servizio reale

Una transazione con tre identita temporanee ha verificato: creazione della coppia, invito, collegamento del secondo membro, rifiuto del terzo, esclusione degli estranei dalle righe, aggiornamenti visibili al partner, rifiuto delle modifiche obsolete, ripetizione idempotente della stessa richiesta e assenza di notifiche per il diario.

La transazione e stata annullata: **zero utenti di prova residui**. Non sono state inviate email durante questi controlli.

Le API REST per contenuti e membri, chiamate senza login con la sola chiave publishable, restituiscono HTTP 401. L'accesso ai dati richiede quindi l'autenticazione.

L'advisor di sicurezza non segnala problemi. L'advisor di prestazioni segnala soltanto alcuni indici appena creati e ancora non utilizzati: vengono conservati per le relazioni tra tabelle. [Indicazioni sugli indici non ancora usati](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Le impostazioni pubbliche Auth confermano: email abilitate, registrazione abilitata, conferma dell'email richiesta.

## Validazione del codice

TypeScript, ESLint, tutti e dieci i test e l'esportazione dei bundle per iOS, Android e web passano con la configurazione del progetto love.

## Ancora da completare prima dell'uso sui due telefoni

- Configurazione o verifica del servizio email per entrambi gli indirizzi e dei link di conferma. Il servizio email predefinito Supabase consegna solo agli indirizzi del team; gli altri richiedono SMTP configurato: https://supabase.com/docs/guides/auth/auth-smtp
- Versioni installabili firmate e collaudo del flusso completo su iOS e Android.
- Collaudo dei WebSocket, riconnessione e aggiornamenti in entrambe le direzioni.
- Invio delle notifiche push: la coda privata e pronta, ma non esiste ancora il servizio di consegna ai dispositivi.

Le verifiche del database non equivalgono a una prova completa delle registrazioni o della ricezione delle notifiche sul telefono.
