import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Heart } from './Motion';
export function BrandHeader(){return <View style={s.header}><View><Text style={s.brand}>love<Text style={{color:'#DBAF34'}}>.</Text></Text><Text style={s.caption}>IL NOSTRO PICCOLO MONDO</Text></View><Heart size={34}/></View>;}
const s=StyleSheet.create({header:{width:'100%',maxWidth:650,alignSelf:'center',paddingHorizontal:24,paddingVertical:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontSize:36,fontWeight:'800',letterSpacing:-2,color:'#352E24'},caption:{fontSize:9,fontWeight:'700',letterSpacing:2,color:'#8A7B62'}});
