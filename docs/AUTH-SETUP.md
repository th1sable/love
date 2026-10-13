# Conferma email e recupero password

L’app passa sempre `https://love-prova-cuore-giallo.thisable.chatgpt.site/auth/confirm` come ritorno per registrazione, nuova conferma e reset password. Questa pagina legge il risultato della verifica, mostra successo o errore e apre la schermata per la nuova password nei flussi di recupero. I token vengono rimossi dall’indirizzo dopo la verifica.

**La configurazione del servizio non è stata modificata:** il connettore Supabase non espone le impostazioni Auth, non è disponibile un token Management API e il controllo del browser non si avvia in questo ambiente. Il problema localhost non può essere considerato risolto finché il servizio non viene configurato e verificato con una nuova email.

In [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/fpkhmzmmlvdwaxgyycdh/auth/url-configuration):

- **Site URL:** `https://love-prova-cuore-giallo.thisable.chatgpt.site/auth/confirm`
- **Redirect URLs:** aggiungere `https://love-prova-cuore-giallo.thisable.chatgpt.site/auth/confirm` e, per la futura build nativa, `love://auth/confirm`.
- Conservare eventuali indirizzi già autorizzati che servono al progetto; non usare wildcard globali.

Nei template email, usare il collegamento standard `{{ .ConfirmationURL }}` oppure un collegamento con `token_hash` e `type` alla pagina sopra. Non scrivere localhost direttamente nel template. Una nuova email va richiesta dopo la modifica: i collegamenti già ricevuti non vengono corretti retroattivamente.

L’anteprima Sites è privata: la pagina web richiede anche l’account ChatGPT autorizzato al sito. Prima di distribuire love ad altre persone serve un ritorno email accessibile a entrambe, o l’apertura nella build nativa. L’app nativa deve gestire `love://auth/confirm`; la route è già presente.

La consegna email a indirizzi esterni al team Supabase richiede SMTP configurato; il servizio SMTP predefinito non basta per un’app da distribuire. Non disabilitare la conferma email per aggirare questo passaggio.

Il controllo Supabase segnala inoltre la protezione contro password compromesse disattivata: [indicazioni Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Fonti: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Reset password](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
