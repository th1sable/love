import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { completeAuthLink } from '../../cloud/authLinks';
import { useCloud } from '../../cloud/Provider';
import { BrandHeader } from '../../components/BrandHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Confirmation(){
  const cloud=useCloud();const router=useRouter();const started=useRef(false);const link=Linking.useLinkingURL();
  const [state,setState]=useState<'loading'|'success'|'error'>('loading'),[message,setMessage]=useState('Confermo il tuo indirizzo…');
  useEffect(()=>{if(started.current||(Platform.OS!=='web'&&!link))return;started.current=true;void (async()=>{try{const raw=Platform.OS==='web'?window.location.href:link;if(!raw)throw new Error('Apri questa pagina dal collegamento ricevuto via email.');const result=await completeAuthLink(raw);if(result.recovery)cloud.setRecovery(true);cloud.setDemo(false);if(Platform.OS==='web')window.history.replaceState(null,'','/auth/confirm');setMessage(result.recovery?'Ora puoi scegliere una nuova password.':'Email confermata! Il vostro piccolo mondo ti aspetta.');setState('success');}catch(error){if(Platform.OS==='web')window.history.replaceState(null,'','/auth/confirm');setMessage(error instanceof Error?error.message:'Non riesco a confermare il collegamento.');setState('error');}})();},[cloud,link]);
  return <SafeAreaView style={{flex:1,backgroundColor:"#FAF8F2"}}><BrandHeader/><View style={s.root}><Text style={s.title}>{state==='error'?'Riproviamo?':state==='success'?'Ci sei.':'Un momento…'}</Text><Text accessibilityRole={state==='error'?'alert':undefined} style={s.text}>{message}</Text>{state==='loading'?<ActivityIndicator color="#B38319"/>:<Pressable accessibilityRole="button" style={s.button} onPress={()=>router.replace('/')}><Text style={s.buttonText}>{state==='error'?'Torna all’accesso':'Continua in love'}</Text></Pressable>}</View></SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1,alignItems:'center',justifyContent:'center',padding:30,backgroundColor:'#FAF8F2',gap:24},title:{fontSize:32,fontWeight:'700',color:'#433828'},text:{fontSize:16,lineHeight:25,textAlign:'center',color:'#78694F',maxWidth:420},button:{backgroundColor:'#F5D367',padding:18,borderRadius:16},buttonText:{fontWeight:'700',color:'#51401B'}});
