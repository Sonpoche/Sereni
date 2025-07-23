// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import prisma from '@/lib/prisma/client'

// Mode simulation activé si variables Stripe manquantes
const MOCK_MODE = !process.env.STRIPE_SECRET_KEY || 
                  !process.env.STRIPE_STANDARD_PRICE_ID || 
                  !process.env.STRIPE_PREMIUM_PRICE_ID

export async function POST(req: NextRequest) {
  try {
    console.log('🟦 [Stripe Checkout API] Début création session checkout')
    console.log('🎭 [Stripe Checkout API] Mode simulation:', MOCK_MODE ? 'ACTIVÉ' : 'DÉSACTIVÉ')
    
    const session = await auth()
    if (!session?.user) {
      console.log('🔴 [Stripe Checkout API] Utilisateur non connecté')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    console.log('🟦 [Stripe Checkout API] Body reçu:', body)

    const { plan, returnUrl } = body

    // Validation du plan
    if (!plan || !['standard', 'premium'].includes(plan)) {
      console.log('🔴 [Stripe Checkout API] Plan invalide:', plan)
      return NextResponse.json({ error: 'Plan requis (standard ou premium)' }, { status: 400 })
    }

    console.log('🟦 [Stripe Checkout API] Plan sélectionné:', plan)
    console.log('🟦 [Stripe Checkout API] User ID:', session.user.id)

    // Vérifier que l'utilisateur existe en base
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, stripeCustomerId: true }
    })

    if (!user) {
      console.log('🔴 [Stripe Checkout API] Utilisateur non trouvé en base')
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    console.log('🟦 [Stripe Checkout API] Utilisateur trouvé:', user.email)

    // URLs de redirection
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = returnUrl || `${baseUrl}/inscription-reussie?success=true&session_id=sim_{SESSION_ID}&plan=${plan}`

    // 🎭 MODE SIMULATION (par défaut pour l'instant)
    if (MOCK_MODE) {
      console.log('🎭 [Stripe Checkout API] MODE SIMULATION ACTIVÉ')
      console.log('🎭 [Stripe Checkout API] Variables Stripe manquantes - simulation automatique')
      
      // Simuler un délai de traitement réaliste
      console.log('🎭 [Stripe Checkout API] Simulation du processus de paiement...')
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Générer des données simulées
      const mockSessionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const finalSuccessUrl = successUrl.replace('{SESSION_ID}', mockSessionId)
      
      console.log('🎭 [Stripe Checkout API] ✅ Paiement simulé avec succès')
      console.log('🎭 [Stripe Checkout API] Session ID simulée:', mockSessionId)
      console.log('🎭 [Stripe Checkout API] URL de redirection:', finalSuccessUrl)

      return NextResponse.json({ 
        url: finalSuccessUrl,
        sessionId: mockSessionId,
        mock: true,
        plan: plan,
        user: {
          id: user.id,
          email: user.email
        },
        message: `Abonnement ${plan} simulé avec succès`
      })
    }

    // 🚀 MODE RÉEL STRIPE (quand les variables seront configurées)
    console.log('🚀 [Stripe Checkout API] MODE RÉEL STRIPE')
    
    try {
      // Importer Stripe seulement en mode réel
      const { stripe, STRIPE_PLANS } = await import('@/lib/stripe')
      
      if (!stripe) {
        throw new Error('Stripe non initialisé')
      }
      
      // Convertir le plan en priceId
      const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]
      if (!planConfig) {
        console.log('🔴 [Stripe Checkout API] Configuration plan non trouvée:', plan)
        return NextResponse.json({ error: 'Configuration de plan invalide' }, { status: 400 })
      }

      const priceId = planConfig.monthly
      console.log('🟦 [Stripe Checkout API] Price ID récupéré:', priceId)

      if (!priceId || priceId.startsWith('mock_')) {
        console.error('🔴 [Stripe Checkout API] Price ID invalide:', priceId)
        return NextResponse.json({ 
          error: 'Configuration de prix invalide',
          details: process.env.NODE_ENV === 'development' ? 'Price ID manquant ou invalide' : undefined
        }, { status: 500 })
      }

      // Récupérer ou créer le customer Stripe
      let customerId = user.stripeCustomerId

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

      const cancelUrl = `${baseUrl}/inscription-reussie?canceled=true`
      
      console.log('🟦 [Stripe Checkout API] URLs de redirection:')
      console.log('🟦 [Stripe Checkout API] - Success:', successUrl)
      console.log('🟦 [Stripe Checkout API] - Cancel:', cancelUrl)

      // Créer la session de checkout Stripe réelle
      console.log('🟦 [Stripe Checkout API] Création session checkout Stripe...')
      
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: successUrl.replace('{SESSION_ID}', '{CHECKOUT_SESSION_ID}'),
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
        custom_text: {
          submit: {
            message: 'Nous vous contacterons sous 24h pour finaliser votre configuration.'
          }
        }
      })

      console.log('🟦 [Stripe Checkout API] ✅ Session Stripe créée avec succès')
      console.log('🟦 [Stripe Checkout API] Session ID:', checkoutSession.id)
      console.log('🟦 [Stripe Checkout API] URL:', checkoutSession.url)

      return NextResponse.json({ 
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
        mock: false
      })

    } catch (stripeError: any) {
      console.error('🔴 [Stripe Checkout API] Erreur Stripe:', stripeError)
      
      // Si erreur Stripe, fallback sur simulation
      console.log('🎭 [Stripe Checkout API] Fallback vers simulation après erreur Stripe')
      
      const mockSessionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const finalSuccessUrl = successUrl.replace('{SESSION_ID}', mockSessionId)
      
      return NextResponse.json({ 
        url: finalSuccessUrl,
        sessionId: mockSessionId,
        mock: true,
        fallback: true,
        plan: plan,
        message: 'Abonnement traité en mode simulation (erreur Stripe)'
      })
    }

  } catch (error: any) {
    console.error('🔴 [Stripe Checkout API] Erreur générale:', error)
    console.error('🔴 [Stripe Checkout API] Stack:', error.stack)
    
    // Messages d'erreur plus spécifiques
    let errorMessage = 'Erreur lors de la création de la session de paiement'
    
    if (error.message?.includes('prisma') || error.message?.includes('database')) {
      errorMessage = 'Erreur de base de données'
    } else if (error.message?.includes('auth') || error.message?.includes('session')) {
      errorMessage = 'Erreur d\'authentification'
    } else if (MOCK_MODE) {
      errorMessage = 'Erreur dans la simulation de paiement'
    }

    return NextResponse.json({ 
      error: errorMessage,
      mockMode: MOCK_MODE,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        mockMode: MOCK_MODE
      } : undefined
    }, { status: 500 })
  }
}