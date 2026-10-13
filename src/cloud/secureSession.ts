// Chunks remain small even when profile metadata contains multibyte characters.
export type StorageDriver={getItem:(key:string)=>Promise<string|null>;setItem:(key:string,value:string)=>Promise<void>;removeItem:(key:string)=>Promise<void>};
type Manifest={version:string;count:number};
export function secureSessionStorage(driver:StorageDriver):StorageDriver {
  let queue:Promise<unknown>=Promise.resolve();
  const serial=<T>(run:()=>Promise<T>):Promise<T>=>{const result=queue.then(run,run);queue=result.catch(()=>{});return result;};
  const read=async(key:string)=>{const value=await driver.getItem(key);if(!value)return null;const m=JSON.parse(value) as Manifest;if(typeof m.version!=='string'||!Number.isInteger(m.count)||m.count<1||m.count>10000)throw new Error('Sessione salvata non valida.');return m;};
  const clear=async(key:string,m:Manifest|null)=>{if(m)await Promise.all(Array.from({length:m.count},(_,i)=>driver.removeItem(`${key}.${m.version}.${i}`)));};
  return {
    getItem:key=>serial(async()=>{const m=await read(key);if(!m)return null;const parts=await Promise.all(Array.from({length:m.count},(_,i)=>driver.getItem(`${key}.${m.version}.${i}`)));if(parts.some(p=>p===null))throw new Error('Sessione incompleta. Accedi di nuovo.');return parts.join('');}),
    setItem:(key,value)=>serial(async()=>{const previous=await read(key);const version=`${Date.now()}_${Math.random().toString(36).slice(2)}`;const symbols=Array.from(value);const chunks:string[]=[];for(let i=0;i<symbols.length;i+=400)chunks.push(symbols.slice(i,i+400).join(''));if(!chunks.length)chunks.push('');const m={version,count:chunks.length};try{for(let i=0;i<chunks.length;i++)await driver.setItem(`${key}.${version}.${i}`,chunks[i]);await driver.setItem(key,JSON.stringify(m));}catch(error){await clear(key,m).catch(()=>{});throw error;}await clear(key,previous).catch(()=>{});}),
    removeItem:key=>serial(async()=>{const m=await read(key);await driver.removeItem(key);await clear(key,m);})
  };
}
