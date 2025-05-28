// src/lib/emails/email-template.ts
export const EmailTemplates = {
  // Email de vérification d'adresse email
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
  
  // Email de réinitialisation de mot de passe
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
  
  // Confirmation de rendez-vous individuel
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
  
  // Rappel de rendez-vous
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

  // Email d'invitation pour nouveaux clients
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
        <li>Vous inscrire aux cours collectifs</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Créer mon compte</a>
      </div>
      <p>Ce lien est valable pendant 7 jours.</p>
      <p>À bientôt,<br>L'équipe SereniBook</p>
    </div>
  `,

  // Notification au praticien d'une nouvelle inscription aux cours collectifs
  newRegistrationNotification: ({ 
    professionalName, 
    clientName, 
    courseName, 
    sessionDate, 
    sessionTime,
    clientEmail,
    clientPhone 
  }: { 
    professionalName: string
    clientName: string
    courseName: string
    sessionDate: string
    sessionTime: string
    clientEmail: string
    clientPhone: string
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #0ea5e9; margin-top: 0;">🎉 Nouvelle inscription !</h2>
      </div>
      
      <p>Bonjour <strong>${professionalName}</strong>,</p>
      
      <p>Vous avez reçu une nouvelle demande d'inscription pour votre cours "<strong>${courseName}</strong>".</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">👤 Informations du participant</h3>
        <p style="margin: 8px 0;"><strong>Nom :</strong> ${clientName}</p>
        <p style="margin: 8px 0;"><strong>Email :</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
        <p style="margin: 8px 0;"><strong>Téléphone :</strong> ${clientPhone || 'Non renseigné'}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📅 Détails de la séance</h3>
        <p style="margin: 8px 0;"><strong>Cours :</strong> ${courseName}</p>
        <p style="margin: 8px 0;"><strong>Date :</strong> ${sessionDate}</p>
        <p style="margin: 8px 0;"><strong>Heure :</strong> ${sessionTime}</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #92400e; margin-top: 0;">📋 À faire</h4>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Confirmer la participation par email ou téléphone</li>
          <li>Préciser les modalités de paiement</li>
          <li>Envoyer les détails pratiques (adresse exacte, matériel, etc.)</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/cours-collectifs" 
           style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
          Gérer mes cours
        </a>
        <a href="mailto:${clientEmail}" 
           style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Répondre au client
        </a>
      </div>
      
      <p>Bonne séance !</p>
      <p>L'équipe SereniBook</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #666;">
        Cet email a été envoyé automatiquement suite à l'inscription d'un client sur SereniBook. 
        Pour modifier vos préférences de notification, rendez-vous dans vos paramètres.
      </p>
    </div>
  `,

  // Confirmation au client de sa demande d'inscription
  registrationConfirmationClient: ({ 
    clientName, 
    courseName, 
    professionalName, 
    sessionDate, 
    sessionTime,
    price 
  }: { 
    clientName: string
    courseName: string
    professionalName: string
    sessionDate: string
    sessionTime: string
    price: number
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #0ea5e9; margin-top: 0;">✅ Demande d'inscription envoyée !</h2>
      </div>
      
      <p>Bonjour <strong>${clientName}</strong>,</p>
      
      <p>Votre demande d'inscription au cours "<strong>${courseName}</strong>" avec <strong>${professionalName}</strong> a bien été envoyée !</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📅 Récapitulatif</h3>
        <p style="margin: 8px 0;"><strong>Cours :</strong> ${courseName}</p>
        <p style="margin: 8px 0;"><strong>Date :</strong> ${sessionDate}</p>
        <p style="margin: 8px 0;"><strong>Heure :</strong> ${sessionTime}</p>
        <p style="margin: 8px 0;"><strong>Praticien :</strong> ${professionalName}</p>
        <p style="margin: 8px 0;"><strong>Prix :</strong> ${price}€</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #92400e; margin-top: 0;">⏳ Prochaines étapes</h4>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li><strong>${professionalName}</strong> va vous confirmer votre place par email ou téléphone</li>
          <li>Les modalités de paiement vous seront précisées</li>
          <li>Vous recevrez tous les détails pratiques du cours</li>
        </ul>
      </div>
      
      <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #065f46; margin-top: 0;">💡 Le saviez-vous ?</h4>
        <p style="color: #065f46; margin: 0;">
          Vous pouvez suivre toutes vos inscriptions dans votre espace personnel SereniBook. 
          Connectez-vous dès maintenant pour découvrir d'autres cours près de chez vous !
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/mes-rendez-vous" 
           style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
          Voir mes inscriptions
        </a>
        <a href="${process.env.NEXTAUTH_URL}/cours-collectifs" 
           style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Découvrir d'autres cours
        </a>
      </div>
      
      <p>En cas de question, n'hésitez pas à nous contacter à <a href="mailto:support@serenibook.fr">support@serenibook.fr</a></p>
      <p>À bientôt !</p>
      <p>L'équipe SereniBook</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #666;">
        Si vous ne souhaitez plus recevoir ces notifications, vous pouvez modifier vos préférences 
        dans votre <a href="${process.env.NEXTAUTH_URL}/parametres">espace personnel</a>.
      </p>
    </div>
  `,

  // Email de confirmation de cours collectif (avec lien/adresse)
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #0ea5e9; margin-top: 0;">✅ Inscription confirmée !</h2>
      </div>
      
      <p>Bonjour <strong>${clientName}</strong>,</p>
      
      <p>Votre inscription au cours "<strong>${courseName}</strong>" avec <strong>${professionalName}</strong> a été confirmée !</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📅 Détails de votre séance</h3>
        <p style="margin: 8px 0;"><strong>Cours :</strong> ${courseName}</p>
        <p style="margin: 8px 0;"><strong>Date :</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Heure :</strong> ${time}</p>
        <p style="margin: 8px 0;"><strong>Praticien :</strong> ${professionalName}</p>
        
        ${isOnline 
          ? `<p style="margin: 8px 0;"><strong>📱 Modalité :</strong> Cours en ligne</p>
             <p style="color: #0ea5e9; font-style: italic;">Le lien de connexion vous sera envoyé 30 minutes avant le début du cours.</p>`
          : `<p style="margin: 8px 0;"><strong>📍 Lieu :</strong> ${address ? address + ', ' : ''}${city}</p>`
        }
      </div>
      
      ${equipment && equipment.length > 0 ? `
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #92400e; margin-top: 0;">🎒 Matériel à prévoir</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            ${equipment.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #dc2626; margin-top: 0;">⚠️ Politique d'annulation</h4>
        <p style="color: #dc2626; margin: 0;">
          Vous pouvez annuler votre inscription jusqu'à 24h avant le cours pour un remboursement complet.
          Pour annuler, connectez-vous à votre espace personnel sur SereniBook ou contactez directement ${professionalName}.
        </p>
      </div>
      
      <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #065f46; margin-top: 0;">💚 Préparez-vous pour une belle séance !</h4>
        <ul style="color: #065f46; margin: 0; padding-left: 20px;">
          <li>Arrivez 5-10 minutes avant le début</li>
          <li>Portez des vêtements confortables</li>
          <li>Apportez une bouteille d'eau</li>
          ${isOnline ? '<li>Testez votre connexion internet</li>' : ''}
          <li>Éteignez votre téléphone pour profiter pleinement</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/mes-rendez-vous" 
           style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
          Voir mes inscriptions
        </a>
        <a href="${process.env.NEXTAUTH_URL}/cours-collectifs" 
           style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Découvrir d'autres cours
        </a>
      </div>
      
      <p>À bientôt pour votre séance !</p>
      <p>L'équipe SereniBook</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #666;">
        Si vous avez des questions, n'hésitez pas à contacter directement ${professionalName} 
        ou notre équipe support à <a href="mailto:support@serenibook.fr">support@serenibook.fr</a>
      </p>
    </div>
  `,

  // Email de rappel de cours collectif (24h avant)
  courseReminder: ({ 
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #92400e; margin-top: 0;">⏰ Rappel : Votre cours demain !</h2>
      </div>
      
      <p>Bonjour <strong>${clientName}</strong>,</p>
      
      <p>Nous vous rappelons votre cours "<strong>${courseName}</strong>" avec <strong>${professionalName}</strong> qui a lieu <strong>demain</strong> !</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📅 Rappel des détails</h3>
        <p style="margin: 8px 0;"><strong>Cours :</strong> ${courseName}</p>
        <p style="margin: 8px 0;"><strong>Date :</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Heure :</strong> ${time}</p>
        <p style="margin: 8px 0;"><strong>Praticien :</strong> ${professionalName}</p>
        
        ${isOnline 
          ? `<p style="margin: 8px 0;"><strong>📱 Modalité :</strong> Cours en ligne</p>
             <p style="color: #0ea5e9; font-style: italic;">Le lien de connexion vous sera envoyé 30 minutes avant le début.</p>`
          : `<p style="margin: 8px 0;"><strong>📍 Lieu :</strong> ${address ? address + ', ' : ''}${city}</p>`
        }
      </div>
      
      ${equipment && equipment.length > 0 ? `
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #92400e; margin-top: 0;">🎒 N'oubliez pas votre matériel</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            ${equipment.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #065f46; margin-top: 0;">✅ Checklist de dernière minute</h4>
        <ul style="color: #065f46; margin: 0; padding-left: 20px;">
          <li>Vêtements confortables préparés</li>
          <li>Bouteille d'eau prête</li>
          ${isOnline ? '<li>Connexion internet testée</li>' : '<li>Itinéraire vérifié</li>'}
          <li>Réveil programmé pour arriver à l'heure</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/mes-rendez-vous" 
           style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Voir mes inscriptions
        </a>
      </div>
      
      <p>Nous vous souhaitons une excellente séance !</p>
      <p>L'équipe SereniBook</p>
    </div>
  `,

  // Email d'annulation de cours collectif
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
    reason?: string
  }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin-top: 0;">❌ Inscription annulée</h2>
      </div>
      
      <p>Bonjour <strong>${clientName}</strong>,</p>
      
      <p>Votre inscription au cours "<strong>${courseName}</strong>" avec <strong>${professionalName}</strong> a été annulée.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📅 Détails du cours annulé</h3>
        <p style="margin: 8px 0;"><strong>Cours :</strong> ${courseName}</p>
        <p style="margin: 8px 0;"><strong>Date :</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>Heure :</strong> ${time}</p>
        <p style="margin: 8px 0;"><strong>Praticien :</strong> ${professionalName}</p>
        ${reason ? `<p style="margin: 8px 0;"><strong>Motif :</strong> ${reason}</p>` : ''}
      </div>
      
      <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin-top: 0;">🔄 Que faire maintenant ?</h4>
        <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
          <li>Vérifiez si une nouvelle date est proposée</li>
          <li>Explorez d'autres cours similaires</li>
          <li>Contactez ${professionalName} pour plus d'informations</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/cours-collectifs" 
           style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
          Découvrir d'autres cours
        </a>
        <a href="${process.env.NEXTAUTH_URL}/mes-rendez-vous" 
           style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Mes inscriptions
        </a>
      </div>
      
      <p>Nous nous excusons pour ce désagrément.</p>
      <p>L'équipe SereniBook</p>
    </div>
  `,

  // Email de bienvenue pour nouveaux utilisateurs
  welcomeEmail: ({ name, role }: { name: string, role: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #67B3AB;">SereniBook</h1>
      </div>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #0ea5e9; margin-top: 0;">🎉 Bienvenue sur SereniBook !</h2>
      </div>
      
      <p>Bonjour <strong>${name}</strong>,</p>
      
      <p>Félicitations ! Votre compte SereniBook a été créé avec succès. Vous rejoignez une communauté dédiée au bien-être et à la sérénité.</p>
      
      ${role === 'PROFESSIONAL' ? `
        <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #065f46; margin-top: 0;">🌟 En tant que professionnel, vous pouvez :</h4>
          <ul style="color: #065f46; margin: 0; padding-left: 20px;">
            <li>Gérer vos rendez-vous et votre planning</li>
            <li>Créer et organiser des cours collectifs</li>
            <li>Suivre votre clientèle</li>
            <li>Automatiser vos notifications</li>
            <li>Développer votre activité sereinement</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/profil/completer" 
             style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
            Compléter mon profil
          </a>
          <a href="${process.env.NEXTAUTH_URL}/tableau-de-bord" 
             style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Découvrir mon espace
          </a>
        </div>
      ` : `
        <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #065f46; margin-top: 0;">🌟 En tant que client, vous pouvez :</h4>
          <ul style="color: #065f46; margin: 0; padding-left: 20px;">
            <li>Découvrir des professionnels près de chez vous</li>
            <li>Vous inscrire aux cours collectifs</li>
            <li>Gérer vos réservations en ligne</li>
            <li>Recevoir des rappels automatiques</li>
            <li>Accéder à un large choix d'activités bien-être</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/cours-collectifs" 
             style="display: inline-block; background-color: #67B3AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
            Découvrir les cours
          </a>
          <a href="${process.env.NEXTAUTH_URL}/tableau-de-bord" 
             style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Mon tableau de bord
          </a>
        </div>
      `}
      
      <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #92400e; margin-top: 0;">💡 Besoin d'aide ?</h4>
        <p style="color: #92400e; margin: 0;">
          Notre équipe est là pour vous accompagner ! N'hésitez pas à nous contacter à 
          <a href="mailto:support@serenibook.fr" style="color: #92400e;">support@serenibook.fr</a> 
          ou consultez notre centre d'aide en ligne.
        </p>
      </div>
      
      <p>Nous vous souhaitons une excellente expérience sur SereniBook !</p>
      <p>L'équipe SereniBook</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #666;">
        Vous recevez cet email car vous venez de créer un compte sur SereniBook. 
        Si ce n'est pas le cas, veuillez nous contacter immédiatement.
      </p>
    </div>
  `
};