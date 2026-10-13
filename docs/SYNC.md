# Collegamento tra i due telefoni

Il codice della modalita collegata e pronto. Il progetto Supabase dedicato deve ancora essere creato e configurato: finche le variabili dell'app restano vuote, funziona la versione locale.

## Preparato e verificato nel codice

- Account con email e password; conferma dell'email richiesta dal servizio.
- Creazione di uno spazio e invito valido 24 ore, con uso singolo.
- Massimo due persone per coppia e un solo spazio per account.
- Stato del partner, pensieri, gesti, diario e attivita condivise.
- Aggiornamenti Realtime, ricaricamento quando si riapre l'app e controllo periodico se la connessione si interrompe.
- Modifiche per singolo contenuto: un cambiamento a una pagina non riscrive tutto lo spazio.
- Controllo della versione: se il partner modifica lo stesso contenuto, l'app avvisa e conserva il testo che stavi scrivendo.
- Sessione conservata con Expo SecureStore su iOS e Android, anche per valori lunghi. Sul web viene usato lo spazio locale del browser.
- Blocco della compilazione se viene configurata una chiave secret o service_role invece della publishable.

## Attivazione del servizio

1. Scegliere l'organizzazione Supabase e confermare il costo indicato dal servizio prima di creare il progetto `love`.
2. Usare un progetto dedicato. Non applicare lo schema ai progetti delle altre app.
3. Attivare la conferma email in Auth. Configurare l'indirizzo di destinazione delle email di conferma.
4. Applicare `supabase/schema.sql` una volta al nuovo progetto tramite gli strumenti Supabase. Il file e uno schema iniziale, non una migrazione gia applicata.
5. Eseguire gli advisors del progetto, controllare le pubblicazioni Realtime e verificare l'accesso con due account reali e un terzo estraneo.
6. Copiare `.env.example` in `.env` e inserire URL e chiave **publishable** del progetto. Non inserire chiavi segrete nel codice dell'app o nella repository.
7. Riavviare Expo. Dopo la registrazione, una persona crea lo spazio e genera il codice nel Profilo; l'altra incolla il codice nella schermata di collegamento.
8. Provare le modifiche in entrambe le direzioni su un iPhone e un Android. Verificare anche riconnessione, uscita dall'account e modifica simultanea della stessa pagina.

Il salvataggio locale della prima versione viene conservato. Non viene importato automaticamente nello spazio online.

## Notifiche

Lo schema prepara una coda privata `private.notification_jobs` solo per stati e gesti. Il salvataggio di umore, bisogno e pensiero produce un singolo aggiornamento. Gli aggiornamenti a diario, calendario, promemoria, liste, idee e obiettivi non entrano nella coda.

La coda non invia ancora notifiche push. Per attivarle servono la registrazione dei dispositivi, un servizio server di invio, gestione degli errori e delle ricevute, credenziali APNs/FCM e una build di sviluppo/distribuzione compatibile. Una chiave di amministrazione non deve mai essere inserita nell'app.

## Test eseguiti

`npm test` include test con Postgres locale tramite PGlite: permessi delle righe, esclusione di account esterni, limite di due membri, inviti invalidati e non riutilizzabili, validazione delle date, conflitti di versione e coda delle notifiche. Si verifica anche che una chiave segreta blocchi la compilazione e che una sessione lunga o una scrittura interrotta non corrompa quella gia salvata.

Questi test non sostituiscono il collaudo del progetto Supabase reale, dei WebSocket o delle notifiche su dispositivi fisici. Il recupero password, le foto del diario, le risposte alle pagine, gli indicatori di novita e la pubblicazione negli store sono ancora da completare.
