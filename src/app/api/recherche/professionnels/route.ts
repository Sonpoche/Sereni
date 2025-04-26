// src/app/api/recherche/professionnels/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";
import { geocodeAddress } from "@/lib/utils/geocoding";

// Fonction pour calculer la distance entre deux coordonnées (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance en km
  return distance;
}

// Fonction pour s'assurer que le professionnel a des coordonnées
async function ensureCoordinates(professional: any): Promise<any> {
  // Si le professionnel a déjà des coordonnées, on les utilise
  if (professional.latitude !== null && professional.longitude !== null) {
    return professional;
  }
  
  try {
    console.log(`🔄 Tentative de géocodage pour: ${professional.user?.name || 'Professionnel'} (${professional.city || 'ville inconnue'})`);
    
    // Vérifier que la ville est présente
    if (!professional.city) {
      console.log(`⚠️ Ville manquante pour: ${professional.user?.name || 'Professionnel'}`);
      return professional;
    }
    
    // Géocoder seulement la ville et le code postal
    const cityQuery = `${professional.city}, ${professional.postalCode || ''} France`;
    
    // Géocoder l'adresse
    const coords = await geocodeAddress(cityQuery);
    
    if (coords) {
      console.log(`✅ Géocodage réussi pour: ${professional.user?.name} (${professional.city}) - Coords: ${coords.latitude}, ${coords.longitude}`);
      
      // Mettre à jour le professionnel dans la base de données
      await prisma.professional.update({
        where: { id: professional.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
      });
      
      // Retourner le professionnel avec ses nouvelles coordonnées
      return {
        ...professional,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    } else {
      console.log(`❌ Géocodage échoué pour la ville: ${professional.city}`);
    }
  } catch (error) {
    console.error(`🔴 Erreur lors du géocodage pour ${professional.user?.name}:`, error);
  }
  
  // Si le géocodage a échoué, on retourne le professionnel inchangé
  return professional;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Récupérer les paramètres de recherche
    const latitude = parseFloat(searchParams.get('lat') || '0');
    const longitude = parseFloat(searchParams.get('lng') || '0');
    const maxDistance = parseFloat(searchParams.get('distance') || '50'); // Par défaut 50km
    const specialite = searchParams.get('specialite');
    const debug = searchParams.get('debug') === 'true'; // Paramètre pour le débogage
    const location = searchParams.get('location') || ''; // Position recherchée
    
    console.log(`📍 Recherche près de: ${location} (${latitude}, ${longitude}) - Distance max: ${maxDistance}km`);
    
    // Vérifier si les coordonnées sont valides
    if (latitude === 0 && longitude === 0) {
      return NextResponse.json(
        { error: "Coordonnées de localisation invalides" },
        { status: 400 }
      );
    }
    
    // Récupérer tous les professionnels
    const professionals = await prisma.professional.findMany({
      where: {
        // Filtrer par spécialité si spécifiée et différente de "all"
        ...(specialite && specialite !== "all" ? { 
          type: specialite as any 
        } : {}),
        // Ne sélectionner que les profils actifs qui ont complété leur inscription
        user: {
          hasProfile: true,
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        services: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          }
        },
      }
    });
    
    console.log(`🔍 Nombre total de professionnels trouvés: ${professionals.length}`);
    
    // Ajouter le géocodage automatique pour les professionnels sans coordonnées
    const updatedProfessionals = [];
    for (const professional of professionals) {
      const updatedProfessional = await ensureCoordinates(professional);
      updatedProfessionals.push(updatedProfessional);
    }
    
    // Pour le débogage, retourner tous les professionnels avec leurs coordonnées
    if (debug) {
      return NextResponse.json({
        searchParams: {
          latitude,
          longitude,
          maxDistance,
          specialite,
          location
        },
        professionals: updatedProfessionals.map(p => ({
          id: p.id,
          userId: p.user?.id,
          name: p.user?.name,
          city: p.city,
          postalCode: p.postalCode,
          latitude: p.latitude,
          longitude: p.longitude,
          hasCoordinates: p.latitude !== null && p.longitude !== null
        }))
      });
    }
    
    // Filtrer les professionnels par distance et ajouter la distance
    const filteredProfessionals = updatedProfessionals
      .map(professional => {
        // Si les coordonnées ne sont pas définies, on ignore ce professionnel
        if (professional.latitude === null || professional.longitude === null) {
          console.log(`⚠️ Professionnel sans coordonnées: ${professional.user?.name} (${professional.city})`);
          return null;
        }
        
        const distance = calculateDistance(
          latitude, 
          longitude, 
          professional.latitude, 
          professional.longitude
        );
        
        // Si la distance est inférieure à la distance maximale demandée
        if (distance <= maxDistance) {
          return {
            ...professional,
            distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
          };
        }
        return null;
      })
      .filter(Boolean) // Éliminer les null
      .sort((a, b) => a!.distance - b!.distance); // Trier par distance croissante
    
    console.log(`✅ Professionnels filtrés par distance: ${filteredProfessionals.length}`);
    
    return NextResponse.json(filteredProfessionals);
  } catch (error) {
    console.error("Erreur dans GET /api/recherche/professionnels:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}