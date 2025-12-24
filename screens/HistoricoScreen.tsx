import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRastreamentoStore, Veiculo, PontoRastreamento } from '../src/store/useRastreamentoStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoScreen({ navigation }: any) {
  const { veiculos } = useRastreamentoStore();
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(
    veiculos.length > 0 ? veiculos[0] : null
  );
  const insets = useSafeAreaInsets();

  const renderPonto = ({ item, index }: { item: PontoRastreamento; index: number }) => {
    const data = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
    const total = selectedVeiculo?.historicoLocalizacoes?.length || 0;
    const isFirst = index === total - 1;
    const isLast = index === 0;

    return (
      <View style={styles.pontoContainer}>
        <View style={styles.pontoLeft}>
          <View style={[styles.pontoIcon, isFirst && styles.pontoIconFirst, isLast && styles.pontoIconLast]}>
            <Ionicons 
              name={isFirst ? "play" : isLast ? "checkmark" : "ellipse"} 
              size={16} 
              color={isFirst ? "#10B981" : isLast ? "#254985" : "#6B7280"} 
            />
          </View>
          {!isLast && <View style={styles.pontoLine} />}
        </View>
        <View style={styles.pontoContent}>
          <View style={styles.pontoHeader}>
            <Text style={styles.pontoTime}>
              {format(data, "HH:mm", { locale: ptBR })}
            </Text>
            <Text style={styles.pontoDate}>
              {format(data, "dd/MM/yyyy", { locale: ptBR })}
            </Text>
          </View>
          <Text style={styles.pontoCoords}>
            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
          <TouchableOpacity
            style={styles.pontoMapButton}
            onPress={() => {
              navigation.navigate('MapaMain', { 
                veiculoId: selectedVeiculo?.id,
                initialLocation: { latitude: item.latitude, longitude: item.longitude }
              });
            }}
          >
            <Ionicons name="map" size={14} color="#254985" />
            <Text style={styles.pontoMapText}>Ver no mapa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#254985', '#1a3366']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Histórico</Text>
            <Text style={styles.headerSubtitle}>
              Trajetos registrados
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {veiculos.length > 1 && (
            <View style={styles.veiculosSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {veiculos.map((veiculo) => (
                  <TouchableOpacity
                    key={veiculo.id}
                    style={[
                      styles.veiculoSelectorItem,
                      selectedVeiculo?.id === veiculo.id && styles.veiculoSelectorItemActive,
                    ]}
                    onPress={() => setSelectedVeiculo(veiculo)}
                  >
                    <Text
                      style={[
                        styles.veiculoSelectorText,
                        selectedVeiculo?.id === veiculo.id && styles.veiculoSelectorTextActive,
                      ]}
                    >
                      {veiculo.placa}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {selectedVeiculo?.historicoLocalizacoes && selectedVeiculo.historicoLocalizacoes.length > 0 ? (
            <FlatList
              data={selectedVeiculo.historicoLocalizacoes.slice().reverse()}
              renderItem={renderPonto}
              keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: 80 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhum histórico ainda</Text>
              <Text style={styles.emptySubtext}>
                Inicie o rastreamento para começar a registrar o histórico
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
    padding: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  veiculosSelector: {
    marginBottom: 16,
  },
  veiculoSelectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  veiculoSelectorItemActive: {
    backgroundColor: '#254985',
    borderColor: '#254985',
  },
  veiculoSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  veiculoSelectorTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  pontoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pontoLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  pontoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pontoIconFirst: {
    backgroundColor: '#D1FAE5',
  },
  pontoIconLast: {
    backgroundColor: '#EFF6FF',
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
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pontoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pontoTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  pontoDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  pontoCoords: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  pontoMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    gap: 4,
  },
  pontoMapText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#254985',
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
