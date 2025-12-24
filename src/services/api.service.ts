import { API_BASE_URL, RASTREAMENTO_API_BASE_URL, API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@rastreamento:access_token';
const REFRESH_TOKEN_KEY = '@rastreamento:refresh_token';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
  };
  plataforma: string;
}

class ApiService {
  private baseURL: string;
  private rastreamentoBaseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.rastreamentoBaseURL = RASTREAMENTO_API_BASE_URL;
  }

  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  private async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useRastreamentoAPI: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();
      const baseURL = useRastreamentoAPI ? this.rastreamentoBaseURL : this.baseURL;
      const url = `${baseURL}${endpoint}`;
      
      console.log('📡 [API] Fazendo requisição:', options.method || 'GET', url);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-requested-with': 'com.tracetrip.app',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('📡 [API] Token de autorização presente');
      } else {
        console.log('📡 [API] Sem token de autorização');
      }

      console.log('📡 [API] Headers:', JSON.stringify(headers, null, 2));

      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 [API] Status da resposta:', response.status, response.statusText);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📡 [API] Resposta JSON:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
        console.log('📡 [API] Resposta texto:', text);
      }

      if (!response.ok) {
        console.error('❌ [API] Erro HTTP:', response.status, response.statusText);
        console.error('❌ [API] Dados do erro:', JSON.stringify(data, null, 2));
        return {
          error: data.message || data.error || `Erro ${response.status}: ${response.statusText}`,
          message: data.message,
        };
      }

      return { data };
    } catch (error: any) {
      console.error('❌ [API] Erro de conexão:', error.message);
      console.error('❌ [API] Stack:', error.stack);
      return {
        error: error.message || 'Erro de conexão',
      };
    }
  }

  async login(email: string, senha: string): Promise<ApiResponse<LoginResponse>> {

    const requestBody = { email, senha };

    const response = await this.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }, true);

    if (response.error) {
      console.error('❌ [API] Erro no login:', response.error);
      console.error('❌ [API] Mensagem:', response.message);
    }

    if (response.data) {
      const loginData = response.data as LoginResponse;
      console.log('✅ [API] Login bem-sucedido');
      console.log('✅ [API] Access Token recebido:', loginData.access_token ? 'Sim' : 'Não');
      console.log('✅ [API] Refresh Token recebido:', loginData.refresh_token ? 'Sim' : 'Não');
      console.log('✅ [API] Usuário recebido:', JSON.stringify(loginData.usuario, null, 2));
      console.log('✅ [API] Plataforma:', loginData.plataforma);

      if (loginData.access_token && loginData.refresh_token) {
        await this.setTokens(loginData.access_token, loginData.refresh_token);
        console.log('✅ [API] Tokens armazenados no AsyncStorage');
      } else {
        console.warn('⚠️ [API] Tokens não encontrados na resposta');
      }
    }

    return response;
  }

  async cadastrarEmpresa(nome: string, email: string, senha: string, endereco?: string): Promise<ApiResponse<{ status: number; mensagem: string }>> {
    const requestBody: any = {
      nome,
      email,
      senha,
    };

    if (endereco) {
      requestBody.endereco = endereco;
    }

    console.log('📡 [API] Payload de cadastro de empresa:', JSON.stringify(requestBody, null, 2));

    const response = await this.request<{ status: number; mensagem: string }>(
      API_ENDPOINTS.EMPRESA.REGISTRAR,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      false
    );

    return response;
  }

  async refreshToken(): Promise<ApiResponse<any>> {
    const refreshToken = await this.getRefreshToken();
    
    if (!refreshToken) {
      return { error: 'Refresh token não encontrado' };
    }

    const response = await this.request(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const refreshData = response.data as { access_token?: string };
    if (refreshData?.access_token) {
      const currentRefreshToken = await this.getRefreshToken();
      await this.setTokens(refreshData.access_token, currentRefreshToken || '');
    }

    return response;
  }

  async get<T>(endpoint: string, useRastreamentoAPI: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, useRastreamentoAPI);
  }

  async post<T>(endpoint: string, body?: any, useRastreamentoAPI: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, useRastreamentoAPI);
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();

