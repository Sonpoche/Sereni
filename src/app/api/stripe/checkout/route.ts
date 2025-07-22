// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import prisma from '@/lib/prisma/client'

export async function POST(req: NextRequest) {
  try {
    console.log('🟦 [Stripe Checkout API] Début création session checkout')
    
    const session = await auth()
    if (!session?.user) {
      console.log('🔴 [Stripe Checkout API] Utilisateur non connecté')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    console.log('🟦 [Stripe Checkout API] Body reçu:', body)

    // 🔧 CORRECTION: Récupérer le plan au lieu du priceId
    const { plan, returnUrl } = body

    // Validation du plan
    if (!plan || !['standard', 'premium'].includes(plan)) {
      console.log('🔴 [Stripe Checkout API] Plan invalide:', plan)
      return NextResponse.json({ error: 'Plan requis (standard ou premium)' }, { status: 400 })
    }

    console.log('🟦 [Stripe Checkout API] Plan sélectionné:', plan)
    console.log('🟦 [Stripe Checkout API] User ID:', session.user.id)

    // 🔧 CORRECTION: Convertir le plan en priceId
    const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]
    if (!planConfig) {
      console.log('🔴 [Stripe Checkout API] Configuration plan non trouvée:', plan)
      return NextResponse.json({ error: 'Configuration de plan invalide' }, { status: 400 })
    }

    const priceId = planConfig.monthly
    console.log('🟦 [Stripe Checkout API] Price ID récupéré:', priceId)

    if (!priceId) {
      console.log('🔴 [Stripe Checkout API] Price ID non trouvé pour plan:', plan)
      return NextResponse.json({ error: 'Configuration de prix invalide' }, { status: 400 })
    }

    // Récupérer ou créer le customer Stripe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true, name: true }
    })

    if (!user) {
      console.log('🔴 [Stripe Checkout API] Utilisateur non trouvé en base')
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    console.log('🟦 [Stripe Checkout API] Utilisateur trouvé:', user.email)

    let customerId = user.stripeCustomerId

    // Créer le customer Stripe s'il n'existe pas
    if (!customerId) {
      console.log('🟦 [Stripe Checkout API] Création customer Stripe...')
      
      const stripeCustomer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: { 
          userId: session.user.id,
          source: 'serenibook_registration',
          plan: plan
        }
      })
      
      customerId = stripeCustomer.id
      console.log('🟦 [Stripe Checkout API] Customer créé:', customerId)

      // Sauvegarder le customer ID en base
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId }
      })
      
      console.log('🟦 [Stripe Checkout API] Customer ID sauvegardé en base')
    }

    // URLs de redirection
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = returnUrl || `${baseUrl}/inscription-reussie?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/finaliser-abonnement?canceled=true`
    
    console.log('🟦 [Stripe Checkout API] URLs de redirection:')
    console.log('🟦 [Stripe Checkout API] - Success:', successUrl)
    console.log('🟦 [Stripe Checkout API] - Cancel:', cancelUrl)

    // Créer la session de checkout
    console.log('🟦 [Stripe Checkout API] Création session checkout...')
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { 
        userId: session.user.id,
        plan: plan,
        source: 'serenibook_registration'
      },
      subscription_data: {
        metadata: { 
          userId: session.user.id,
          plan: plan,
          source: 'serenibook_registration'
        }
      },
      // Ajouter des informations sur la facturation
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Abonnement SereniBook - Plan ${planConfig.name}`,
          metadata: {
            userId: session.user.id,
            plan: plan,
            userEmail: user.email
          }
        }
      },
      // Personnaliser l'expérience checkout
      custom_text: {
        submit: {
          message: 'Nous vous contacterons sous 24h pour finaliser votre configuration.'
        }
      }
    })

    console.log('🟦 [Stripe Checkout API] ✅ Session créée avec succès')
    console.log('🟦 [Stripe Checkout API] Session ID:', checkoutSession.id)
    console.log('🟦 [Stripe Checkout API] URL:', checkoutSession.url)

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    })

  } catch (error: any) {
    console.error('🔴 [Stripe Checkout API] Erreur:', error)
    
    // Log détaillé pour debug
    if (error.type) {
      console.error('🔴 [Stripe Checkout API] Type erreur Stripe:', error.type)
      console.error('🔴 [Stripe Checkout API] Code erreur:', error.code)
      console.error('🔴 [Stripe Checkout API] Message:', error.message)
    }

    // Messages d'erreur plus spécifiques selon le type d'erreur
    let errorMessage = 'Erreur lors de la création de la session de paiement'
    
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Configuration de paiement invalide'
    } else if (error.code === 'resource_missing') {
      errorMessage = 'Configuration Stripe incomplète - contactez le support'
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}