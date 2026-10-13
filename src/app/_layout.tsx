import { Stack } from 'expo-router';
import { CloudProvider } from '../cloud/Provider';
export default function Layout(){return <CloudProvider><Stack screenOptions={{headerShown:false,animation:'fade'}}/></CloudProvider>;}
