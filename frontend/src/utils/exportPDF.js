import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportPlanningPDF(selectedDate, lignes, assignments, HEURES) {
  const doc = new jsPDF({ orientation: "landscape" });
  const dateStr = selectedDate.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  
  doc.setFontSize(16);
  doc.text(`Planning du ${dateStr}`, 14, 15);
  
  const dateKey = selectedDate.toISOString().split("T")[0];
  
  const head = [["Heure", ...lignes.map(l => l.libelle)]];
  
  const body = HEURES.map(heure => {
    const row = [heure];
    for (const ligne of lignes) {
      const bus = assignments[`${dateKey}__${heure}__${ligne._id}__bus`];
      const driver = assignments[`${dateKey}__${heure}__${ligne._id}__driver`];
      const rec = assignments[`${dateKey}__${heure}__${ligne._id}__receveur`];
      const parts = [];
      if (bus) parts.push(`Bus: ${bus.matricule}`);
      if (driver) parts.push(`Chauffeur: ${driver.nom} ${driver.prenom}`);
      if (rec) parts.push(`Receveur: ${rec.nom} ${rec.prenom}`);
      row.push(parts.join(" / ") || "-");
    }
    return row;
  });
  
  autoTable(doc, {
    head,
    body,
    startY: 25,
    styles: { fontSize: 8, font: "helvetica", fontStyle: "normal" },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    bodyStyles: { textColor: 0 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { fontStyle: "bold" } },
  });
  doc.save(`planning-${dateKey}.pdf`);
}