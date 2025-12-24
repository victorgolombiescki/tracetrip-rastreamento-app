import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/config/toastConfig';

import LoginScreen from './screens/LoginScreen';
import CadastroScreen from './screens/CadastroScreen';
import MainStack from './navigation/MainStack';
import { useRastreamentoStore } from './src/store/useRastreamentoStore';

const Stack = createStackNavigator();

function App() {
  const { isAuthenticated, buscarVeiculos } = useRastreamentoStore();

  useEffect(() => {
    if (isAuthenticated) {
      buscarVeiculos().catch(() => {});
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#254985"
          translucent={Platform.OS === 'android' ? false : true}
        />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Cadastro" component={CadastroScreen} />
            </>
          ) : (
            <Stack.Screen name="MainStack" component={MainStack} />
          )}
        </Stack.Navigator>
        <Toast config={toastConfig} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
