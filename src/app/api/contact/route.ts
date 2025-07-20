// src/app/api/contact/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Veuillez sélectionner un sujet"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  userType: z.string().min(1, "Veuillez préciser votre profil")
})

const subjectLabels: Record<string, string> = {
  support: "Support technique",
  billing: "Facturation et abonnement",
  features: "Demande de fonctionnalité",
  partnership: "Partenariat",
  press: "Presse et médias",
  other: "Autre"
}

const userTypeLabels: Record<string, string> = {
  professional: "Professionnel du bien-être",
  client: "Client particulier",
  prospect: "Prospect (future inscription)",
  partner: "Partenaire potentiel",
  press: "Journaliste/Média"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // Email pour l'équipe SereniBook
    const adminEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0;">Nouveau message de contact</h2>
          <p style="color: #64748b; margin: 5px 0 0 0;">Reçu depuis le formulaire de contact</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="color: #1e293b; margin-top: 0;">Informations de contact</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Nom:</td>
              <td style="padding: 8px 0; color: #1e293b;">${validatedData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
              <td style="padding: 8px 0; color: #1e293b;">
                <a href="mailto:${validatedData.email}" style="color: #3b82f6;">${validatedData.email}</a>
              </td>
            </tr>
            ${validatedData.phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Téléphone:</td>
              <td style="padding: 8px 0; color: #1e293b;">${validatedData.phone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Profil:</td>
              <td style="padding: 8px 0; color: #1e293b;">${userTypeLabels[validatedData.userType] || validatedData.userType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Sujet:</td>
              <td style="padding: 8px 0; color: #1e293b;">${subjectLabels[validatedData.subject] || validatedData.subject}</td>
            </tr>
          </table>
          
          <h3 style="color: #1e293b; margin-top: 30px; margin-bottom: 10px;">Message</h3>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${validatedData.message}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Action recommandée:</strong> 
              ${validatedData.subject === 'support' ? 'Répondre sous 24h maximum (support technique)' :
                validatedData.subject === 'billing' ? 'Répondre sous 4h (question commerciale)' :
                validatedData.subject === 'partnership' || validatedData.subject === 'press' ? 'Transférer à la direction' :
                'Répondre selon la priorité standard'}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
          <p>Email envoyé automatiquement depuis SereniBook</p>
        </div>
      </div>
    `

    // Email de confirmation pour l'utilisateur
    const userEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #7c3aed; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SereniBook</h1>
          <p style="color: #e4d4f4; margin: 10px 0 0 0;">Merci pour votre message</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${validatedData.name},</h2>
          
          <p style="color: #374151; line-height: 1.6;">
            Nous avons bien reçu votre message concernant "<strong>${subjectLabels[validatedData.subject] || validatedData.subject}</strong>" 
            et vous remercions de nous avoir contactés.
          </p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 16px;">⏱️ Temps de réponse estimé</h3>
            <p style="color: #0c4a6e; margin: 0;">
              ${validatedData.subject === 'support' ? 'Notre équipe technique vous répondra sous 24h maximum.' :
                validatedData.subject === 'billing' ? 'Notre service commercial vous répondra sous 4h.' :
                validatedData.subject === 'partnership' || validatedData.subject === 'press' ? 'Votre demande sera traitée en priorité par notre direction.' :
                'Nous vous répondrons dans les meilleurs délais.'}
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            En attendant, n'hésitez pas à consulter notre 
            <a href="${process.env.NEXTAUTH_URL}/tarifs" style="color: #7c3aed;">page tarifs</a> 
            ou à découvrir nos fonctionnalités sur notre 
            <a href="${process.env.NEXTAUTH_URL}" style="color: #7c3aed;">site web</a>.
          </p>
          
          <p style="color: #374151; line-height: 1.6;">
            À très bientôt,<br/>
            <strong>L'équipe SereniBook</strong>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.<br/>
              Pour toute question, contactez-nous à <a href="mailto:support@serenibook.fr" style="color: #7c3aed;">support@serenibook.fr</a>
            </p>
          </div>
        </div>
      </div>
    `

    // Envoyer l'email à l'équipe
    await resend.emails.send({
      from: 'SereniBook Contact <onboarding@resend.dev>',
      to: ['contact@serenibook.fr'], // Remplace par ton vrai email
      subject: `[Contact] ${subjectLabels[validatedData.subject]} - ${validatedData.name}`,
      html: adminEmailContent,
      reply_to: validatedData.email
    })

    // Envoyer l'email de confirmation à l'utilisateur
    await resend.emails.send({
      from: 'SereniBook <onboarding@resend.dev>',
      to: validatedData.email,
      subject: 'Votre message a été reçu - SereniBook',
      html: userEmailContent
    })

    // Log pour le monitoring
    console.log(`📧 Nouveau message de contact reçu:`, {
      from: validatedData.email,
      subject: validatedData.subject,
      userType: validatedData.userType,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      message: "Message envoyé avec succès" 
    })

  } catch (error) {
    console.error("Erreur lors de l'envoi du message de contact:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}