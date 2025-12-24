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
import { formatarDataInput, formatarDataParaAPI } from '../src/utils/dateFormatter';
import { useRastreamentoStore } from '../src/store/useRastreamentoStore';

export default function AdicionarVeiculoScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { buscarVeiculos } = useRastreamentoStore();
  
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [anoFabricacao, setAnoFabricacao] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [loading, setLoading] = useState(false);

  const validarPlaca = (placa: string): boolean => {
    const placaLimpa = placa.replace(/[^A-Z0-9]/gi, '');
    return placaLimpa.length === 7;
  };

  const validarAno = (ano: string): boolean => {
    if (!ano.trim()) return true;
    const anoNum = parseInt(ano);
    const anoAtual = new Date().getFullYear();
    return !isNaN(anoNum) && anoNum >= 1900 && anoNum <= anoAtual + 1;
  };

  const validarNumero = (valor: string): boolean => {
    if (!valor.trim()) return true;
    const num = parseFloat(valor);
    return !isNaN(num) && num >= 0;
  };

  const validarTexto = (texto: string): boolean => {
    return /^[a-zA-ZÀ-ÿ\s]+$/.test(texto.trim());
  };

  const validarData = (dataString: string): boolean => {
    if (!dataString.trim()) return true;
    
    const partes = dataString.split('/');
    if (partes.length !== 3) return false;
    
    const diaStr = partes[0].trim();
    const mesStr = partes[1].trim();
    const anoStr = partes[2].trim();
    
    if (diaStr.length !== 2 || mesStr.length !== 2 || anoStr.length !== 4) return false;
    
    const dia = parseInt(diaStr, 10);
    const mes = parseInt(mesStr, 10);
    const ano = parseInt(anoStr, 10);
    
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
    
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;
    
    const anoAtual = new Date().getFullYear();
    if (ano < 1900 || ano > anoAtual + 1) return false;
    
    const data = new Date(ano, mes - 1, dia);
    
    if (isNaN(data.getTime())) return false;
    
    return (
      data.getFullYear() === ano &&
      data.getMonth() === mes - 1 &&
      data.getDate() === dia
    );
  };

  const handleSalvar = async () => {
    const placaLimpa = placa.toUpperCase().replace(/[^A-Z0-9]/gi, '');

    if (!placaLimpa || placaLimpa.length !== 7) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Placa inválida. Deve ter 7 caracteres (ex: ABC1234 ou ABC1D23)',
      });
      return;
    }

    if (!marca.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Marca é obrigatória',
      });
      return;
    }

    if (!modelo.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Modelo é obrigatório',
      });
      return;
    }

    if (cor.trim() && !validarTexto(cor)) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Cor deve conter apenas letras',
      });
      return;
    }

    if (anoFabricacao.trim() && !validarAno(anoFabricacao)) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ano de fabricação inválido',
      });
      return;
    }

    if (anoModelo.trim() && !validarAno(anoModelo)) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ano do modelo inválido',
      });
      return;
    }

    if (kmInicial.trim() && !validarNumero(kmInicial)) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'KM inicial deve ser um número válido',
      });
      return;
    }

    if (dataAquisicao.trim() && !validarData(dataAquisicao)) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Data de aquisição inválida. Use o formato DD/MM/AAAA',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        placa: placaLimpa,
        marca: marca.trim(),
        modelo: modelo.trim(),
        status: 'ATIVO',
      };

      if (cor.trim()) payload.cor = cor.trim();
      if (anoFabricacao.trim()) {
        const ano = parseInt(anoFabricacao);
        if (!isNaN(ano)) payload.anoFabricacao = ano;
      }
      if (anoModelo.trim()) {
        const ano = parseInt(anoModelo);
        if (!isNaN(ano)) payload.anoModelo = ano;
      }
      if (dataAquisicao.trim()) {
        if (!validarData(dataAquisicao)) {
          Toast.show({
            type: 'error',
            text1: 'Erro',
            text2: 'Data de aquisição inválida. Use o formato DD/MM/AAAA',
          });
          setLoading(false);
          return;
        }
        const dataFormatada = formatarDataParaAPI(dataAquisicao);
        if (dataFormatada) {
          const dataTeste = new Date(dataFormatada);
          if (isNaN(dataTeste.getTime())) {
            Toast.show({
              type: 'error',
              text1: 'Erro',
              text2: 'Data de aquisição inválida',
            });
            setLoading(false);
            return;
          }
          payload.dataAquisicao = dataFormatada;
        }
      }
      if (kmInicial.trim()) {
        const km = parseFloat(kmInicial);
        if (!isNaN(km)) payload.kmInicial = km;
      }

      const response = await apiService.post(API_ENDPOINTS.FROTA.CRIAR_VEICULO, payload);

      if (response.error) {
        throw new Error(response.error);
      }

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Veículo cadastrado com sucesso!',
      });

      await buscarVeiculos();
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Erro ao cadastrar veículo',
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
            <Text style={styles.headerTitle}>Novo Veículo</Text>
            <Text style={styles.headerSubtitle}>Cadastre um novo veículo na frota</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Básicas</Text>
              
              <Input
                label="Placa *"
                value={placa}
                onChangeText={(text) => setPlaca(text.toUpperCase().replace(/[^A-Z0-9]/gi, ''))}
                placeholder="ABC1234"
                autoCapitalize="characters"
                maxLength={7}
              />

              <Input
                label="Marca *"
                value={marca}
                onChangeText={(text) => {
                  const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
                  setMarca(apenasLetras);
                }}
                placeholder="Ex: Toyota"
                autoCapitalize="words"
              />

              <Input
                label="Modelo *"
                value={modelo}
                onChangeText={(text) => {
                  const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
                  setModelo(apenasLetras);
                }}
                placeholder="Ex: Corolla"
                autoCapitalize="words"
              />

              <Input
                label="Cor"
                value={cor}
                onChangeText={(text) => {
                  const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
                  setCor(apenasLetras);
                }}
                placeholder="Ex: Branco"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Anos</Text>
              
              <Input
                label="Ano de Fabricação"
                value={anoFabricacao}
                onChangeText={(text) => {
                  const apenasNumeros = text.replace(/[^0-9]/g, '');
                  if (apenasNumeros.length <= 4) {
                    setAnoFabricacao(apenasNumeros);
                  }
                }}
                placeholder="Ex: 2020"
                keyboardType="numeric"
                maxLength={4}
              />

              <Input
                label="Ano do Modelo"
                value={anoModelo}
                onChangeText={(text) => {
                  const apenasNumeros = text.replace(/[^0-9]/g, '');
                  if (apenasNumeros.length <= 4) {
                    setAnoModelo(apenasNumeros);
                  }
                }}
                placeholder="Ex: 2021"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Adicionais</Text>
              
              <Input
                label="Data de Aquisição"
                value={dataAquisicao}
                onChangeText={(text) => {
                  const apenasNumeros = text.replace(/\D/g, '');
                  
                  if (apenasNumeros.length <= 2) {
                    setDataAquisicao(apenasNumeros);
                    return;
                  }
                  
                  if (apenasNumeros.length <= 4) {
                    const dia = apenasNumeros.slice(0, 2);
                    const mes = apenasNumeros.slice(2);
                    
                    if (mes.length === 1) {
                      const mesNum = parseInt(mes, 10);
                      if (mesNum > 1) {
                        setDataAquisicao(`${dia}/0${mes}`);
                        return;
                      }
                      setDataAquisicao(`${dia}/${mes}`);
                      return;
                    }
                    
                    if (mes.length === 2) {
                      const mesNum = parseInt(mes, 10);
                      if (mesNum > 12) {
                        setDataAquisicao(`${dia}/12`);
                        return;
                      }
                      setDataAquisicao(`${dia}/${mes}`);
                      return;
                    }
                    
                    setDataAquisicao(`${dia}/${mes}`);
                    return;
                  }
                  
                  if (apenasNumeros.length <= 8) {
                    const dia = apenasNumeros.slice(0, 2);
                    const mes = apenasNumeros.slice(2, 4);
                    const ano = apenasNumeros.slice(4);
                    
                    const mesNum = parseInt(mes, 10);
                    const mesFormatado = mesNum > 12 ? '12' : mes;
                    
                    setDataAquisicao(`${dia}/${mesFormatado}/${ano}`);
                    return;
                  }
                }}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
              />

              <Input
                label="KM Inicial"
                value={kmInicial}
                onChangeText={(text) => {
                  const apenasNumeros = text.replace(/[^0-9.]/g, '');
                  const partes = apenasNumeros.split('.');
                  if (partes.length <= 2) {
                    setKmInicial(apenasNumeros);
                  }
                }}
                placeholder="Ex: 0"
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <Button
            title="Cadastrar Veículo"
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
