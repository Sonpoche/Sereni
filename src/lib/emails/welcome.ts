// src/lib/emails/welcome.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface WelcomeEmailParams {
  email: string
  name: string
  tempPassword: string
  loginUrl: string
}

export async function sendWelcomeEmail({
  email,
  name,
  tempPassword,
  loginUrl
}: WelcomeEmailParams) {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur SereniBook</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
        }
        .content {
            margin: 30px 0;
        }
        .credentials-box {
            background: #f1f5f9;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin: 10px 0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        .credential-label {
            font-weight: bold;
            color: #475569;
        }
        .credential-value {
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            display: inline-block;
            margin-left: 10px;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: #8b5cf6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning-icon {
            color: #d97706;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .features {
            margin: 30px 0;
        }
        .feature-item {
            margin: 15px 0;
            display: flex;
            align-items: center;
        }
        .feature-icon {
            color: #10b981;
            margin-right: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SereniBook</div>
            <div class="subtitle">Votre plateforme de gestion bien-être</div>
        </div>

        <div class="content">
            <h2>Bienvenue ${name} !</h2>
            
            <p>Votre compte SereniBook a été créé avec succès par un administrateur. Nous sommes ravis de vous accueillir dans notre communauté de professionnels du bien-être.</p>

            <div class="credentials-box">
                <h3 style="margin-top: 0; color: #475569;">Vos informations de connexion :</h3>
                <div class="credential-item">
                    <span class="credential-label">Email :</span>
                    <span class="credential-value">${email}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Mot de passe temporaire :</span>
                    <span class="credential-value">${tempPassword}</span>
                </div>
            </div>

            <div class="warning">
                <span class="warning-icon">⚠️</span>
                <strong>Important :</strong> Veuillez vous connecter dès que possible et changer votre mot de passe temporaire pour sécuriser votre compte.
            </div>

            <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">
                    Se connecter maintenant
                </a>
            </div>

            <div class="features">
                <h3>Avec SereniBook, vous pouvez :</h3>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>Gérer vos rendez-vous et votre calendrier</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>Organiser vos clients et leurs informations</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>Créer et envoyer des factures professionnelles</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>Accéder à des statistiques détaillées</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>Bénéficier d'un support client dédié</span>
                </div>
            </div>

            <p>Si vous avez des questions ou besoin d'aide pour démarrer, n'hésitez pas à nous contacter. Notre équipe est là pour vous accompagner dans la prise en main de la plateforme.</p>
        </div>

        <div class="footer">
            <p>
                <strong>L'équipe SereniBook</strong><br>
                <a href="mailto:support@serenibook.fr" style="color: #8b5cf6;">support@serenibook.fr</a>
            </p>
            <p style="font-size: 12px; margin-top: 20px;">
                Cet email a été envoyé automatiquement. Si vous pensez avoir reçu ce message par erreur, 
                veuillez nous contacter.
            </p>
        </div>
    </div>
</body>
</html>`

    const emailText = `
Bienvenue sur SereniBook, ${name} !

Votre compte a été créé avec succès par un administrateur.

Informations de connexion :
- Email : ${email}
- Mot de passe temporaire : ${tempPassword}

⚠️ IMPORTANT : Veuillez vous connecter et changer votre mot de passe dès que possible.

Lien de connexion : ${loginUrl}

Avec SereniBook, vous pouvez :
✓ Gérer vos rendez-vous et votre calendrier
✓ Organiser vos clients et leurs informations  
✓ Créer et envoyer des factures professionnelles
✓ Accéder à des statistiques détaillées
✓ Bénéficier d'un support client dédié

Si vous avez des questions, contactez-nous à support@serenibook.fr

L'équipe SereniBook
`

    const result = await resend.emails.send({
      from: 'SereniBook <noreply@serenibook.fr>',
      to: [email],
      subject: 'Bienvenue sur SereniBook - Votre compte a été créé',
      html: emailHtml,
      text: emailText,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      },
      tags: [
        {
          name: 'category',
          value: 'welcome'
        },
        {
          name: 'user_type',
          value: 'admin_created'
        }
      ]
    })

    console.log(`✅ Email de bienvenue envoyé à ${email}`, { 
      id: result.data?.id,
      status: 'sent' 
    })

    return result

  } catch (error) {
    console.error(`❌ Erreur envoi email de bienvenue à ${email}:`, error)
    throw error
  }
}

// Email de notification de changement de rôle
export async function sendRoleChangeEmail({
  email,
  name,
  oldRole,
  newRole
}: {
  email: string
  name: string
  oldRole: string
  newRole: string
}) {
  try {
    const roleNames = {
      'CLIENT': 'Client',
      'PROFESSIONAL': 'Professionnel',
      'ADMIN': 'Administrateur'
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modification de votre rôle SereniBook</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8b5cf6;
        }
        .role-change {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .role-arrow {
            font-size: 20px;
            margin: 0 10px;
            color: #0ea5e9;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SereniBook</div>
        </div>

        <h2>Modification de votre rôle</h2>
        
        <p>Bonjour ${name},</p>
        
        <p>Votre rôle sur SereniBook a été modifié par un administrateur.</p>

        <div class="role-change">
            <strong>${roleNames[oldRole as keyof typeof roleNames] || oldRole}</strong>
            <span class="role-arrow">→</span>
            <strong>${roleNames[newRole as keyof typeof roleNames] || newRole}</strong>
        </div>

        ${newRole !== 'ADMIN' ? '<p>Vous devrez peut-être compléter votre profil lors de votre prochaine connexion pour accéder à toutes les fonctionnalités.</p>' : ''}

        <p>Si vous avez des questions concernant ce changement, n'hésitez pas à nous contacter.</p>

        <div class="footer">
            <p><strong>L'équipe SereniBook</strong></p>
            <p><a href="mailto:support@serenibook.fr">support@serenibook.fr</a></p>
        </div>
    </div>
</body>
</html>`

    const result = await resend.emails.send({
      from: 'SereniBook <noreply@serenibook.fr>',
      to: [email],
      subject: 'Modification de votre rôle SereniBook',
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'role_change'
        }
      ]
    })

    console.log(`✅ Email changement de rôle envoyé à ${email}`)
    return result

  } catch (error) {
    console.error(`❌ Erreur envoi email changement rôle à ${email}:`, error)
    throw error
  }
}