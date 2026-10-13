import { test, expect } from '@playwright/test';

test('accesso: password visibile, registrazione e recupero senza inviare email', async ({ page }) => {
  await page.goto('/');
  const password = page.getByLabel('Password', { exact: true });
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostra password', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Nascondi password', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Password dimenticata?', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Inserisci prima la tua email.');
  await page.getByRole('button', { name: 'Non ho un account', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Crea il mio account', exact: true })).toBeVisible();
  await expect(page.getByLabel('Cuore giallo')).toHaveCount(1);
});
