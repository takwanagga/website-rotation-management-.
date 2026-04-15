import Planning from '../models/planning.js';
import Bus from '../models/bus.js';
import Employe from '../models/employe.js';
import Ligne from '../models/ligne.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const HEURES = [
  { label: "06:00-08:00", start: 6,  end: 8,  heuredebut: "06:00", heurefin: "08:00" },
  { label: "08:00-10:00", start: 8,  end: 10, heuredebut: "08:00", heurefin: "10:00" },
  { label: "10:00-12:00", start: 10, end: 12, heuredebut: "10:00", heurefin: "12:00" },
  { label: "12:00-14:00", start: 12, end: 14, heuredebut: "12:00", heurefin: "14:00" },
  { label: "14:00-16:00", start: 14, end: 16, heuredebut: "14:00", heurefin: "16:00" },
  { label: "16:00-18:00", start: 16, end: 18, heuredebut: "16:00", heurefin: "18:00" },
  { label: "18:00-20:00", start: 18, end: 20, heuredebut: "18:00", heurefin: "20:00" },
  { label: "20:00-22:00", start: 20, end: 22, heuredebut: "20:00", heurefin: "22:00" },
];

const MAX_DAILY_HOURS = 8;
const SLOT_HOURS       = 2;

// ── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Score an employee for a specific slot + line.
 * Returns -Infinity when the employee cannot be assigned.
 */
function scoreEmployee(employee, slot, ligne, dailyHoursMap) {
  const hoursUsed = dailyHoursMap[employee._id.toString()] ?? 0;

  // Hard constraint: 8-hour daily ceiling
  if (hoursUsed + SLOT_HOURS > MAX_DAILY_HOURS) return -Infinity;

  const age          = employee.age ?? 35;
  const distance     = ligne.distance ?? 0;
  const isNight      = slot.start >= 18;
  const isEarlyMorn  = slot.start < 8;
  const isLongRoute  = distance > 40;
  const isMedRoute   = distance > 20 && distance <= 40;

  let score = 100;

  // ── Age-based rules ─────────────────────────────────────────────────────
  if (age >= 55) {
    if (isNight)     score -= 50;   // Protect seniors from late shifts
    if (isEarlyMorn) score -= 25;   // Protect from very early
    if (isLongRoute) score -= 30;   // Protect from demanding long routes
    if (isMedRoute)  score -= 10;
  } else if (age >= 45) {
    if (isNight)     score -= 25;
    if (isLongRoute) score -= 15;
  } else if (age >= 35) {
    // Prime age: neutral – very slight night preference to keep seniors day-assigned
    if (isNight) score += 5;
  } else {
    // Young employees (< 35) – handle nights and long routes best
    if (isNight)     score += 15;
    if (isLongRoute) score += 10;
    if (isEarlyMorn) score += 8;   // Energetic early start
  }

  // ── Load-balancing: prefer less-loaded employees ─────────────────────
  score -= hoursUsed * 6;

  // ── Soft bonus: keep consecutive slots on the same route (fatigue less
  //    disruptive than many context switches) – simple approximation
  score += (MAX_DAILY_HOURS - hoursUsed - SLOT_HOURS) * 2;

  return score;
}

/**
 * Score a bus for a given route.
 * Future-proof: could incorporate bus model capacity vs distance.
 */
function scoreBus(bus, ligne) {
  const distance = ligne.distance ?? 0;
  let score = 100;

  // Longer routes should prefer buses that aren't already heavily rotated
  // (proxy: we just use equal weighting here – extend with bus mileage data later)
  if (distance > 50) score += 10;

  return score;
}

// ── Main controller ──────────────────────────────────────────────────────────

/**
 * POST /ai/generate-planning
 * Body: { date: "YYYY-MM-DD" }
 *
 * Returns a frontend-compatible `assignments` object plus planning entries
 * pre-saved to the database (publie: false).
 */
export async function generatePlanningIA(req, res) {
  try {
    const { date, saveToDb = false } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Le champ 'date' est obligatoire." });
    }

    // ── Fetch active resources ─────────────────────────────────────────────
    const [buses, employes, lignes] = await Promise.all([
      Bus.find({ status: 'actif' }).lean(),
      Employe.find({ statut: 'actif' }).lean(),
      Ligne.find({ status: 'actif' }).lean(),
    ]);

    const chauffeurs = employes.filter(e => e.role === 'chauffeur');
    const receveurs  = employes.filter(e => e.role === 'receveur');

    // ── Validation ─────────────────────────────────────────────────────────
    if (lignes.length === 0)
      return res.status(422).json({ message: "Aucune ligne active n'a été trouvée." });
    if (buses.length === 0)
      return res.status(422).json({ message: "Aucun bus disponible n'a été trouvé." });
    if (chauffeurs.length === 0)
      return res.status(422).json({ message: "Aucun chauffeur actif n'a été trouvé." });
    if (receveurs.length === 0)
      return res.status(422).json({ message: "Aucun receveur actif n'a été trouvé." });

    // ── State trackers ────────────────────────────────────────────────────
    // busSlotUsed[busId__slotLabel]  = true  → bus already committed this slot
    // empSlotUsed[empId__slotLabel]  = true  → employee already committed
    // dailyHours[empId]              = hours committed today (number)
    const busSlotUsed  = {};
    const empSlotUsed  = {};
    const dailyHours   = {};

    const assignments   = {};  // frontend-compatible map
    const planningDocs  = [];  // DB records (if saveToDb)

    // ── Core scheduling loop ──────────────────────────────────────────────
    for (const slot of HEURES) {
      for (const ligne of lignes) {
        // ── Pick best bus ──────────────────────────────────────────────
        let bestBus   = null;
        let bestBusScore = -Infinity;

        for (const bus of buses) {
          const key = `${bus._id}__${slot.label}`;
          if (busSlotUsed[key]) continue;

          const s = scoreBus(bus, ligne);
          if (s > bestBusScore) { bestBusScore = s; bestBus = bus; }
        }

        // ── Pick best chauffeur ────────────────────────────────────────
        let bestDriver      = null;
        let bestDriverScore = -Infinity;

        for (const emp of chauffeurs) {
          const key = `${emp._id}__${slot.label}`;
          if (empSlotUsed[key]) continue;

          const s = scoreEmployee(emp, slot, ligne, dailyHours);
          if (s > bestDriverScore) { bestDriverScore = s; bestDriver = emp; }
        }

        // ── Pick best receveur ─────────────────────────────────────────
        let bestReceveur      = null;
        let bestReceveurScore = -Infinity;

        for (const emp of receveurs) {
          const key = `${emp._id}__${slot.label}`;
          if (empSlotUsed[key]) continue;

          const s = scoreEmployee(emp, slot, ligne, dailyHours);
          if (s > bestReceveurScore) { bestReceveurScore = s; bestReceveur = emp; }
        }

        // ── Only commit if all three resources are found ───────────────
        if (!bestBus || !bestDriver || !bestReceveur) continue;

        // Mark as used
        busSlotUsed[`${bestBus._id}__${slot.label}`]     = true;
        empSlotUsed[`${bestDriver._id}__${slot.label}`]  = true;
        empSlotUsed[`${bestReceveur._id}__${slot.label}`] = true;

        // Accumulate hours
        const drivId = bestDriver._id.toString();
        const recId  = bestReceveur._id.toString();
        dailyHours[drivId] = (dailyHours[drivId] ?? 0) + SLOT_HOURS;
        dailyHours[recId]  = (dailyHours[recId]  ?? 0) + SLOT_HOURS;

        // ── Build frontend-compatible assignment keys ───────────────────
        const dateKey  = date;
        const ligneId  = ligne._id.toString();

        const driverKey   = `${dateKey}__${slot.label}__${ligneId}__driver`;
        const receveurKey = `${dateKey}__${slot.label}__${ligneId}__receveur`;
        const busKey      = `${dateKey}__${slot.label}__${ligneId}__bus`;

        assignments[driverKey] = {
          ...bestDriver,
          _id:        bestDriver._id.toString(),
          type:       'driver',
          employeeId: bestDriver._id.toString(),
        };

        assignments[receveurKey] = {
          ...bestReceveur,
          _id:        bestReceveur._id.toString(),
          type:       'receveur',
          employeeId: bestReceveur._id.toString(),
        };

        assignments[busKey] = {
          ...bestBus,
          _id:         bestBus._id.toString(),
          type:        'bus',
          busId:       bestBus._id.toString(),
          matricule:   bestBus.matricule,
          immatriculation: bestBus.matricule,
        };

        // ── Collect DB records (driver slot only – one planning per slot) ──
        planningDocs.push({
          date:      new Date(date),
          heuredebut: slot.heuredebut,
          heurefin:   slot.heurefin,
          ligne:      ligne._id,
          bus:        bestBus._id,
          employe:    bestDriver._id,
          publie:     false,
        });
      }
    }

    // ── Optionally persist plannings ───────────────────────────────────────
    let savedCount = 0;
    if (saveToDb && planningDocs.length > 0) {
      try {
        const inserted = await Planning.insertMany(planningDocs, { ordered: false });
        savedCount = inserted.length;
      } catch (dbErr) {
        // Partial inserts are acceptable (duplicate-key conflicts)
        console.warn("AI planning partial insert:", dbErr.message);
        savedCount = dbErr.result?.nInserted ?? 0;
      }
    }

    // ── Build stats summary ────────────────────────────────────────────────
    const busesUsed    = new Set(Object.values(assignments).filter(a => a.type === 'bus').map(a => a.busId));
    const employeesUsed = new Set(Object.values(assignments).filter(a => a.type !== 'bus').map(a => a.employeeId));

    const stats = {
      totalSlots:         HEURES.length * lignes.length,
      assignedSlots:      planningDocs.length,
      coveragePercent:    Math.round((planningDocs.length / (HEURES.length * lignes.length)) * 100),
      busesUsed:          busesUsed.size,
      employeesAssigned:  employeesUsed.size,
      savedToDb:          savedCount,
      dailyHoursPerEmployee: dailyHours,
    };

    return res.status(200).json({ assignments, stats });

  } catch (error) {
    console.error("Error in generatePlanningIA:", error);
    return res.status(500).json({ message: "Erreur interne du serveur.", detail: error.message });
  }
}

export default { generatePlanningIA };