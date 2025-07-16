// src/lib/utils/geocoding.ts
/**
 * Utilitaire pour la géolocalisation avec plusieurs APIs en fallback
 */

// Fonction améliorée pour convertir une adresse en coordonnées géographiques
export async function geocodeAddress(address: string, country = "fr"): Promise<{latitude: number, longitude: number} | null> {
  console.log('🔍 Géocodage pour:', address);
  
  // Étape 1: Essayer avec l'API gouvernementale française (plus précise)
  try {
    const coordsDataGouv = await geocodeWithDataGouv(address);
    if (coordsDataGouv) {
      console.log('✅ Succès avec data.gouv.fr:', coordsDataGouv);
      return coordsDataGouv;
    }
  } catch (error) {
    console.warn('⚠️ Échec data.gouv.fr:', error);
  }
  
  // Étape 2: Fallback vers Nominatim (version originale améliorée)
  try {
    const coordsNominatim = await geocodeWithNominatim(address, country);
    if (coordsNominatim) {
      console.log('✅ Succès avec Nominatim:', coordsNominatim);
      return coordsNominatim;
    }
  } catch (error) {
    console.warn('⚠️ Échec Nominatim:', error);
  }
  
  console.log('❌ Échec de géocodage pour:', address);
  return null;
}

// Nouvelle fonction avec l'API gouvernementale française
async function geocodeWithDataGouv(address: string): Promise<{latitude: number, longitude: number} | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API data.gouv.fr: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const score = feature.properties.score || 0;
      
      // Seuil de qualité - data.gouv.fr a des scores entre 0 et 1
      if (score > 0.5) {
        return {
          latitude: feature.geometry.coordinates[1], // Note: data.gouv.fr retourne [longitude, latitude]
          longitude: feature.geometry.coordinates[0],
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Erreur avec data.gouv.fr:", error);
    return null;
  }
}

// Fonction Nominatim améliorée (version originale)
async function geocodeWithNominatim(address: string, country = "fr"): Promise<{latitude: number, longitude: number} | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=${country}`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SereniBook/1.0 (contact@serenibook.fr)",
        "Accept-Language": "fr",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur Nominatim: ${response.status}`);
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
    console.error("Erreur avec Nominatim:", error);
    return null;
  }
}

/**
 * Fonction spécialisée pour l'onboarding - teste plusieurs variantes d'adresse
 */
export async function geocodeForOnboarding(data: {
  address: string;
  city: string;
  postalCode: string;
}): Promise<{latitude: number, longitude: number} | null> {
  
  console.log('🚀 Géocodage onboarding pour:', data);
  
  // Construire différentes variantes d'adresse par ordre de précision
  const addressVariants = [
    // 1. Adresse complète
    `${data.address}, ${data.postalCode} ${data.city}, France`,
    // 2. Adresse + ville
    `${data.address}, ${data.city}, France`,
    // 3. Code postal + ville  
    `${data.postalCode} ${data.city}, France`,
    // 4. Ville seule
    `${data.city}, France`,
    // 5. Code postal seul
    `${data.postalCode}, France`
  ];
  
  console.log('📍 Variantes à tester:', addressVariants);
  
  // Tester chaque variante
  for (let i = 0; i < addressVariants.length; i++) {
    const variant = addressVariants[i];
    console.log(`🔎 Test ${i + 1}/${addressVariants.length}: "${variant}"`);
    
    try {
      const coords = await geocodeAddress(variant);
      if (coords) {
        console.log(`✅ Succès avec variante ${i + 1}:`, coords);
        return coords;
      }
    } catch (error) {
      console.warn(`⚠️ Échec variante ${i + 1}:`, error);
    }
    
    // Petit délai entre les tentatives pour respecter les limites d'API
    if (i < addressVariants.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log('❌ Échec de toutes les variantes pour:', data);
  return null;
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