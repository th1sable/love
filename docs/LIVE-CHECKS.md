# Collaudo — 13 ottobre 2026

Progetto Supabase love: fpkhmzmmlvdwaxgyycdh. Progetto EAS: @thisable/love, 93d7bf81-70ed-470a-8137-bb999ce70adb.

## Verifiche concluse

- 16 test automatici di dominio, date e integrazione del database passati.
- TypeScript ed ESLint passati.
- Tre prove Playwright in Chrome mobile (390×844, Europe/Rome) passate: cuore unico nelle cinque sezioni e stato persistente; creazione diario e impegno; album con selezione foto, visualizzazione e conservazione dopo riapertura. Sono prove locali, non una ricezione push su telefoni fisici.
- Verifiche SQL sul servizio reale per inviti, massimo due membri, isolamento dagli estranei, conflitti, idempotenza, aggiornamenti silenziosi e album privati. Transazioni annullate: zero utenti di prova residui.
- Dispatcher push installato; pg_net/pg_cron e timer ogni minuto attivi, esecuzione negata ai client. Verifica: zero dispositivi attivi, zero consegne. Nessuna notifica reale inviata nei test.

## Problemi aperti

- Conferma e recupero email: il test HTTP con token volutamente invalido e redirect esplicito ha restituito 303 verso http://localhost:3000/. La URL Configuration Auth è ancora da modificare. Nessuna email inviata durante questo test.
- La build nativa richiede love://auth/confirm; quella web usa la pagina Sites privata. Servono allowlist corretta e SMTP per indirizzi fuori dal team.
- Advisor Auth: protezione contro password compromesse disattivata.
- Firma Android/iOS e credenziali FCM/APNs in lavorazione.
- Da verificare su due telefoni: registrazione, pairing, Realtime e riconnessione, banner con app chiusa, permessi negati, logout e cambio giorno.

Le prove del database e del browser non dimostrano la ricezione sul telefono.
