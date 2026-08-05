import axios from 'axios';

export interface SurahItem {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: 'Mekah' | 'Madinah' | string;
  arti: string;
  deskripsi: string;
  audioFull?: Record<string, string>;
}

export interface AyahItem {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio?: Record<string, string>;
}

export interface SurahDetail extends SurahItem {
  ayat: AyahItem[];
}

const EQURAN_BASE_URL = 'https://equran.id/api/v2';

export class QuranApiService {
  private static surahListCache: SurahItem[] | null = null;
  private static surahDetailCache: Map<number, SurahDetail> = new Map();

  /**
   * Fetch list of all 114 Surahs
   */
  static async getAllSurahs(): Promise<SurahItem[]> {
    if (this.surahListCache && this.surahListCache.length > 0) {
      return this.surahListCache;
    }

    try {
      const response = await axios.get(`${EQURAN_BASE_URL}/surat`, { timeout: 10000 });
      if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
        this.surahListCache = response.data.data;
        return response.data.data;
      }
      throw new Error('Format respon API Al-Qur\'an tidak sesuai');
    } catch (error) {
      console.log('[QuranApiService] Error fetching surah list:', error);
      throw error;
    }
  }

  /**
   * Fetch detail of a specific Surah with verses
   */
  static async getSurahDetail(surahNumber: number): Promise<SurahDetail> {
    if (this.surahDetailCache.has(surahNumber)) {
      return this.surahDetailCache.get(surahNumber)!;
    }

    try {
      const response = await axios.get(`${EQURAN_BASE_URL}/surat/${surahNumber}`, { timeout: 12000 });
      if (response.data && response.data.code === 200 && response.data.data) {
        const detailData: SurahDetail = response.data.data;
        this.surahDetailCache.set(surahNumber, detailData);
        return detailData;
      }
      throw new Error(`Gagal memuat Surah nomor ${surahNumber}`);
    } catch (error) {
      console.log(`[QuranApiService] Error fetching detail surah ${surahNumber}:`, error);
      throw error;
    }
  }

  /**
   * Helper to get audio URL of Qori (Default Qori 05: Sheikh Mishary Rashid Al-Afasy)
   */
  static getAudioUrl(audioObj?: Record<string, string>, preferQoriKey: string = '05'): string | null {
    if (!audioObj) return null;
    return audioObj[preferQoriKey] || audioObj['01'] || Object.values(audioObj)[0] || null;
  }
}
