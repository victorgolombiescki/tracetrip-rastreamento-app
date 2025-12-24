import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../src/services/api.service';
import { API_ENDPOINTS } from '../src/config/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoHigienizacao {
  id: number;
  dataHigienizacao: string;
  tipoHigienizacao: string;
  descricao?: string;
  valor?: number;
  local?: string;
  proximaHigienizacaoData?: string;
}

interface VeiculoBasico {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  cor?: string | null;
  ano?: string | number | null;
}

export default function HigienizacoesScreen({ navigation, route }: any) {
  const veiculo: VeiculoBasico | undefined = route?.params?.veiculo;
  const insets = useSafeAreaInsets();
  const [higienizacoes, setHigienizacoes] = useState<HistoricoHigienizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (veiculo?.id) {
      buscarHigienizacoes();
    }
  }, [veiculo?.id]);

  const buscarHigienizacoes = async (forcarAtualizacao = false) => {
    if (!veiculo?.id) return;

    if (forcarAtualizacao) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiService.get<HistoricoHigienizacao[]>(
        API_ENDPOINTS.FROTA.HIGIENIZACOES(parseInt(veiculo.id)),
        true
      );
      if (response.data) {
        setHigienizacoes(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar higienizações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatarData = (data?: string) => {
    if (!data) return null;
    try {
      const dataObj = new Date(data);
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);

      if (dataObj.toDateString() === hoje.toDateString()) {
        return 'Hoje';
      } else if (dataObj.toDateString() === ontem.toDateString()) {
        return 'Ontem';
      } else {
        return format(dataObj, "dd/MM/yyyy", { locale: ptBR });
      }
    } catch {
      return data;
    }
  };

  const renderHigienizacao = ({ item }: { item: HistoricoHigienizacao }) => {
    const valor = typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="water-outline" size={20} color="#254985" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{item.tipoHigienizacao}</Text>
              <Text style={styles.cardDate}>
                {formatarData(item.dataHigienizacao)}
              </Text>
            </View>
          </View>
          {valor && !isNaN(valor) && (
            <View style={styles.valueBadge}>
              <Text style={styles.cardValue}>
                R$ {valor.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          )}
        </View>

        {(item.local || item.descricao) && (
          <View style={styles.cardDetails}>
            {item.local && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.cardDetailText}>{item.local}</Text>
              </View>
            )}
            {item.descricao && (
              <Text style={styles.cardDescription}>{item.descricao}</Text>
            )}
          </View>
        )}

        {item.proximaHigienizacaoData && (
          <View style={styles.cardNext}>
            <Ionicons name="calendar-outline" size={14} color="#254985" />
            <Text style={styles.cardNextText}>
              Próxima: {formatarData(item.proximaHigienizacaoData)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Higienizações</Text>
          {veiculo && (
            <Text style={styles.headerSubtitle}>
              {veiculo.placa} • {veiculo.marca} {veiculo.modelo}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {loading && higienizacoes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Carregando...</Text>
          </View>
        ) : higienizacoes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="water-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhuma higienização</Text>
            <Text style={styles.emptyText}>
              Ainda não há higienizações registradas para este veículo
            </Text>
          </View>
        ) : (
          <FlatList
            data={higienizacoes}
            renderItem={renderHigienizacao}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[styles.list, { paddingBottom: 20 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => buscarHigienizacoes(true)}
                tintColor="#254985"
                colors={['#254985']}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#254985',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cardDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  cardDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardDescription: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    marginTop: 4,
  },
  cardNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  cardNextText: {
    fontSize: 11,
    color: '#254985',
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

