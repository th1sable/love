import { Directory, File, Paths } from 'expo-file-system';
const folder=()=>new Directory(Paths.document,'love-photos');
export async function storeLocalPhoto(id:string,bytes:Uint8Array){const dir=folder();dir.create({idempotent:true,intermediates:true});const file=new File(dir,`${id}.jpg`);file.create({overwrite:false});file.write(bytes);return `local:${id}`;}
export async function localPhotoUrl(path:string){const file=new File(folder(),`${path.slice(6)}.jpg`);if(!file.exists)throw new Error('Foto non disponibile su questo dispositivo.');return file.uri;}
export function releasePhotoUrl(_url:string){}
