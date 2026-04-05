import Notification from '../models/notification.js';

// Fonction créer une notification
export async function ajouterNotification(req, res) {
    try {
        const { message, type, destinataire, temps } = req.body;
        
        if (!message || !type || !destinataire) {
            return res.status(400).json({ message: "Message, type et destinataire sont obligatoires" });
        }

        const notification = new Notification({ 
            message,
            type,
            destinataire,
            temps: temps || Date.now()
        });
        
        const savedNotification = await notification.save();
        
        const populatedNotification = await Notification.findById(savedNotification._id)
            .populate('destinataire');

        res.status(201).json(populatedNotification);
    } catch (error) {
        console.error("Error in ajouterNotification controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction marquer comme vue (correspond à la méthode Estvue())
export async function marquerVue(req, res) {
    try {
        const { vue } = req.body;
        
        const updatedNotification = await Notification.findByIdAndUpdate(
            req.params.id,
            { vue },
            { new: true }
        )
        .populate('destinataire');

        if (!updatedNotification) {
            return res.status(404).json({ error: "Notification non trouvée" });
        }

        return res.status(200).json(updatedNotification);
    } catch (error) {
        console.error("Error in marquerVue controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction vérifier si une notification est vue (méthode Estvue())
export async function verifierSiVue(req, res) {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: "Notification non trouvée" });
        }

        // Appel de la méthode Estvue()
        const estVue = notification.Estvue();

        res.status(200).json({ estVue });
    } catch (error) {
        console.error("Error in verifierSiVue controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction marquer comme supprimé (soft delete)
export async function marquerSupprime(req, res) {
    try {
        const { supprime } = req.body;
        
        const updatedNotification = await Notification.findByIdAndUpdate(
            req.params.id,
            { supprime },
            { new: true }
        )
        .populate('destinataire');

        if (!updatedNotification) {
            return res.status(404).json({ error: "Notification non trouvée" });
        }

        return res.status(200).json(updatedNotification);
    } catch (error) {
        console.error("Error in marquerSupprime controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction vérifier si une notification est supprimée (méthode Estsupprimer())
export async function verifierSiSupprime(req, res) {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: "Notification non trouvée" });
        }

        // Appel de la méthode Estsupprimer()
        const estSupprime = notification.Estsupprimer();

        res.status(200).json({ estSupprime });
    } catch (error) {
        console.error("Error in verifierSiSupprime controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction supprimer définitivement une notification (hard delete)
export async function supprimerNotification(req, res) {
    try {
        const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
        
        if (!deletedNotification) {
            return res.status(404).json({ error: "Notification non trouvée" });
        }

        return res.status(200).json({ message: "Notification supprimée définitivement" });
    } catch (error) {
        console.error("Error in supprimerNotification controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction obtenir une notification par ID
export async function obtenirNotificationParId(req, res) {
    try {
        const notification = await Notification.findById(req.params.id)
            .populate('destinataire');

        if (!notification) {
            return res.status(404).json({ error: "Notification non trouvée" });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error("Error in obtenirNotificationParId controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction lister les notifications par destinataire (non supprimées)
export async function listerNotificationsParDestinataire(req, res) {
    try {
        const { destinataireId } = req.params;

        const notifications = await Notification.find({ 
            destinataire: destinataireId,
            supprime: false  // Ne pas afficher les notifications supprimées
        })
        .populate('destinataire')
        .sort({ temps: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error in listerNotificationsParDestinataire controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction lister les notifications non vues d'un destinataire
export async function listerNotificationsNonVues(req, res) {
    try {
        const { destinataireId } = req.params;

        const notifications = await Notification.find({ 
            destinataire: destinataireId,
            vue: false,
            supprime: false
        })
        .populate('destinataire')
        .sort({ temps: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error in listerNotificationsNonVues controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    ajouterNotification,
    marquerVue,
    verifierSiVue,
    marquerSupprime,
    verifierSiSupprime,
    supprimerNotification,
    obtenirNotificationParId,
    listerNotificationsParDestinataire,
    listerNotificationsNonVues
};