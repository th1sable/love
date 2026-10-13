import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, isState, isValidDate, shouldNotifyPartner, type EventKind } from '../src/domain.ts';
test('solo stato e gesto avvisano il partner', () => {
  const events: EventKind[] = ['status','gesture','diary','calendar','reminder','list','idea','goal'];
  assert.deepEqual(events.filter(shouldNotifyPartner), ['status','gesture']);
});
test('date inesistenti vengono rifiutate', () => {
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2026-13-01'), false);
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(isValidDate('2026-10-13'), true);
});
test('i dati salvati devono avere la struttura prevista', () => {
  assert.equal(isState(emptyState), true);
  assert.equal(isState({ ...emptyState, pages: [null] }), false);
});
