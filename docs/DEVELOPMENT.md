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
- Gesti senza cronologia visibile; notifiche predisposte, con attivazione esterna ancora in attesa.
- Diario: creazione, modifica, date, ordinamento e preferiti.
- Calendario a griglia con impegni, orario, annotazioni e modifica. Promemoria rimossi dalla navigazione; i vecchi dati si possono trasferire nel calendario.
- Liste spiegate con esempi, proposte per uscire da scegliere insieme e obiettivi con una data entro cui realizzarli.
- Diario con data giorno/mese/anno e calendario compatto.
- «Da quanto stiamo insieme»: data del fidanzamento condivisa, anni/mesi/giorni, giorni totali e prossimo anniversario. Disponibile in Noi e modificabile in Profilo. La data è un record calendario condiviso con id stabile, aggiornato senza notifiche.
- Password visibile/nascosta, recupero password, reinvio conferma e pagina di risposta al link email. Il ritorno Supabase va ancora configurato: vedi docs/AUTH-SETUP.md.
- Cuore che batte, entrata morbida delle schermate, feedback sui pulsanti e rispetto delle impostazioni per ridurre le animazioni.
- Umore, bisogno e pensiero si svuotano a mezzanotte italiana, anche riaprendo l’app dopo il cambio giorno.
- Salvataggio su dispositivo, caricamento e gestione degli errori.
- Icona a cuore giallo per iOS, Android e web.

## Modalita collegata

Account, inviti e sincronizzazione sono collegati al progetto love. La guida docs/SYNC.md descrive la configurazione e i test eseguiti. La modalita collegata e predefinita; EXPO_PUBLIC_LOCAL_MODE=true permette di riaprire il prototipo locale.

## Da attivare o completare

Collaudo su due telefoni, impostazioni di ritorno e consegna delle email, attivazione autorizzata del servizio push, build firmate e credenziali Apple/Google, foto, risposte alle pagine, indicatore delle novità del partner, gestione degli obiettivi economici e pubblicazione negli store. Vedi docs/AUTH-SETUP.md e docs/NOTIFICATIONS.md.

Non vengono simulati messaggi ricevuti dal partner. I gesti salvati in questa versione non sono inviati ad altri telefoni. Il banner nella UI comunica il limite.

## Prossimo passo: servizio della coppia

Il progetto dedicato love e gia attivo. Restano da completare i controlli di rilascio e le funzioni sotto indicate:

1. Account e sessioni protette, conferma dell'email e recupero password.
2. Inviti con scadenza e uso singolo; massimo due membri per coppia.
3. Accesso ai dati limitato ai membri della coppia tramite RLS.
4. Scritture sul server e sincronizzazione Realtime, con gestione della connessione e dei conflitti.
5. Foto in un bucket privato; nessun dato personale nella repository pubblica.
6. Eventi personali inviati come singolo aggiornamento e singola notifica. Diario e organizzazione restano silenziosi.
7. Test con due account e un terzo estraneo, su iOS e Android. Verificare che il terzo account non possa leggere o modificare dati della coppia.

La funzione `shouldNotifyPartner` fissa la regola, ma non invia notifiche. La coda privata è installata. Il dispatcher esterno è scritto e testato ma non attivo, in attesa di approvazione esplicita.

## Logo

`assets/heart.svg` e' la sorgente vettoriale: un cuore giallo su fondo avorio. `npm run icons` rigenera le immagini PNG. Il foreground Android ha fondo trasparente; il launcher applica la propria maschera.

## Verifica e limiti

TypeScript, ESLint, i test del dominio, del collegamento e del database e l'esportazione dei bundle per iOS, Android e web sono stati verificati. L'esportazione non e' una build firmata e non sostituisce il collaudo su due telefoni reali.

L'audit delle dipendenze ha rilevato anche avvisi negli strumenti Expo. Sono stati fissati `decode-uri-component` a 0.5.0 e `uuid` a 11.1.1 tramite override. Restano avvisi ereditati da `braces` 3.0.3 e `node-forge` 1.4.0: al momento della verifica non risultano versioni stabili successive nei rispettivi pacchetti. Ricontrollare gli aggiornamenti degli strumenti prima della distribuzione. Non usare aggiornamenti forzati che portino Expo a una versione incompatibile.
