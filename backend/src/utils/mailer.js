import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const sendEmployeeCredentials = async (email, password) => {
  const transporter = createTransporter();
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const loginUrl = `${appUrl}/employe-login`;

  if (!transporter) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧  SMTP non configuré — identifiants de connexion :');
    console.log(`   Email    : ${email}`);
    console.log(`   Mot de passe : ${password}`);
    console.log(`   Lien     : ${loginUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenue sur TransRoute</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #1a202c; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 6px; }
    .bus-icon { font-size: 40px; margin-bottom: 12px; display: block; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1a202c; margin-bottom: 12px; }
    .intro { font-size: 15px; color: #4a5568; line-height: 1.6; margin-bottom: 28px; }
    .credentials-box { background: #f7f8fc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
    .credentials-box h3 { font-size: 13px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .cred-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label { font-size: 13px; color: #718096; width: 110px; flex-shrink: 0; }
    .cred-value { font-size: 15px; font-weight: 600; color: #2d3748; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; flex: 1; font-family: 'Courier New', monospace; }
    .btn-container { text-align: center; margin-bottom: 28px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; letter-spacing: 0.3px; }
    .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
    .note p { font-size: 13px; color: #92400e; line-height: 1.5; }
    .note strong { font-weight: 700; }
    .footer { background: #f7f8fc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #a0aec0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="bus-icon">🚌</span>
      <h1>TransRoute</h1>
      <p>Système de Gestion de Transport</p>
    </div>
    <div class="body">
      <p class="greeting">Bienvenue dans l'équipe !</p>
      <p class="intro">
        Votre compte employé a été créé avec succès. Voici vos identifiants de connexion pour accéder à votre espace personnel et consulter votre planning.
      </p>

      <div class="credentials-box">
        <h3>🔐 Vos identifiants</h3>
        <div class="cred-row">
          <span class="cred-label">Adresse email</span>
          <span class="cred-value">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Mot de passe</span>
          <span class="cred-value">${password}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Lien de connexion</span>
          <span class="cred-value" style="font-size:12px;">${loginUrl}</span>
        </div>
      </div>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn">Se connecter maintenant →</a>
      </div>

      <div class="note">
        <p>
          <strong>⚠️ Important :</strong> Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe dès votre première connexion. Ne partagez jamais vos identifiants avec d'autres personnes.
        </p>
      </div>

      <p style="font-size:14px; color:#718096; line-height:1.6;">
        En cas de problème de connexion ou si vous avez perdu vos identifiants, contactez votre administrateur.
      </p>
    </div>
    <div class="footer">
      <p>
        Cet email a été envoyé automatiquement par TransRoute.<br/>
        Merci de ne pas répondre à cet email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Bienvenue sur TransRoute !

Votre compte employé a été créé.

Vos identifiants :
  Email       : ${email}
  Mot de passe: ${password}
  Connexion   : ${loginUrl}

Pour des raisons de sécurité, changez votre mot de passe dès la première connexion.
  `;

  try {
    const info = await transporter.sendMail({
      from: `"TransRoute" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🚌 Bienvenue sur TransRoute — Vos identifiants de connexion',
      text,
      html,
    });
    console.log('Email envoyé :', info.messageId);
  } catch (error) {
    console.error('Erreur envoi email :', error.message);
    console.log(`   Email    : ${email}`);
    console.log(`   Mot de passe : ${password}`);
  }
};

export const sendPlanningNotification = async (email, nom, dateStr, loginUrl) => {
  const transporter = createTransporter();
  const url = loginUrl || `${process.env.APP_URL || 'http://localhost:5173'}/employe-login`;

  if (!transporter) {
    console.log(`📅  Planning publié pour ${email} (${dateStr})`);
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; color: #fff; }
    .header h1 { font-size: 22px; font-weight: 700; }
    .body { padding: 32px; }
    .btn { display: inline-block; background: #059669; color: #fff !important; font-weight: 700; text-decoration: none; padding: 12px 30px; border-radius: 10px; margin-top: 20px; }
    .footer { background: #f7f8fc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="font-size:36px;margin-bottom:8px">📅</div>
      <h1>Planning publié !</h1>
    </div>
    <div class="body">
      <p style="font-size:16px;font-weight:600;margin-bottom:12px">Bonjour ${nom},</p>
      <p style="font-size:15px;color:#4a5568;line-height:1.6;">
        Votre planning du <strong>${dateStr}</strong> vient d'être publié. Connectez-vous à votre espace pour le consulter.
      </p>
      <div style="text-align:center">
        <a href="${url}" class="btn">Voir mon planning →</a>
      </div>
    </div>
    <div class="footer"><p>TransRoute — ne pas répondre à cet email</p></div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"TransRoute" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `📅 Votre planning du ${dateStr} est disponible`,
      html,
    });
  } catch (err) {
    console.error('Erreur email planning :', err.message);
  }
};