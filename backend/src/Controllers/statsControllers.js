import Planning from '../models/planning.js';
import Employe from '../models/employe.js';
import Bus from '../models/bus.js';
import Ligne from '../models/ligne.js';

// ── Helper: split a time slot into day and night hours ──────────────────────
function splitDayNight(heuredebut, heurefin) {
  const DAY_START = 5;
  const DAY_END = 20;

  const startH = parseInt(heuredebut.split(':')[0], 10);
  const endH = parseInt(heurefin.split(':')[0], 10);
  const total = endH - startH;

  if (total <= 0) return { dayHours: 0, nightHours: 0 };

  let dayHours = 0;
  let nightHours = 0;

  for (let h = startH; h < endH; h++) {
    if (h >= DAY_START && h < DAY_END) {
      dayHours++;
    } else {
      nightHours++;
    }
  }

  return { dayHours, nightHours };
}

// ── GET /stats/admin — Full dashboard stats ──────────────────────────────────
export async function getAdminStats(req, res) {
  try {
    const filter = { publie: true };
    const plannings = await Planning.find(filter).populate('employe receveur');

    // ── Work hours per employee ──
    const workHours = {};
    plannings.forEach(p => {
      const { dayHours, nightHours } = splitDayNight(p.heuredebut, p.heurefin);

      const processPerson = (person) => {
        if (person && person._id) {
          const id = person._id.toString();
          if (!workHours[id]) {
            workHours[id] = {
              nom: person.nom, prenom: person.prenom,
              role: person.role, hours: 0, dayHours: 0, nightHours: 0,
            };
          }
          workHours[id].hours += dayHours + nightHours;
          workHours[id].dayHours += dayHours;
          workHours[id].nightHours += nightHours;
        }
      };

      processPerson(p.employe);
      processPerson(p.receveur);
    });

    // ── Resource status counts ──
    const [employees, buses, lines] = await Promise.all([
      Employe.find().lean(),
      Bus.find().lean(),
      Ligne.find().lean(),
    ]);

    const employeeStatus = {
      actif: employees.filter(e => (e.statut || 'actif') === 'actif').length,
      'en congé': employees.filter(e => e.statut === 'en congé').length,
      inactif: employees.filter(e => e.statut === 'inactif').length,
      total: employees.length,
    };

    const busStatus = {
      actif: buses.filter(b => (b.status || 'actif') === 'actif').length,
      'en maintenance': buses.filter(b => b.status === 'en maintenance').length,
      'retiré': buses.filter(b => b.status === 'retiré').length,
      total: buses.length,
    };

    const lineStatus = {
      actif: lines.filter(l => (l.status || 'actif') === 'actif').length,
      inactif: lines.filter(l => l.status === 'inactif').length,
      total: lines.length,
    };

    // ── Planning coverage (last 7 days) ──
    const coverageData = [];
    const activeLinesCount = lineStatus.actif || 1;
    const slotsPerDay = 8; 

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

      const dayPlannings = plannings.filter(p => p.date && p.date.toISOString().split('T')[0] === dateStr);
      const totalPossible = activeLinesCount * slotsPerDay;
      const covered = dayPlannings.length;
      const percent = totalPossible > 0 ? Math.round((covered / totalPossible) * 100) : 0;

      coverageData.push({ date: dateStr, label: dayLabel, covered, totalPossible, percent });
    }

    res.status(200).json({
      workHours: Object.values(workHours),
      employeeStatus,
      busStatus,
      lineStatus,
      coverageData,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── GET /stats/employee-hours/:employeeId ────────────────────────────────────
export async function getEmployeeWorkHours(req, res) {
  try {
    const { employeeId } = req.params;
    const { start, end } = req.query;

    const filter = {
      $or: [{ employe: employeeId }, { receveur: employeeId }],
      publie: true,
    };

    if (start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
      filter.date.$lte.setHours(23, 59, 59, 999);
    }

    const plannings = await Planning.find(filter)
      .populate('ligne bus employe receveur')
      .sort({ date: 1, heuredebut: 1 });

    const dailyBreakdown = {};
    let totalDay = 0;
    let totalNight = 0;

    plannings.forEach(p => {
      const dateKey = p.date.toISOString().split('T')[0];
      const { dayHours, nightHours } = splitDayNight(p.heuredebut, p.heurefin);

      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          date: dateKey, dayHours: 0, nightHours: 0, totalHours: 0, slots: [],
        };
      }

      dailyBreakdown[dateKey].dayHours += dayHours;
      dailyBreakdown[dateKey].nightHours += nightHours;
      dailyBreakdown[dateKey].totalHours += dayHours + nightHours;
      dailyBreakdown[dateKey].slots.push({
        heuredebut: p.heuredebut,
        heurefin: p.heurefin,
        ligne: p.ligne?.libelle || '—',
        bus: p.bus?.matricule || '—',
        dayHours,
        nightHours,
      });

      totalDay += dayHours;
      totalNight += nightHours;
    });

    res.status(200).json({
      employeeId,
      totalDayHours: totalDay,
      totalNightHours: totalNight,
      totalHours: totalDay + totalNight,
      dailyBreakdown: Object.values(dailyBreakdown),
    });
  } catch (error) {
    console.error("Error fetching employee work hours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Ensure you only have ONE default export at the very end
export default { getAdminStats, getEmployeeWorkHours };