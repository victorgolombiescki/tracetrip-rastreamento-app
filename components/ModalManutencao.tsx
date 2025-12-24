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
import { useRastreamentoStore, Veiculo } from '../src/store/useRastreamentoStore';

interface ModalManutencaoProps {
  visible: boolean;
  onClose: () => void;
  onSelecionarRevisao: (veiculo: Veiculo) => void;
  onSelecionarHigienizacao: (veiculo: Veiculo) => void;
  onAdicionarVeiculo: () => void;
}

export default function ModalManutencao({
  visible,
  onClose,
  onSelecionarRevisao,
  onSelecionarHigienizacao,
  onAdicionarVeiculo,
}: ModalManutencaoProps) {
  const { veiculos } = useRastreamentoStore();

  const handleSelecionarVeiculo = (veiculo: Veiculo, tipo: 'revisao' | 'higienizacao') => {
    onClose();
    if (tipo === 'revisao') {
      onSelecionarRevisao(veiculo);
    } else {
      onSelecionarHigienizacao(veiculo);
    }
  };

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
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>Nova Manutenção</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <TouchableOpacity
                  style={styles.adicionarVeiculoBtn}
                  onPress={() => {
                    onClose();
                    onAdicionarVeiculo();
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#254985" />
                  <Text style={styles.adicionarVeiculoText}>Adicionar Novo Veículo</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.subtitle}>Selecione o veículo e o tipo de manutenção:</Text>
                
                {veiculos.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="car-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Nenhum veículo disponível</Text>
                  </View>
                ) : (
                  <View style={styles.veiculosList}>
                    {veiculos.map((veiculo) => (
                      <View key={veiculo.id} style={styles.veiculoCard}>
                        <View style={styles.veiculoHeader}>
                          <Text style={styles.veiculoPlaca}>{veiculo.placa}</Text>
                          <Text style={styles.veiculoModelo}>{veiculo.marca} {veiculo.modelo}</Text>
                        </View>
                        <View style={styles.acoesRow}>
                          <TouchableOpacity
                            style={[styles.acaoBtn, styles.revisaoBtn]}
                            onPress={() => handleSelecionarVeiculo(veiculo, 'revisao')}
                          >
                            <Ionicons name="construct-outline" size={20} color="#254985" />
                            <Text style={styles.acaoBtnText}>Revisão</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.acaoBtn, styles.higienizacaoBtn]}
                            onPress={() => handleSelecionarVeiculo(veiculo, 'higienizacao')}
                          >
                            <Ionicons name="water-outline" size={20} color="#254985" />
                            <Text style={styles.acaoBtnText}>Higienização</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  adicionarVeiculoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#254985',
    borderStyle: 'dashed',
    marginBottom: 16,
    gap: 8,
  },
  adicionarVeiculoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#254985',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  veiculosList: {
    gap: 12,
  },
  veiculoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  veiculoHeader: {
    marginBottom: 12,
  },
  veiculoPlaca: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  veiculoModelo: {
    fontSize: 14,
    color: '#6B7280',
  },
  acoesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acaoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  revisaoBtn: {
    borderColor: '#254985',
  },
  higienizacaoBtn: {
    borderColor: '#254985',
  },
  acaoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#254985',
  },
});

