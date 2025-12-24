import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRastreamentoStore, Veiculo } from '../src/store/useRastreamentoStore';
import { apiService } from '../src/services/api.service';
import { API_ENDPOINTS } from '../src/config/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PontoHistorico {
  latitude: number;
  longitude: number;
  timestamp: string;
  velocidade?: number | null;
  curso?: number | null;
  accuracy?: number | null;
  altitude?: number | null;
}

export default function MapaScreen({ navigation, route }: any) {
  const { veiculos, buscarVeiculos } = useRastreamentoStore();
  const { veiculoId, initialLocation } = route?.params || {};
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [mapReady, setMapReady] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historico, setHistorico] = useState<PontoHistorico[]>([]);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [historicoFechadoManualmente, setHistoricoFechadoManualmente] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadHtmlFile();
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (veiculoId) {
      const veiculo = veiculos.find(v => v.id === veiculoId);
      if (veiculo) {
        setSelectedVeiculo(veiculo);
      }
    } else if (veiculos.length > 0) {
      const primeiroVeiculoComLocalizacao = veiculos.find(v => v.latitude && v.longitude) || veiculos[0];
      setSelectedVeiculo(primeiroVeiculoComLocalizacao);
    }
  }, [veiculoId, veiculos]);

  useEffect(() => {
    if (selectedVeiculo) {
      buscarHistoricoVeiculo();
    }
  }, [selectedVeiculo?.id]);

  useEffect(() => {
    if (selectedVeiculo && mapReady && initialLocation) {
      setTimeout(() => {
        sendMessageToWebView({
          type: 'addPontoEspecifico',
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude
        });
        
        sendMessageToWebView({
          type: 'centerMap',
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          zoom: 17
        });
      }, 500);
    }
  }, [selectedVeiculo?.id, mapReady, initialLocation]);

  useEffect(() => {
    if (selectedVeiculo && mapReady && historico.length > 0) {
      setTimeout(() => {
        sendMessageToWebView({
          type: 'updateHistorico',
          historico: historico.map(h => ({ latitude: h.latitude, longitude: h.longitude }))
        });
        if (!historicoFechadoManualmente) {
          setMostrarHistorico(true);
          animatePanel(true);
        }
      }, 800);
    }
  }, [historico, mapReady]);

  useEffect(() => {
    if (selectedVeiculo && mapReady && !initialLocation) {
      atualizarPosicaoVeiculo();
      
      if (historico.length === 0) {
        buscarHistoricoVeiculo();
      }
      
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
      
      intervaloRef.current = setInterval(() => {
        atualizarPosicaoVeiculo();
      }, 5000);
    }

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [selectedVeiculo?.id, mapReady, initialLocation]);

  const animatePanel = (show: boolean) => {
    Animated.spring(slideAnim, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const atualizarPosicaoVeiculo = async () => {
    if (!selectedVeiculo) return;

    try {
      await buscarVeiculos();
      const veiculoAtualizado = veiculos.find(v => v.id === selectedVeiculo.id);
      if (veiculoAtualizado && veiculoAtualizado.latitude && veiculoAtualizado.longitude) {
        setSelectedVeiculo(veiculoAtualizado);
        atualizarMapaComPosicao(veiculoAtualizado);
      }
    } catch (error) {
    }
  };

  const atualizarMapaComPosicao = (veiculo: Veiculo) => {
    if (!veiculo.latitude || !veiculo.longitude) return;

    sendMessageToWebView({
      type: 'updateVeiculos',
      veiculos: [{
        id: veiculo.id,
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        latitude: veiculo.latitude,
        longitude: veiculo.longitude
      }],
      selectedId: veiculo.id
    });

    sendMessageToWebView({
      type: 'centerMap',
      latitude: veiculo.latitude,
      longitude: veiculo.longitude,
      zoom: 15
    });
  };

  const buscarHistoricoVeiculo = async (abrirPainel: boolean = false) => {
    if (!selectedVeiculo) return;

    try {
      const veiculoIdNum = parseInt(selectedVeiculo.id, 10);
      if (isNaN(veiculoIdNum)) return;

      const response = await apiService.get<any>(
        API_ENDPOINTS.RASTREAMENTO.HISTORICO_FILTROS + `?usuarioId=${veiculoIdNum}&limite=1000`,
        true
      );

      if (response.error || !response.data) {
        return;
      }

      const historicoData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const historicoFormatado: PontoHistorico[] = historicoData
        .map((p: any) => ({
          latitude: parseFloat(p.latitude) || 0,
          longitude: parseFloat(p.longitude) || 0,
          timestamp: p.timestamp || new Date().toISOString(),
          velocidade: p.speed ? parseFloat(p.speed) : null,
          curso: p.heading ? parseFloat(p.heading) : null,
          accuracy: p.accuracy ? parseFloat(p.accuracy) : null,
          altitude: p.altitude ? parseFloat(p.altitude) : null
        }))
        .filter((p: PontoHistorico) => p.latitude !== 0 && p.longitude !== 0);

      setHistorico(historicoFormatado);
      
      if (historicoFormatado.length > 0 && mapReady) {
        setTimeout(() => {
          sendMessageToWebView({
            type: 'updateHistorico',
            historico: historicoFormatado.map(h => ({ latitude: h.latitude, longitude: h.longitude }))
          });
          if (abrirPainel && !historicoFechadoManualmente) {
            setMostrarHistorico(true);
            animatePanel(true);
          }
        }, 500);
      }
      
      return historicoFormatado;
    } catch (error) {
      return [];
    }
  };

  const toggleHistorico = async () => {
    if (mostrarHistorico) {
      setMostrarHistorico(false);
      setHistoricoFechadoManualmente(true);
      animatePanel(false);
    } else {
      setHistoricoFechadoManualmente(false);
      if (historico.length === 0) {
        await buscarHistoricoVeiculo(true);
      } else {
        setMostrarHistorico(true);
        animatePanel(true);
      }
    }
  };

  const fecharHistorico = () => {
    toggleHistorico();
  };

  const handleCenterMap = () => {
    if (selectedVeiculo && selectedVeiculo.latitude && selectedVeiculo.longitude) {
      sendMessageToWebView({
        type: 'centerMap',
        latitude: selectedVeiculo.latitude,
        longitude: selectedVeiculo.longitude,
        zoom: 15
      });
    } else if (initialLocation) {
      sendMessageToWebView({
        type: 'centerMap',
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        zoom: 17
      });
    }
  };

  const handleMapTypeToggle = () => {
    const newType = mapType === 'standard' ? 'satellite' : 'standard';
    setMapType(newType);
    sendMessageToWebView({
      type: 'changeMapType',
      mapType: newType
    });
  };

  const handlePontoPress = (ponto: PontoHistorico) => {
    const lat = typeof ponto.latitude === 'number' ? ponto.latitude : parseFloat(String(ponto.latitude || 0));
    const lng = typeof ponto.longitude === 'number' ? ponto.longitude : parseFloat(String(ponto.longitude || 0));
    
    if (lat && lng) {
      sendMessageToWebView({
        type: 'centerMap',
        latitude: lat,
        longitude: lng,
        zoom: 17
      });
    }
  };

  const formatarHorario = (timestamp: string) => {
    try {
      const data = new Date(timestamp);
      return format(data, "HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  const formatarDataCompleta = (timestamp: string) => {
    try {
      const data = new Date(timestamp);
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);

      if (data.toDateString() === hoje.toDateString()) {
        return 'Hoje';
      } else if (data.toDateString() === ontem.toDateString()) {
        return 'Ontem';
      } else {
        return format(data, "dd/MM/yyyy", { locale: ptBR });
      }
    } catch {
      return '';
    }
  };

  const loadHtmlFile = () => {
    try {
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Mapa</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body, html {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        #map {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        let map = null;
        let markers = {};
        let polyline = null;
        let polylineShadow = null;
        let polylineHighlight = null;
        let pontoEspecificoMarker = null;
        let historicoMarkers = [];
        let mapInitialized = false;
        let currentMapType = 'standard';

        function initMap(center, zoom) {
            if (!window.L) {
                setTimeout(() => initMap(center, zoom), 100);
                return;
            }

            if (map) {
                map.remove();
            }

            try {
                map = L.map('map', {
                    center: center,
                    zoom: zoom,
                    zoomControl: true,
                    attributionControl: true,
                    doubleClickZoom: true,
                    scrollWheelZoom: true,
                    dragging: true,
                    touchZoom: true,
                    boxZoom: true,
                    keyboard: true
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(map);

                mapInitialized = true;

                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapReady'
                    }));
                }
            } catch (error) {
                setTimeout(() => initMap(center, zoom), 500);
            }
        }

        function changeMapType(mapType) {
            if (!map) return;
            
            currentMapType = mapType;
            
            map.eachLayer(function(layer) {
                if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                }
            });

            if (mapType === 'satellite') {
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '© Esri',
                    maxZoom: 19
                }).addTo(map);
            } else {
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(map);
            }
        }

        function updateVeiculos(veiculos, selectedId) {
            if (!map) {
                setTimeout(() => updateVeiculos(veiculos, selectedId), 200);
                return;
            }

            Object.keys(markers).forEach(id => {
                if (markers[id] && markers[id].remove) {
                    map.removeLayer(markers[id]);
                    delete markers[id];
                }
            });

            if (!veiculos || veiculos.length === 0) {
                return;
            }

            veiculos.forEach(veiculo => {
                const lat = parseFloat(veiculo.latitude);
                const lng = parseFloat(veiculo.longitude);
                
                if (isNaN(lat) || isNaN(lng)) {
                    return;
                }

                const color = '#254985';
                const iconSize = [32, 32];

                try {
                    const customIcon = L.divIcon({
                        className: 'custom-marker',
                        html: '<div style="background-color: ' + color + '; width: ' + iconSize[0] + 'px; height: ' + iconSize[1] + 'px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">🚗</div></div>',
                        iconSize: iconSize,
                        iconAnchor: [iconSize[0] / 2, iconSize[1]]
                    });

                    const marker = L.marker([lat, lng], {
                        icon: customIcon
                    }).addTo(map);

                    const popupContent = '<div style="text-align: center; padding: 4px;"><strong style="font-size: 14px;">' + (veiculo.placa || 'N/A') + '</strong><br><span style="font-size: 12px; color: #666;">' + (veiculo.marca || '') + ' ' + (veiculo.modelo || '') + '</span></div>';
                    marker.bindPopup(popupContent);

                    markers[veiculo.id] = marker;
                } catch (error) {
                }
            });

            if (veiculos.length > 0 && veiculos[0].latitude && veiculos[0].longitude) {
                const lat = parseFloat(veiculos[0].latitude);
                const lng = parseFloat(veiculos[0].longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                    map.setView([lat, lng], 15);
                }
            }
        }

        function updateHistorico(historico) {
            if (!map) {
                setTimeout(() => updateHistorico(historico), 200);
                return;
            }

            historicoMarkers.forEach(marker => {
                if (marker && marker.remove) {
                    map.removeLayer(marker);
                }
            });
            historicoMarkers = [];

            if (polyline) {
                map.removeLayer(polyline);
                polyline = null;
            }

            if (!historico || historico.length === 0) {
                return;
            }

            const coordinates = historico
                .map(p => {
                    const lat = parseFloat(p.latitude);
                    const lng = parseFloat(p.longitude);
                    if (isNaN(lat) || isNaN(lng)) return null;
                    return [lat, lng];
                })
                .filter(c => c !== null);

            if (coordinates.length > 0) {
                    historico.forEach((p, index) => {
                    const lat = parseFloat(p.latitude);
                    const lng = parseFloat(p.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const isFirst = index === 0;
                        const isLast = index === historico.length - 1;
                        const size = isFirst || isLast ? 20 : 12;
                        const color = isFirst ? '#10B981' : isLast ? '#254985' : '#6B7280';
                        const borderColor = isFirst ? '#059669' : isLast ? '#1E40AF' : '#4B5563';
                        const icon = isFirst ? '▶' : isLast ? '●' : '●';
                        const iconSize = isFirst || isLast ? '10px' : '6px';
                        
                        const markerIcon = L.divIcon({
                            className: 'historico-marker',
                            html: '<div style="background-color: ' + color + '; width: ' + size + 'px; height: ' + size + 'px; border-radius: 50%; border: 3px solid ' + borderColor + '; box-shadow: 0 3px 12px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.8), inset 0 1px 3px rgba(255,255,255,0.4); position: relative; display: flex; align-items: center; justify-content: center; font-size: ' + iconSize + '; color: white; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">' + icon + '</div>',
                            iconSize: [size, size],
                            iconAnchor: [size / 2, size / 2]
                        });

                        const marker = L.marker([lat, lng], {
                            icon: markerIcon,
                            zIndexOffset: isFirst || isLast ? 1000 : 500
                        }).addTo(map);

                        historicoMarkers.push(marker);
                    }
                });

                if (coordinates.length > 1) {
                    if (polylineShadow) {
                        map.removeLayer(polylineShadow);
                        polylineShadow = null;
                    }
                    if (polylineHighlight) {
                        map.removeLayer(polylineHighlight);
                        polylineHighlight = null;
                    }
                    
                    polyline = L.polyline(coordinates, {
                        color: '#EF4444',
                        weight: 3,
                        opacity: 0.9,
                        smoothFactor: 1,
                        lineJoin: 'round',
                        lineCap: 'round'
                    }).addTo(map);

                    try {
                        const bounds = polyline.getBounds();
                        map.fitBounds(bounds, {
                            padding: [100, 100],
                            maxZoom: 16
                        });
                    } catch (e) {
                        if (coordinates.length > 0) {
                            map.setView(coordinates[0], 15);
                        }
                    }
                } else {
                    map.setView(coordinates[0], 15);
                }
            }
        }

        function clearHistorico() {
            historicoMarkers.forEach(marker => {
                if (marker && marker.remove) {
                    map.removeLayer(marker);
                }
            });
            historicoMarkers = [];
            
            if (polyline) {
                map.removeLayer(polyline);
                polyline = null;
            }
            if (pontoEspecificoMarker) {
                map.removeLayer(pontoEspecificoMarker);
                pontoEspecificoMarker = null;
            }
        }

        function addPontoEspecifico(latitude, longitude) {
            if (!map) {
                setTimeout(() => addPontoEspecifico(latitude, longitude), 200);
                return;
            }

            if (pontoEspecificoMarker) {
                map.removeLayer(pontoEspecificoMarker);
                pontoEspecificoMarker = null;
            }

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                return;
            }

            try {
                const customIcon = L.divIcon({
                    className: 'custom-marker-ponto-especifico',
                    html: '<div style="background-color: #10B981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); position: relative; display: flex; align-items: center; justify-content: center;"><div style="width: 12px; height: 12px; background-color: white; border-radius: 50%;"></div></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                pontoEspecificoMarker = L.marker([lat, lng], {
                    icon: customIcon,
                    zIndexOffset: 1000
                }).addTo(map);

                pontoEspecificoMarker.bindPopup('<div style="text-align: center; padding: 4px;"><strong style="font-size: 14px;">Ponto Selecionado</strong></div>').openPopup();
            } catch (error) {
            }
        }

        function centerMap(latitude, longitude, zoom) {
            if (!map) return;
            map.setView([latitude, longitude], zoom || 15);
        }

        window.handleMessage = function(data) {
            try {
                switch (data.type) {
                    case 'init':
                    case 'forceInit':
                        initMap(data.center || [-23.5505, -46.6333], data.zoom || 13);
                        break;
                    case 'updateVeiculos':
                        updateVeiculos(data.veiculos || [], data.selectedId);
                        break;
                    case 'updateHistorico':
                        updateHistorico(data.historico || []);
                        break;
                    case 'clearHistorico':
                        clearHistorico();
                        break;
                    case 'centerMap':
                        centerMap(data.latitude, data.longitude, data.zoom);
                        break;
                    case 'addPontoEspecifico':
                        addPontoEspecifico(data.latitude, data.longitude);
                        break;
                    case 'changeMapType':
                        changeMapType(data.mapType);
                        break;
                }
            } catch (error) {
            }
        };

        function notifyReady() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'htmlReady'
                }));
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    if (!mapInitialized && window.L) {
                        initMap([-23.5505, -46.6333], 13);
                    }
                    notifyReady();
                }, 300);
            });
        } else {
            setTimeout(() => {
                if (!mapInitialized && window.L) {
                    initMap([-23.5505, -46.6333], 13);
                }
                notifyReady();
            }, 300);
        }

        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!mapInitialized && window.L) {
                    initMap([-23.5505, -46.6333], 13);
                }
                notifyReady();
            }, 500);
        });
    </script>
</body>
</html>`;
      setHtmlContent(html);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const sendMessageToWebView = (message: any) => {
    if (webViewRef.current) {
      const script = `if (window.handleMessage) { window.handleMessage(${JSON.stringify(message)}); } else { setTimeout(function() { if (window.handleMessage) { window.handleMessage(${JSON.stringify(message)}); } }, 100); }`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapReady' || data.type === 'htmlReady') {
        if (!mapReady) {
          setMapReady(true);
          
          let center: [number, number];
          let zoom = 15;
          
          if (initialLocation) {
            center = [initialLocation.latitude, initialLocation.longitude];
            zoom = 17;
          } else if (selectedVeiculo?.latitude && selectedVeiculo?.longitude) {
            center = [selectedVeiculo.latitude, selectedVeiculo.longitude];
          } else {
            center = [-23.5505, -46.6333];
          }
          
          setTimeout(() => {
            sendMessageToWebView({
              type: 'init',
              center,
              zoom
            });
            
            setTimeout(() => {
              if (initialLocation) {
                sendMessageToWebView({
                  type: 'centerMap',
                  latitude: initialLocation.latitude,
                  longitude: initialLocation.longitude,
                  zoom: 17
                });
              } else if (selectedVeiculo) {
                atualizarMapaComPosicao(selectedVeiculo);
              }
            }, 500);
          }, 200);
        }
      }
    } catch (error) {
    }
  };

  const panelTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#254985" />
          <Text style={styles.loadingText}>Carregando mapa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const historicoReverso = [...historico].reverse();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('VeiculosMain')}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Histórico de Localização</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.mapContainer}>
        {htmlContent ? (
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={styles.map}
            onMessage={handleWebViewMessage}
            injectedJavaScript={`
              (function() {
                const originalLog = console.log;
                const originalError = console.error;
                const originalWarn = console.warn;
                
                function sendLog(level, args) {
                  if (window.ReactNativeWebView) {
                    try {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'console',
                        level: level,
                        message: args.map(a => {
                          if (typeof a === 'object') {
                            try {
                              return JSON.stringify(a);
                            } catch(e) {
                              return String(a);
                            }
                          }
                          return String(a);
                        }).join(' ')
                      }));
                    } catch(e) {
                    }
                  }
                }
                
                console.log = function(...args) {
                  sendLog('log', args);
                  originalLog.apply(console, args);
                };
                
                console.error = function(...args) {
                  sendLog('error', args);
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  sendLog('warn', args);
                  originalWarn.apply(console, args);
                };
              })();
              true;
            `}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => {
              setTimeout(() => {
                if (!mapReady && webViewRef.current) {
                  handleWebViewMessage({ nativeEvent: { data: JSON.stringify({ type: 'htmlReady' }) } });
                }
              }, 500);
            }}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#254985" />
          </View>
        )}

        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={handleMapTypeToggle}
            activeOpacity={0.7}
          >
            <Ionicons name="layers" size={20} color="#254985" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={handleCenterMap}
            activeOpacity={0.7}
          >
            <Ionicons name="locate" size={20} color="#254985" />
          </TouchableOpacity>
          {historico.length > 0 && (
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={toggleHistorico}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={mostrarHistorico ? "list" : "time"} 
                size={20} 
                color={mostrarHistorico ? "#10B981" : "#254985"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {mostrarHistorico && historico.length > 0 && (
        <Animated.View
          style={[
            styles.historicoPanel,
            {
              transform: [{ translateY: panelTranslateY }],
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={styles.panelHandle} />
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Histórico de Localização</Text>
            <TouchableOpacity onPress={fecharHistorico}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.historicoList}
            showsVerticalScrollIndicator={false}
          >
            {historicoReverso.map((ponto, index) => {
              const isFirst = index === 0;
              const isLast = index === historicoReverso.length - 1;
              const nextPonto = historicoReverso[index + 1];
              const startTime = formatarHorario(ponto.timestamp);
              const endTime = nextPonto ? formatarHorario(nextPonto.timestamp) : '';
              const data = formatarDataCompleta(ponto.timestamp);

              return (
                <TouchableOpacity
                  key={`${ponto.latitude}-${ponto.longitude}-${index}`}
                  style={styles.historicoItem}
                  onPress={() => handlePontoPress(ponto)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historicoItemLeft}>
                    <View style={[
                      styles.historicoDot,
                      isFirst && styles.historicoDotFirst,
                      isLast && styles.historicoDotLast
                    ]}>
                      <View style={styles.historicoDotInner} />
                    </View>
                    {!isLast && <View style={styles.historicoLine} />}
                  </View>
                  <View style={styles.historicoItemContent}>
                    <View style={styles.historicoItemHeader}>
                      <Text style={styles.historicoItemTime}>
                        {startTime}{endTime ? ` - ${endTime}` : ''}
                      </Text>
                      <Text style={styles.historicoItemDate}>{data}</Text>
                    </View>
                    <Text style={styles.historicoItemCoords}>
                      {Number(ponto.latitude || 0).toFixed(6)}, {Number(ponto.longitude || 0).toFixed(6)}
                    </Text>
                    <View style={styles.historicoItemDetails}>
                      {ponto.velocidade !== null && ponto.velocidade !== undefined && (
                        <View style={styles.detailBadge}>
                          <Ionicons name="speedometer" size={12} color="#254985" />
                          <Text style={styles.detailText}>
                            {Number(ponto.velocidade * 3.6).toFixed(1)} km/h
                          </Text>
                        </View>
                      )}
                      {ponto.curso !== null && ponto.curso !== undefined && ponto.curso > 0 && (
                        <View style={styles.detailBadge}>
                          <Ionicons name="compass" size={12} color="#254985" />
                          <Text style={styles.detailText}>
                            {Math.round(ponto.curso)}°
                          </Text>
                        </View>
                      )}
                      {ponto.accuracy !== null && ponto.accuracy !== undefined && (
                        <View style={styles.detailBadge}>
                          <Ionicons name="radio" size={12} color="#254985" />
                          <Text style={styles.detailText}>
                            {Math.round(ponto.accuracy)}m
                          </Text>
                        </View>
                      )}
                      {ponto.altitude !== null && ponto.altitude !== undefined && (
                        <View style={styles.detailBadge}>
                          <Ionicons name="arrow-up" size={12} color="#254985" />
                          <Text style={styles.detailText}>
                            {Math.round(ponto.altitude)}m
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 12,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  historicoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.3,
  },
  historicoList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historicoItem: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  historicoItemLeft: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  historicoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  historicoDotFirst: {
    backgroundColor: '#10B981',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  historicoDotLast: {
    backgroundColor: '#254985',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  historicoDotInner: {
    flex: 1,
  },
  historicoLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    marginBottom: -4,
  },
  historicoItemContent: {
    flex: 1,
  },
  historicoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historicoItemTime: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  historicoItemDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  historicoItemCoords: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  historicoItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
