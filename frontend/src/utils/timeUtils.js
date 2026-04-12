// Time utilities for planning calculations

/**
 * Parse time string (HH:mm) to minutes from midnight
 */
export function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Parse time range string ("HH:mm-HH:mm") to minutes
 */
export function parseTimeRange(rangeStr) {
  const [start, end] = rangeStr.split('-');
  return {
    start: timeToMinutes(start),
    end: timeToMinutes(end),
    duration: timeToMinutes(end) - timeToMinutes(start),
    startStr: start,
    endStr: end
  };
}

/**
 * Check if two time ranges overlap
 * Overlap exists when: start1 < end2 && start2 < end1
 * Consecutive slots (end1 === start2) do NOT overlap
 */
export function hasOverlap(range1, range2) {
  const r1 = typeof range1 === 'string' ? parseTimeRange(range1) : range1;
  const r2 = typeof range2 === 'string' ? parseTimeRange(range2) : range2;
  return r1.start < r2.end && r2.start < r1.end;
}

/**
 * Check if two time ranges are consecutive (end1 === start2)
 */
export function isConsecutive(range1, range2) {
  const r1 = typeof range1 === 'string' ? parseTimeRange(range1) : range1;
  const r2 = typeof range2 === 'string' ? parseTimeRange(range2) : range2;
  return r1.end === r2.start || r2.end === r1.start;
}

/**
 * Format date to YYYY-MM-DD key
 */
export function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Check if two dates are the same day
 */
export function isSameDate(d1, d2) {
  return formatDateKey(d1) === formatDateKey(d2);
}

/**
 * Calculate total assigned hours for an employee on a specific date
 * @param {Object} assignments - All assignments object
 * @param {string} dateKey - Date key in YYYY-MM-DD format
 * @param {string} employeeId - Employee ID
 * @returns {number} Total hours assigned
 */
export function getEmployeeDailyHours(assignments, dateKey, employeeId) {
  let totalMinutes = 0;
  
  Object.entries(assignments).forEach(([key, assignment]) => {
    if (assignment.employeeId !== employeeId) return;
    
    const [keyDate, timeRange] = key.split('__');
    if (keyDate !== dateKey) return;
    
    const { duration } = parseTimeRange(timeRange);
    totalMinutes += duration;
  });
  
  return totalMinutes / 60;
}

/**
 * Calculate total assigned hours for a bus on a specific date
 * @param {Object} assignments - All assignments object
 * @param {string} dateKey - Date key in YYYY-MM-DD format
 * @param {string} busId - Bus ID
 * @returns {number} Total hours assigned
 */
export function getBusDailyHours(assignments, dateKey, busId) {
  let totalMinutes = 0;
  
  Object.entries(assignments).forEach(([key, assignment]) => {
    if (assignment.type !== 'bus' || assignment.busId !== busId) return;
    
    const [keyDate, timeRange] = key.split('__');
    if (keyDate !== dateKey) return;
    
    const { duration } = parseTimeRange(timeRange);
    totalMinutes += duration;
  });
  
  return totalMinutes / 60;
}

/**
 * Check if an employee is available for a specific time slot
 * @param {Object} params - Check parameters
 * @returns {Object} { available: boolean, reason?: string }
 */
export function checkEmployeeAvailability({
  assignments,
  dateKey,
  timeRange,
  employeeId,
  currentKey = null,
  maxDailyHours = 8
}) {
  const { duration } = parseTimeRange(timeRange);
  const newSlotHours = duration / 60;
  
  // Calculate current daily hours excluding the current assignment being edited
  let currentDailyHours = 0;
  const existingSlots = [];
  
  Object.entries(assignments).forEach(([key, assignment]) => {
    if (key === currentKey) return;
    if (assignment.employeeId !== employeeId) return;
    
    const [keyDate, keyTimeRange] = key.split('__');
    if (keyDate !== dateKey) return;
    
    const slotInfo = parseTimeRange(keyTimeRange);
    currentDailyHours += slotInfo.duration / 60;
    existingSlots.push({ key, timeRange: keyTimeRange, ...slotInfo });
  });
  
  // Check 8-hour daily limit
  if (currentDailyHours + newSlotHours > maxDailyHours) {
    return {
      available: false,
      reason: `Limite journalière: ${currentDailyHours.toFixed(1)}/${maxDailyHours}h déjà assignées`
    };
  }
  
  // Check for overlaps with existing slots
  const newSlot = parseTimeRange(timeRange);
  for (const existing of existingSlots) {
    if (hasOverlap(newSlot, existing)) {
      return {
        available: false,
        reason: `Conflit horaire avec ${existing.timeRange}`
      };
    }
  }
  
  return {
    available: true,
    currentHours: currentDailyHours,
    remainingHours: maxDailyHours - currentDailyHours - newSlotHours
  };
}

/**
 * Check if a bus is available for a specific time slot
 * Buses CAN do consecutive slots but NOT overlapping
 * @param {Object} params - Check parameters
 * @returns {Object} { available: boolean, reason?: string }
 */
export function checkBusAvailability({
  assignments,
  dateKey,
  timeRange,
  busId,
  currentKey = null
}) {
  const newSlot = parseTimeRange(timeRange);
  const existingSlots = [];
  
  Object.entries(assignments).forEach(([key, assignment]) => {
    if (key === currentKey) return;
    if (assignment.type !== 'bus' || assignment.busId !== busId) return;
    
    const [keyDate, keyTimeRange] = key.split('__');
    if (keyDate !== dateKey) return;
    
    existingSlots.push({
      key,
      timeRange: keyTimeRange,
      ...parseTimeRange(keyTimeRange)
    });
  });
  
  // Check for overlaps (consecutive is OK)
  for (const existing of existingSlots) {
    if (hasOverlap(newSlot, existing)) {
      return {
        available: false,
        reason: `Bus déjà assigné sur ${existing.timeRange}`
      };
    }
  }
  
  return { available: true };
}
