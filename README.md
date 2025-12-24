# TraceTrip - Rastreamento Veicular

Aplicativo React Native com Expo para rastreamento veicular do usuário.

## Funcionalidades

- **Autenticação**
  - Tela de Login
  - Tela de Cadastro
  - Logout

- **Onboarding**
  - Cadastro de dados do veículo (placa, marca, modelo, cor, ano)
  - Cadastro de dados do endereço (rua, número, complemento, bairro, cidade, estado, CEP)

- **Gerenciamento de Veículos**
  - Lista de veículos cadastrados
  - Adicionar novos veículos
  - Visualização de status de rastreamento

- **Rastreamento**
  - Mapa interativo mostrando localização dos veículos
  - Atualização de localização em tempo real
  - Navegação para localização do veículo

## Estrutura

```
trace-trip-rastreamento/
├── screens/
│   ├── LoginScreen.tsx
│   ├── CadastroScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── VeiculosScreen.tsx
│   ├── MapaScreen.tsx
│   └── AdicionarVeiculoScreen.tsx
├── src/
│   ├── store/
│   │   └── useRastreamentoStore.ts
│   ├── components/
│   │   └── ui/
│   │       ├── Input.tsx
│   │       └── Button.tsx
│   └── config/
│       └── toastConfig.tsx
├── App.tsx
├── package.json
└── app.json
```

## Como Usar

1. Instale as dependências:
```bash
npm install
```

2. Configure a URL da API:
   
   **IMPORTANTE**: Para dispositivos físicos ou emuladores Android, não use `localhost`. Use o IP da sua máquina na rede local.
   
   **Opção 1: Detecção Automática (Recomendado)**
   - O app detecta automaticamente o IP do servidor Expo
   - Funciona quando você usa `expo start` ou `expo start --android`
   - O IP é extraído automaticamente do Expo
   
   **Opção 2: Configuração Manual**
   Crie um arquivo `.env` na raiz do projeto com:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:3002
   ```
   
   Substitua `192.168.x.x` pelo IP da sua máquina na rede local.
   
   Para descobrir seu IP:
   - Linux/Mac: `ifconfig` ou `ip addr show`
   - Windows: `ipconfig`
   - Procure por um IP como `192.168.x.x` ou `10.0.2.2` (para emulador Android)
   
   **Opção 3: Para Emulador Android**
   Use `10.0.2.2` que é o IP especial do host no emulador Android:
   ```
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3002
   ```

3. Inicie o projeto:

```bash
npm start
```

4. Para Android:
```bash
npm run android
```

5. Para iOS:
```bash
npm run ios
```

## Tecnologias

- React Native
- Expo
- React Navigation (Stack Navigator)
- Zustand (gerenciamento de estado com persistência)
- React Native Maps (mapas)
- Expo Location (localização)
- AsyncStorage (persistência)

## Fluxo do Usuário

1. Login/Cadastro → Autenticação
2. Onboarding → Cadastro de veículo e endereço
3. Lista de Veículos → Visualização e gerenciamento
4. Mapa → Rastreamento em tempo real

## Estado Persistente

O estado da aplicação é persistido usando Zustand + AsyncStorage:
- Estado de autenticação
- Dados do usuário
- Lista de veículos
- Status de onboarding
# tracetrip-rastreamento-app
