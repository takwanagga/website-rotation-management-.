import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // Only one settings document should exist — we use a fixed key
  key: {
    type: String,
    default: 'global',
    unique: true,
  },

  // ── General ──
  appName: {
    type: String,
    default: 'TransRoute',
    trim: true,
  },
  supportEmail: {
    type: String,
    default: 'support@transroute.com',
    trim: true,
  },
  timezone: {
    type: String,
    default: 'Africa/Tunis',
    trim: true,
  },

  // ── Notifications ──
  emailNotificationsEnabled: {
    type: Boolean,
    default: true,
  },
  notifyOnPlanningPublish: {
    type: Boolean,
    default: true,
  },
  notifyOnPasswordChange: {
    type: Boolean,
    default: true,
  },
  notifyOnPlanningModification: {
    type: Boolean,
    default: true,
  },

  // ── Planning ──
  workDayStart: {
    type: String,
    default: '06:00',
    trim: true,
  },
  workDayEnd: {
    type: String,
    default: '22:00',
    trim: true,
  },
  slotDurationHours: {
    type: Number,
    default: 2,
    min: 1,
    max: 8,
  },
  maxDailyHoursPerEmployee: {
    type: Number,
    default: 8,
    min: 1,
    max: 16,
  },

  // ── Security ──
  sessionTimeoutHours: {
    type: Number,
    default: 8,
    min: 1,
    max: 24,
  },
  enforceStrongPasswords: {
    type: Boolean,
    default: true,
  },

  // ── Theme ──
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'light',
  },
}, {
  timestamps: true,
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
