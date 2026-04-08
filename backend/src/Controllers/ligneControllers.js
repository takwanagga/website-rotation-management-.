import Ligne from '../models/ligne.js';

// fonction ajouter ligne
export async function ajouterLigne(req,res) {
    try {
        const { libelle , debutDeLigne , finDeLigne , distance , status } = req.body;
        const ligne = new Ligne({ libelle, debutDeLigne, finDeLigne, distance, status });
        const savedLigne = await ligne.save();

        res.status(201).json(savedLigne);
  } catch (error) {
        console.error("Error in ajouterLigne contoller", error);
        res.status(500).json({ message:"Internal server error " });
    }
};

// fonction modifier ligne (toutes les infos)
export async function modifierLigne(req, res) {
    try {        
        const{ libelle , debutDeLigne , finDeLigne , distance , status } = req.body;
        const updatedLigne = await Ligne.findByIdAndUpdate(
            req.params.id,{ libelle, debutDeLigne, finDeLigne, distance, status },
            { new: true}
        );
        if (!updatedLigne) return res.status(404).json({ error: "Ligne non trouvée" });
        return res.status(200).json(updatedLigne);
    } catch (error) {
        console.error("Error in updateLigne controller", error);
        res.status(500).json({message: "Intrernal server error"});
    }
}

// fonction changer le statut 
export async function setStatutLigne(req, res) {
    try {     
        const{ libelle , debutDeLigne , finDeLigne , distance , status } = req.body;   
        const updatedLigne = await Ligne.findByIdAndUpdate(
            req.params.id,
            { libelle , debutDeLigne , finDeLigne , distance , status } , 
            { new: true }
        );
        if (!updatedLigne) 
        return res.status(404).json({ error: "Ligne non trouvée" });
        return res.status(200).json({ message: "Statut de la ligne mis à jour", updatedLigne });
    } catch (error) {
        console.error("Error in updateLigne controller", error);
        res.status(500).json({message: "Intrernal server error"});
    }
}

// fonction lister ligne
export async function listerLigne(req, res) {
    try {
        const ligne = await Ligne.find();
        res.status(200).json(ligne);
    } catch (error) {
        res.status(500).json({ message:"Internal server error " });
    }
};

export default {
    ajouterLigne,
    modifierLigne,
    setStatutLigne,
    listerLigne
    
};