# Prima versione

La base e' Expo + React Native, con TypeScript. Lo stesso codice serve iOS e Android; l'esportazione web permette una verifica aggiuntiva.

## Avvio

Richiede Node.js 22.13 o successivo.

```sh
npm ci
npm start
```

Aprire con una versione compatibile di Expo Go o con una development build. Per Android si puo' usare anche un emulatore. Il simulatore iOS richiede macOS; le build di distribuzione richiedono firma e account delle piattaforme.

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform all
```

## Funziona ora

- Nomi e stato personale (umore, bisogno e pensiero).
- Gesti con animazione e cronologia locale.
- Diario: creazione, modifica, date, ordinamento e preferiti.
- Calendario come elenco di appuntamenti, promemoria, liste, idee e obiettivi: aggiunta e completamento.
- Salvataggio su dispositivo, caricamento e gestione degli errori.
- Icona a cuore giallo per iOS, Android e web.

## Non ancora disponibile

Account, invito, sincronizzazione fra telefoni, notifiche push, foto, risposte alle pagine, avvisi programmati, indicatore delle novita' del partner, gestione avanzata degli obiettivi economici e pubblicazione negli store.

Non vengono simulati messaggi ricevuti dal partner. I gesti salvati in questa versione non sono inviati ad altri telefoni. Il banner nella UI comunica il limite.

## Prossimo passo: servizio della coppia

Preparare un progetto Supabase dedicato a love, separato dalle altre app. Prima dell'attivazione:

1. Account e sessioni protette, conferma dell'email e recupero password.
2. Inviti con scadenza e uso singolo; massimo due membri per coppia.
3. Accesso ai dati limitato ai membri della coppia tramite RLS.
4. Scritture sul server e sincronizzazione Realtime, con gestione della connessione e dei conflitti.
5. Foto in un bucket privato; nessun dato personale nella repository pubblica.
6. Eventi personali inviati come singolo aggiornamento e singola notifica. Diario e organizzazione restano silenziosi.
7. Test con due account e un terzo estraneo, su iOS e Android. Verificare che il terzo account non possa leggere o modificare dati della coppia.

La funzione `shouldNotifyPartner` fissa la regola, ma non invia notifiche. Una futura coda server deve rendere gli invii idempotenti e non affidare le autorizzazioni al client.

## Logo

`assets/heart.svg` e' la sorgente vettoriale: un cuore giallo su fondo avorio. `npm run icons` rigenera le immagini PNG. Il foreground Android ha fondo trasparente; il launcher applica la propria maschera.

## Verifica e limiti

TypeScript, ESLint, i tre test del dominio e l'esportazione dei bundle per iOS, Android e web sono stati verificati. L'esportazione non e' una build firmata e non sostituisce il collaudo su due telefoni reali.

L'audit delle dipendenze ha rilevato anche avvisi negli strumenti Expo. Sono stati fissati `decode-uri-component` a 0.5.0 e `uuid` a 11.1.1 tramite override. Restano avvisi ereditati da `braces` 3.0.3 e `node-forge` 1.4.0: al momento della verifica non risultano versioni stabili successive nei rispettivi pacchetti. Ricontrollare gli aggiornamenti degli strumenti prima della distribuzione. Non usare aggiornamenti forzati che portino Expo a una versione incompatibile.
