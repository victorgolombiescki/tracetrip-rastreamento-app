import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Veiculo } from '../src/store/useRastreamentoStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiService } from '../src/services/api.service';
import { API_ENDPOINTS } from '../src/config/api';
import Toast from 'react-native-toast-message';

interface PontoHistorico {
  latitude: number;
  longitude: number;
  dataHora: string;
  velocidade: number | null;
  curso: number | null;
  satelites?: number;
  gpsFixado?: boolean;
}

export default function HistoricoDetalhadoScreen({ navigation, route }: any) {
  const { veiculoId, veiculo: veiculoParam } = route?.params || {};
  const [veiculo, setVeiculo] = useState<Veiculo | null>(veiculoParam || null);
  const [historico, setHistorico] = useState<PontoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (veiculoId) {
      buscarHistorico();
    }
  }, [veiculoId]);

  const buscarHistorico = async () => {
    if (!veiculoId) return;

    setLoading(true);
    console.log('📊 [HISTORICO] Buscando histórico do veículo:', veiculoId);

    try {
      const veiculoIdNum = parseInt(veiculoId, 10);
      if (isNaN(veiculoIdNum)) {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'ID do veículo inválido',
        });
        return;
      }

      const response = await apiService.get<any>(
        API_ENDPOINTS.RASTREAMENTO.HISTORICO_FILTROS + `?usuarioId=${veiculoIdNum}&limite=1000`,
        true
      );

      if (response.error || !response.data) {
        console.error('❌ [HISTORICO] Erro ao buscar histórico:', response.error);
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: response.error || 'Erro ao carregar histórico',
        });
        return;
      }

      const historicoData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const historicoFormatado: PontoHistorico[] = historicoData.map((p: any) => ({
        latitude: parseFloat(p.latitude.toString()),
        longitude: parseFloat(p.longitude.toString()),
        dataHora: p.timestamp || new Date().toISOString(),
        velocidade: p.speed !== null && p.speed !== undefined ? parseFloat(p.speed.toString()) : null,
        curso: p.heading !== null && p.heading !== undefined ? parseFloat(p.heading.toString()) : null,
        satelites: p.accuracy !== null && p.accuracy !== undefined ? Math.round(parseFloat(p.accuracy.toString())) : undefined,
      }));

      console.log('✅ [HISTORICO] Histórico recebido:', historicoFormatado.length, 'pontos');
      setHistorico(historicoFormatado);
    } catch (error: any) {
      console.error('❌ [HISTORICO] Erro na requisição:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao carregar histórico',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarDataCompleta = (timestamp: string) => {
    try {
      const data = new Date(timestamp);
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);

      if (data.toDateString() === hoje.toDateString()) {
        return 'Hoje';
      } else if (data.toDateString() === ontem.toDateString()) {
        return 'Ontem';
      } else {
        return format(data, "dd/MM/yyyy", { locale: ptBR });
      }
    } catch {
      return '';
    }
  };

  const renderPonto = ({ item, index }: { item: PontoHistorico; index: number }) => {
    const data = new Date(item.dataHora);
    const total = historico.length;
    const isFirst = index === total - 1;
    const isLast = index === 0;
    const velocidadeKmh = item.velocidade !== null && item.velocidade !== undefined 
      ? Number(item.velocidade * 3.6).toFixed(1) 
      : null;

    return (
      <View style={styles.pontoContainer}>
        <View style={styles.pontoLeft}>
          <View style={[
            styles.pontoDot,
            isFirst && styles.pontoDotFirst,
            isLast && styles.pontoDotLast
          ]}>
            <View style={styles.pontoDotInner} />
          </View>
          {!isLast && <View style={styles.pontoLine} />}
        </View>
        <View style={styles.pontoContent}>
          <View style={styles.pontoHeader}>
            <View style={styles.pontoTimeContainer}>
              <Text style={styles.pontoTime}>
                {format(data, "HH:mm", { locale: ptBR })}
              </Text>
              <Text style={styles.pontoDate}>
                {formatarDataCompleta(item.dataHora)}
              </Text>
            </View>
            {velocidadeKmh !== null && (
              <View style={styles.velocidadeBadge}>
                <Ionicons name="speedometer" size={11} color="#254985" />
                <Text style={styles.velocidadeText}>{velocidadeKmh}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.pontoCoords}>
            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>

          <View style={styles.detalhesRow}>
            {velocidadeKmh !== null && (
              <View style={styles.detailBadge}>
                <Ionicons name="speedometer" size={10} color="#254985" />
                <Text style={styles.detalheText}>{velocidadeKmh} km/h</Text>
              </View>
            )}
            {item.curso !== null && item.curso !== undefined && item.curso > 0 && (
              <View style={styles.detailBadge}>
                <Ionicons name="compass" size={10} color="#254985" />
                <Text style={styles.detalheText}>{Math.round(item.curso)}°</Text>
              </View>
            )}
            {item.satelites !== undefined && (
              <View style={styles.detailBadge}>
                <Ionicons name="radio" size={10} color="#254985" />
                <Text style={styles.detalheText}>{item.satelites}m</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.pontoMapButton}
            onPress={() => {
              navigation.navigate('MapaMain', { 
                veiculoId: veiculoId,
                initialLocation: { latitude: item.latitude, longitude: item.longitude }
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="map" size={14} color="#254985" />
            <Text style={styles.pontoMapText}>Ver no mapa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#254985', '#1a3366']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Histórico Detalhado</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#254985" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#254985', '#1a3366']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Histórico Detalhado</Text>
            {veiculo && (
              <Text style={styles.headerSubtitle}>{veiculo.placa}</Text>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={20} color="#254985" />
              <Text style={styles.statValue}>{historico.length}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            {historico.length > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="time" size={20} color="#254985" />
                  <Text style={styles.statValue}>
                    {format(new Date(historico[historico.length - 1].dataHora), "dd/MM", { locale: ptBR })}
                  </Text>
                  <Text style={styles.statLabel}>Início</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#254985" />
                  <Text style={styles.statValue}>
                    {format(new Date(historico[0].dataHora), "dd/MM", { locale: ptBR })}
                  </Text>
                  <Text style={styles.statLabel}>Último</Text>
                </View>
              </>
            )}
          </View>

          {historico.length > 0 ? (
            <FlatList
              data={historico.slice().reverse()}
              renderItem={renderPonto}
              keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${item.dataHora}-${index}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: 80 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={buscarHistorico}
                  tintColor="#254985"
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhum histórico encontrado</Text>
              <Text style={styles.emptySubtext}>
                Este veículo ainda não possui histórico de localizações registrado
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  pontoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pontoLeft: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  pontoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  pontoDotFirst: {
    backgroundColor: '#10B981',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pontoDotLast: {
    backgroundColor: '#254985',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pontoDotInner: {
    flex: 1,
  },
  pontoLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    minHeight: 40,
  },
  pontoContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pontoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  pontoTimeContainer: {
    flex: 1,
  },
  pontoTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.2,
  },
  pontoDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  velocidadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  velocidadeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  pontoCoords: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    marginBottom: 8,
    marginTop: 2,
  },
  detalhesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  detalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detalheText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  pontoMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 4,
    marginTop: 2,
  },
  pontoMapText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#254985',
    letterSpacing: 0.1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

