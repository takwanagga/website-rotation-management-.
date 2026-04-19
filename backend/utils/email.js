import transporter from '../src/config/mailer.js';

const APP_NAME = process.env.APP_NAME || 'TransRoute';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const wrapHTML = (body) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #1a202c; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; }
    .header p  { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
    .body  { padding: 32px; }
    .btn   { display: inline-block; background: #4f46e5; color: #fff !important; font-weight: 700; text-decoration: none; padding: 13px 30px; border-radius: 10px; margin: 18px 0; font-size: 15px; }
    .box   { background: #f7f8fc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin: 20px 0; }
    .box h3 { font-size: 12px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
    .row   { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .row:last-child { margin-bottom: 0; }
    .label { font-size: 13px; color: #718096; width: 110px; flex-shrink: 0; }
    .value { font-size: 14px; font-weight: 600; color: #2d3748; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; flex: 1; font-family: monospace; word-break: break-all; }
    .note  { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-top: 16px; font-size: 13px; color: #92400e; line-height: 1.5; }
    .footer { background: #f7f8fc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
      <p>Systeme de Gestion de Transport</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <p>Cet email a ete envoye automatiquement par ${APP_NAME}.<br/>Merci de ne pas repondre a cet email.</p>
    </div>
  </div>
</body>
</html>`;

export const sendEmployeeCredentials = async (email, password) => {
  const loginUrl = `${CLIENT_URL}/employe-login`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP non configure - identifiants a envoyer manuellement :');
    console.log(`Email        : ${email}`);
    console.log(`Mot de passe : ${password}`);
    console.log(`Lien         : ${loginUrl}`);
    return;
  }

  const html = wrapHTML(`
    <p style="font-size:18px;font-weight:600;margin-bottom:12px">Bienvenue dans l'equipe !</p>
    <p style="font-size:15px;color:#4a5568;line-height:1.6;margin-bottom:20px">
      Votre compte employe a ete cree avec succes sur <strong>${APP_NAME}</strong>.
      Voici vos identifiants de connexion pour acceder a votre espace personnel.
    </p>
    <div class="box">
      <h3>Vos identifiants de connexion</h3>
      <div class="row">
        <span class="label">Adresse email</span>
        <span class="value">${email}</span>
      </div>
      <div class="row">
        <span class="label">Mot de passe</span>
        <span class="value">${password}</span>
      </div>
    </div>
    <div style="text-align:center">
      <a href="${loginUrl}" class="btn">Acceder a mon espace employe</a>
    </div>
    <div class="note">
      <strong>Important :</strong> Pour des raisons de securite, changez votre mot de passe
      des votre premiere connexion. Ne partagez jamais vos identifiants.
    </div>
  `);

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `${APP_NAME} - Vos identifiants de connexion`,
    html,
  });

  console.log(`Identifiants envoyes a : ${email}`);
};

export const sendResetPasswordEmail = async (employe, resetToken) => {
  const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`SMTP non configure - lien de reset (valable 1h) : ${resetUrl}`);
    return;
  }

  const html = wrapHTML(`
    <p style="font-size:18px;font-weight:600;margin-bottom:12px">Reinitialisation du mot de passe</p>
    <p style="font-size:15px;color:#4a5568;line-height:1.6;margin-bottom:20px">
      Bonjour <strong>${employe.prenom} ${employe.nom}</strong>,<br/>
      Nous avons recu une demande de reinitialisation de votre mot de passe pour votre compte <strong>${APP_NAME}</strong>.
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <div style="text-align:center">
      <a href="${resetUrl}" class="btn">Reinitialiser mon mot de passe</a>
    </div>
    <div class="box">
      <h3>Ou copiez ce lien dans votre navigateur</h3>
      <div class="row">
        <span class="value">${resetUrl}</span>
      </div>
    </div>
    <div class="note">
      Ce lien est valable <strong>1 heure</strong> seulement.
      Si vous n'avez pas demande cette reinitialisation, ignorez cet email -
      votre mot de passe ne sera pas modifie.
    </div>
  `);

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: employe.email,
    subject: `${APP_NAME} - Reinitialisation de mot de passe`,
    html,
  });

  console.log(`Lien de reset envoye a : ${employe.email}`);
};

export const sendPlanningNotification = async (email, nom, dateStr) => {
  const loginUrl = `${CLIENT_URL}/employe-login`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Planning publie pour ${email} (${dateStr})`);
    return;
  }

  const html = wrapHTML(`
    <p style="font-size:18px;font-weight:600;margin-bottom:12px">Planning publie</p>
    <p style="font-size:15px;color:#4a5568;line-height:1.6;margin-bottom:20px">
      Bonjour <strong>${nom}</strong>,<br/>
      Votre planning du <strong>${dateStr}</strong> vient d'etre publie.
      Connectez-vous a votre espace pour le consulter.
    </p>
    <div style="text-align:center">
      <a href="${loginUrl}" class="btn">Voir mon planning</a>
    </div>
  `);

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `${APP_NAME} - Votre planning du ${dateStr} est disponible`,
    html,
  });
};

export const sendVerificationEmail = async (utilisateur, verificationToken) => {
  const verifyUrl = `${CLIENT_URL}/verify-email/${verificationToken}`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Lien de verification email (valable 24h) : ${verifyUrl}`);
    return;
  }

  const html = wrapHTML(`
    <p style="font-size:18px;font-weight:600;margin-bottom:12px">Verifiez votre adresse email</p>
    <p style="font-size:15px;color:#4a5568;line-height:1.6;margin-bottom:20px">
      Bonjour <strong>${utilisateur.prenom} ${utilisateur.nom}</strong>,<br/>
      Votre compte <strong>${APP_NAME}</strong> a ete cree avec succes.
      Cliquez sur le bouton ci-dessous pour activer votre compte.
    </p>
    <div style="text-align:center">
      <a href="${verifyUrl}" class="btn">Activer mon compte</a>
    </div>
    <div class="box">
      <h3>Ou copiez ce lien dans votre navigateur</h3>
      <div class="row">
        <span class="value">${verifyUrl}</span>
      </div>
    </div>
    <div class="note">
      Ce lien est valable <strong>24 heures</strong>.
      Si vous n'avez pas cree ce compte, ignorez cet email.
    </div>
  `);

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: utilisateur.email,
    subject: `${APP_NAME} - Activez votre compte`,
    html,
  });

  console.log(`Email de verification envoye a : ${utilisateur.email}`);
};