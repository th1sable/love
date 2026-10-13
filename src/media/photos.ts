import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { randomUUID } from 'expo-crypto';
import type { Photo } from '../domain';
import { supabase } from '../cloud/client';
import { decodePhoto } from './groups';
import { storeLocalPhoto } from './localPhotos';
export async function pickPhotos(){return ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsMultipleSelection:true,selectionLimit:10,quality:1});}
export async function keepPhoto(asset:ImagePicker.ImagePickerAsset,date:string,spaceId?:string,actorId?:string):Promise<Photo>{
  const context=ImageManipulator.manipulate(asset.uri);
  if(asset.width>1800||asset.height>1800)context.resize(asset.width>=asset.height?{width:1800,height:null}:{height:1800,width:null});
  const rendered=await context.renderAsync();
  const compressed=await rendered.saveAsync({format:SaveFormat.JPEG,compress:.82,base64:true});
  if(!compressed.base64)throw new Error('Non riesco a preparare questa foto. Prova con un’altra immagine.');
  const bytes=decodePhoto(compressed.base64);if(bytes.byteLength>8*1024*1024)throw new Error('Questa foto è troppo grande. Scegli una versione più piccola.');
  const id=randomUUID();let path:string;
  if(spaceId&&actorId){
    if(!supabase||(await supabase.auth.getSession()).data.session?.user.id!==actorId)throw new Error('Il tuo account è cambiato. Accedi di nuovo.');
    path=`${spaceId}/${actorId}/${id}.jpg`;
    const result=await supabase.storage.from('couple-photos').upload(path,bytes.slice().buffer,{contentType:'image/jpeg',upsert:false});
    if(result.error)throw new Error('Caricamento non riuscito. Controlla la connessione e riprova.');
  }else path=await storeLocalPhoto(id,bytes);
  return {id,path,date,width:compressed.width,height:compressed.height};
}
