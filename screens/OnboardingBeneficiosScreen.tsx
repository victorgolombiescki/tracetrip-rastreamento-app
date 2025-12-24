import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';

const { width } = Dimensions.get('window');

interface Beneficio {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const beneficios: Beneficio[] = [
  {
    icon: 'location',
    title: 'Rastreamento em Tempo Real',
    description: 'Acompanhe a localização exata do seu veículo a qualquer momento, com atualizações instantâneas no mapa.',
    color: '#3B82F6',
  },
  {
    icon: 'time',
    title: 'Histórico Completo',
    description: 'Visualize todos os trajetos percorridos pelo seu veículo, com data e hora de cada localização registrada.',
    color: '#10B981',
  },
  {
    icon: 'notifications',
    title: 'Alertas Inteligentes',
    description: 'Receba notificações sobre movimentações suspeitas, saída de áreas definidas e muito mais.',
    color: '#F59E0B',
  },
  {
    icon: 'shield-checkmark',
    title: 'Segurança Total',
    description: 'Proteja seu veículo com monitoramento 24/7 e tenha acesso rápido à localização em caso de emergência.',
    color: '#EF4444',
  },
  {
    icon: 'document-text',
    title: '1. Cadastre seu Veículo',
    description: 'Preencha os dados do seu veículo e endereço. É rápido e simples!',
    color: '#3B82F6',
  },
  {
    icon: 'call',
    title: '2. Aguarde nosso Contato',
    description: 'Nossa equipe entrará em contato para confirmar os dados e agendar a instalação.',
    color: '#F59E0B',
  },
  {
    icon: 'card',
    title: '3. Realize o Pagamento',
    description: 'Após a confirmação, realize o pagamento para iniciarmos a preparação.',
    color: '#8B5CF6',
  },
  {
    icon: 'construct',
    title: '4. Preparação e Instalação',
    description: 'Preparamos o rastreador e agendamos a instalação no seu veículo.',
    color: '#10B981',
  },
];

export default function OnboardingBeneficiosScreen({ navigation }: any) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentSlide < beneficios.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
    } else {
      navigation.navigate('OnboardingDados');
    }
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingDados');
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#254985', '#1a3366']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {beneficios.map((beneficio, index) => (
            <View key={index} style={styles.slide}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: `${beneficio.color}20` }]}>
                  <Ionicons 
                    name={beneficio.icon} 
                    size={64} 
                    color={beneficio.color} 
                  />
                </View>
              </View>
              
              <Text style={styles.title}>{beneficio.title}</Text>
              <Text style={styles.description}>{beneficio.description}</Text>
              
              {index === 3 && (
                <View style={styles.sectionDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.sectionTitle}>Como Funciona</Text>
                  <View style={styles.dividerLine} />
                </View>
              )}
              
              {index === beneficios.length - 1 && (
                <View style={styles.finalBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.finalBadgeText}>Pronto para começar!</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {beneficios.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentSlide === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <Button
            title={currentSlide === beneficios.length - 1 ? 'Começar' : 'Próximo'}
            onPress={handleNext}
            style={styles.button}
          />
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
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    gap: 8,
  },
  finalBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 0,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
