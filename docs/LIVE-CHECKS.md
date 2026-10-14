# Collaudo — 13 ottobre 2026

Progetto Supabase love: fpkhmzmmlvdwaxgyycdh. Progetto EAS: @thisable/love, 93d7bf81-70ed-470a-8137-bb999ce70adb.

## Verifiche concluse

- 18 test automatici di dominio, date e integrazione del database passati.
- TypeScript ed ESLint passati. Expo Doctor: 21/21 controlli passati nella configurazione aggiornata.
- Quattro prove Playwright in Chrome mobile (390×844, Europe/Rome) passate: cuore unico nelle cinque sezioni e stato persistente; creazione diario e impegno; album con selezione foto, visualizzazione e conservazione dopo riapertura; password visibile/nascosta e recupero senza email. Sono prove locali, non una ricezione push su telefoni fisici.
- Verifiche SQL sul servizio reale per inviti, massimo due membri, isolamento dagli estranei, conflitti, idempotenza, aggiornamenti silenziosi e album privati. Controlli ripetuti dopo l’attivazione del dispatcher. Transazioni annullate: zero utenti di prova residui.
- Dispatcher push installato; pg_net/pg_cron e timer ogni minuto attivi, esecuzione negata ai client. Verifica: zero dispositivi attivi, zero consegne. Nessuna notifica reale inviata nei test.

## Problemi aperti

- Conferma e recupero email: il test HTTP con token volutamente invalido e redirect esplicito ha restituito 303 verso http://localhost:3000/. La URL Configuration Auth è ancora da modificare. Nessuna email inviata durante questo test.
- La build nativa richiede love://auth/confirm; quella web usa la pagina Sites privata. Servono allowlist corretta e SMTP per indirizzi fuori dal team.
- Advisor Auth: protezione contro password compromesse disattivata.
- APK Android firmato completato su EAS (build 1d0e677a-648d-40a8-91fb-44336ef8f7b5). Verifica del download eseguita; installazione fisica ancora da collaudare. Firma iOS e credenziali FCM/APNs da completare.
- Da verificare su due telefoni: registrazione, pairing, Realtime e riconnessione, banner con app chiusa, permessi negati, logout e cambio giorno.

Le prove del database e del browser non dimostrano la ricezione sul telefono.

## Aggiornamento del 14 ottobre 2026

Nuovo controllo privato dei telefoni nel Profilo e messaggi che distinguono un contenuto salvato dalla ricezione di una notifica. Test di isolamento e compatibilità delle vecchie risposte superati anche nel servizio reale; zero account temporanei residui. Controlli e compilazione dei tre sistemi passati. Il servizio di invio è attivo ma i telefoni registrati sono ancora zero. Non è stata generata una nuova build firmata: manca la sessione Expo in questo ambiente. La verifica browser del nuovo pannello non è stata eseguita: il controllo browser non è disponibile nel runtime.
