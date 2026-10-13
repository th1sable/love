import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacentMonth, currentStatus, dateNumber, dayKey, monthCells, relationshipTime } from '../src/dates.ts';
test('lo stato scade a mezzanotte italiana anche con cambio dell’ora',()=>{
  const status={mood:'Felice',need:'Parlare',thought:'Ciao',updatedAt:'2026-10-13T21:30:00Z'};
  assert.equal(dayKey(new Date(status.updatedAt)),'2026-10-13');
  assert.equal(currentStatus(status,new Date('2026-10-13T21:59:59Z')),status);
  assert.equal(currentStatus(status,new Date('2026-10-13T22:00:00Z')),null);
  const winter={...status,updatedAt:'2026-10-25T22:59:00Z'};
  assert.equal(currentStatus(winter,new Date('2026-10-25T23:00:00Z')),null);
  assert.equal(currentStatus({...status,updatedAt:'bad'}),null);
});
test('tempo insieme: anni, mesi, giorni, fine mese, bisestili e ora legale',()=>{
  assert.deepEqual(relationshipTime('2024-02-29',new Date('2025-02-28T12:00:00Z')),{years:1,months:0,days:0,totalDays:365,nextAnniversaryDays:0});
  assert.equal(relationshipTime('2026-01-31',new Date('2026-03-01T12:00:00Z'))?.months,1);
  assert.equal(relationshipTime('2026-01-31',new Date('2026-03-01T12:00:00Z'))?.days,1);
  assert.equal(relationshipTime('2026-03-28',new Date('2026-03-30T12:00:00Z'))?.totalDays,2);
  assert.equal(relationshipTime('2026-10-14',new Date('2026-10-13T12:00:00Z')),null);
  assert.equal(relationshipTime('2023-05-12',new Date('2026-10-13T12:00:00Z'))?.years,3);
});
test('il calendario parte da lunedì, include gli anni bisestili e cambia anno',()=>{
  assert.equal(dateNumber('2026-10-13'),'13/10/2026');
  assert.equal(monthCells('2024-02').filter(Boolean).length,29);
  assert.equal(monthCells('2026-02').filter(Boolean).length,28);
  assert.equal(monthCells('2026-06')[0],'2026-06-01');
  assert.equal(adjacentMonth('2026-12',1),'2027-01');
  assert.equal(adjacentMonth('2026-01',-1),'2025-12');
});
