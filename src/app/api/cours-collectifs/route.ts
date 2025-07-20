// src/app/api/cours-collectifs/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma/client"
import { geocodeAddress } from "@/lib/utils/geocoding"

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
    console.log(`🔄 Géocodage pour professionnel: ${professional.user?.name || 'Inconnu'} (${professional.city || 'ville inconnue'})`);
    
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
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const onlineOnly = searchParams.get('online') === 'true'
    
    // NOUVEAUX PARAMÈTRES pour la géolocalisation
    const userLat = searchParams.get('lat')
    const userLng = searchParams.get('lng')
    const maxDistance = parseFloat(searchParams.get('distance') || '50')

    console.log(`🔍 Recherche cours collectifs - Filtres:`, {
      search,
      category,
      level,
      onlineOnly,
      userLat,
      userLng,
      maxDistance
    });

    // Construction des filtres (ton système existant)
    const filters: any = {
      active: true
    }

    if (category) {
      filters.category = category
    }

    if (level) {
      filters.level = level
    }

    if (onlineOnly) {
      filters.isOnline = true
    }

    // Récupérer tous les cours collectifs actifs (ton système existant)
    const groupClasses = await prisma.groupClass.findMany({
      where: filters,
      include: {
        professional: {
          include: {
            user: {
              select: { 
                name: true 
              }
            }
          }
        },
        sessions: {
          where: {
            startTime: { gte: new Date() },
            status: "SCHEDULED"
          },
          orderBy: { startTime: 'asc' },
          take: 3,
          include: {
            registrations: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`🔍 Nombre total de cours trouvés avant tri: ${groupClasses.length}`);

    // Convertir les objets Decimal en nombres (ton système existant)
    let serializedClasses = groupClasses.map(course => ({
      ...course,
      price: Number(course.price), // Conversion Decimal -> Number
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      sessions: course.sessions.map(session => ({
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString()
      }))
    }))

    // Filtrer par recherche textuelle si nécessaire (ton système existant)
    if (search) {
      const searchLower = search.toLowerCase()
      serializedClasses = serializedClasses.filter(course => 
        course.name.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        // Vérifier que name n'est pas null
        (course.professional.user.name && course.professional.user.name.toLowerCase().includes(searchLower)) ||
        course.city?.toLowerCase().includes(searchLower)
      )
    }

    // NOUVEAU : Si l'utilisateur a fourni sa position, trier par proximité
    if (userLat && userLng) {
      const latitude = parseFloat(userLat);
      const longitude = parseFloat(userLng);
      
      console.log(`📍 Position utilisateur: ${latitude}, ${longitude} - Distance max: ${maxDistance}km`);
      
      // Ajouter le géocodage automatique pour les professionnels sans coordonnées
      const updatedClasses = [];
      for (const course of serializedClasses) {
        const updatedProfessional = await ensureCoordinates(course.professional);
        updatedClasses.push({
          ...course,
          professional: updatedProfessional
        });
      }
      
      // Filtrer les cours par distance et ajouter la distance
      const classesWithDistance = updatedClasses
        .map(course => {
          // Pour les cours en ligne, pas de filtre de distance
          if (course.isOnline) {
            return {
              ...course,
              distance: 0 // Distance virtuelle pour les cours en ligne
            };
          }
          
          // Si les coordonnées du professionnel ne sont pas définies, on l'ignore
          if (course.professional.latitude === null || course.professional.longitude === null) {
            console.log(`⚠️ Cours sans coordonnées: ${course.name} (${course.professional.user?.name})`);
            return null;
          }
          
          const distance = calculateDistance(
            latitude, 
            longitude, 
            course.professional.latitude, 
            course.professional.longitude
          );
          
          // Si la distance est inférieure à la distance maximale demandée
          if (distance <= maxDistance) {
            return {
              ...course,
              distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
            };
          }
          return null;
        })
        .filter(Boolean) // Éliminer les null
        .sort((a, b) => a!.distance - b!.distance); // Trier par distance croissante
      
      serializedClasses = classesWithDistance as any[];
      console.log(`✅ Cours filtrés et triés par distance: ${serializedClasses.length}`);
    } else {
      // NOUVEAU : Pas de géolocalisation, mélanger aléatoirement pour l'équité
      serializedClasses = serializedClasses
        .map(course => ({
          ...course,
          distance: null // Pas de distance calculée
        }))
        .sort(() => Math.random() - 0.5); // Mélange aléatoire équitable
      
      console.log(`🎲 Cours mélangés aléatoirement pour l'équité: ${serializedClasses.length}`);
    }

    return NextResponse.json(serializedClasses)

  } catch (error) {
    console.error("Erreur lors de la récupération des cours collectifs:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}