import { test, expect } from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Prova senza account'}).click();await expect(page.getByRole('tab',{name:/Noi$/})).toBeVisible();});
test('un solo cuore, stato conservato e navigazione completa',async({page})=>{
  await expect(page.getByLabel('Cuore giallo')).toHaveCount(1);
  await page.getByRole('button',{name:/Felice/}).click();
  await page.getByLabel('Un pensiero per te',{exact:true}).fill('Pensiero di collaudo');
  await page.getByRole('button',{name:/Salva il mio stato/}).click();
  for(const tab of ['Pagine','Album','Insieme','Profilo']){await page.getByRole('tab',{name:new RegExp(tab+'$')}).click();await expect(page.getByLabel('Cuore giallo')).toHaveCount(1);}
  await page.reload();await page.getByRole('button',{name:'Prova senza account'}).click();await page.getByRole('tab',{name:/Noi$/}).click();await expect(page.getByLabel('Un pensiero per te',{exact:true})).toHaveValue('Pensiero di collaudo');
});
test('diario e calendario salvano contenuti veri',async({page})=>{
  await page.getByRole('tab',{name:/Pagine$/}).click();await page.getByRole('button',{name:'+ Scrivi una pagina'}).click();await page.getByLabel('Titolo',{exact:true}).fill('Un ricordo di collaudo');await page.getByLabel('Il ricordo',{exact:true}).fill('Una giornata da conservare');await page.getByRole('button',{name:'Conserva questa pagina'}).click();await expect(page.getByText('Un ricordo di collaudo',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:/Insieme$/}).click();await page.getByRole('button',{name:'+ Aggiungi al calendario'}).click();await page.getByLabel('Titolo',{exact:true}).fill('Cena di collaudo');await page.getByLabel('Ora',{exact:true}).fill('20:30');await page.getByRole('button',{name:'Aggiungi al calendario',exact:true}).click();await expect(page.getByText('Cena di collaudo',{exact:true})).toBeVisible();
});
test('album: una foto scelta si carica e resta dopo la riapertura',async({page})=>{
  await page.getByRole('tab',{name:/^.+ Album$/}).click();await page.getByRole('button',{name:'+ Crea un album'}).click();await page.getByLabel('Titolo dell’album',{exact:true}).fill('Album di collaudo');await page.getByRole('button',{name:'Crea questa raccolta'}).click();
  const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'+ Aggiungi foto dal telefono'}).click();await (await chooser).setFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCKcAAAAASUVORK5CYII=','base64')});
  await expect(page.getByText(/1 foto/)).toBeVisible();await expect(page.locator('img').first()).toBeVisible();await page.reload();await page.getByRole('button',{name:'Prova senza account'}).click();await page.getByRole('tab',{name:/^.+ Album$/}).click();await page.getByRole('button',{name:/Apri foto del/}).first().click();await expect(page.getByText(/1 foto/)).toBeVisible();
});
