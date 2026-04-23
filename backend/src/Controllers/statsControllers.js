import Planning from '../models/planning.js';
<<<<<<< HEAD
import Employe from '../models/employe.js';
import Bus from '../models/bus.js';
import Ligne from '../models/ligne.js';

// ── Helper: split a time slot into day and night hours ──────────────────────
// Day = 05:00–20:00, Night = 20:00–05:00
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

      if (p.employe && p.employe._id) {
        const eId = p.employe._id.toString();
        if (!workHours[eId]) {
          workHours[eId] = {
            nom: p.employe.nom, prenom: p.employe.prenom,
            role: p.employe.role, hours: 0, dayHours: 0, nightHours: 0,
          };
        }
        workHours[eId].hours += dayHours + nightHours;
        workHours[eId].dayHours += dayHours;
        workHours[eId].nightHours += nightHours;
      }

      if (p.receveur && p.receveur._id) {
        const rId = p.receveur._id.toString();
        if (!workHours[rId]) {
          workHours[rId] = {
            nom: p.receveur.nom, prenom: p.receveur.prenom,
            role: p.receveur.role, hours: 0, dayHours: 0, nightHours: 0,
          };
        }
        workHours[rId].hours += dayHours + nightHours;
        workHours[rId].dayHours += dayHours;
        workHours[rId].nightHours += nightHours;
      }
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
    const slotsPerDay = 8; // 8 time slots per day

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

// ── GET /stats/employee-hours/:employeeId — Per-employee day/night breakdown ─
export async function getEmployeeWorkHours(req, res) {
  try {
    const { employeeId } = req.params;
    const { start, end } = req.query;

    const filter = {
      $or: [{ employe: employeeId }, { receveur: employeeId }],
      publie: true,
    };

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const plannings = await Planning.find(filter)
      .populate('ligne bus employe receveur')
      .sort({ date: 1, heuredebut: 1 });

    // Group by date
    const dailyBreakdown = {};
    let totalDay = 0;
    let totalNight = 0;

    plannings.forEach(p => {
      const dateKey = p.date.toISOString().split('T')[0];
      const { dayHours, nightHours } = splitDayNight(p.heuredebut, p.heurefin);

      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          date: dateKey,
          dayHours: 0,
          nightHours: 0,
          totalHours: 0,
          slots: [],
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

export default { getAdminStats, getEmployeeWorkHours };
=======

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
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a
