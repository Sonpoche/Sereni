// src/lib/utils/geocoding.ts
/**
 * Utilitaire pour la géolocalisation avec Nominatim (OpenStreetMap)
 */

// Fonction pour convertir une adresse en coordonnées géographiques
export async function geocodeAddress(address: string, country = "fr"): Promise<{latitude: number, longitude: number} | null> {
    try {
      // Construction de l'URL Nominatim avec échappement des caractères spéciaux
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=${country}`;
      
      // Ajout d'un User-Agent personnalisé comme requis par Nominatim
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SereniBook/1.0 (contact@serenibook.fr)",
          "Accept-Language": "fr",
        },
        // Respecter la limitation à 1 requête par seconde de Nominatim
        cache: "force-cache",
      });
      
      if (!response.ok) {
        throw new Error(`Erreur de géocodage: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
      
      return null;
    } catch (error) {
      console.error("Erreur de géocodage:", error);
      return null;
    }
  }
  
  // Fonction pour obtenir les coordonnées à partir d'un code postal
  export async function geocodePostalCode(postalCode: string, country = "fr"): Promise<{latitude: number, longitude: number} | null> {
    return geocodeAddress(`${postalCode}, ${country}`);
  }
  
  // Fonction pour obtenir l'adresse à partir de coordonnées (géocodage inverse)
  export async function reverseGeocode(lat: number, lon: number): Promise<any | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SereniBook/1.0 (contact@serenibook.fr)",
          "Accept-Language": "fr",
        },
        cache: "force-cache",
      });
      
      if (!response.ok) {
        throw new Error(`Erreur de géocodage inverse: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        return {
          address: data.display_name,
          details: data.address,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Erreur de géocodage inverse:", error);
      return null;
    }
  }

/**
 * Calcule la distance entre deux coordonnées GPS en utilisant la formule de Haversine
 * @param lat1 Latitude du premier point
 * @param lon1 Longitude du premier point
 * @param lat2 Latitude du second point
 * @param lon2 Longitude du second point
 * @returns Distance en kilomètres
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

/**
 * Interface pour les coordonnées géographiques
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Obtient les coordonnées GPS du navigateur (géolocalisation côté client)
 * @returns Promise avec les coordonnées ou null si impossible
 */
export function getCurrentPosition(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Géolocalisation non supportée par ce navigateur');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Erreur de géolocalisation:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Formate une distance en kilomètres avec une unité appropriée
 * @param distanceKm Distance en kilomètres
 * @returns Chaîne formatée (ex: "2.5 km" ou "450 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  } else if (distanceKm < 10) {
    return `${Math.round(distanceKm * 10) / 10} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
}

/**
 * Vérifie si deux coordonnées sont dans un rayon donné
 * @param lat1 Latitude du premier point
 * @param lon1 Longitude du premier point
 * @param lat2 Latitude du second point
 * @param lon2 Longitude du second point
 * @param radiusKm Rayon en kilomètres
 * @returns true si les points sont dans le rayon
 */
export function isWithinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusKm: number): boolean {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

/**
 * Trouve le point le plus proche parmi une liste de coordonnées
 * @param targetLat Latitude du point de référence
 * @param targetLon Longitude du point de référence
 * @param points Liste de points avec coordonnées et données associées
 * @returns Le point le plus proche avec sa distance
 */
export function findNearestPoint<T extends { latitude: number; longitude: number }>(
  targetLat: number, 
  targetLon: number, 
  points: T[]
): (T & { distance: number }) | null {
  if (points.length === 0) return null;

  let nearest = points[0];
  let minDistance = calculateDistance(targetLat, targetLon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(targetLat, targetLon, points[i].latitude, points[i].longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = points[i];
    }
  }

  return { ...nearest, distance: minDistance };
}

/**
 * Trie une liste de points par distance par rapport à un point de référence
 * @param targetLat Latitude du point de référence
 * @param targetLon Longitude du point de référence
 * @param points Liste de points à trier
 * @returns Liste triée par distance croissante avec les distances calculées
 */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  targetLat: number, 
  targetLon: number, 
  points: T[]
): (T & { distance: number })[] {
  return points
    .map(point => ({
      ...point,
      distance: calculateDistance(targetLat, targetLon, point.latitude, point.longitude)
    }))
    .sort((a, b) => a.distance - b.distance);
}