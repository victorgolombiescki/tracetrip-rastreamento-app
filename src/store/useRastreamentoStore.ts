import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api.service';
import { API_ENDPOINTS } from '../config/api';

export interface PontoRastreamento {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export type StatusVeiculo = 'aguardando_contato' | 'em_preparacao' | 'aguardando_pagamento' | 'online';

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  ano: string;
  status: StatusVeiculo;
  latitude?: number;
  longitude?: number;
  ultimaAtualizacao?: Date;
  historicoLocalizacoes?: PontoRastreamento[];
  velocidade?: number;
  curso?: number;
  dispositivoId?: number;
  dispositivoNome?: string;
  dispositivoSerial?: string;
}

export interface Endereco {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco?: Endereco;
}

interface RastreamentoState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  usuario: Usuario | null;
  veiculos: Veiculo[];

  login: (email: string, senha: string) => Promise<void>;
  cadastro: (nome: string, email: string, senha: string, endereco?: string) => Promise<void>;
  logout: () => Promise<void>;
  buscarVeiculos: () => Promise<void>;
  completeOnboarding: (veiculo: Omit<Veiculo, 'id' | 'status'>, endereco: Endereco) => Promise<void>;
  adicionarVeiculo: (veiculo: Omit<Veiculo, 'id' | 'status'>) => void;
  removerVeiculo: (id: string) => void;
  atualizarLocalizacaoVeiculo: (id: string, latitude: number, longitude: number) => void;
}

export const useRastreamentoStore = create<RastreamentoState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      usuario: null,
      veiculos: [],

      login: async (email: string, senha: string) => {
        console.log('👤 [STORE] Iniciando login no store...');
        console.log('👤 [STORE] Email:', email);

        const response = await apiService.login(email, senha);

        console.log('👤 [STORE] Resposta recebida do serviço:', JSON.stringify(response, null, 2));

        if (response.error || !response.data) {
          console.error('❌ [STORE] Erro na resposta:', response.error);
          throw new Error(response.error || 'Erro ao fazer login');
        }

        console.log('👤 [STORE] Dados da resposta:', JSON.stringify(response.data, null, 2));

        const { usuario: usuarioApi } = response.data;

        if (!usuarioApi) {
          console.error('❌ [STORE] Usuário não encontrado na resposta');
          console.error('❌ [STORE] Estrutura da resposta:', Object.keys(response.data));
          throw new Error('Usuário não encontrado na resposta');
        }

        console.log('👤 [STORE] Dados do usuário da API:', JSON.stringify(usuarioApi, null, 2));

        const usuario: Usuario = {
          id: usuarioApi.id.toString(),
          nome: usuarioApi.nome,
          email: usuarioApi.email,
          telefone: usuarioApi.telefone || '',
        };

        console.log('👤 [STORE] Usuário mapeado:', JSON.stringify(usuario, null, 2));

        set({
          isAuthenticated: true,
          usuario,
          hasCompletedOnboarding: true,
        });

        console.log('✅ [STORE] Login concluído com sucesso!');
        console.log('✅ [STORE] Estado atualizado: isAuthenticated = true');

        await get().buscarVeiculos();
      },

      buscarVeiculos: async () => {
        console.log('🚗 [STORE] Buscando veículos da API...');

        const response = await apiService.get(API_ENDPOINTS.RASTREAMENTO.VEICULOS, true);

        if (response.error || !response.data) {
          console.error('❌ [STORE] Erro ao buscar veículos:', response.error);
          return;
        }

        const veiculos: Veiculo[] = (response.data as any[]).map((veiculoApi: any) => ({
          id: veiculoApi.id.toString(),
          placa: veiculoApi.placa,
          modelo: veiculoApi.modelo,
          marca: veiculoApi.marca,
          cor: veiculoApi.cor || '',
          ano: veiculoApi.ano?.toString() || '',
          status: veiculoApi.latitude && veiculoApi.longitude ? 'online' : 'aguardando_contato',
          latitude: veiculoApi.latitude,
          longitude: veiculoApi.longitude,
          ultimaAtualizacao: veiculoApi.ultimaAtualizacao ? new Date(veiculoApi.ultimaAtualizacao) : undefined,
          historicoLocalizacoes: veiculoApi.latitude && veiculoApi.longitude ? [{
            latitude: veiculoApi.latitude,
            longitude: veiculoApi.longitude,
            timestamp: veiculoApi.ultimaAtualizacao ? new Date(veiculoApi.ultimaAtualizacao) : new Date(),
          }] : [],
          velocidade: veiculoApi.velocidade,
          curso: veiculoApi.curso,
          dispositivoId: veiculoApi.dispositivoId,
          dispositivoNome: veiculoApi.dispositivoNome,
          dispositivoSerial: veiculoApi.dispositivoSerial,
        }));


        set({
          veiculos,
        });

      },

      cadastro: async (nome: string, email: string, senha: string, endereco?: string) => {
        const response = await apiService.cadastrarEmpresa(nome, email, senha, endereco);

        if (response.error || !response.data) {
          throw new Error(response.error || 'Erro ao realizar cadastro');
        }

        await get().login(email, senha);
      },

      logout: async () => {
        await apiService.clearTokens();
        set({
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          usuario: null,
          veiculos: [],
        });
      },

      completeOnboarding: async (veiculo: Omit<Veiculo, 'id' | 'status'>, endereco: Endereco) => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const novoVeiculo: Veiculo = {
          ...veiculo,
          id: Date.now().toString(),
          status: 'aguardando_contato',
        };

        set((state) => ({
          hasCompletedOnboarding: true,
          veiculos: [novoVeiculo],
          usuario: state.usuario ? {
            ...state.usuario,
            endereco,
          } : null,
        }));
      },

      adicionarVeiculo: (veiculo: Omit<Veiculo, 'id' | 'status'>) => {
        const novoVeiculo: Veiculo = {
          ...veiculo,
          id: Date.now().toString(),
          status: 'aguardando_contato',
        };

        set((state) => ({
          veiculos: [...state.veiculos, novoVeiculo],
        }));
      },

      removerVeiculo: (id: string) => {
        set((state) => ({
          veiculos: state.veiculos.filter(v => v.id !== id),
        }));
      },

      atualizarLocalizacaoVeiculo: (id: string, latitude: number, longitude: number) => {
        set((state) => ({
          veiculos: state.veiculos.map(v => {
            if (v.id === id) {
              const novoPonto: PontoRastreamento = {
                latitude,
                longitude,
                timestamp: new Date(),
              };
              const historico = v.historicoLocalizacoes || [];
              return {
                ...v,
                latitude,
                longitude,
                ultimaAtualizacao: new Date(),
                historicoLocalizacoes: [...historico, novoPonto].slice(-100),
              };
            }
            return v;
          }),
        }));
      },
    }),
    {
      name: 'rastreamento-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        usuario: state.usuario,
        veiculos: state.veiculos.map(v => ({
          ...v,
          ultimaAtualizacao: v.ultimaAtualizacao ? v.ultimaAtualizacao.toISOString() : undefined,
          historicoLocalizacoes: v.historicoLocalizacoes?.map(p => ({
            ...p,
            timestamp: p.timestamp instanceof Date ? p.timestamp.toISOString() : p.timestamp,
          })),
        })),
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          veiculos: persistedState.veiculos?.map((v: any) => ({
            ...v,
            status: v.status || 'aguardando_contato',
            ultimaAtualizacao: v.ultimaAtualizacao ? new Date(v.ultimaAtualizacao) : undefined,
            historicoLocalizacoes: v.historicoLocalizacoes?.map((p: any) => ({
              ...p,
              timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
            })) || [],
          })) || [],
        };
      },
    }
  )
);
