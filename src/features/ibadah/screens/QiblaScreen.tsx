import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { calculateQiblaBearing } from '../../../utils/qiblaCalculator';
import { Compass as CompassIcon, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react-native';

interface QiblaScreenProps {
  onBack?: () => void;
}

export const QiblaScreen: React.FC<QiblaScreenProps> = ({ onBack }) => {
  const { colors, isDarkMode } = useThemeStore();

  const [heading, setHeading] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: -6.200000,
    lng: 106.816666,
  });
  const [locationName, setLocationName] = useState<string>('Jakarta, Indonesia');
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(true);

  // Animated rotation angle
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Calculate Ka'bah Bearing Angle from user coordinates
  const qiblaBearing = calculateQiblaBearing(userLocation.lat, userLocation.lng);

  // Determine if phone is pointing towards Ka'bah (+/- 5 degrees tolerance)
  const isAligned = Math.abs((heading - qiblaBearing + 360) % 360) < 5;

  useEffect(() => {
    // 1. Get user location
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

          const reverse = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (reverse.length > 0) {
            setLocationName(`${reverse[0].city || reverse[0].subregion}, ${reverse[0].country}`);
          }
        }
      } catch (err) {
        console.warn('Location permission or sensor error:', err);
      }
    })();

    // 2. Setup Magnetometer Compass listener
    Magnetometer.setUpdateInterval(100);
    const subscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) {
        angle = 360 + angle;
      }
      const currentHeading = Math.round(angle);
      setHeading(currentHeading);

      // Smooth Animation
      Animated.timing(animatedValue, {
        toValue: -currentHeading,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    Magnetometer.isAvailableAsync().then((avail) => setSensorAvailable(avail));

    return () => {
      subscription.remove();
    };
  }, []);

  // Interpolate rotation for dial animation
  const spinDial = animatedValue.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  return (
    <ScreenWrapper bg={isDarkMode ? '#0F172A' : '#0F5132'} barStyle="light-content" style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Kompas Kiblat</Text>
          <View style={styles.locationRow}>
            <MapPin color="#FDE047" size={14} />
            <Text style={styles.locationText}>{locationName}</Text>
          </View>
        </View>
      </View>

      {/* Main Animated Compass Display */}
      <View style={styles.compassContainer}>
        {/* Glow Ring when aligned with Ka'bah */}
        <View style={[styles.glowRing, isAligned && styles.activeGlowRing]} />

        {/* Animated Rotating Dial */}
        <Animated.View style={[styles.dialContainer, { transform: [{ rotate: spinDial }] }]}>
          {/* Degree markers N, E, S, W */}
          <Text style={[styles.cardinalText, styles.northText]}>U</Text>
          <Text style={[styles.cardinalText, styles.eastText]}>T</Text>
          <Text style={[styles.cardinalText, styles.southText]}>S</Text>
          <Text style={[styles.cardinalText, styles.westText]}>B</Text>

          {/* Dial Circle Rings */}
          <View style={styles.innerRing} />
          <View style={styles.crosshairVertical} />
          <View style={styles.crosshairHorizontal} />

          {/* Ka'bah Qibla Indicator Marker */}
          <View
            style={[
              styles.qiblaMarkerContainer,
              { transform: [{ rotate: `${qiblaBearing}deg` }] },
            ]}
          >
            <View style={[styles.kaabaIcon, isAligned && styles.kaabaIconActive]}>
              <Text style={styles.kaabaSymbol}>🕋</Text>
            </View>
            <View style={styles.pointerLine} />
          </View>
        </Animated.View>

        {/* Center Pivot Indicator */}
        <View style={[styles.centerPivot, isAligned && styles.centerPivotActive]}>
          <CompassIcon color={isAligned ? '#0F5132' : '#F59E0B'} size={24} />
        </View>
      </View>

      {/* Status Badge & Degrees Card */}
      <View style={styles.infoSection}>
        <View style={[styles.statusBadge, isAligned ? styles.statusBadgeAligned : styles.statusBadgeNormal]}>
          {isAligned ? (
            <>
              <CheckCircle2 color="#FFFFFF" size={18} />
              <Text style={styles.statusBadgeTextAligned}>Menghadap Ka'bah (Tepat!)</Text>
            </>
          ) : (
            <Text style={styles.statusBadgeTextNormal}>Putar HP hingga jarum sejajar ikon Ka'bah</Text>
          )}
        </View>

        <Card style={styles.degreesCard}>
          <View style={styles.degreeItem}>
            <Text style={styles.degreeValue}>{heading}°</Text>
            <Text style={styles.degreeLabel}>Arah HP</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.degreeItem}>
            <Text style={[styles.degreeValue, { color: '#F59E0B' }]}>
              {Math.round(qiblaBearing)}°
            </Text>
            <Text style={styles.degreeLabel}>Sudut Ka'bah</Text>
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#FDE047',
    marginLeft: 4,
  },
  compassContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 300,
    marginVertical: SPACING.xl,
  },
  glowRing: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  activeGlowRing: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
  },
  dialContainer: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#1E293B',
    borderWidth: 4,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  crosshairVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardinalText: {
    position: 'absolute',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  northText: { top: 12, color: '#EF4444' },
  eastText: { right: 14 },
  southText: { bottom: 12 },
  westText: { left: 14 },
  qiblaMarkerContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  pointerLine: {
    width: 2,
    height: 40,
    backgroundColor: '#D4AF37',
    marginTop: 40,
  },
  kaabaIcon: {
    marginTop: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  kaabaIconActive: {
    backgroundColor: '#10B981',
  },
  kaabaSymbol: {
    fontSize: 22,
  },
  centerPivot: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  centerPivotActive: {
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
  },
  infoSection: {
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  statusBadgeNormal: {
    backgroundColor: '#334155',
  },
  statusBadgeAligned: {
    backgroundColor: '#10B981',
  },
  statusBadgeTextNormal: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadgeTextAligned: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  degreesCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  degreeItem: {
    alignItems: 'center',
  },
  degreeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  degreeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#334155',
  },
});
