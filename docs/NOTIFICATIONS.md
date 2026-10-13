# Notifiche di sistema

Il client per iOS/Android registra il telefono da **Profilo → Attiva le notifiche su questo telefono**. Il browser e Expo Go mostrano il limite senza simulare una consegna. Uscire dall’account disattiva prima il dispositivo, per evitare che riceva contenuti di un vecchio account.

## Stato attuale

- `notifications-core.sql` è installato nel progetto love: dispositivi e coda sono privati, senza lettura diretta dai client.
- `notifications-network.sql` è scritto e verificato con risposte HTTP simulate, ma **non è attivo sul servizio reale**.
- Il controllo automatico ha rifiutato l’attivazione di pg_net/cron perché trasmetterebbe testi personali e token dei telefoni a Expo. Serve l’approvazione esplicita di Luigi per questa destinazione e questi dati.
- Nessuna notifica reale è stata inviata durante i test.
- Serve una build firmata, il vero EAS projectId e le credenziali APNs/FCM. Esportare un bundle non crea un’app installabile.

## Invio previsto dopo l’approvazione

La coda usa solo il destinatario ricavato dalla coppia autenticata. Un salvataggio di umore, bisogno e pensiero produce un solo evento. Ogni gesto produce il proprio evento. Diario, calendario, liste, idee e obiettivi non producono notifiche.

Il server conserva una copia del contenuto al momento dell’invio, per non sostituirlo con uno stato aggiornato dopo. Ogni evento ha al massimo una consegna per telefono; i retry di rete possono comunque duplicare un invio se Expo lo riceve ma la risposta si perde. Il collapseId limita gli avvisi ancora in coda, non garantisce esattamente una visualizzazione.

L’invio parte dopo il commit, indipendentemente dall’app aperta. Il processo cron riprova gli errori temporanei e verifica le ricevute Expo dopo 15 minuti. Una richiesta accettata da Expo non viene subito marcata come consegnata. Una ricevuta conferma il passaggio ad Apple/Google, non che l’utente abbia letto l’avviso. Un token non più registrato viene disattivato.

Gli invii iniziali scadono dopo 10 minuti; gli stati del giorno prima non vengono inviati dopo mezzanotte italiana. La cronologia dei gesti non viene mostrata nell’app. I metadati tecnici della coda restano privati per gestire invii e ricevute.

Dopo l’approvazione: abilitare pg_net e pg_cron, applicare `notifications-network.sql`, revocare l’accesso client agli schemi net/cron e programmare `private.process_push_queue()` ogni minuto. Non attivare automaticamente questa parte con CI.

## Collaudo sui telefoni

Con entrambi i telefoni registrati, inviare uno stato e un gesto mentre il destinatario ha l’app chiusa; verificare banner e suono. Controllare che modificare diario e calendario non generi avvisi. Ripetere dopo logout, con permessi negati e dopo mezzanotte.

Fonti: [Expo Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [invio e ricevute Expo](https://docs.expo.dev/push-notifications/sending-notifications/), [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net).
