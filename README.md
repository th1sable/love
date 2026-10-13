# love

Uno spazio per due, per sentirsi vicini e organizzare la vita insieme.

**love** è un progetto di app per **iOS e Android** dedicata alla coppia. Due account collegati condividono stati d’animo, pensieri, gesti affettuosi, ricordi e attività quotidiane.

> **Stato del progetto:** app Expo/React Native per iOS e Android collegata al progetto Supabase love. Database, permessi, inviti e gestione dei conflitti sono installati e verificati anche sul servizio reale. Calendario a griglia, date italiane, recupero password, cuore animato e reset quotidiano sono implementati. Restano la configurazione del ritorno email, il collaudo completo su due telefoni e l’attivazione autorizzata delle notifiche push. Vedi [i controlli eseguiti](docs/LIVE-CHECKS.md).

**Logo:** un cuore giallo su fondo avorio 💛.

## Prova senza account

Nella schermata iniziale tocca **Prova senza account**. Puoi provare stati d’animo, gesti, pagine del diario e liste: i dati restano sul dispositivo o nel browser. Nessun contenuto viene inviato al partner. In **Profilo**, tocca **Esci dalla prova e accedi** per usare lo spazio online. I dati della prova non vengono importati automaticamente. Le notifiche della prova locale non vengono inviate.

## Avvio della prima versione

Richiede Node.js 22.13 o successivo.

```sh
npm ci
npm start
```

Per controllare il progetto: `npm run typecheck`, `npm test` e `npx expo export --platform all`.

Vedi [la guida di sviluppo](docs/DEVELOPMENT.md) per funzioni già implementate, limiti e prossimo passo. I contenuti locali non vengono importati automaticamente nello spazio online. Vedi [come attivare il collegamento](docs/SYNC.md).

La prova aggiornata è disponibile su [love 💛](https://love-prova-cuore-giallo.thisable.chatgpt.site). Vedi i passaggi ancora necessari per [email](docs/AUTH-SETUP.md) e [notifiche di sistema](docs/NOTIFICATIONS.md).

## Come funziona

Ogni persona usa l’app sul proprio telefono e collega il suo account a quello del partner tramite un codice d’invito. I contenuti condivisi vengono sincronizzati tra i due account, anche quando uno usa iPhone e l’altro Android.

Con l’app aperta e una connessione disponibile, gli aggiornamenti devono comparire in tempo reale. Le notifiche sul telefono sono previste solo per gli aggiornamenti personali e i gesti affettuosi, se abilitate dal destinatario. La sincronizzazione dei contenuti non dipende dal consenso alle notifiche.

## Stati d’animo e vicinanza

- **Come ti senti:** felice 😊, triste 😔, stanco 😴, stressato 😣, “mi manchi” 🥺.
- **Di cosa hai bisogno:** parlare 💬, un abbraccio 🫂, compagnia ❤️ o un po’ di spazio 🌙.
- **Un pensiero:** una breve frase da aggiungere al proprio stato.
- **Una risposta affettuosa:** un bacio 😘, un abbraccio 🫂, un’emoji o un messaggio.

Ogni stato mostra l’ora dell’aggiornamento, così è chiaro quanto è recente. Ciascuno sceglie cosa condividere. Piccole animazioni accompagnano l’invio e la ricezione dei gesti affettuosi.

## Le pagine della nostra vita

Un diario condiviso da sfogliare come un libro.

Ogni pagina può contenere titolo, data, pensieri, foto ed emoji. Quando viene salvata compare anche nell’app dell’altra persona, che può aggiungere una risposta o un ricordo proprio.

Le pagine sono ordinate per data e possono essere segnate come preferite. Nuove pagine, risposte e modifiche si sincronizzano senza inviare notifiche sul telefono.

## Album privati

Create raccolte con titolo e data, scegliete più foto dal telefono e sfogliatele per **giorni, mesi e anni**, oppure per album. Ogni gruppo di foto può avere una data diversa. Le immagini si aprono a schermo intero; negli account collegati foto e album restano privati alla coppia e si aggiornano senza notifiche. Nella prova vengono conservati soltanto sul dispositivo. Vedi [la guida Album](docs/ALBUMS.md).

## Spazio condiviso

- **Calendario:** appuntamenti, anniversari e impegni, per organizzare il tempo insieme.
- **Liste:** spesa, film da vedere, cose da fare e posti da visitare.
- **Idee per uscire:** proposte da raccogliere e scegliere insieme.
- **Obiettivi di coppia:** un progetto da realizzare, con una data «entro il».

Aggiunte e modifiche in queste sezioni si sincronizzano in silenzio. Un indicatore “Novità” segnala nell’app i contenuti aggiunti o aggiornati dal partner.

## Regole delle notifiche

| Evento | Notifica al partner | Sincronizzazione |
| --- | --- | --- |
| Aggiornamento dello stato d’animo | Sì | Sì |
| Aggiornamento di un bisogno | Sì | Sì |
| Pensiero condiviso nello stato | Sì | Sì |
| Bacio, abbraccio, emoji o messaggio affettuoso | Sì | Sì |
| Pagina del diario, risposta o modifica | No | Sì |
| Aggiunta o modifica a calendario e promemoria | No | Sì |
| Aggiunta o modifica a una lista | No | Sì |
| Aggiunta o modifica a un’idea per uscire | No | Sì |
| Aggiunta o modifica a un obiettivo di coppia | No | Sì |

**Un aggiornamento, una notifica:** se umore, bisogno e pensiero vengono salvati insieme, il partner riceve una sola notifica.

Gli eventuali avvisi all’orario scelto per calendario e promemoria sono separati dalle notifiche per le modifiche del partner e saranno configurabili.

## Accesso e dati personali

Lo spazio della coppia deve essere accessibile soltanto ai due account collegati. Stati d’animo, messaggi, foto e pagine del diario sono dati personali e non devono essere pubblicati nella repository.

La gestione degli accessi e dei dati dovrà essere implementata e verificata prima dell’utilizzo con contenuti reali.

## Percorso di sviluppo

- [ ] Accesso e collegamento dei due account con codice d’invito.
- [ ] Sincronizzazione degli stati d’animo, bisogni e pensieri.
- [ ] Invio di gesti affettuosi e messaggi.
- [ ] Notifiche secondo le regole concordate.
- [ ] Diario “Le pagine della nostra vita”.
- [ ] Calendario, promemoria, liste, idee e obiettivi condivisi.
- [ ] Indicatore “Novità” nelle sezioni silenziose.
- [ ] Animazioni leggere e riscontro visivo sui pulsanti.
- [ ] Verifica del funzionamento tra iOS e Android.
- [ ] Documentazione tecnica e istruzioni di avvio.
