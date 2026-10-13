# Versioni installabili

## Android

Progetto EAS: https://expo.dev/accounts/thisable/projects/love
Build iniziale: https://expo.dev/accounts/thisable/projects/love/builds/1d0e677a-648d-40a8-91fb-44336ef8f7b5

Build preview interna con APK e keystore remoto creato da EAS. Attendere FINISHED prima di installare. Il solo caricamento dei sorgenti non è un APK.

Per ricevere push Android servono un’app Firebase per com.th1sable.love, il file google-services.json nella variabile file EAS GOOGLE_SERVICES_JSON e la credenziale FCM V1 caricata nel progetto EAS. Nessuna credenziale amministrativa va nel codice. La build iniziale consente il collaudo delle funzioni, ma la configurazione Firebase non è ancora disponibile.

## iPhone

Bundle ID com.th1sable.love. EAS ha richiesto l’accesso Apple per creare certificato/profilo specifici di love; l’accesso non è disponibile in questa sessione. La chiave App Store Connect esistente ha bisogno del suo Issuer ID; non è una chiave APNs e non va usata come tale. Non riutilizzare profili di MrDoggy per un bundle diverso. Nessuna IPA o versione TestFlight love creata.

## Accesso e notifiche

Il dispatcher server è attivo. Prima del collaudo con due account reali servono URL Configuration Auth e SMTP, poi entrambi i telefoni vanno registrati dal Profilo con il consenso del sistema operativo. I permessi del telefono possono essere concessi soltanto dal proprietario sul dispositivo.

Installare una build ed esportare bundle JavaScript sono due operazioni diverse. La prova browser non sostituisce il collaudo nativo.
