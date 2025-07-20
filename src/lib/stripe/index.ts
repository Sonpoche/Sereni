// src/lib/stripe/index.ts
import Stripe from 'stripe'
import prisma from '@/lib/prisma/client'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

// Configuration des plans
export const STRIPE_PLANS = {
  standard: {
    monthly: process.env.STRIPE_STANDARD_PRICE_ID!,
    name: 'Standard',
    price: 20,
    features: [
      'Réservations illimitées',
      'Gestion des clients',
      'Jusqu\'à 10 services',
      'Cours collectifs',
      'Notifications email',
      'Application mobile',
      'Support email (48h)'
    ]
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_PRICE_ID!,
    name: 'Premium',  
    price: 40,
    features: [
      'Tout du plan Standard',
      'Services illimités',
      'Site web personnalisé',
      'Notifications SMS',
      'Analyses avancées',
      'Marketing automation',
      'Support prioritaire (24h)',
      'Personnalisation avancée'
    ]
  }
} as const

export type StripePlan = keyof typeof STRIPE_PLANS

// ==================== FONCTIONS UTILITAIRES ====================

export function getPlanFromPriceId(priceId: string): 'standard' | 'premium' {
  return priceId === process.env.STRIPE_PREMIUM_PRICE_ID ? 'premium' : 'standard'
}

export function getPlanConfig(plan: StripePlan) {
  return STRIPE_PLANS[plan]
}

// ==================== GESTION DES ABONNEMENTS ====================

export async function createCheckoutSession({
  userId,
  priceId,
  successUrl,
  cancelUrl
}: {
  userId: string
  priceId: string
  successUrl?: string
  cancelUrl?: string
}) {
  try {
    // Récupérer ou créer le customer Stripe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true }
    })

    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }

    let customerId = user.stripeCustomerId

    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: { userId }
      })
      
      customerId = stripeCustomer.id

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      })
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/parametres/abonnement?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/parametres/abonnement?canceled=true`,
      allow_promotion_codes: true,
      metadata: { userId },
      subscription_data: {
        // SUPPRIMÉ: trial_period_days: 14,
        metadata: { userId }
      }
    })

    return session
  } catch (error) {
    console.error('Erreur création session checkout:', error)
    throw error
  }
}

export async function getSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { user: { select: { email: true, name: true } } }
    })

    if (!subscription?.stripeSubscriptionId) {
      return { subscription: null, stripeData: null }
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
      { expand: ['latest_invoice', 'customer'] }
    )

    return {
      subscription,
      stripeData: stripeSubscription
    }
  } catch (error) {
    console.error('Erreur récupération abonnement:', error)
    return { subscription: null, stripeData: null }
  }
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { subscription } = await getSubscription(userId)
  return subscription?.status === 'active'
}

export async function getUserPlan(userId: string): Promise<'free' | 'standard' | 'premium'> {
  const { subscription } = await getSubscription(userId)
  
  if (!subscription || subscription.status !== 'active') {
    return 'free'
  }
  
  return subscription.plan
}

export async function changePlan(userId: string, newPlan: 'standard' | 'premium') {
  try {
    const { subscription } = await getSubscription(userId)
    
    if (!subscription?.stripeSubscriptionId) {
      throw new Error('Aucun abonnement trouvé')
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
    const newPriceId = STRIPE_PLANS[newPlan].monthly

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    })

    await prisma.subscription.update({
      where: { userId },
      data: { plan: newPlan }
    })

    return { success: true }
  } catch (error) {
    console.error('Erreur changement de plan:', error)
    throw error
  }
}

// ==================== DEMANDES D'ANNULATION ====================

export async function createCancelationRequest({
  userId,
  reason,
  feedback,
  contactPreference = 'email'
}: {
  userId: string
  reason: string
  feedback?: string
  contactPreference?: string
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user?.subscription) {
      throw new Error('Aucun abonnement trouvé')
    }

    const request = await prisma.cancelationRequest.create({
      data: {
        userId,
        subscriptionId: user.subscription.id,
        reason,
        feedback,
        contactPreference,
        status: 'pending'
      }
    })

    // Envoyer notifications
    await sendCancelationNotifications(request.id)

    return request
  } catch (error) {
    console.error('Erreur création demande annulation:', error)
    throw error
  }
}

export async function processCancelationRequest(
  requestId: string, 
  action: 'approve' | 'deny' | 'resolved',
  adminResponse?: string
) {
  try {
    const request = await prisma.cancelationRequest.update({
      where: { id: requestId },
      data: {
        status: action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : 'resolved',
        processedAt: new Date(),
        adminResponse
      },
      include: {
        user: true,
        subscription: true
      }
    })

    // Si approuvé, annuler l'abonnement Stripe
    if (action === 'approve' && request.subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(request.subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      })

      await prisma.subscription.update({
        where: { id: request.subscription.id },
        data: { cancelAtPeriodEnd: true }
      })
    }

    // Envoyer notification au client
    await sendProcessingNotification(request.id, action, adminResponse)

    return request
  } catch (error) {
    console.error('Erreur traitement demande:', error)
    throw error
  }
}

// ==================== NOTIFICATIONS ====================

async function sendCancelationNotifications(requestId: string) {
  try {
    const request = await prisma.cancelationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        subscription: true
      }
    })

    if (!request) return

    // Email au support (console.log pour maintenant)
    console.log(`
📧 EMAIL SUPPORT - Nouvelle demande d'annulation:

👤 Client: ${request.user.name || 'Non renseigné'} (${request.user.email})
📋 Plan: ${request.subscription.plan.toUpperCase()}
📞 Contact: ${request.contactPreference}

❌ Raison: ${request.reason}

💬 Commentaires:
${request.feedback || 'Aucun commentaire'}

🔗 ID: ${request.id}
🔗 Traiter: ${process.env.NEXTAUTH_URL}/admin/cancelations/${request.id}
    `)

    // Email de confirmation au client (console.log pour maintenant)
    console.log(`
📧 EMAIL CLIENT - Confirmation demande d'annulation:

À: ${request.user.email}
Sujet: Votre demande d'annulation SereniBook

Bonjour ${request.user.name || ''},

Nous avons bien reçu votre demande d'annulation.

🎯 Prochaines étapes:
• Notre équipe vous contactera sous 24h
• Nous discuterons de votre situation
• Nous chercherons des solutions ensemble

📞 Contact direct:
• Email: support@serenibook.fr
• Téléphone: +33 1 23 45 67 89

Référence: ${request.id}

L'équipe SereniBook
    `)

  } catch (error) {
    console.error('Erreur envoi notifications:', error)
  }
}

async function sendProcessingNotification(requestId: string, action: string, adminResponse?: string) {
  console.log(`📧 Notification traitement: ${requestId} - ${action}`)
  if (adminResponse) {
    console.log(`💬 Réponse admin: ${adminResponse}`)
  }
}

// ==================== WEBHOOKS ====================

export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Événement non géré: ${event.type}`)
    }
  } catch (error) {
    console.error('Erreur traitement webhook:', error)
    throw error
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) return

  const plan = getPlanFromPriceId(subscription.items.data[0]?.price.id)

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status as any,
      plan,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    },
    update: {
      status: subscription.status as any,
      plan,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    }
  })

  console.log(`✅ Abonnement mis à jour - User: ${userId}, Plan: ${plan}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) return

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'canceled',
      cancelAtPeriodEnd: true
    }
  })

  console.log(`❌ Abonnement supprimé - User: ${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionChange(subscription)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (user) {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status: 'past_due' }
    })
    
    console.log(`💳 Paiement échoué - User: ${user.id}`)
  }
}