// src/lib/emails/email-template.ts
type EmailTemplateProps = {
  name: string;
  url: string;
}

export const EmailTemplates = {
  /**
   * Template pour l'email de vérification
   */
  verificationEmail: ({name, url}: EmailTemplateProps) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #e6f7f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #1aa385; margin-top: 0;">Vérification de votre email</h1>
      </div>
      
      <p>Bonjour ${name},</p>
      
      <p>Merci de votre inscription sur SereniBook !</p>
      
      <p>Pour finaliser votre inscription et profiter de toutes les fonctionnalités, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #1aa385; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Vérifier mon email</a>
      </div>
      
      <p>Si le bouton ne fonctionne pas, vous pouvez également copier et coller le lien suivant dans votre navigateur :</p>
      <p style="word-break: break-all; color: #1aa385;">${url}</p>
      
      <p>Ce lien est valable 24 heures.</p>
      
      <p>Si vous n'avez pas créé de compte sur SereniBook, veuillez ignorer cet email.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>À bientôt,<br>L'équipe SereniBook</p>
      </div>
    </div>
  `,

  /**
   * Template pour l'email de réinitialisation de mot de passe
   */
  resetPasswordEmail: ({name, url}: EmailTemplateProps) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #e6f7f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #1aa385; margin-top: 0;">Réinitialisation de votre mot de passe</h1>
      </div>
      
      <p>Bonjour ${name},</p>
      
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      
      <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #1aa385; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Réinitialiser mon mot de passe</a>
      </div>
      
      <p>Si le bouton ne fonctionne pas, vous pouvez également copier et coller le lien suivant dans votre navigateur :</p>
      <p style="word-break: break-all; color: #1aa385;">${url}</p>
      
      <p>Ce lien est valable 1 heure.</p>
      
      <p>Si vous n'avez pas demandé à réinitialiser votre mot de passe, vous pouvez ignorer cet email.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>À bientôt,<br>L'équipe SereniBook</p>
      </div>
    </div>
  `
}