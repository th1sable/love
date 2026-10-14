# Notifiche di sistema

Il client per iOS/Android registra il telefono da **Profilo → Attiva le notifiche su questo telefono**. Il browser e Expo Go mostrano il limite senza simulare una consegna. Uscire dall’account disattiva prima il dispositivo, per evitare che riceva contenuti di un vecchio account.

## Stato attuale — 13 ottobre 2026

- Core e dispatcher installati sul progetto love.
- pg_net/pg_cron attivi; love-push-dispatch esegue il dispatcher ogni minuto. Accesso diretto negato ad anon/authenticated.
- Attivazione eseguita dopo la richiesta di Luigi di attivare le notifiche, con precedente informazione sui dati trasmessi a Expo: nome del mittente, testo e token del dispositivo.
- Zero dispositivi registrati e zero consegne alla verifica: nessuna ricezione su telefoni dichiarata.
- Progetto EAS @thisable/love collegato con ID 93d7bf81-70ed-470a-8137-bb999ce70adb. Firma delle build e credenziali APNs/FCM ancora da completare.

## Invio attivo sul server

La coda usa solo il destinatario ricavato dalla coppia autenticata. Un salvataggio di umore, bisogno e pensiero produce un solo evento. Ogni gesto produce il proprio evento. Diario, calendario, liste, idee e obiettivi non producono notifiche.

Il server conserva una copia del contenuto al momento dell’invio, per non sostituirlo con uno stato aggiornato dopo. Ogni evento ha al massimo una consegna per telefono; i retry di rete possono comunque duplicare un invio se Expo lo riceve ma la risposta si perde. Il collapseId limita gli avvisi ancora in coda, non garantisce esattamente una visualizzazione.

L’invio parte dopo il commit, indipendentemente dall’app aperta. Il processo cron riprova gli errori temporanei e verifica le ricevute Expo dopo 15 minuti. Una richiesta accettata da Expo non viene subito marcata come consegnata. Una ricevuta conferma il passaggio ad Apple/Google, non che l’utente abbia letto l’avviso. Un token non più registrato viene disattivato.

Gli invii iniziali scadono dopo 10 minuti; gli stati del giorno prima non vengono inviati dopo mezzanotte italiana. La cronologia dei gesti non viene mostrata nell’app. I metadati tecnici della coda restano privati per gestire invii e ricevute.

Per riprodurre la configurazione: abilitare pg_net e pg_cron, applicare `notifications-network.sql`, revocare l’accesso client agli schemi net/cron e programmare `private.process_push_queue()` ogni minuto. Non attivare automaticamente questa parte con CI.

## Collaudo sui telefoni

Con entrambi i telefoni registrati, inviare uno stato e un gesto mentre il destinatario ha l’app chiusa; verificare banner e suono. Controllare che modificare diario e calendario non generi avvisi. Ripetere dopo logout, con permessi negati e dopo mezzanotte.

Fonti: [Expo Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [invio e ricevute Expo](https://docs.expo.dev/push-notifications/sending-notifications/), [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net).

## Controllo dei telefoni — aggiornamento del 14 ottobre 2026

Nel Profilo il controllo mostra quanti telefoni propri e del partner sono collegati, il permesso sul dispositivo attuale e la disponibilità del servizio di invio. Si aggiorna al ritorno nell'app e con il pulsante Aggiorna. Questi dati indicano il collegamento: non certificano che il destinatario abbia ricevuto o letto un avviso.

La funzione `get_push_status` è disponibile soltanto agli utenti confermati che appartengono a uno spazio. Non restituisce token, identificativi dei telefoni, messaggi o dati di altre coppie. `notification-status.sql` aggiunge anche la stessa informazione alla risposta di salvataggio, evitando un'altra richiesta dopo ogni gesto. Le versioni precedenti continuano a leggere i contenuti normalmente.

Gli errori di collegamento Android vengono spiegati in italiano. Nessun errore successivo al salvataggio delle informazioni sulle notifiche trasforma un contenuto già salvato in un falso errore di scrittura.

Verifiche: 18 test passati, TypeScript ed ESLint passati, esportazione iOS/Android/web riuscita, prova reale con transazione annullata e zero utenti di test residui. Il connettore non consente di modificare le impostazioni Auth e in questo ambiente il comando EAS whoami restituisce Not logged in. Le credenziali Firebase e Apple restano da completare. Nessuna nuova build installabile prodotta da questo aggiornamento.
