import cron from 'node-cron';
import Planning from './models/planning.js';
import Notification from './models/notification.js';

/**
 * Scheduler: auto-publish planning every day at 12:00 PM.
 * Publishes all unpublished plannings for the NEXT day and notifies employees.
 */
export function startScheduler() {
  // Run every day at 12:00 PM
  cron.schedule('0 12 * * *', async () => {
    console.log('[Scheduler] Running auto-publish job at', new Date().toISOString());

    try {
      // Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find all unpublished plannings for tomorrow
      const plannings = await Planning.find({
        date: { $gte: tomorrow, $lt: dayAfterTomorrow },
        publie: false,
      }).populate('employe receveur');

      if (plannings.length === 0) {
        console.log('[Scheduler] No unpublished plannings for tomorrow.');
        return;
      }

      // Publish them all
      const ids = plannings.map(p => p._id);
      await Planning.updateMany(
        { _id: { $in: ids } },
        { $set: { publie: true } }
      );

      console.log(`[Scheduler] Published ${plannings.length} planning(s) for ${tomorrow.toISOString().split('T')[0]}`);

      // Collect unique employee IDs to notify
      const employeeIds = new Set();
      plannings.forEach(p => {
        if (p.employe?._id) employeeIds.add(p.employe._id.toString());
        if (p.receveur?._id) employeeIds.add(p.receveur._id.toString());
      });

      // Send notifications
      const dateStr = tomorrow.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      const notifications = [...employeeIds].map(empId => ({
        destinataire: empId,
        message: `📅 Votre planning du ${dateStr} a été automatiquement publié. Connectez-vous pour le consulter.`,
        type: 'planning_publie',
        vue: false,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`[Scheduler] Notified ${notifications.length} employee(s).`);
      }
    } catch (error) {
      console.error('[Scheduler] Auto-publish error:', error);
    }
  }, {
    timezone: 'Africa/Tunis'
  });

  console.log('[Scheduler] Auto-publish cron job started (daily at 12:00 PM Africa/Tunis)');
}
