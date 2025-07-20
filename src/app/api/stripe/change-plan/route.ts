// src/app/api/stripe/change-plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.config'
import { changePlan } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { plan } = await req.json()

    if (!['standard', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    await changePlan(session.user.id, plan)

    return NextResponse.json({
      success: true,
      message: `Plan changé vers ${plan}`
    })
  } catch (error: any) {
    console.error('Erreur changement plan:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}