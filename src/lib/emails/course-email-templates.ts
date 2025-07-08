// src/lib/emails/course-email-templates.ts

export const CourseEmailTemplates = {
  courseRegistrationConfirmation: ({
    clientName,
    courseName,
    professionalName,
    date,
    time,
    isOnline,
    address,
    city,
    equipment
  }: {
    clientName: string
    courseName: string
    professionalName: string
    date: string
    time: string
    isOnline: boolean
    address?: string
    city?: string
    equipment?: string[]
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inscription confirmée</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
            .equipment-list { background: #e6f7ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Inscription confirmée</h1>
            </div>
            <div class="content">
                <p>Bonjour ${clientName},</p>
                
                <p>Excellente nouvelle ! Votre inscription au cours <strong>"${courseName}"</strong> avec ${professionalName} a été confirmée.</p>
                
                <div class="info-box">
                    <h3>📅 Détails de votre cours</h3>
                    <p><strong>Date :</strong> ${date}</p>
                    <p><strong>Heure :</strong> ${time}</p>
                    <p><strong>Cours :</strong> ${courseName}</p>
                    <p><strong>Praticien :</strong> ${professionalName}</p>
                    
                    ${isOnline ? `
                        <p><strong>📱 Format :</strong> Cours en ligne</p>
                        <p><em>Le lien de connexion vous sera envoyé 30 minutes avant le début du cours.</em></p>
                    ` : `
                        <p><strong>📍 Lieu :</strong></p>
                        ${address ? `<p>${address}</p>` : ''}
                        ${city ? `<p>${city}</p>` : ''}
                        <p><em>Merci d'arriver 10 minutes avant le début du cours.</em></p>
                    `}
                </div>
                
                ${equipment && equipment.length > 0 ? `
                    <div class="equipment-list">
                        <h3>🎒 Matériel recommandé</h3>
                        <ul>
                            ${equipment.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <p>Si vous avez des questions ou si vous devez annuler votre inscription, n'hésitez pas à contacter directement ${professionalName}.</p>
                
                <p>Nous vous souhaitons une excellente séance !</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}/mes-inscriptions" class="button">
                        Voir mes inscriptions
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p>Cet email vous a été envoyé par <strong>SereniBook</strong></p>
                <p><a href="${process.env.NEXTAUTH_URL}">Retourner sur SereniBook</a></p>
            </div>
        </div>
    </body>
    </html>
  `,

  courseRegistrationCancelled: ({
    clientName,
    courseName,
    professionalName,
    date,
    time,
    reason
  }: {
    clientName: string
    courseName: string
    professionalName: string
    date: string
    time: string
    reason: string
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inscription annulée</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Inscription annulée</h1>
            </div>
            <div class="content">
                <p>Bonjour ${clientName},</p>
                
                <p>Nous sommes désolés de vous informer que votre inscription au cours <strong>"${courseName}"</strong> avec ${professionalName} a été annulée.</p>
                
                <div class="info-box">
                    <h3>📅 Cours annulé</h3>
                    <p><strong>Date :</strong> ${date}</p>
                    <p><strong>Heure :</strong> ${time}</p>
                    <p><strong>Cours :</strong> ${courseName}</p>
                    <p><strong>Praticien :</strong> ${professionalName}</p>
                    <p><strong>Motif :</strong> ${reason}</p>
                </div>
                
                <p>Si vous aviez effectué un paiement, vous serez remboursé dans les plus brefs délais.</p>
                
                <p>Nous vous invitons à consulter les autres créneaux disponibles pour ce cours ou à explorer d'autres activités qui pourraient vous intéresser.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}/cours-collectifs" class="button">
                        Voir d'autres cours
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p>Cet email vous a été envoyé par <strong>SereniBook</strong></p>
                <p><a href="${process.env.NEXTAUTH_URL}">Retourner sur SereniBook</a></p>
            </div>
        </div>
    </body>
    </html>
  `
}