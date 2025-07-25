// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔧 Création d\'un administrateur SereniBook...')

    // Données de l'administrateur
    const adminData = {
      name: 'Admin SereniBook',
      email: 'admin@serenibook.fr',
      password: 'Admin123!', // Changez ce mot de passe !
      role: 'ADMIN' as const
    }

    console.log('📧 Email:', adminData.email)
    console.log('🔐 Mot de passe:', adminData.password)
    console.log('⚠️  CHANGEZ CE MOT DE PASSE après la première connexion !')

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (existingAdmin) {
      console.log('❌ Un utilisateur avec cet email existe déjà')
      console.log('🔄 Mise à jour des permissions admin...')
      
      // Mettre à jour pour s'assurer qu'il est admin
      const updatedUser = await prisma.user.update({
        where: { email: adminData.email },
        data: {
          role: 'ADMIN',
          hasProfile: true,
          emailVerified: new Date()
        }
      })

      console.log('✅ Utilisateur mis à jour en tant qu\'administrateur')
      console.log(`👤 ID: ${updatedUser.id}`)
      console.log(`📧 Email: ${updatedUser.email}`)
      console.log(`🎭 Rôle: ${updatedUser.role}`)
      return
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(adminData.password, 12)

    // Créer l'administrateur
    const admin = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role,
        hasProfile: true,
        emailVerified: new Date(),
        isFirstVisit: false
      }
    })

    console.log('\n✅ Administrateur créé avec succès !')
    console.log('📋 Détails du compte :')
    console.log(`👤 ID: ${admin.id}`)
    console.log(`👤 Nom: ${admin.name}`)
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🎭 Rôle: ${admin.role}`)
    console.log(`✅ Email vérifié: ${admin.emailVerified ? 'Oui' : 'Non'}`)
    console.log(`✅ Profil complet: ${admin.hasProfile ? 'Oui' : 'Non'}`)

    console.log('\n🚀 Vous pouvez maintenant vous connecter à l\'interface admin :')
    console.log(`🌐 URL: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/connexion`)
    console.log(`📧 Email: ${adminData.email}`)
    console.log(`🔐 Mot de passe: ${adminData.password}`)

    console.log('\n🛡️  Accès admin disponible à :')
    console.log(`📊 Dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`)
    console.log(`👥 Utilisateurs: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/utilisateurs`)
    console.log(`💳 Abonnements: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/demandes-annulation`)

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        console.log('💡 Un utilisateur avec cet email existe peut-être déjà')
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
createAdmin()