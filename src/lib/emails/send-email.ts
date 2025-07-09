// src/lib/email/send-email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailData {
  to: string
  subject: string
  template: 'course-cancellation' | 'session-cancellation'
  data: {
    participantName: string
    courseName: string
    professionalName: string
    sessionDate: string
    reason: string
    contactEmail: string
    sessionLocation?: string
    emailSignature?: string
  }
}

export async function sendEmail({ to, subject, template, data }: EmailData) {
  try {
    console.log(`📧 Envoi email à ${to}: ${subject}`)
    
    let htmlContent = ''
    
    if (template === 'course-cancellation') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .title { color: #dc3545; font-size: 24px; margin: 0; }
            .content { background: white; padding: 20px; border-radius: 8px; }
            .course-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
            .contact { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">🚫 Annulation de cours collectif</h1>
            </div>
            
            <div class="content">
              <p>Bonjour <strong>${data.participantName}</strong>,</p>
              
              <p>Nous regrettons de vous informer que le cours collectif suivant a été annulé :</p>
              
              <div class="course-info">
                <p><strong>Cours :</strong> ${data.courseName}</p>
                <p><strong>Date :</strong> ${data.sessionDate}</p>
                <p><strong>Professionnel :</strong> ${data.professionalName}</p>
              </div>
              
              <p><strong>Raison :</strong> ${data.reason}</p>
              
              <div class="contact">
                <p><strong>Contact :</strong></p>
                <p>Si vous avez des questions ou souhaitez reprogrammer une séance, 
                n'hésitez pas à contacter directement ${data.professionalName} à l'adresse : 
                <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>
              </div>
              
              <p>Nous nous excusons pour le désagrément occasionné.</p>
              
              <div class="footer">
                ${data.emailSignature ? 
                  `<p style="white-space: pre-line;">${data.emailSignature}</p>` : 
                  `<p>Cordialement,<br>L'équipe Mon Agenda Bien-être</p>`
                }
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (template === 'session-cancellation') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .title { color: #f57c00; font-size: 24px; margin: 0; }
            .content { background: white; padding: 20px; border-radius: 8px; }
            .session-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
            .contact { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">⚠️ Annulation de séance</h1>
            </div>
            
            <div class="content">
              <p>Bonjour <strong>${data.participantName}</strong>,</p>
              
              <p>Nous regrettons de vous informer que la séance suivante a été annulée :</p>
              
              <div class="session-info">
                <p><strong>Cours :</strong> ${data.courseName}</p>
                <p><strong>Date :</strong> ${data.sessionDate}</p>
                <p><strong>Lieu :</strong> ${data.sessionLocation || 'Non spécifié'}</p>
                <p><strong>Professionnel :</strong> ${data.professionalName}</p>
              </div>
              
              <p><strong>Raison :</strong> ${data.reason}</p>
              
              <div class="contact">
                <p><strong>Contact :</strong></p>
                <p>Si vous avez des questions ou souhaitez reprogrammer une séance, 
                n'hésitez pas à contacter directement ${data.professionalName} à l'adresse : 
                <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>
              </div>
              
              <p>Nous nous excusons pour le désagrément occasionné.</p>
              
              <div class="footer">
                ${data.emailSignature ? 
                  `<p style="white-space: pre-line;">${data.emailSignature}</p>` : 
                  `<p>Cordialement,<br>L'équipe Mon Agenda Bien-être</p>`
                }
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
    
    const result = await resend.emails.send({
      from: 'Mon Agenda Bien-être <noreply@votre-domaine.com>',
      to: [to],
      subject: subject,
      html: htmlContent,
    })
    
    console.log('✅ Email envoyé avec succès:', result.data?.id)
    return result
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    throw error
  }
}