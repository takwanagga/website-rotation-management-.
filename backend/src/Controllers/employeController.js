import Employe from '../models/employe.js';
import jwt from 'jsonwebtoken';

//fonction signup employe
export async function signupEmploye (req, res) {
    try {
        const {nom , prenom , mecano , localisation , email , role , telephone , MotDePasse} = req.body;
        const employe = new Employe({nom , prenom , mecano , localisation , email , role , telephone , MotDePasse});
        const savedEmploye = await employe.save();


        return res.status(201).json( savedEmploye);

    } catch (error) {
        console.error("Error in signupEmploye controller", error);
        return res.status(500).json({ message:"Internal server error " });
    }
};

//fonction ajouter employe
export async function ajouterEmploye (req, res) {
    try {
        const {nom , prenom , mecano , localisation , email , role , telephone , MotDePasse} = req.body;
        const employe = new Employe({nom , prenom , mecano , localisation , email , role , telephone , MotDePasse});
        const savedEmploye = await employe.save();


        return res.status(201).json( savedEmploye);

    } catch (error) {
        console.error("Error in ajouterEmploye contoller", error);
        return res.status(500).json({ message:"Internal server error " });
    }
};

//fonction login employe
const loginEmploye = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find employee by email
        const employe = await EmployeModel.findOne({ email });
        if (!employe) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await employe.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: employe._id, email: employe.email, role: employe.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            employe: {
                id: employe._id,
                nom: employe.nom,
                prenom: employe.prenom,
                email: employe.email,
                role: employe.role
            }
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

//fonction modifier employe
export async function modifierEmploye(req, res) {
    try {  
        const {nom , prenom , mecano , localisation , email , role , telephone , MotDePasse} = req.body;
        const updatedEmploye = await Employe.findByIdAndUpdate(
            req.params.id,
            {nom , prenom , mecano , localisation , email , role , telephone , MotDePasse},
            { returnDocument: 'after' }
        );
        if (!updatedEmploye) 
        return res.status(404).json({ error: "Employé non trouvé" });
        res.status(200).json({ message: "Employé modifié avec succès", updatedEmploye });
    } catch (error) {
        console.error("Error in updateEmploye controller", error);
        res.status(500).json({message: "Intrernal server error"});
    }
}

export async function supprimerEmploye(req, res) {
    try {
        const deletedEmploye = await Employe.findByIdAndDelete(req.params.id);
        if (!deletedEmploye) 
         return res.status(404).json({ error: "Employé non trouvé" });
        res.status(200).json({ message: "Employé supprimé avec succès", deletedEmploye });
    } catch (error) {
        console.error("Error in deleteEmploye controller", error);
        res.status(500).json({message: "Intrernal server error"});
    }
}

export async function listerEmploye(req, res) {
    try {
        const employe = await Employe.find();
        res.status(200).json(employe);
    } catch (error) {
        res.status(500).json({ message:"Internal server error " });
    }
};

// fonction forgot password (generates a reset token; in production send email)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const employe = await EmployeModel.findOne({ email });
        // To avoid user enumeration, always respond with success message
        if (!employe) {
            return res.status(200).json({ message: 'If that email exists, a reset link was sent.' });
        }

        // Create a short-lived reset token (JWT)
        const resetToken = jwt.sign(
            { id: employe._id, email: employe.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        // In production: send resetToken via email link. For now return it for development.
        return res.status(200).json({ message: 'Reset token generated', resetToken });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export default {
    signupEmploye,
    ajouterEmploye,
    loginEmploye,
    modifierEmploye,
    supprimerEmploye,
    listerEmploye,
    forgotPassword
};