# Album e galleria

La sezione Album permette di creare raccolte con titolo e data, aggiungere più foto dalla selezione del telefono o del browser e sfogliarle a griglia. Le viste Album, Giorni, Mesi e Anni ordinano i ricordi nel tempo. Una foto si apre a schermo intero con precedente/successiva. Si possono modificare titolo e data dell’album e scegliere una data diversa per ogni gruppo di foto aggiunte.

La data è scelta dall’utente: non viene letta automaticamente dai dati EXIF. Cambiare la data dell’album non cambia le date già assegnate alle foto.

## Modalità di prova

Le immagini restano sul dispositivo: IndexedDB nel browser, directory documenti nell’app nativa. Lo stato contiene solo riferimenti alle immagini, senza grandi stringhe base64 in AsyncStorage. Cancellare i dati del browser o dell’app rimuove anche le foto locali. Le foto della prova non vengono importate automaticamente negli account online.

## Modalità collegata

Le immagini vengono preparate come JPEG, ridimensionate al massimo a 1800 pixel sul lato maggiore e compresse prima del caricamento. Il bucket Supabase `couple-photos` è privato, ammette JPEG fino a 8 MiB e non permette sovrascritture. Percorso: coppia/utente/foto.jpg. I due membri possono leggere le immagini della coppia; si carica solo nel proprio percorso e un terzo account non può leggere o caricare.

Gli album sono record con versioni e controlli dei conflitti. Il server verifica che ogni foto esista nel bucket e appartenga alla stessa coppia. I link di visualizzazione sono firmati, durano un’ora e vengono rinnovati durante l’uso. Non vengono salvati nei record né pubblicati nel codice. Album e foto non generano notifiche push.

Fino a 10 immagini per selezione e 60 per album. Se il salvataggio dei riferimenti non è confermato, il pulsante Riprova salvataggio conserva il tentativo nella schermata. Non uscire prima di completarlo. Non si eliminano automaticamente i file dopo un errore di rete: il salvataggio può essere riuscito senza che la risposta sia arrivata. Eventuali caricamenti abbandonati possono lasciare file orfani privati; la pulizia e l’eliminazione degli album non sono ancora implementate.

## Verifiche

Test su raggruppamento per data, compatibilità del salvataggio, copie duplicate, link estranei, accesso dei due membri e rifiuto di terzi, conflitti e assenza di notifiche. `supabase/verify_albums.sql` verifica anche il servizio reale in una transazione annullata, senza caricare immagini o inviare email. Resta il collaudo manuale del selettore e del caricamento su due telefoni.
