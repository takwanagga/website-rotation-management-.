import Bus from '../models/bus.js';

// fonction ajouter bus
export async function ajouterBus(req, res) {
    try { 
        const {model, matricule, status} = req.body;
        const bus = new Bus({model, matricule, status});
        const savedBus = await bus.save();
        
        res.status(201).json(savedBus);

    } catch (error) {
        console.error("Error in ajouterBus contoller", error);
        res.status(500).json({ message:"Internal server error " });
    }
};

// fonction modifier bus 
export async function modifierBus(req, res) {
    
    try { 
        const {model, matricule, status} = req.body;       
        const updatedBus = await Bus.findByIdAndUpdate(
            req.params.id,{model, matricule, status}
            ,
            { returnDocument: 'after' }
        );
        if (!updatedBus) 
            return res.status(404).json({ error: "Bus non trouvé" });
        return res.status(200).json(updatedBus);
    } catch (error) {
    console.error("Error in updateBus controller", error);
    res.status(500).json({message: "Intrernal server error"});
    }
}

// fonction changer le statut 
export async function setStatutBus(req, res) {
    try {    
        const {model, matricule, status} = req.body;       
        const updatedBus = await Bus.findByIdAndUpdate(
            req.params.id,
            {model, matricule, status}, 
            { returnDocument: 'after' }
        );
        if (!updatedBus) 
         return res.status(404).json({ error: "Bus non trouvé" });
        return res.status(200).json({ message: "Statut du bus mis à jour", updatedBus });
    } catch (error) {
        console.error("Error in updateBus controller", error);
        res.status(500).json({message: "Intrernal server error"});
    }
}

// fonction lister bus
export async function listerBus(req, res) {
    try {
        const bus = await Bus.find();
        res.status(200).json(bus);
    } catch (error) {
        console.error("Error in listerBus contoller", error);
        res.status(500).json({ message:"Internal server error " });
    }
};

export default {
    ajouterBus,
    modifierBus,
    setStatutBus,
    listerBus
};