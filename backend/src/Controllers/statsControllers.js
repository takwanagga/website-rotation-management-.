import Planning from '../models/planning.js';

export async function getAdminStats(req, res) {
    try {
        // Here we sum hours from published plannings per employee for a time range
        // For simplicity, we just calculate for all time unless query params exist
        // Currently each slot is 2 hours (per aiControleers.js logic). We can calculate based on heuredebut/heurefin theoretically, but let's just count plannings * 2 for now, or actually parse hr.
        
        const filter = { publie: true };
        const plannings = await Planning.find(filter).populate('employe receveur');
        
        const workHours = {};

        plannings.forEach(p => {
            const startH = parseInt(p.heuredebut.split(':')[0], 10);
            const endH = parseInt(p.heurefin.split(':')[0], 10);
            const diff = endH - startH;

            if (p.employe && p.employe._id) {
                const eId = p.employe._id.toString();
                if (!workHours[eId]) {
                    workHours[eId] = { nom: p.employe.nom, prenom: p.employe.prenom, role: p.employe.role, hours: 0 };
                }
                workHours[eId].hours += diff;
            }

            if (p.receveur && p.receveur._id) {
                const rId = p.receveur._id.toString();
                if (!workHours[rId]) {
                    workHours[rId] = { nom: p.receveur.nom, prenom: p.receveur.prenom, role: p.receveur.role, hours: 0 };
                }
                workHours[rId].hours += diff;
            }
        });

        res.status(200).json({ workHours: Object.values(workHours) });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export default { getAdminStats };
