import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { useRastreamentoStore } from '../src/store/useRastreamentoStore';
import Toast from 'react-native-toast-message';

export default function OnboardingDadosScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [ano, setAno] = useState('');
  
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  const completeOnboarding = useRastreamentoStore((state) => state.completeOnboarding);

  const formatCep = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!placa.trim() || !marca.trim() || !modelo.trim() || !cor.trim() || !ano.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Preencha todos os dados do veículo',
        });
        return;
      }
      setStep(2);
    }
  };

  const handleComplete = async () => {
    if (!rua.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim() || !cep.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Preencha todos os dados do endereço',
      });
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding(
        {
          placa: placa.toUpperCase(),
          marca,
          modelo,
          cor,
          ano,
        },
        {
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cep: cep.replace(/\D/g, ''),
        }
      );
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Cadastro concluído!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao concluir cadastro. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#254985', '#1a3366']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Cadastre seu Veículo</Text>
              <Text style={styles.subtitle}>
                {step === 1 ? 'Dados do Veículo' : 'Dados do Endereço'}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / 2) * 100}%` }]} />
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.form}>
                {step === 1 ? (
                  <>
                    <Input
                      label="Placa"
                      placeholder="ABC-1234"
                      value={placa}
                      onChangeText={(text) => setPlaca(text.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={8}
                    />

                    <Input
                      label="Marca"
                      placeholder="Ex: Toyota"
                      value={marca}
                      onChangeText={setMarca}
                      autoCapitalize="words"
                    />

                    <Input
                      label="Modelo"
                      placeholder="Ex: Corolla"
                      value={modelo}
                      onChangeText={setModelo}
                      autoCapitalize="words"
                    />

                    <Input
                      label="Cor"
                      placeholder="Ex: Branco"
                      value={cor}
                      onChangeText={setCor}
                      autoCapitalize="words"
                    />

                    <Input
                      label="Ano"
                      placeholder="Ex: 2020"
                      value={ano}
                      onChangeText={setAno}
                      keyboardType="numeric"
                      maxLength={4}
                    />

                    <Button
                      title="Próximo"
                      onPress={handleNext}
                      style={styles.button}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Rua"
                      placeholder="Nome da rua"
                      value={rua}
                      onChangeText={setRua}
                      autoCapitalize="words"
                    />

                    <Input
                      label="Número"
                      placeholder="123"
                      value={numero}
                      onChangeText={setNumero}
                      keyboardType="numeric"
                    />

                    <Input
                      label="Complemento"
                      placeholder="Apto, Bloco, etc (opcional)"
                      value={complemento}
                      onChangeText={setComplemento}
                      autoCapitalize="words"
                    />

                    <Input
                      label="Bairro"
                      placeholder="Nome do bairro"
                      value={bairro}
                      onChangeText={setBairro}
                      autoCapitalize="words"
                    />

                    <Input
                      label="Cidade"
                      placeholder="Nome da cidade"
                      value={cidade}
                      onChangeText={setCidade}
                      autoCapitalize="words"
                    />

                    <Input
                      label="Estado"
                      placeholder="UF"
                      value={estado}
                      onChangeText={(text) => setEstado(text.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={2}
                    />

                    <Input
                      label="CEP"
                      placeholder="00000-000"
                      value={cep}
                      onChangeText={(text) => setCep(formatCep(text))}
                      keyboardType="numeric"
                      maxLength={9}
                    />

                    <View style={styles.buttonRow}>
                      <Button
                        title="Voltar"
                        onPress={() => setStep(1)}
                        variant="secondary"
                        style={[styles.button, styles.buttonHalf]}
                      />
                      <Button
                        title="Concluir"
                        onPress={handleComplete}
                        loading={loading}
                        style={[styles.button, styles.buttonHalf]}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  formContainer: {
    width: '100%',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
  },
});












