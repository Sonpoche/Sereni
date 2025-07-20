// src/app/api/stripe/cancel-request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import { createCancelationRequest } from '@/lib/stripe'
import prisma from '@/lib/prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { reason, feedback, contactPreference } = await req.json()

    if (!reason) {
      return NextResponse.json({ error: 'Raison requise' }, { status: 400 })
    }

    const request = await createCancelationRequest({
      userId: session.user.id,
      reason,
      feedback,
      contactPreference
    })

    return NextResponse.json({
      success: true,
      message: 'Votre demande a été transmise. Nous vous contacterons sous 24h.',
      requestId: request.id,
      contactInfo: {
        email: 'support@serenibook.fr',
        phone: '+33 1 23 45 67 89',
        hours: 'Lundi-Vendredi 9h-18h'
      }
    })
  } catch (error: any) {
    console.error('Erreur demande annulation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const requests = await prisma.cancelationRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: 'desc' },
      take: 5
    })

    return NextResponse.json({
      requests: requests.map(request => ({
        id: request.id,
        reason: request.reason,
        status: request.status,
        requestedAt: request.requestedAt,
        processedAt: request.processedAt,
        adminResponse: request.adminResponse
      }))
    })
  } catch (error: any) {
    console.error('Erreur récupération demandes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}