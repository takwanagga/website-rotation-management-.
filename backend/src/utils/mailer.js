import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to another provider if needed
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const sendEmployeeCredentials = async (email, password) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('SMTP credentials not provided. Attempted to send email to:', email, 'with password:', password);
            return;
        }

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Vos identifiants de connexion',
            text: `Bonjour,\n\nVotre compte a été créé avec succès.\n\nVoici vos identifiants de connexion:\nEmail: ${email}\nMot de passe: ${password}\n\nVous pouvez vous connecter ici: http://localhost:5173/employe-login\n\nCordialement,\nL'équipe d'administration`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
