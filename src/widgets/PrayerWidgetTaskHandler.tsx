import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { FlexWidget, TextWidget, SvgWidget, OverlapWidget } from 'react-native-android-widget';

const PRAYER_SCHEDULE_CACHE_KEY = 'prayer_bg_schedule_cache';

const ISLAMIC_STAR_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <polygon points="50,0 64.6,14.6 85.4,14.6 85.4,35.4 100,50 85.4,64.6 85.4,85.4 64.6,85.4 50,100 35.4,85.4 14.6,85.4 14.6,64.6 0,50 14.6,35.4 14.6,14.6 35.4,14.6" fill="#FDE047"/>
  <circle cx="50" cy="50" r="20" fill="#047857"/>
  <circle cx="50" cy="50" r="10" fill="#FDE047"/>
</svg>`;

const ISLAMIC_CRESCENT_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <path d="M50 10 A40 40 0 1 0 90 50 A30 30 0 1 1 50 10 Z" fill="#FDE047"/>
  <polygon points="75,18 79,28 89,28 81,35 84,45 75,38 66,45 69,35 61,28 71,28" fill="#FDE047"/>
</svg>`;

const ISLAMIC_ARCH_SVG = `<svg viewBox="0 0 200 30" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <path d="M0 30 Q 50 0 100 0 Q 150 0 200 30" fill="none" stroke="#FDE047" stroke-width="3" opacity="0.7"/>
</svg>`;

/**
 * Tiled Islamic Geometric Background Pattern derived from IslamicTexture.tsx
 * Features 8-pointed star motifs, hexagons, connecting lattice lines & gold accents
 */
const ISLAMIC_TEXTURE_SVG = `<svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="islamicPattern" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
      <polygon points="36,22 39.8,29.9 48.6,26 44.7,34.8 52.6,38.6 44.7,42.4 48.6,51.2 39.8,47.3 36,55.2 32.2,47.3 23.4,51.2 27.3,42.4 19.4,38.6 27.3,34.8 23.4,26 32.2,29.9" fill="none" stroke="#FDE047" stroke-width="1.2" opacity="0.35"/>
      <polygon points="0,-14 3.8,-6.1 12.6,-10 8.7,-1.2 16.6,2.6 8.7,6.4 12.6,15.2 3.8,11.3 0,19.2 -3.8,11.3 -12.6,15.2 -8.7,6.4 -16.6,2.6 -8.7,-1.2 -12.6,-10 -3.8,-6.1" fill="none" stroke="#FDE047" stroke-width="1.2" opacity="0.35"/>
      <polygon points="72,-14 75.8,-6.1 84.6,-10 80.7,-1.2 88.6,2.6 80.7,6.4 84.6,15.2 75.8,11.3 72,19.2 68.2,11.3 59.4,15.2 63.3,6.4 55.4,2.6 63.3,-1.2 59.4,-10 68.2,-6.1" fill="none" stroke="#FDE047" stroke-width="1.2" opacity="0.35"/>
      <polygon points="0,58 3.8,65.9 12.6,62 8.7,70.8 16.6,74.6 8.7,78.4 12.6,87.2 3.8,83.3 0,91.2 -3.8,83.3 -12.6,87.2 -8.7,78.4 -16.6,74.6 -8.7,70.8 -12.6,62 -3.8,65.9" fill="none" stroke="#FDE047" stroke-width="1.2" opacity="0.35"/>
      <polygon points="72,58 75.8,65.9 84.6,62 80.7,70.8 88.6,74.6 80.7,78.4 84.6,87.2 75.8,83.3 72,91.2 68.2,83.3 59.4,87.2 63.3,78.4 55.4,74.6 63.3,70.8 59.4,62 68.2,65.9" fill="none" stroke="#FDE047" stroke-width="1.2" opacity="0.35"/>
      <polygon points="36,-11 45.5,-5.5 45.5,5.5 36,11 26.5,5.5 26.5,-5.5" fill="none" stroke="#FDE047" stroke-width="0.9" opacity="0.25"/>
      <polygon points="36,61 45.5,66.5 45.5,77.5 36,83 26.5,77.5 26.5,66.5" fill="none" stroke="#FDE047" stroke-width="0.9" opacity="0.25"/>
      <polygon points="0,25 9.5,30.5 9.5,41.5 0,47 -9.5,41.5 -9.5,30.5" fill="none" stroke="#FDE047" stroke-width="0.9" opacity="0.25"/>
      <polygon points="72,25 81.5,30.5 81.5,41.5 72,47 62.5,41.5 62.5,30.5" fill="none" stroke="#FDE047" stroke-width="0.9" opacity="0.25"/>
      <line x1="22" y1="22" x2="14" y2="14" stroke="#FDE047" stroke-width="0.7" opacity="0.2"/>
      <line x1="50" y1="22" x2="58" y2="14" stroke="#FDE047" stroke-width="0.7" opacity="0.2"/>
      <line x1="22" y1="50" x2="14" y2="58" stroke="#FDE047" stroke-width="0.7" opacity="0.2"/>
      <line x1="50" y1="50" x2="58" y2="58" stroke="#FDE047" stroke-width="0.7" opacity="0.2"/>
      <circle cx="36" cy="36" r="2" fill="#FDE047" opacity="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#islamicPattern)"/>
</svg>`;

export async function getPrayerWidgetData() {
  let city = 'Jakarta';
  let isOffline = false;
  let prayers: { name: string; time: string }[] = [
    { name: 'Subuh', time: '04:42' },
    { name: 'Dzuhur', time: '12:02' },
    { name: 'Ashar', time: '15:24' },
    { name: 'Maghrib', time: '18:01' },
    { name: 'Isya', time: '19:12' },
  ];

  try {
    const netState = await NetInfo.fetch();
    isOffline = netState.isConnected === false || netState.isInternetReachable === false;
  } catch (e) {}

  try {
    const raw = await AsyncStorage.getItem(PRAYER_SCHEDULE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.city) city = parsed.city;
      if (parsed?.prayers && Array.isArray(parsed.prayers) && parsed.prayers.length > 0) {
        prayers = parsed.prayers;
      }
    }
  } catch (e) {}

  const now = new Date();
  let upcoming: { name: string; time: string; targetDate: Date } | null = null;

  for (let i = 0; i < prayers.length; i++) {
    const p = prayers[i];
    if (!p.time) continue;
    const [h, m] = p.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);

    if (target.getTime() > now.getTime()) {
      upcoming = { name: p.name, time: p.time, targetDate: target };
      break;
    }
  }

  if (!upcoming && prayers.length > 0) {
    const subuh = prayers[0];
    if (subuh && subuh.time) {
      const [h, m] = subuh.time.split(':').map(Number);
      const tomorrowSubuh = new Date();
      tomorrowSubuh.setDate(now.getDate() + 1);
      tomorrowSubuh.setHours(h, m, 0, 0);
      upcoming = { name: subuh.name, time: subuh.time, targetDate: tomorrowSubuh };
    }
  }

  let nextPrayerName = 'Subuh';
  let nextPrayerTime = '--:--';
  let countdown = '00:00:00';
  let timeRemainingStr = 'Menunggu...';

  if (upcoming) {
    nextPrayerName = upcoming.name;
    const diffMs = upcoming.targetDate.getTime() - now.getTime();
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    countdown = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

    if (hours > 0) {
      timeRemainingStr = `${hours} Jam ${mins} Mnt Lagi`;
    } else if (mins > 0) {
      timeRemainingStr = `${mins} Menit Lagi`;
    } else {
      timeRemainingStr = 'Waktu Salat Tiba!';
    }

    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzSuffix = tzName.includes('Makassar') || tzName.includes('Jayapura') ? 'WITA' : 'WIB';
    nextPrayerTime = `${upcoming.time} ${tzSuffix}`;
  }

  return {
    city,
    nextPrayerName,
    nextPrayerTime,
    countdown,
    timeRemainingStr,
    prayers,
    isOffline,
  };
}

export function PrayerWidgetUi({
  city = 'Jakarta',
  nextPrayerName = 'Maghrib',
  nextPrayerTime = '18:01 WIB',
  countdown = '00:45:10',
  timeRemainingStr = '45 Menit Lagi',
  prayers = [],
  isOffline = false,
  widgetWidth = 320,
  widgetHeight = 180,
}: {
  city?: string;
  nextPrayerName?: string;
  nextPrayerTime?: string;
  countdown?: string;
  timeRemainingStr?: string;
  prayers?: { name: string; time: string }[];
  isOffline?: boolean;
  widgetWidth?: number;
  widgetHeight?: number;
}) {
  const prayerList = prayers.length > 0 ? prayers : [
    { name: 'Subuh', time: '04:42' },
    { name: 'Dzuhur', time: '12:02' },
    { name: 'Ashar', time: '15:24' },
    { name: 'Maghrib', time: '18:01' },
    { name: 'Isya', time: '19:12' },
  ];

  // Responsiveness Breakpoints based on Android Widget DP dimensions
  const isSmallHeight = widgetHeight < 130;
  const isCompactHeight = widgetHeight < 170;
  const isNarrowWidth = widgetWidth < 290;
  const isTinyWidth = widgetWidth < 180;

  // Responsive dynamic sizes
  const padding = isSmallHeight ? 8 : isCompactHeight ? 10 : 14;
  const headerFontSize = isNarrowWidth ? 11 : 12;
  const timeFontSize = isNarrowWidth ? 16 : isSmallHeight ? 18 : 22;
  const countdownFontSize = isNarrowWidth ? 12 : 14;

  const displayCity = city.length > 12 ? `${city.substring(0, 10)}..` : city;

  return (
    <OverlapWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#059669',
        borderRadius: 16,
      }}
    >
      {/* Background Tiled Islamic Geometric Pattern */}
      <SvgWidget
        svg={ISLAMIC_TEXTURE_SVG}
        style={{
          width: 'match_parent',
          height: 'match_parent',
        }}
      />

      {/* Content Layer with dynamic responsive layout */}
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          padding: padding,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top Header Row */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: 'match_parent',
          }}
        >
          {/* Location Pill */}
          <FlexWidget
            style={{
              backgroundColor: '#047857',
              borderRadius: 10,
              paddingHorizontal: isNarrowWidth ? 6 : 8,
              paddingVertical: isSmallHeight ? 3 : 4,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <SvgWidget svg={ISLAMIC_STAR_SVG} style={{ width: isNarrowWidth ? 10 : 13, height: isNarrowWidth ? 10 : 13, marginRight: 4 }} />
            <TextWidget
              text={`📍 ${displayCity}`}
              style={{
                fontSize: headerFontSize,
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>

          {/* Hijri / App Branding Badge with Crescent */}
          <FlexWidget
            style={{
              backgroundColor: isOffline ? '#B45309' : '#03543F',
              borderRadius: 10,
              paddingHorizontal: isNarrowWidth ? 6 : 8,
              paddingVertical: isSmallHeight ? 3 : 4,
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 4,
            }}
          >
            <SvgWidget svg={ISLAMIC_CRESCENT_SVG} style={{ width: isNarrowWidth ? 10 : 13, height: isNarrowWidth ? 10 : 13, marginRight: 4 }} />
            <TextWidget
              text={isOffline ? '⚠️ Offline' : isNarrowWidth ? 'Muslim' : 'Muslim App'}
              style={{
                fontSize: headerFontSize,
                color: '#FDE047',
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>
        </FlexWidget>


        {/* Center Hero Countdown Box */}
        <FlexWidget
          style={{
            flexDirection: isNarrowWidth && isSmallHeight ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: 'match_parent',
            marginVertical: isSmallHeight ? 2 : 6,
          }}
        >
          <FlexWidget style={{ flexDirection: 'column' }}>
            {!isSmallHeight && (
              <SvgWidget svg={ISLAMIC_ARCH_SVG} style={{ width: isNarrowWidth ? 60 : 80, height: 8, marginBottom: 2 }} />
            )}
            <TextWidget
              text={`Adzan ${nextPrayerName}`}
              style={{
                fontSize: isNarrowWidth ? 12 : 13,
                color: '#F3F4F6',
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text={nextPrayerTime}
              style={{
                fontSize: timeFontSize,
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              backgroundColor: '#03543F',
              borderRadius: 10,
              paddingHorizontal: isNarrowWidth ? 6 : 10,
              paddingVertical: isSmallHeight ? 4 : 6,
              borderWidth: 1,
              borderColor: '#FDE047',
              marginTop: isNarrowWidth && isSmallHeight ? 4 : 0,
            }}
          >
            <TextWidget
              text={`⏳ ${timeRemainingStr}`}
              style={{
                fontSize: countdownFontSize,
                color: '#FDE047',
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Bottom 5 Prayer Grid (Hidden in small height widgets to prevent overflow) */}
        {!isSmallHeight && (
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: 'match_parent',
              paddingTop: isCompactHeight ? 4 : 8,
              borderTopWidth: 1,
              borderTopColor: '#047857',
            }}
          >
            {prayerList.map((p, idx) => {
              const isNext = p.name.toLowerCase() === nextPrayerName.toLowerCase();
              return (
                <FlexWidget
                  key={idx}
                  style={{
                    flex: 1,
                    backgroundColor: isNext ? '#047857' : undefined,
                    borderRadius: 6,
                    paddingHorizontal: isNarrowWidth ? 2 : 4,
                    paddingVertical: isCompactHeight ? 3 : 5,
                    alignItems: 'center',
                    marginHorizontal: 2,
                    borderWidth: isNext ? 1 : 0,
                    borderColor: isNext ? '#FDE047' : undefined,
                  }}
                >
                  {!isTinyWidth && (
                    <TextWidget
                      text={p.name}
                      style={{
                        fontSize: isNarrowWidth ? 9 : 10,
                        color: isNext ? '#FDE047' : '#E5E7EB',
                        fontWeight: isNext ? 'bold' : 'normal',
                      }}
                    />
                  )}
                  <TextWidget
                    text={p.time}
                    style={{
                      fontSize: isNarrowWidth ? 10 : 11,
                      color: '#FFFFFF',
                      fontWeight: isNext ? 'bold' : 'normal',
                    }}
                  />
                </FlexWidget>
              );
            })}
          </FlexWidget>
        )}
      </FlexWidget>
    </OverlapWidget>
  );
}


export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      const widgetData = await getPrayerWidgetData();
      const rawWidth = props.widgetInfo?.width || 320;
      const screenWidth = props.widgetInfo?.screenInfo?.screenWidthDp;
      const widgetHeight = props.widgetInfo?.height || 180;
      const effectiveWidth = (screenWidth && rawWidth >= 250)
        ? Math.max(rawWidth, Math.round(screenWidth - 24))
        : rawWidth;

      props.renderWidget(
        <PrayerWidgetUi
          {...widgetData}
          widgetWidth={effectiveWidth}
          widgetHeight={widgetHeight}
        />
      );
      break;

    case 'WIDGET_DELETED':
      break;

    default:
      break;
  }
}

