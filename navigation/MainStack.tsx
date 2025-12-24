import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import VeiculosScreen from '../screens/VeiculosScreen';
import MapaScreen from '../screens/MapaScreen';
import HistoricoScreen from '../screens/HistoricoScreen';
import HistoricoDetalhadoScreen from '../screens/HistoricoDetalhadoScreen';
import AdicionarVeiculoScreen from '../screens/AdicionarVeiculoScreen';
import AdicionarRevisaoScreen from '../screens/AdicionarRevisaoScreen';
import AdicionarHigienizacaoScreen from '../screens/AdicionarHigienizacaoScreen';
import RevisoesScreen from '../screens/RevisoesScreen';
import HigienizacoesScreen from '../screens/HigienizacoesScreen';

const Stack = createStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VeiculosMain" component={VeiculosScreen} />
      <Stack.Screen 
        name="AdicionarVeiculo" 
        component={AdicionarVeiculoScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="HistoricoDetalhado" 
        component={HistoricoDetalhadoScreen}
      />
      <Stack.Screen 
        name="AdicionarRevisao" 
        component={AdicionarRevisaoScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="AdicionarHigienizacao" 
        component={AdicionarHigienizacaoScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="MapaMain" 
        component={MapaScreen} 
      />
      <Stack.Screen 
        name="HistoricoMain" 
        component={HistoricoScreen} 
      />
      <Stack.Screen 
        name="Revisoes" 
        component={RevisoesScreen} 
      />
      <Stack.Screen 
        name="Higienizacoes" 
        component={HigienizacoesScreen} 
      />
    </Stack.Navigator>
  );
}
