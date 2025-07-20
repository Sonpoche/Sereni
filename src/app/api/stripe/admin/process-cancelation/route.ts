// src/app/api/stripe/admin/process-cancelation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import { processCancelationRequest } from '@/lib/stripe'

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin requis' }, { status: 401 })
    }

    const { requestId, action, adminResponse } = await req.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID requis' }, { status: 400 })
    }

    if (!['approve', 'deny', 'resolved'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const request = await processCancelationRequest(requestId, action, adminResponse)

    return NextResponse.json({
      success: true,
      message: `Demande ${action === 'approve' ? 'approuvée' : action === 'deny' ? 'refusée' : 'résolue'}`,
      request: {
        id: request.id,
        status: request.status,
        processedAt: request.processedAt
      }
    })
  } catch (error: any) {
    console.error('Erreur traitement admin:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}