export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface UserSettings {
  calculation_method: string;
  reminder_offset_minutes: number;
  notif_adzan_enabled: boolean;
  language: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  media_urls?: { type: 'IMAGE' | 'LINK'; url: string }[];
  category?: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_me: boolean;
  is_bookmarked_by_me?: boolean;
  deleted_at?: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Masjid {
  id: string;
  google_place_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance_km?: number;
  average_rating?: number;
  total_reviews?: number;
  is_bookmarked_by_me?: boolean;
}

export interface MasjidReview {
  id: string;
  masjid_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  photos?: string[];
  user_name: string;
  user_avatar: string | null;
  created_at: string;
  updated_at?: string;
  is_mine?: boolean;
}

export interface MasjidReviewSummary {
  average_rating: number;
  total_reviews: number;
  star_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  my_review?: MasjidReview | null;
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
}

export interface HijriDate {
  day: string;
  month: { en: string; ar: string; number: number };
  year: string;
  weekday: { en: string; ar: string };
}

export interface IslamicEvent {
  id: string;
  name: string;
  hijri_date: string;
  gregorian_date?: string;
}
