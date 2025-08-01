import * as Location from 'expo-location';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export class LocationService {
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  static async getCurrentLocation(): Promise<LocationInfo | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permission de localisation refusée');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressInfo = address[0];

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: addressInfo ? `${addressInfo.street} ${addressInfo.streetNumber}` : undefined,
        city: addressInfo?.city,
        country: addressInfo?.country,
      };
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      return null;
    }
  }

  static async geocodeAddress(address: string): Promise<LocationInfo | null> {
    try {
      const locations = await Location.geocodeAsync(address);
      if (locations.length === 0) return null;

      const location = locations[0];
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const addressInfo = reverseGeocode[0];

      return {
        latitude: location.latitude,
        longitude: location.longitude,
        address: addressInfo ? `${addressInfo.street} ${addressInfo.streetNumber}` : address,
        city: addressInfo?.city,
        country: addressInfo?.country,
      };
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      return null;
    }
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length === 0) return null;

      const address = addresses[0];
      return `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.country || ''}`.trim();
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error);
      return null;
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static async getRouteOptimization(locations: LocationInfo[]): Promise<LocationInfo[]> {
    // Implémentation basique d'optimisation d'itinéraire
    // Pour une solution plus avancée, utilisez Google Maps Directions API
    if (locations.length <= 2) return locations;

    const optimized = [locations[0]]; // Point de départ
    const remaining = locations.slice(1, -1);
    let current = locations[0];

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      remaining.forEach((location, index) => {
        const distance = this.calculateDistance(
          current.latitude,
          current.longitude,
          location.latitude,
          location.longitude
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const nearest = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nearest);
      current = nearest;
    }

    if (locations.length > 1) {
      optimized.push(locations[locations.length - 1]); // Point d'arrivée
    }

    return optimized;
  }
}