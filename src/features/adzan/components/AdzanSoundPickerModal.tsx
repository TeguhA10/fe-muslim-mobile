import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Check, Volume2, Music, VolumeX, ShieldCheck } from 'lucide-react-native';
import { useThemeStore } from '../../../store/useThemeStore';
import { ADZAN_SOUND_OPTIONS, AdzanSoundOption, PrayerSoundSettings } from '../../../store/useSettingsStore';
import { Audio } from 'expo-av';

interface AdzanSoundPickerModalProps {
  visible: boolean;
  prayerName: keyof PrayerSoundSettings | null;
  currentSoundId: string;
  onClose: () => void;
  onSelectSound: (prayerName: keyof PrayerSoundSettings, soundId: string) => void;
}

// Audio preview URLs hosted on Cloudinary CDN
// const SOUND_PREVIEWS: Record<string, string> = {
//   adzan_makkah: 'https://res.cloudinary.com/duzkwgevq/video/upload/v1785943922/muslim_app/adzan_audio/adzan_makkah.mp3',
//   adzan_madinah: 'https://res.cloudinary.com/duzkwgevq/video/upload/v1785943916/muslim_app/adzan_audio/adzan_madinah.mp3',
//   adzan_subuh_makkah: 'https://res.cloudinary.com/duzkwgevq/video/upload/v1785943932/muslim_app/adzan_audio/adzan_subuh_makkah.mp3',
//   adzan_soft: 'https://res.cloudinary.com/duzkwgevq/video/upload/v1785943940/muslim_app/adzan_audio/adzan_soft.mp3',
//   chime_short: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
// };

const SOUND_PREVIEWS: Record<string, number> = {
  adzan_makkah: require('../../../../assets/adzan/adzan_makkah.mp3'),
  adzan_madinah: require('../../../../assets/adzan/adzan_madinah.mp3'),
  adzan_subuh_makkah: require('../../../../assets/adzan/adzan_subuh_makkah.mp3'),
  adzan_soft: require('../../../../assets/adzan/adzan_soft.mp3'),
  chime_short: require('../../../../assets/adzan/short_chime.mp3'),
};

export const AdzanSoundPickerModal: React.FC<AdzanSoundPickerModalProps> = ({
  visible,
  prayerName,
  currentSoundId,
  onClose,
  onSelectSound,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const [selectedId, setSelectedId] = useState<string>(currentSoundId || 'adzan_makkah');
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedId(currentSoundId || 'adzan_makkah');
  }, [currentSoundId, visible]);

  React.useEffect(() => {
    return () => {
      if (soundObject) {
        soundObject.unloadAsync().catch(() => { });
      }
    };
  }, [soundObject]);

  const handlePlayPreview = async (soundId: string) => {
    try {
      if (playingId === soundId && soundObject) {
        try {
          await soundObject.stopAsync();
        } catch { }
        setPlayingId(null);
        return;
      }

      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch { }
      }

      const source = SOUND_PREVIEWS[soundId];

      if (!source) {
        console.log('Sound tidak ditemukan:', soundId);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          volume: 0.8,
        }
      );

      if (!sound) {
        setPlayingId(null);
        return;
      }

      setSoundObject(sound);
      setPlayingId(soundId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e: any) {
      console.log('[AdzanSoundPickerModal] Audio preview play error:', e?.message || e);
      setPlayingId(null);
    }
  };

  const handleSave = () => {
    if (soundObject) {
      soundObject.stopAsync().catch(() => { });
    }
    setPlayingId(null);
    if (prayerName) {
      onSelectSound(prayerName, selectedId);
    }
    onClose();
  };

  if (!visible || !prayerName) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Volume2 color={colors.primary} size={22} />
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Suara Adzan {prayerName}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <X color={colors.textMuted} size={20} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Pilih suara notifikasi adzan yang ingin dikumandangkan khusus pada waktu {prayerName}:
              </Text>

              {/* Sound Options List */}
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {ADZAN_SOUND_OPTIONS.map((opt: AdzanSoundOption) => {
                  const isSelected = selectedId === opt.id;
                  const isPlayingThis = playingId === opt.id;
                  const hasPreview = !!SOUND_PREVIEWS[opt.id];

                  return (
                    <TouchableOpacity
                      key={opt.id}
                      activeOpacity={0.7}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? 'rgba(34, 197, 94, 0.12)'
                              : '#F0FDF4'
                            : isDarkMode
                              ? '#1E293B'
                              : '#F8FAFC',
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedId(opt.id)}
                    >
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isSelected ? colors.primary : colors.textMuted,
                              backgroundColor: isSelected ? colors.primary : 'transparent',
                            },
                          ]}
                        >
                          {isSelected && <Check color="#FFFFFF" size={14} />}
                        </View>
                        <View style={styles.optionTextCol}>
                          <Text
                            style={[
                              styles.optionName,
                              { color: isSelected ? colors.primary : colors.text },
                            ]}
                          >
                            {opt.name}
                          </Text>
                          <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                            {opt.description}
                          </Text>
                        </View>
                      </View>

                      {/* Preview Play Button */}
                      {hasPreview && (
                        <TouchableOpacity
                          style={[
                            styles.previewBtn,
                            {
                              backgroundColor: isPlayingThis
                                ? '#EF4444'
                                : isDarkMode
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : '#DCFCE7',
                            },
                          ]}
                          onPress={() => handlePlayPreview(opt.id)}
                        >
                          {isPlayingThis ? (
                            <VolumeX color="#FFFFFF" size={16} />
                          ) : (
                            <Music color={colors.primary} size={16} />
                          )}
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>Simpan Suara</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  optionsList: {
    maxHeight: 320,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
  },
  previewBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
