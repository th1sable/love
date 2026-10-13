import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, StyleSheet } from 'react-native';
export function useReducedMotion(){const [reduced,setReduced]=useState(false);useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;sub.remove();};},[]);return reduced;}
export function Heart({size=34}:{size?:number}){
  const [scale]=useState(()=>new Animated.Value(1));const reduced=useReducedMotion();
  useEffect(()=>{let loop:Animated.CompositeAnimation|undefined;const stop=()=>{loop?.stop();scale.setValue(1);};const start=()=>{stop();if(reduced)return;loop=Animated.loop(Animated.sequence([Animated.timing(scale,{toValue:1.16,duration:160,easing:Easing.out(Easing.quad),useNativeDriver:true}),Animated.timing(scale,{toValue:1,duration:160,useNativeDriver:true}),Animated.timing(scale,{toValue:1.09,duration:140,useNativeDriver:true}),Animated.timing(scale,{toValue:1,duration:220,useNativeDriver:true}),Animated.delay(950)]));loop.start();};start();const sub=AppState.addEventListener('change',v=>v==='active'?start():stop());return()=>{stop();sub.remove();};},[reduced,scale]);
  return <Animated.Text accessibilityLabel="Cuore giallo" style={{fontSize:size,transform:[{scale}]}}>💛</Animated.Text>;
}
export function Reveal({children}:React.PropsWithChildren){const [fade]=useState(()=>new Animated.Value(0));const reduced=useReducedMotion();useEffect(()=>{Animated.timing(fade,{toValue:1,duration:reduced?0:380,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();return()=>fade.stopAnimation();},[fade,reduced]);return <Animated.View style={[s.container,{opacity:fade,transform:[{translateY:fade.interpolate({inputRange:[0,1],outputRange:[reduced?0:14,0]})}]}]}>{children}</Animated.View>;}
const s=StyleSheet.create({container:{width:'100%'}});
