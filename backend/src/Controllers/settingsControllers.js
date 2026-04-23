import Settings from '../models/settings.js';

// Get settings (auto-create if not exist)
export async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = await Settings.create({ key: 'global' });
    }
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des paramètres.' });
  }
}

// Update settings
export async function updateSettings(req, res) {
  try {
    const allowedFields = [
      'appName', 'supportEmail', 'timezone',
      'emailNotificationsEnabled', 'notifyOnPlanningPublish',
      'notifyOnPasswordChange', 'notifyOnPlanningModification',
      'workDayStart', 'workDayEnd', 'slotDurationHours', 'maxDailyHoursPerEmployee',
      'sessionTimeoutHours', 'enforceStrongPasswords',
      'theme',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    let settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ message: 'Paramètres mis à jour avec succès.', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(400).json({ error: error.message || 'Erreur lors de la mise à jour des paramètres.' });
  }
}

export default { getSettings, updateSettings };
