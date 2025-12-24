import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { apiService } from '../src/services/api.service';
import { API_ENDPOINTS } from '../src/config/api';
import Toast from 'react-native-toast-message';
import { Veiculo } from '../src/store/useRastreamentoStore';
import { formatarDataInput, formatarDataParaAPI } from '../src/utils/dateFormatter';

export default function AdicionarRevisaoScreen({ navigation, route }: any) {
  const veiculo: Veiculo = route?.params?.veiculo;
  const insets = useSafeAreaInsets();
  
  const [dataRevisao, setDataRevisao] = useState('');
  const [kmRevisao, setKmRevisao] = useState('');
  const [tipoRevisao, setTipoRevisao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [oficina, setOficina] = useState('');
  const [telefoneOficina, setTelefoneOficina] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [proximaRevisaoKm, setProximaRevisaoKm] = useState('');
  const [proximaRevisaoData, setProximaRevisaoData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!dataRevisao.trim() || !kmRevisao.trim() || !tipoRevisao.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Preencha os campos obrigatórios',
      });
      return;
    }

    const dataFormatada = formatarDataParaAPI(dataRevisao);
    if (!dataFormatada) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Data da revisão inválida. Use o formato DD/MM/AAAA',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        veiculoId: parseInt(veiculo.id),
        dataRevisao: dataFormatada,
        kmRevisao: parseFloat(kmRevisao),
        tipoRevisao,
        status: 'REALIZADA',
      };

      if (descricao) payload.descricao = descricao;
      if (valor) payload.valor = parseFloat(valor);
      if (oficina) payload.oficina = oficina;
      if (telefoneOficina) payload.telefoneOficina = telefoneOficina;
      if (notaFiscal) payload.notaFiscal = notaFiscal;
      if (proximaRevisaoKm) payload.proximaRevisaoKm = parseFloat(proximaRevisaoKm);
      if (proximaRevisaoData.trim()) {
        const proximaDataFormatada = formatarDataParaAPI(proximaRevisaoData);
        if (proximaDataFormatada) payload.proximaRevisaoData = proximaDataFormatada;
      }

      const response = await apiService.post(API_ENDPOINTS.MANUTENCAO.CRIAR_REVISAO, payload);

      if (response.error) {
        throw new Error(response.error);
      }

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Revisão registrada com sucesso!',
      });

      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Erro ao registrar revisão',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Nova Revisão</Text>
            {veiculo && (
              <Text style={styles.headerSubtitle}>{veiculo.placa}</Text>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações da Revisão</Text>
              
              <Input
                label="Data da Revisão *"
                value={dataRevisao}
                onChangeText={(text) => {
                  const formatado = formatarDataInput(text);
                  if (formatado.length <= 10) {
                    setDataRevisao(formatado);
                  }
                }}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
              />

              <Input
                label="KM da Revisão *"
                value={kmRevisao}
                onChangeText={setKmRevisao}
                placeholder="Ex: 50000"
                keyboardType="numeric"
              />

              <Input
                label="Tipo de Revisão *"
                value={tipoRevisao}
                onChangeText={setTipoRevisao}
                placeholder="Ex: Preventiva, Corretiva"
              />

              <Input
                label="Descrição"
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Descrição da revisão"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Financeiras</Text>
              
              <Input
                label="Valor (R$)"
                value={valor}
                onChangeText={setValor}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Input
                label="Oficina"
                value={oficina}
                onChangeText={setOficina}
                placeholder="Nome da oficina"
              />

              <Input
                label="Telefone da Oficina"
                value={telefoneOficina}
                onChangeText={setTelefoneOficina}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />

              <Input
                label="Nota Fiscal"
                value={notaFiscal}
                onChangeText={setNotaFiscal}
                placeholder="Número da nota fiscal"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Próxima Revisão</Text>
              
              <Input
                label="Próxima Revisão (KM)"
                value={proximaRevisaoKm}
                onChangeText={setProximaRevisaoKm}
                placeholder="Ex: 60000"
                keyboardType="numeric"
              />

              <Input
                label="Próxima Revisão (Data)"
                value={proximaRevisaoData}
                onChangeText={(text) => {
                  const formatado = formatarDataInput(text);
                  if (formatado.length <= 10) {
                    setProximaRevisaoData(formatado);
                  }
                }}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <Button
            title="Salvar Revisão"
            onPress={handleSalvar}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#254985',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    width: '100%',
  },
});

