// src/lib/prisma/client.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma

// Export types pour TypeScript
export type { PrismaClient } from '@prisma/client'

// Utility functions pour l'application
export const connectDatabase = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Connexion à la base de données établie')
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error)
    throw error
  }
}

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect()
    console.log('✅ Déconnexion de la base de données')
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error)
  }
}

// Helper pour les transactions - VERSION CORRIGÉE
export const executeTransaction = async <T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(callback)
}

// Helper pour la pagination - VERSION CORRIGÉE
export const paginate = <T>(
  data: T[],
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit
  const take = limit
  
  return {
    data: data.slice(skip, skip + take),
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasNext: skip + take < data.length,
      hasPrev: page > 1
    }
  }
}

// Helper pour les requêtes avec retry
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      console.warn(`Tentative ${attempt} échouée, retry dans ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  
  throw lastError!
}

// Types personnalisés pour l'application
export type DatabaseUser = {
  id: string
  email: string | null
  name: string | null
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN'
  hasProfile: boolean
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export type DatabaseSubscription = {
  id: string
  userId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  plan: 'standard' | 'premium'
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

// Queries communes réutilisables - VERSION CORRIGÉE
export const commonQueries = {
  // Utilisateur avec détails de base (sans relations complexes)
  getUserWithProfile: (userId: string) => 
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        professionalProfile: true,
        clientProfile: true
      }
    }),

  // Abonnements actifs
  getActiveSubscriptions: () =>
    prisma.subscription.findMany({
      where: {
        status: {
          in: ['active', 'trialing']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    }),

  // Statistiques utilisateurs
  getUserStats: async () => {
    const [totalUsers, activeSubscriptions, trialUsers] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({
        where: { status: 'active' }
      }),
      prisma.subscription.count({
        where: { status: 'trialing' }
      })
    ])

    return {
      totalUsers,
      activeSubscriptions,
      trialUsers,
      conversionRate: totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0
    }
  },

  // Récupérer un professionnel avec ses services
  getProfessionalWithServices: (professionalId: string) =>
    prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        services: {
          where: { active: true }
        }
      }
    }),

  // Récupérer les réservations d'un professionnel
  getProfessionalBookings: (professionalId: string, startDate?: Date, endDate?: Date) => {
    const where: any = { professionalId }
    
    if (startDate && endDate) {
      where.startTime = {
        gte: startDate,
        lte: endDate
      }
    }

    return prisma.booking.findMany({
      where,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        service: true
      },
      orderBy: { startTime: 'asc' }
    })
  }
}

// Validation des modèles Prisma
export const validateModel = {
  user: (data: any): data is DatabaseUser => {
    return data && 
           typeof data.id === 'string' &&
           typeof data.email === 'string' &&
           ['CLIENT', 'PROFESSIONAL', 'ADMIN'].includes(data.role) &&
           typeof data.hasProfile === 'boolean'
  },

  subscription: (data: any): data is DatabaseSubscription => {
    return data &&
           typeof data.id === 'string' &&
           typeof data.userId === 'string' &&
           ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'].includes(data.status) &&
           ['standard', 'premium'].includes(data.plan)
  }
}

// Helper pour créer un utilisateur avec profil
export const createUserWithProfile = async (userData: {
  email: string
  name: string
  password: string
  role: 'CLIENT' | 'PROFESSIONAL'
}) => {
  return await executeTransaction(async (tx) => {
    // Créer l'utilisateur
    const user = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.password,
        role: userData.role
      }
    })

    // Créer le profil selon le rôle
    if (userData.role === 'PROFESSIONAL') {
      await tx.professional.create({
        data: {
          userId: user.id,
          type: 'OTHER' // Valeur par défaut
        }
      })
    } else {
      await tx.client.create({
        data: {
          userId: user.id
        }
      })
    }

    return user
  })
}