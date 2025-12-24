import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRastreamentoStore, StatusVeiculo, Veiculo } from '../src/store/useRastreamentoStore';
import Toast from 'react-native-toast-message';
import ModalAcoesVeiculo from '../components/ModalAcoesVeiculo';
import ModalManutencao from '../components/ModalManutencao';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<StatusVeiculo, { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  aguardando_contato: {
    label: 'Aguardando',
    color: '#FF6B35',
    bgColor: '#FFF5F2',
    icon: 'time-outline',
  },
  em_preparacao: {
    label: 'Preparação',
    color: '#4A90E2',
    bgColor: '#F0F7FF',
    icon: 'construct-outline',
  },
  aguardando_pagamento: {
    label: 'Pagamento',
    color: '#E74C3C',
    bgColor: '#FFF5F5',
    icon: 'card-outline',
  },
  online: {
    label: 'Online',
    color: '#2ECC71',
    bgColor: '#F0FDF4',
    icon: 'checkmark-circle',
  },
};

export default function VeiculosScreen({ navigation }: any) {
  const { veiculos, usuario, logout, buscarVeiculos } = useRastreamentoStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalAcoesVisible, setModalAcoesVisible] = useState(false);
  const [modalManutencaoVisible, setModalManutencaoVisible] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    Toast.show({
      type: 'success',
      text1: 'Logout realizado',
      text2: 'Você foi desconectado',
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await buscarVeiculos();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, [buscarVeiculos]);

  const handleVerRevisoes = () => {
    if (!veiculoSelecionado) return;
    const veiculoSerializado = {
      id: veiculoSelecionado.id,
      placa: veiculoSelecionado.placa,
      marca: veiculoSelecionado.marca,
      modelo: veiculoSelecionado.modelo,
      cor: veiculoSelecionado.cor,
      ano: veiculoSelecionado.ano,
    };
    navigation.navigate('Revisoes', { veiculo: veiculoSerializado });
  };

  const handleVerHigienizacoes = () => {
    if (!veiculoSelecionado) return;
    const veiculoSerializado = {
      id: veiculoSelecionado.id,
      placa: veiculoSelecionado.placa,
      marca: veiculoSelecionado.marca,
      modelo: veiculoSelecionado.modelo,
      cor: veiculoSelecionado.cor,
      ano: veiculoSelecionado.ano,
    };
    navigation.navigate('Higienizacoes', { veiculo: veiculoSerializado });
  };

  const handleAbrirAcoes = (veiculo: Veiculo) => {
    if (!veiculo) return;
    setVeiculoSelecionado(veiculo);
    setModalAcoesVisible(true);
  };

  const handleVerNoMapa = () => {
    if (!veiculoSelecionado) return;
    navigation.navigate('MapaMain', { 
      veiculoId: veiculoSelecionado.id 
    });
  };

  const handleVerHistorico = () => {
    if (!veiculoSelecionado) return;
    navigation.navigate('HistoricoDetalhado', { 
      veiculoId: veiculoSelecionado.id,
      veiculo: veiculoSelecionado
    });
  };

  const formatarData = (data?: Date) => {
    if (!data) return null;
    const dataObj = data instanceof Date ? data : new Date(data);
    const agora = new Date();
    const diffMs = agora.getTime() - dataObj.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h atrás`;
    return format(dataObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatarVelocidade = (velocidade?: number) => {
    if (!velocidade && velocidade !== 0) return null;
    return `${Math.round(velocidade)}`;
  };

  const formatarCurso = (curso?: number) => {
    if (curso === undefined || curso === null) return null;
    
    let cursoNormalizado = Number(curso);
    
    if (isNaN(cursoNormalizado)) return null;
    
    if (cursoNormalizado > 1000) {
      const cursoStr = cursoNormalizado.toString();
      if (cursoStr.length >= 3) {
        const ultimosTres = parseInt(cursoStr.slice(-3), 10);
        cursoNormalizado = ultimosTres > 360 ? ultimosTres % 360 : ultimosTres;
      } else {
        cursoNormalizado = cursoNormalizado % 360;
      }
    } else if (cursoNormalizado > 360) {
      cursoNormalizado = cursoNormalizado % 360;
    }
    
    if (cursoNormalizado < 0) {
      cursoNormalizado = ((cursoNormalizado % 360) + 360) % 360;
    }
    
    if (cursoNormalizado === 0 || cursoNormalizado > 360) {
      return null;
    }
    
    const direcoes = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(cursoNormalizado / 45) % 8;
    return direcoes[index];
  };

  const renderVeiculo = ({ item }: { item: Veiculo }) => {
    const status: StatusVeiculo = item.status || 'aguardando_contato';
    const statusInfo = statusConfig[status] || statusConfig['aguardando_contato'];
    const isOnline = status === 'online' && item.latitude && item.longitude;
    const ultimaAtualizacaoFormatada = formatarData(item.ultimaAtualizacao);

    return (
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={() => handleAbrirAcoes(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.placaRow}>
              <Text style={styles.placa}>{item.placa}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
            <Text style={styles.vehicleName}>{item.marca} {item.modelo}</Text>
            {(item.cor || item.ano) && (
              <Text style={styles.vehicleDetails}>
                {item.cor} {item.cor && item.ano && '•'} {item.ano}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => handleAbrirAcoes(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {isOnline ? (
          <View style={styles.cardBottom}>
            <View style={styles.metricsRow}>
              {(item.velocidade !== undefined && item.velocidade !== null) && (
                <View style={styles.metricItem}>
                  <Ionicons 
                    name="speedometer-outline" 
                    size={16} 
                    color="#254985" 
                  />
                  <Text style={[
                    styles.metricText,
                    item.velocidade > 60 && styles.metricHigh,
                    item.velocidade > 30 && item.velocidade <= 60 && styles.metricMedium
                  ]}>
                    {formatarVelocidade(item.velocidade)} km/h
                  </Text>
                </View>
              )}
              
              {item.curso !== undefined && item.curso !== null && (
                <View style={styles.metricItem}>
                  <Ionicons name="compass-outline" size={16} color="#254985" />
                  <Text style={styles.metricText}>{formatarCurso(item.curso)}</Text>
                </View>
              )}

              <View style={styles.metricItem}>
                <View style={styles.onlineDot} />
                <Text style={styles.updateTime}>{ultimaAtualizacaoFormatada || 'Sem atualização'}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.inactiveRow}>
            <Ionicons name={statusInfo.icon} size={18} color="#CBD5E1" />
            <Text style={styles.inactiveText}>
              {status === 'aguardando_contato' && 'Aguardando contato'}
              {status === 'em_preparacao' && 'Em preparação'}
              {status === 'aguardando_pagamento' && 'Aguardando pagamento'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.userSection}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color="#254985" />
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>
                Bem-vindo, {usuario?.nome?.split(' ')[0] || 'Usuário'}
              </Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="car" size={18} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.statText}>
                {veiculos.length} {veiculos.length === 1 ? 'veículo' : 'veículos'}
              </Text>
            </View>
            {veiculos.filter(v => v.status === 'online').length > 0 && (
              <View style={styles.statItem}>
                <View style={styles.onlineIndicatorDot} />
                <Text style={styles.statText}>
                  {veiculos.filter(v => v.status === 'online').length} {veiculos.filter(v => v.status === 'online').length === 1 ? 'online' : 'online'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {veiculos.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="car-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Nenhum veículo encontrado</Text>
            <Text style={styles.emptyDescription}>
              Adicione seu primeiro veículo para começar
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AdicionarVeiculo')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Adicionar Veículo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={veiculos}
              renderItem={renderVeiculo}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#4A90E2"
                  colors={['#2563EB']}
                />
              }
            />
            <TouchableOpacity
              style={[styles.fab, { bottom: 32 + insets.bottom }]}
              onPress={() => setModalManutencaoVisible(true)}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {veiculoSelecionado && (
        <ModalAcoesVeiculo
          visible={modalAcoesVisible && !!veiculoSelecionado}
          veiculo={veiculoSelecionado}
          onClose={() => {
            setModalAcoesVisible(false);
            setVeiculoSelecionado(null);
          }}
          onVerMapa={handleVerNoMapa}
          onVerHistorico={handleVerHistorico}
          onVerRevisoes={handleVerRevisoes}
          onVerHigienizacoes={handleVerHigienizacoes}
        />
      )}

      <ModalManutencao
        visible={modalManutencaoVisible}
        onClose={() => setModalManutencaoVisible(false)}
        onSelecionarRevisao={(veiculo) => {
          navigation.navigate('AdicionarRevisao', { veiculo });
        }}
        onSelecionarHigienizacao={(veiculo) => {
          navigation.navigate('AdicionarHigienizacao', { veiculo });
        }}
        onAdicionarVeiculo={() => {
          navigation.navigate('AdicionarVeiculo');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSection: {
    backgroundColor: '#254985',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 0,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTextContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  onlineIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ECC71',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  list: {
    padding: 16,
    paddingTop: 20,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
  },
  placaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  placa: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 1.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  vehicleDetails: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  cardBottom: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.1,
  },
  metricHigh: {
    color: '#DC2626',
    fontWeight: '600',
  },
  metricMedium: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ECC71',
  },
  updateTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inactiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inactiveText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    fontWeight: '400',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#254985',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#254985',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#254985',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});
