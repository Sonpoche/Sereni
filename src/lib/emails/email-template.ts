// src/lib/emails/email-template.ts
export const EmailTemplates = {
  verificationEmail: ({ name, url }: { name: string, url: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      <p>Bonjour ${name},</p>
      <p>Merci de vous être inscrit sur <strong>SereniBook</strong>. Pour finaliser votre inscription, veuillez vérifier votre adresse e-mail en cliquant sur le lien ci-dessous :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Vérifier mon email</a>
      </div>
      <p>Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet e-mail.</p>
      <p>Ce lien est valable pendant 24 heures.</p>
      <p>À bientôt,<br>L'équipe SereniBook</p>
    </div>
  `,
  
  resetPasswordEmail: ({ name, url }: { name: string, url: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      <p>Bonjour ${name},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Réinitialiser mon mot de passe</a>
      </div>
      <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.</p>
      <p>Ce lien est valable pendant 1 heure.</p>
      <p>À bientôt,<br>L'équipe SereniBook</p>
    </div>
  `,
  
  appointmentConfirmation: ({ clientName, serviceName, date, time, professionalName }: { clientName: string, serviceName: string, date: string, time: string, professionalName: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      <p>Bonjour ${clientName},</p>
      <p>Votre rendez-vous a été confirmé avec <strong>${professionalName}</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Service :</strong> ${serviceName}</p>
        <p style="margin: 5px 0;"><strong>Date :</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Heure :</strong> ${time}</p>
      </div>
      <p>Nous vous rappelons ce rendez-vous 24h avant.</p>
      <p>Si vous avez besoin d'annuler ou de modifier ce rendez-vous, veuillez nous contacter dès que possible.</p>
      <p>À bientôt,<br>L'équipe SereniBook</p>
    </div>
  `,
  
  appointmentReminder: ({ clientName, serviceName, date, time, professionalName }: { clientName: string, serviceName: string, date: string, time: string, professionalName: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous rappelons votre rendez-vous demain avec <strong>${professionalName}</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Service :</strong> ${serviceName}</p>
        <p style="margin: 5px 0;"><strong>Date :</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Heure :</strong> ${time}</p>
      </div>
      <p>Si vous avez besoin d'annuler, veuillez nous contacter dès que possible.</p>
      <p>À bientôt,<br>L'équipe SereniBook</p>
    </div>
  `,

  invitationEmail: ({ clientName, professionalName, url, isNewAppointment = true }: { clientName: string, professionalName: string, url: string, isNewAppointment?: boolean }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      <p>Bonjour ${clientName},</p>
      
      ${isNewAppointment 
        ? `<p>Vous avez un nouveau rendez-vous avec <strong>${professionalName}</strong> sur SereniBook, la plateforme qui simplifie la gestion de vos rendez-vous.</p>`
        : `<p><strong>${professionalName}</strong> vous invite à rejoindre SereniBook, la plateforme qui simplifie la gestion de vos rendez-vous.</p>`
      }
      
      <p>Si vous avez déjà un compte SereniBook, <a href="${process.env.NEXTAUTH_URL}/connexion">connectez-vous ici</a>.</p>
      
      <p>Sinon, en créant votre compte, vous pourrez :</p>
      <ul>
        <li>Consulter vos rendez-vous</li>
        <li>Modifier ou annuler vos réservations</li>
        <li>Recevoir des rappels automatiques</li>
        <li>Prendre rendez-vous en ligne</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Créer mon compte</a>
      </div>
      <p>Ce lien est valable pendant 7 jours.</p>
      <p>À bientôt,<br>L'équipe SereniBook</p>
    </div>
  `
};