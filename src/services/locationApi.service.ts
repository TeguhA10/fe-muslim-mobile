import axios from 'axios';

export interface DynamicCityOption {
  id?: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
}

export class LocationApiService {
  /**
   * Fetch all official Indonesian regencies & cities from MyQuran Public API
   * Endpoint: https://api.myquran.com/v2/sholat/kota/semua
   */
  static async fetchAllIndonesianCities(): Promise<DynamicCityOption[]> {
    try {
      const response = await axios.get('https://api.myquran.com/v2/sholat/kota/semua');
      const data = response.data?.data;
      if (Array.isArray(data)) {
        return data.map((item: { id: string; lokasi: string }) => ({
          id: item.id,
          name: item.lokasi,
          province: 'Indonesia',
          lat: -6.200000,
          lng: 106.816666,
        }));
      }
    } catch (error) {
      console.log('[LocationAPI] Error fetching MyQuran cities, using Nominatim fallback');
    }
    return [];
  }

  /**
   * Live Search Indonesian locations using OpenStreetMap Nominatim Public API
   * Endpoint: https://nominatim.openstreetmap.org/search
   */
  static async searchLocationPublicApi(query: string): Promise<DynamicCityOption[]> {
    if (!query.trim()) return [];

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          countrycodes: 'id',
          format: 'json',
          addressdetails: 1,
          limit: 10,
        },
        headers: {
          'User-Agent': 'MuslimAppMobile/1.0',
        },
      });

      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => {
          const addr = item.address || {};
          const cityName =
            addr.city ||
            addr.town ||
            addr.regency ||
            addr.county ||
            addr.suburb ||
            item.display_name.split(',')[0];
          const provinceName = addr.state || 'Indonesia';

          return {
            name: cityName,
            province: provinceName,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });
      }
    } catch (error) {
      console.log('[LocationAPI] Error calling Nominatim API:', error);
    }
    return [];
  }
}
