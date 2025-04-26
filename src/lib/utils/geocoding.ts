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