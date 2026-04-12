import { useMemo, useCallback } from 'react';
import {
  formatDateKey,
  checkEmployeeAvailability,
  checkBusAvailability,
  getEmployeeDailyHours,
  getBusDailyHours,
  parseTimeRange
} from '../utils/timeUtils.js';

/**
 * Hook for managing availability checks and resource filtering
 * Provides efficient lookups and availability calculations
 */
export function useAvailability({
  assignments,
  chauffeurs,
  receveurs,
  buses,
  selectedDate,
  selectedTimeRange,
  maxDailyHours = 8
}) {
  const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  // Build indexes for efficient lookups
  const { busyEmployeeIds, busyBusIds, employeeHours, busHours } = useMemo(() => {
    const busyEmployees = new Set();
    const busyBuses = new Set();
    const empHours = {};
    const busHrs = {};

    Object.entries(assignments).forEach(([key, assignment]) => {
      const [keyDate, timeRange] = key.split('__');
      if (keyDate !== dateKey) return;

      const { duration } = parseTimeRange(timeRange);
      const hours = duration / 60;

      if (selectedTimeRange) {
        const isOverlap = checkOverlap(selectedTimeRange, timeRange);
        
        if (assignment.employeeId && isOverlap) {
          busyEmployees.add(assignment.employeeId);
        }
        if (assignment.type === 'bus' && assignment.busId && isOverlap) {
          busyBuses.add(assignment.busId);
        }
      }

      // Track hours
      if (assignment.employeeId) {
        empHours[assignment.employeeId] = (empHours[assignment.employeeId] || 0) + hours;
      }
      if (assignment.type === 'bus' && assignment.busId) {
        busHrs[assignment.busId] = (busHrs[assignment.busId] || 0) + hours;
      }
    });

    return {
      busyEmployeeIds: busyEmployees,
      busyBusIds: busyBuses,
      employeeHours: empHours,
      busHours: busHrs
    };
  }, [assignments, dateKey, selectedTimeRange]);

  // Helper to check time overlap
  const checkOverlap = useCallback((range1, range2) => {
    const r1 = parseTimeRange(range1);
    const r2 = parseTimeRange(range2);
    return r1.start < r2.end && r2.start < r1.end;
  }, []);

  // Get availability status for an employee
  const getEmployeeStatus = useCallback((employee) => {
    if (!selectedTimeRange) {
      return { available: true, status: 'unknown' };
    }

    const hoursUsed = employeeHours[employee._id] || 0;
    const { duration } = parseTimeRange(selectedTimeRange);
    const slotHours = duration / 60;

    // Check if already busy at this time
    const isBusy = busyEmployeeIds.has(employee._id);
    if (isBusy) {
      return {
        available: false,
        status: 'busy',
        reason: 'Déjà assigné sur ce créneau',
        hoursUsed,
        remainingHours: maxDailyHours - hoursUsed
      };
    }

    // Check 8-hour limit
    if (hoursUsed + slotHours > maxDailyHours) {
      return {
        available: false,
        status: 'limit',
        reason: `Limite ${maxDailyHours}h atteinte (${hoursUsed.toFixed(1)}h)`,
        hoursUsed,
        remainingHours: 0
      };
    }

    // Check approaching limit (>6 hours)
    if (hoursUsed + slotHours > 6) {
      return {
        available: true,
        status: 'warning',
        hoursUsed,
        remainingHours: maxDailyHours - hoursUsed - slotHours
      };
    }

    return {
      available: true,
      status: 'available',
      hoursUsed,
      remainingHours: maxDailyHours - hoursUsed - slotHours
    };
  }, [busyEmployeeIds, employeeHours, selectedTimeRange, maxDailyHours]);

  // Get availability status for a bus
  const getBusStatus = useCallback((bus) => {
    if (!selectedTimeRange) {
      return { available: true, status: 'unknown' };
    }

    const isBusy = busyBusIds.has(bus._id);
    if (isBusy) {
      return {
        available: false,
        status: 'busy',
        reason: 'Déjà assigné sur ce créneau'
      };
    }

    return {
      available: true,
      status: 'available'
    };
  }, [busyBusIds, selectedTimeRange]);

  // Filtered available resources
  const availableChauffeurs = useMemo(() => {
    if (!selectedTimeRange) return chauffeurs;
    return chauffeurs.map(c => ({
      ...c,
      availability: getEmployeeStatus(c)
    }));
  }, [chauffeurs, selectedTimeRange, getEmployeeStatus]);

  const availableReceveurs = useMemo(() => {
    if (!selectedTimeRange) return receveurs;
    return receveurs.map(r => ({
      ...r,
      availability: getEmployeeStatus(r)
    }));
  }, [receveurs, selectedTimeRange, getEmployeeStatus]);

  const availableBuses = useMemo(() => {
    if (!selectedTimeRange) return buses;
    return buses.map(b => ({
      ...b,
      availability: getBusStatus(b)
    }));
  }, [buses, selectedTimeRange, getBusStatus]);

  // Check if assignment is allowed
  const canAssignEmployee = useCallback((employeeId, timeRange, currentKey = null) => {
    return checkEmployeeAvailability({
      assignments,
      dateKey,
      timeRange,
      employeeId,
      currentKey,
      maxDailyHours
    });
  }, [assignments, dateKey, maxDailyHours]);

  const canAssignBus = useCallback((busId, timeRange, currentKey = null) => {
    return checkBusAvailability({
      assignments,
      dateKey,
      timeRange,
      busId,
      currentKey
    });
  }, [assignments, dateKey]);

  // Get conflicts for entire assignment set
  const conflicts = useMemo(() => {
    const conflictList = [];
    const employeeSlots = {};

    Object.entries(assignments).forEach(([key, assignment]) => {
      if (!assignment.employeeId) return;

      const [keyDate, timeRange, ligneId] = key.split('__');
      if (keyDate !== dateKey) return;

      if (!employeeSlots[assignment.employeeId]) {
        employeeSlots[assignment.employeeId] = [];
      }
      employeeSlots[assignment.employeeId].push({
        key,
        timeRange,
        ligneId,
        assignment
      });
    });

    // Check for overlaps per employee
    Object.entries(employeeSlots).forEach(([employeeId, slots]) => {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slot1 = parseTimeRange(slots[i].timeRange);
          const slot2 = parseTimeRange(slots[j].timeRange);

          if (slot1.start < slot2.end && slot2.start < slot1.end) {
            const employee = chauffeurs.find(c => c._id === employeeId) ||
                           receveurs.find(r => r._id === employeeId);
            conflictList.push({
              type: 'overlap',
              employeeId,
              employeeName: employee ? `${employee.nom} ${employee.prenom}` : 'Inconnu',
              timeRange1: slots[i].timeRange,
              timeRange2: slots[j].timeRange,
              message: `${employee?.nom || 'Employé'} a un conflit: ${slots[i].timeRange} et ${slots[j].timeRange}`
            });
          }
        }
      }
    });

    return conflictList;
  }, [assignments, dateKey, chauffeurs, receveurs]);

  return {
    availableChauffeurs,
    availableReceveurs,
    availableBuses,
    getEmployeeStatus,
    getBusStatus,
    canAssignEmployee,
    canAssignBus,
    conflicts,
    employeeHours,
    busHours
  };
}