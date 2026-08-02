import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import * as Location from 'expo-location';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { SPACING } from '../../../constants/theme';
import { useLocationStore } from '../../../store/useLocationStore';
import { calculateQiblaBearing, calculateDistanceToKaaba } from '../../../utils/qiblaCalculator';
import {
  Compass as CompassIcon,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Navigation2,
  ChevronRight,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(SCREEN_WIDTH - 48, 310);

// ── Color palette ────────────────────────────────────────────────────────────
const C = {
  bg: '#07111F',
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.35)',
  goldGlow: 'rgba(212,175,55,0.15)',
  green: '#10B981',
  greenGlow: 'rgba(16,185,129,0.2)',
  white: '#FFFFFF',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate800: '#1E293B',
  red: '#F87171',
};

interface QiblaScreenProps {
  onBack?: () => void;
}

// ── Tick marks around the compass ring ───────────────────────────────────────
function CompassTicks({ size, isAligned }: { size: number; isAligned: boolean }) {
  const TICK_COUNT = 72; // every 5°
  const r = size / 2;
  const elements = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const deg = (i / TICK_COUNT) * 360;
    const isCardinal = i % 18 === 0; // 0, 90, 180, 270
    const isMajor = i % 9 === 0;    // 0, 45, 90 …
    const tickLen = isCardinal ? 14 : isMajor ? 9 : 5;
    const color = isAligned
      ? isCardinal ? C.green : 'rgba(16,185,129,0.35)'
      : isCardinal ? C.gold : 'rgba(212,175,55,0.2)';

    elements.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          top: 0,
          left: r - 1,
          width: 2,
          height: r,
          alignItems: 'flex-start',
          transform: [{ rotate: `${deg}deg` }],
          // @ts-ignore – RN web prop, safe to ignore on native
          transformOrigin: `1px ${r}px`,
        }}
      >
        <View
          style={{
            width: isCardinal ? 2.5 : isMajor ? 1.5 : 1,
            height: tickLen,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    );
  }
  return <>{elements}</>;
}

// ─────────────────────────────────────────────────────────────────────────────

export const QiblaScreen: React.FC<QiblaScreenProps> = ({ onBack }) => {
  // ── Shared global location (same store as MasjidMapScreen) ─────────────────
  const {
    latitude: userLat,
    longitude: userLng,
    city,
    isGps,
    setGpsLocation,
  } = useLocationStore();

  // ── Local compass state ───────────────────────────────────────────────────
  const [heading, setHeading] = useState<number>(0);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // ── Animated values ───────────────────────────────────────────────────────
  const dialRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const alignedPulse = useRef(new Animated.Value(0)).current;

  // ── Derived qibla data ────────────────────────────────────────────────────
  const qiblaBearing = calculateQiblaBearing(userLat, userLng);
  const distanceToKaaba = calculateDistanceToKaaba(userLat, userLng);
  const diff = (heading - qiblaBearing + 360) % 360;
  const isAligned = diff < 5 || diff > 355;
  const accentColor = isAligned ? C.green : C.gold;

  // ── Pulse animation loop ──────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Aligned blink animation ───────────────────────────────────────────────
  useEffect(() => {
    if (isAligned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(alignedPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(alignedPulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      alignedPulse.setValue(0);
    }
  }, [isAligned]);

  // ── Compass sensor subscription ───────────────────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setSensorAvailable(false); return; }

        // If GPS mode, also get fresh coords
        if (isGps) {
          const loc = await Location.getCurrentPositionAsync({});
          const reverse = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          const cityName = reverse.length > 0
            ? `${reverse[0].city || reverse[0].subregion}, ${reverse[0].region || reverse[0].country}`
            : 'Lokasi GPS';
          setGpsLocation(loc.coords.latitude, loc.coords.longitude, cityName);
        }

        sub = await Location.watchHeadingAsync((headingObj) => {
          const current = Math.round(headingObj.magHeading);
          setHeading(current);
          Animated.timing(dialRotation, {
            toValue: -current,
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        });
        setSensorAvailable(true);
      } catch {
        setSensorAvailable(false);
      }
    })();

    return () => { sub?.remove(); };
  }, []);

  const spinDial = dialRotation.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  const INNER_SIZE = COMPASS_SIZE - 32;
  const PIVOT_SIZE = 48;

  return (
    <ScreenWrapper bg={C.bg} barStyle="light-content" style={styles.wrapper}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft color={C.white} size={20} />
          </TouchableOpacity>
        )}

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Kompas Kiblat</Text>

          {/* Location selector — same pattern as MasjidMapScreen */}
          <TouchableOpacity
            style={styles.locationSelectorBtn}
            onPress={() => setIsLocationModalOpen(true)}
            activeOpacity={0.8}
          >
            <MapPin color={C.gold} size={12} />
            <Text style={styles.locationSelectorText} numberOfLines={1}>
              {city.split(',')[0]}
            </Text>
            <ChevronRight color={C.slate400} size={12} />
          </TouchableOpacity>
        </View>

        {/* Live heading badge */}
        <View style={[styles.headingBadge, { borderColor: accentColor + '66' }]}>
          <Text style={[styles.headingBadgeNum, { color: accentColor }]}>{heading}°</Text>
          <Text style={styles.headingBadgeLabel}>HP</Text>
        </View>
      </View>

      {/* GPS / Manual indicator subtitle */}
      <Text style={styles.locationSubtitle}>
        {isGps ? '📍 GPS Otomatis' : '🌐 Lokasi Manual'} — {city}
      </Text>

      {/* ── Compass ────────────────────────────────────────────────────────── */}
      <View style={styles.compassArea}>
        {/* Ambient glow rings */}
        <Animated.View
          style={[
            styles.glowRing3,
            {
              borderColor: isAligned ? C.greenGlow : C.goldGlow,
              opacity: isAligned ? alignedPulse : 0.5,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <View
          style={[
            styles.glowRing2,
            { borderColor: isAligned ? 'rgba(16,185,129,0.25)' : 'rgba(212,175,55,0.12)' },
          ]}
        />

        {/* Rotating dial */}
        <Animated.View
          style={[
            styles.dialOuter,
            {
              width: COMPASS_SIZE,
              height: COMPASS_SIZE,
              borderRadius: COMPASS_SIZE / 2,
              borderColor: accentColor,
              shadowColor: accentColor,
              transform: [{ rotate: spinDial }],
            },
          ]}
        >
          {/* Tick marks */}
          <View style={{ position: 'absolute', width: COMPASS_SIZE, height: COMPASS_SIZE }}>
            <CompassTicks size={COMPASS_SIZE} isAligned={isAligned} />
          </View>

          {/* Inner disc */}
          <View
            style={[
              styles.dialInner,
              { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2 },
            ]}
          >
            {/* Subtle grid lines */}
            <View style={[styles.gridLine, { height: '80%', width: 1 }]} />
            <View style={[styles.gridLine, { width: '80%', height: 1 }]} />
            <View style={[styles.gridLine, { height: '65%', width: 1, transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.gridLine, { height: '65%', width: 1, transform: [{ rotate: '-45deg' }] }]} />
            <View style={[styles.innerCircle, { width: INNER_SIZE * 0.45, height: INNER_SIZE * 0.45, borderRadius: (INNER_SIZE * 0.45) / 2 }]} />

            {/* Cardinal labels */}
            <Text style={[styles.cardinal, styles.north]}>U</Text>
            <Text style={[styles.cardinal, styles.east]}>T</Text>
            <Text style={[styles.cardinal, styles.south]}>S</Text>
            <Text style={[styles.cardinal, styles.west]}>B</Text>

            {/* Qibla pointer — rotated by bearing */}
            <View style={[styles.qiblaMarker, { transform: [{ rotate: `${qiblaBearing}deg` }] }]}>
              <View style={[styles.kaabaIconWrap, isAligned && styles.kaabaIconWrapActive]}>
                <Text style={styles.kaabaEmoji}>🕋</Text>
              </View>
              <View
                style={[
                  styles.qiblaLine,
                  { maxHeight: INNER_SIZE / 2 - 56 },
                  isAligned && styles.qiblaLineActive,
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Fixed center pivot */}
        <Animated.View
          style={[
            styles.pivot,
            {
              width: PIVOT_SIZE,
              height: PIVOT_SIZE,
              borderRadius: PIVOT_SIZE / 2,
              backgroundColor: isAligned ? C.green : C.slate800,
              borderColor: accentColor,
              shadowColor: accentColor,
              transform: [{ scale: isAligned ? pulseAnim : 1 }],
            },
          ]}
        >
          <CompassIcon color={isAligned ? '#fff' : C.gold} size={20} />
        </Animated.View>
      </View>

      {/* ── Bottom Info Panel ───────────────────────────────────────────────── */}
      <View style={styles.infoPanel}>

        {/* Status Banner */}
        <View style={[styles.statusBanner, isAligned ? styles.statusBannerAligned : styles.statusBannerIdle]}>
          {isAligned ? (
            <>
              <CheckCircle2 color="#fff" size={18} />
              <Text style={styles.statusTextAligned}>Menghadap Ka'bah — Tepat!</Text>
            </>
          ) : (
            <>
              <Navigation2 color={C.slate400} size={18} />
              <Text style={styles.statusTextIdle}>Putar perangkat hingga jarum sejajar ikon Ka'bah</Text>
            </>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Arah HP */}
          <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.07)' }]}>
            <Text style={styles.statValue}>
              {heading}<Text style={styles.statUnit}>°</Text>
            </Text>
            <Text style={styles.statLabel}>Arah HP</Text>
          </View>

          {/* Sudut Ka'bah */}
          <View style={[styles.statCard, { borderColor: C.goldDim }]}>
            <Text style={[styles.statValue, { color: C.gold }]}>
              {Math.round(qiblaBearing)}<Text style={[styles.statUnit, { color: C.gold }]}>°</Text>
            </Text>
            <Text style={styles.statLabel}>Sudut Ka'bah</Text>
          </View>

          {/* Jarak */}
          <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.07)' }]}>
            <Text style={[styles.statValue, { fontSize: 18 }]}>
              {distanceToKaaba >= 1000
                ? (distanceToKaaba / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })
                : distanceToKaaba.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              <Text style={styles.statUnit}>{distanceToKaaba >= 1000 ? ' rb' : ''} km</Text>
            </Text>
            <Text style={styles.statLabel}>Jarak</Text>
          </View>
        </View>

        {/* Sensor warning */}
        {!sensorAvailable && (
          <View style={styles.sensorWarning}>
            <Text style={styles.sensorWarningText}>⚠ Sensor kompas tidak tersedia di perangkat ini</Text>
          </View>
        )}
      </View>

      {/* ── Location Picker Modal (same as MasjidMapScreen) ─────────────────── */}
      <LocationPickerModal
        visible={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

    </ScreenWrapper>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.3,
  },
  // Location selector button — mirrors MasjidMapScreen's locationSelectorBtn
  locationSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderColor: 'rgba(212,175,55,0.35)',
    gap: 4,
  },
  locationSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.gold,
    flexShrink: 1,
    maxWidth: 130,
  },
  headingBadge: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    minWidth: 56,
  },
  headingBadgeNum: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  headingBadgeLabel: {
    fontSize: 10,
    color: C.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Subtitle below header
  locationSubtitle: {
    fontSize: 11,
    color: C.slate400,
    marginTop: 6,
    marginBottom: 2,
  },

  // Compass
  compassArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing3: {
    position: 'absolute',
    width: COMPASS_SIZE + 44,
    height: COMPASS_SIZE + 44,
    borderRadius: (COMPASS_SIZE + 44) / 2,
    borderWidth: 1,
  },
  glowRing2: {
    position: 'absolute',
    width: COMPASS_SIZE + 18,
    height: COMPASS_SIZE + 18,
    borderRadius: (COMPASS_SIZE + 18) / 2,
    borderWidth: 1.5,
  },
  dialOuter: {
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
    backgroundColor: 'transparent',
  },
  dialInner: {
    backgroundColor: '#08182D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardinal: {
    position: 'absolute',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  north: { top: 12, color: '#F87171' },
  east: { right: 14, color: C.slate300 },
  south: { bottom: 12, color: C.slate300 },
  west: { left: 14, color: C.slate300 },
  qiblaMarker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  kaabaIconWrap: {
    marginTop: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.5)',
  },
  kaabaIconWrapActive: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  kaabaEmoji: { fontSize: 20 },
  qiblaLine: {
    marginTop: 4,
    width: 2.5,
    flex: 1,
    backgroundColor: C.goldDim,
    borderRadius: 2,
  },
  qiblaLineActive: {
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  pivot: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
  },

  // Bottom panel
  infoPanel: {
    gap: SPACING.sm,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusBannerIdle: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusBannerAligned: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  statusTextAligned: {
    color: C.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  statusTextIdle: {
    color: C.slate400,
    fontWeight: '500',
    fontSize: 13,
    flexShrink: 1,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: C.white,
    lineHeight: 26,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: C.slate400,
  },
  statLabel: {
    fontSize: 11,
    color: C.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sensorWarning: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 12,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  sensorWarningText: {
    color: C.red,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QiblaScreen;
