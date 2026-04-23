import Planning from '../models/planning.js';
import Notification from '../models/notification.js';

async function findPlanningConflict({ date, heuredebut, ligne, bus, employe, excludeId }) {
    const baseFilter = { date, heuredebut, ligne: { $ne: ligne } };
    if (excludeId) {
        baseFilter._id = { $ne: excludeId };
    }

    const [employeeConflict, busConflict] = await Promise.all([
        Planning.findOne({ ...baseFilter, employe }).populate('ligne').populate('employe'),
        Planning.findOne({ ...baseFilter, bus }).populate('ligne').populate('bus'),
    ]);

    if (employeeConflict) {
        return {
            status: 409,
            payload: {
                message: "Conflit: employé déjà affecté à une autre ligne sur le même créneau",
                conflictType: "employee",
                conflictWith: employeeConflict,
            },
        };
    }

    if (busConflict) {
        return {
            status: 409,
            payload: {
                message: "Conflit: bus déjà affecté à une autre ligne sur le même créneau",
                conflictType: "bus",
                conflictWith: busConflict,
            },
        };
    }

    return null;
}

// Fonction ajouter planning
export async function ajouterPlanning(req, res) {
    try {
        const { date, heuredebut, heurefin, ligne, bus, employe, receveur } = req.body;
        
        // Validation basique
        if (!date || !heuredebut || !heurefin || !ligne || !bus || !employe || !receveur) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires y compris le receveur" });
        }

        const conflict = await findPlanningConflict({ date, heuredebut, ligne, bus, employe });
        if (conflict) {
            return res.status(conflict.status).json(conflict.payload);
        }

        const planning = new Planning({ 
            date, 
            heuredebut, 
            heurefin, 
            ligne, 
            bus, 
            employe,
            receveur
        });
        
        const savedPlanning = await planning.save();
        
        // Peupler les références pour renvoyer les détails complets
        const populatedPlanning = await Planning.findById(savedPlanning._id)
            .populate('ligne')
            .populate('bus')
            .populate('employe')
            .populate('receveur');

        res.status(201).json(populatedPlanning);
    } catch (error) {
        console.error("Error in ajouterPlanning controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction modifier planning (toutes les infos)
export async function modifierPlanning(req, res) {
    try {
        const { date, heuredebut, heurefin, ligne, bus, employe, receveur } = req.body;

        const conflict = await findPlanningConflict({
            date,
            heuredebut,
            ligne,
            bus,
            employe,
            excludeId: req.params.id,
        });
        if (conflict) {
            return res.status(conflict.status).json(conflict.payload);
        }
        
        const existingPlanning = await Planning.findById(req.params.id);

        const updatedPlanning = await Planning.findByIdAndUpdate(
            req.params.id,
            { date, heuredebut, heurefin, ligne, bus, employe, receveur },
            { returnDocument: 'after' }
        )
        .populate('ligne')
        .populate('bus')
        .populate('employe')
        .populate('receveur');

        if (!updatedPlanning) {
            return res.status(404).json({ error: "Planning non trouvé" });
        }

        if (existingPlanning && existingPlanning.publie) {
            const dateStr = new Date(date).toLocaleDateString('fr-FR');
            const msg = `Votre planning du ${dateStr} à ${heuredebut} sur la ligne a été modifié.`;
            
            await Notification.create({ message: msg, type: 'modification_planning', destinataire: employe });
            if (receveur) {
                await Notification.create({ message: msg, type: 'modification_planning', destinataire: receveur });
            }
        }

        if (!updatedPlanning) {
            return res.status(404).json({ error: "Planning non trouvé" });
        }

        return res.status(200).json(updatedPlanning);
    } catch (error) {
        console.error("Error in modifierPlanning controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction supprimer planning
export async function supprimerPlanning(req, res) {
    try {
        const deletedPlanning = await Planning.findByIdAndDelete(req.params.id);
        
        if (!deletedPlanning) {
            return res.status(404).json({ error: "Planning non trouvé" });
        }

        return res.status(200).json({ message: "Planning supprimé avec succès" });
    } catch (error) {
        console.error("Error in supprimerPlanning controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction obtenir un planning par ID
export async function obtenirPlanningParId(req, res) {
    try {
        const planning = await Planning.findById(req.params.id)
            .populate('ligne')
            .populate('bus')
            .populate('employe')
            .populate('receveur');

        if (!planning) {
            return res.status(404).json({ error: "Planning non trouvé" });
        }

        res.status(200).json(planning);
    } catch (error) {
        console.error("Error in obtenirPlanningParId controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction publier/dépublier planning
export async function publierPlanning(req, res) {
    try {
        const { publie } = req.body;
        
        const updatedPlanning = await Planning.findByIdAndUpdate(
            req.params.id,
            { publie },
            { returnDocument: 'after' }
        )
        .populate('ligne')
        .populate('bus')
        .populate('employe')
        .populate('receveur');

        if (!updatedPlanning) {
            return res.status(404).json({ error: "Planning non trouvé" });
        }

        const message = publie ? "Planning publié avec succès" : "Planning dépublié avec succès";
        return res.status(200).json({ message, planning: updatedPlanning });
    } catch (error) {
        console.error("Error in publierPlanning controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction lister planning par employé

export async function listerPlanningParEmploye(req, res) {
  try {
    const { employeId } = req.params;
    const filter = { $or: [{ employe: employeId }, { receveur: employeId }], publie: true };
    const planning = await Planning.find(filter)
      .populate("ligne").populate("bus").populate("employe").populate("receveur")
      .sort({ date: 1, heuredebut: 1 });
    res.status(200).json(planning);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// Fonction lister planning par ligne
export async function listerPlanningParLigne(req, res) {
    try {
        const { ligneId } = req.params;

        const planning = await Planning.find({ ligne: ligneId })
            .populate('ligne')
            .populate('bus')
            .populate('employe')
            .populate('receveur')
            .sort({ date: 1, heuredebut: 1 });

        res.status(200).json(planning);
    } catch (error) {
        console.error("Error in listerPlanningParLigne controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Fonction lister planning par bus
export async function listerPlanningParBus(req, res) {
    try {
        const { busId } = req.params;

        const planning = await Planning.find({ bus: busId })
            .populate('ligne')
            .populate('bus')
            .populate('employe')
            .populate('receveur')
            .sort({ date: 1, heuredebut: 1 });

        res.status(200).json(planning);
    } catch (error) {
        console.error("Error in listerPlanningParBus controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function listerPlanningParDateRange(req, res) {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ message: "Les parametres start et end sont obligatoires" });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        const planning = await Planning.find({
            date: { $gte: startDate, $lte: endDate }
        })
            .populate('ligne')
            .populate('bus')
            .populate('employe')
            .populate('receveur')
            .sort({ date: 1, heuredebut: 1 });

        res.status(200).json(planning);
    } catch (error) {
        console.error("Error in listerPlanningParDateRange controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    ajouterPlanning,
    modifierPlanning,
    supprimerPlanning,
    obtenirPlanningParId,
    publierPlanning,
    listerPlanningParEmploye,
    listerPlanningParLigne,
    listerPlanningParBus,
    listerPlanningParDateRange
};