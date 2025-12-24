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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { useRastreamentoStore } from '../src/store/useRastreamentoStore';
import Toast from 'react-native-toast-message';

export default function CadastroScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const cadastro = useRastreamentoStore((state) => state.cadastro);

  const handleCadastro = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Preencha todos os campos obrigatórios',
      });
      return;
    }

    if (senha !== confirmarSenha) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'As senhas não coincidem',
      });
      return;
    }

    if (senha.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'A senha deve ter no mínimo 6 caracteres',
      });
      return;
    }

    setLoading(true);
    try {
      await cadastro(nome, email, senha, endereco.trim() || undefined);
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Cadastro realizado com sucesso!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Erro ao realizar cadastro. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Input
                label="Nome da Empresa"
                placeholder="Nome da sua empresa"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />

              <Input
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Input
                label="Endereço"
                placeholder="Endereço completo (opcional)"
                value={endereco}
                onChangeText={setEndereco}
                autoCapitalize="words"
              />

              <Input
                label="Senha"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
              />

              <Input
                label="Confirmar Senha"
                placeholder="Digite a senha novamente"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                title="Cadastrar"
                onPress={handleCadastro}
                loading={loading}
                style={styles.button}
              />

              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>
                  Já tem uma conta? <Text style={styles.linkBold}>Entrar</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  button: {
    marginTop: 8,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  linkBold: {
    color: '#254985',
    fontWeight: '600',
  },
});
