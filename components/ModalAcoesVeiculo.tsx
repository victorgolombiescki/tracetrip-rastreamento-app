import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Veiculo } from '../src/store/useRastreamentoStore';

interface ModalAcoesVeiculoProps {
  visible: boolean;
  veiculo: Veiculo | null;
  onClose: () => void;
  onVerMapa: () => void;
  onVerHistorico: () => void;
  onVerRevisoes: () => void;
  onVerHigienizacoes: () => void;
}

export default function ModalAcoesVeiculo({
  visible,
  veiculo,
  onClose,
  onVerMapa,
  onVerHistorico,
  onVerRevisoes,
  onVerHigienizacoes,
}: ModalAcoesVeiculoProps) {
  if (!veiculo) return null;

  const isOnline = veiculo.status === 'online' && veiculo.latitude && veiculo.longitude;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.veiculoPlaca}>{veiculo.placa}</Text>
                  <Text style={styles.veiculoModelo}>
                    {veiculo.marca} {veiculo.modelo}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.option, !isOnline && styles.optionDisabled]}
                  onPress={() => {
                    if (isOnline) {
                      onVerMapa();
                      onClose();
                    }
                  }}
                  disabled={!isOnline}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="map" size={24} color={isOnline ? '#254985' : '#9CA3AF'} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, !isOnline && styles.optionTitleDisabled]}>
                      Ver no Mapa
                    </Text>
                    <Text style={styles.optionDescription}>
                      Visualizar posição atual do veículo
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={isOnline ? '#6B7280' : '#D1D5DB'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onVerHistorico();
                    onClose();
                  }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="time" size={24} color="#10B981" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>
                      Ver Histórico
                    </Text>
                    <Text style={styles.optionDescription}>
                      Visualizar histórico completo de localizações
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onVerRevisoes();
                    onClose();
                  }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="construct" size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>
                      Ver Revisões
                    </Text>
                    <Text style={styles.optionDescription}>
                      Visualizar histórico de revisões do veículo
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onVerHigienizacoes();
                    onClose();
                  }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="water" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>
                      Ver Higienizações
                    </Text>
                    <Text style={styles.optionDescription}>
                      Visualizar histórico de higienizações do veículo
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  veiculoPlaca: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  veiculoModelo: {
    fontSize: 16,
    color: '#6B7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionTitleDisabled: {
    color: '#9CA3AF',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
});


