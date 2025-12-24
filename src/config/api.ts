import Constants from 'expo-constants';

const getApiBaseURL = (): string => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (configuredUrl) {
    console.log('⚙️ [CONFIG] Usando URL configurada:', configuredUrl);
    return configuredUrl;
  }

  let serverIP = 'localhost';
  const port = '3002';

  try {
    if (Constants.expoConfig?.hostUri) {
      const ip = Constants.expoConfig.hostUri.split(':')[0];
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        serverIP = ip;
        console.log('⚙️ [CONFIG] IP detectado do hostUri:', serverIP);
      }
    } else if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
      const ip = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        serverIP = ip;
        console.log('⚙️ [CONFIG] IP detectado do debuggerHost:', serverIP);
      }
    } else if ((Constants.manifest as any)?.hostUri) {
      const ip = (Constants.manifest as any).hostUri.split(':')[0];
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        serverIP = ip;
        console.log('⚙️ [CONFIG] IP detectado do manifest:', serverIP);
      }
    }
  } catch (error) {
    console.warn('⚠️ [CONFIG] Erro ao detectar IP, usando localhost:', error);
  }

  const url = `http://${serverIP}:${port}`;
  console.log('⚙️ [CONFIG] URL da API construída:', url);
  return url;
};

export const API_BASE_URL = getApiBaseURL();

const getRastreamentoApiURL = (): string => {
  const configuredUrl = process.env.EXPO_PUBLIC_RASTREAMENTO_API_URL;
  
  if (configuredUrl) {
    console.log('⚙️ [CONFIG] Usando URL de rastreamento configurada:', configuredUrl);
    return configuredUrl;
  }

  let serverIP = 'localhost';
  const port = '3003';

  try {
    if (Constants.expoConfig?.hostUri) {
      const ip = Constants.expoConfig.hostUri.split(':')[0];
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        serverIP = ip;
      }
    } else if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
      const ip = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        serverIP = ip;
      }
    } else if ((Constants.manifest as any)?.hostUri) {
      const ip = (Constants.manifest as any).hostUri.split(':')[0];
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        serverIP = ip;
      }
    }
  } catch (error) {
    console.warn('⚠️ [CONFIG] Erro ao detectar IP para API de rastreamento, usando localhost:', error);
  }

  const url = `http://${serverIP}:${port}`;
  console.log('⚙️ [CONFIG] URL da API de Rastreamento construída:', url);
  return url;
};

export const RASTREAMENTO_API_BASE_URL = getRastreamentoApiURL();

console.log('⚙️ [CONFIG] API Base URL final:', API_BASE_URL);
console.log('⚙️ [CONFIG] API Rastreamento URL final:', RASTREAMENTO_API_BASE_URL);
console.log('⚙️ [CONFIG] Variável de ambiente EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || 'não definida');
console.log('⚙️ [CONFIG] Variável de ambiente EXPO_PUBLIC_RASTREAMENTO_API_URL:', process.env.EXPO_PUBLIC_RASTREAMENTO_API_URL || 'não definida');

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  EMPRESA: {
    REGISTRAR: '/empresa/registrar-publico',
  },
  RASTREAMENTO: {
    VEICULOS: '/app/frota/veiculos-com-rastreamento',
    HISTORICO: (veiculoId: number) => `/app/frota/veiculos/${veiculoId}/historico`,
    LOCATION: '/rastreamento/location',
    USUARIO_LOCALIZACOES: (usuarioId: number) => `/rastreamento/usuario/${usuarioId}`,
    HISTORICO_FILTROS: '/rastreamento/historico',
  },
  FROTA: {
    REVISOES: (veiculoId: number) => `/app/frota/veiculos/${veiculoId}/revisoes`,
    HIGIENIZACOES: (veiculoId: number) => `/app/frota/veiculos/${veiculoId}/higienizacoes`,
    CRIAR_VEICULO: '/frota/veiculos',
  },
  MANUTENCAO: {
    CRIAR_REVISAO: '/app/manutencao/revisoes',
    CRIAR_HIGIENIZACAO: '/app/manutencao/higienizacoes',
  },
};

