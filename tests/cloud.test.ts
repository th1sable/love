import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/domain.ts';
import { diffState, mergeSpace, projectSpace, type Space } from '../src/cloud/model.ts';
import { secureSessionStorage, type StorageDriver } from '../src/cloud/secureSession.ts';
const space:Space={id:'couple',members:[{user_id:'a',display_name:'A'},{user_id:'b',display_name:'B'}],entries:[]};
test('un salvataggio di umore, bisogno e pensiero produce un solo aggiornamento',()=>{
  const before={...emptyState,name:'A',partnerName:'B'};
  const next={...before,status:{mood:'Felice',need:'Parlare',thought:'Ciao',updatedAt:'now'}};
  const changes=diffState(before,next,space,'a');assert.equal(changes.length,1);assert.equal(changes[0].kind,'status');assert.equal(changes[0].id,'a');
});
test('l’aggiornamento di una pagina non ripubblica liste, gesti o stato',()=>{
  const page={id:'page',title:'Noi',body:'Ricordo',date:'2026-10-13',favorite:false};
  const before={...emptyState,pages:[page]};const next={...before,pages:[{...page,body:'Un nuovo ricordo'}]};
  const entries:Space={...space,entries:[{kind:'diary',id:'page',payload:page,version:3,author_id:'b',updated_at:'2026-10-13T12:00:00Z'}]};
  const changes=diffState(before,next,entries,'a');assert.equal(changes.length,1);assert.equal(changes[0].expected_version,3);
});
test('risposte in ritardo non cancellano la modifica piu recente',()=>{
  const record={id:'a',kind:'status' as const,author_id:'a',payload:{mood:'Felice',need:'',thought:''},updated_at:'2026-10-13T12:00:00Z',version:2};
  const latest={...space,entries:[record]};const stale={...space,entries:[{...record,version:1,payload:{...record.payload,mood:'Stanco'}}]};
  assert.equal(mergeSpace(latest,stale).entries[0].version,2);
  assert.equal(projectSpace(mergeSpace(latest,stale),'b').partnerStatus?.mood,'Felice');
});
test('una scrittura incompleta della sessione lascia leggibile la precedente',async()=>{
  const values=new Map<string,string>();let writes=0;let fail=false;
  const driver:StorageDriver={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{writes++;if(fail&&writes===2)throw new Error('disk full');values.set(k,v);},removeItem:async k=>{values.delete(k);}};
  const storage=secureSessionStorage(driver);await storage.setItem('session','old');writes=0;fail=true;
  await assert.rejects(storage.setItem('session','x'.repeat(1200)));assert.equal(await storage.getItem('session'),'old');
});
test('la sessione lunga si ricompone e viene cancellata completamente',async()=>{
  const values=new Map<string,string>();const storage=secureSessionStorage({getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{values.set(k,v);},removeItem:async k=>{values.delete(k);}});
  const value='x💛'.repeat(2000);await storage.setItem('session',value);assert.equal(await storage.getItem('session'),value);await storage.removeItem('session');assert.equal(values.size,0);
});
