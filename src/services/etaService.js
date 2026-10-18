/**
 * Cordinia ETA & Delay Intelligence Service (Frontend Local Storage Prototype - Part 4B)
 * 
 * Provides deterministic, explainable ETA calculations for active doctor rounds,
 * augmented with Delay Intelligence derived from actual observed consultation durations.
 * 
 * Rules:
 *   - DEFAULT_CONSULTATION_MINUTES = 10
 *   - DEFAULT_FLOOR_TRANSITION_MINUTES = 2
 *   - Actual consultation duration = completedAt - startedAt (in whole minutes, min 1)
 *   - Observed round delay = average positive delay (actual - 10) among completed patients in current round
 *   - Waiting patient consultation duration = DEFAULT_CONSULTATION_MINUTES + observedRoundDelay
 *   - Current patient remaining time continues to be based on actual elapsed time vs DEFAULT_CONSULTATION_MINUTES
 *   - Floor transition (+2 min per floor change) is added when moving between different floors
 */

export const DEFAULT_CONSULTATION_MINUTES = 10;
export const DEFAULT_FLOOR_TRANSITION_MINUTES = 2;

/**
 * Calculate actual consultation duration in minutes for a COMPLETED patient.
 * @param {object} queueEntry - Queue entry record
 * @returns {number|null} Actual minutes or null if timestamps invalid/missing
 */
export function calculateActualConsultationMinutes(queueEntry) {
  if (!queueEntry) return null;

  if (typeof queueEntry.actualDurationMinutes === 'number' && queueEntry.actualDurationMinutes >= 0) {
    return queueEntry.actualDurationMinutes;
  }

  if (queueEntry.startedAt && queueEntry.completedAt) {
    try {
      const startMs = new Date(queueEntry.startedAt).getTime();
      const endMs = new Date(queueEntry.completedAt).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
        return Math.max(1, Math.floor((endMs - startMs) / (1000 * 60)));
      }
    } catch (err) {
      console.warn('[etaService] Failed to calculate actual duration:', err);
    }
  }

  return null;
}

/**
 * Calculate average observed positive round delay (in minutes) across completed patients in the round.
 * 
 * @param {Array} queue - Array of RoundPatientRecord
 * @returns {number} Average positive delay in whole minutes (>= 0)
 */
export function calculateObservedRoundDelay(queue) {
  if (!Array.isArray(queue) || queue.length === 0) {
    return 0;
  }

  const completedEntries = queue.filter((entry) => entry.status === 'COMPLETED');
  if (completedEntries.length === 0) {
    return 0;
  }

  const positiveDelays = [];

  for (const entry of completedEntries) {
    const actual = calculateActualConsultationMinutes(entry);
    if (actual !== null) {
      const delay = actual - DEFAULT_CONSULTATION_MINUTES;
      if (delay > 0) {
        positiveDelays.push(delay);
      }
    }
  }

  if (positiveDelays.length === 0) {
    return 0;
  }

  const sum = positiveDelays.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / positiveDelays.length);
}

/**
 * Calculate remaining consultation time in minutes for the CURRENT patient.
 * 
 * Formula:
 *   expectedDuration = DEFAULT_CONSULTATION_MINUTES + observedDelay
 *   remainingMinutes = Math.max(0, expectedDuration - elapsedMinutes)
 * 
 * @param {object} currentQueueEntry - Queue entry object (status === 'CURRENT')
 * @param {Date} [now=new Date()] - Current timestamp
 * @param {number} [observedDelay=0] - Average observed delay in round
 * @returns {number} Remaining consultation minutes (0 to expectedDuration)
 */
export function calculateRemainingConsultationMinutes(currentQueueEntry, now = new Date(), observedDelay = 0) {
  const safeDelay = typeof observedDelay === 'number' && observedDelay > 0 ? observedDelay : 0;
  const expectedDuration = DEFAULT_CONSULTATION_MINUTES + safeDelay;

  if (!currentQueueEntry || currentQueueEntry.status !== 'CURRENT') {
    return expectedDuration;
  }

  const startTimeStr = currentQueueEntry.startedAt;
  if (!startTimeStr) {
    return expectedDuration;
  }

  try {
    const startedAt = new Date(startTimeStr);
    const elapsedMs = now.getTime() - startedAt.getTime();
    
    // Handle invalid timestamps or clock skew (startedAt in future)
    if (isNaN(elapsedMs) || elapsedMs < 0) {
      return expectedDuration;
    }

    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    return Math.max(0, expectedDuration - elapsedMinutes);
  } catch (err) {
    console.warn('[etaService] Failed to parse startedAt timestamp:', err);
    return expectedDuration;
  }
}

/**
 * Calculate the active consultation overrun in minutes for the CURRENT patient.
 * Keeps completed-visit observed delay separate from active-consultation overrun.
 * Returns 0 if consultation is within expected duration or timestamps are missing/invalid/future.
 *
 * @param {object} currentQueueEntry - Queue entry with status === 'CURRENT'
 * @param {Date} [now=new Date()] - Current timestamp
 * @param {number} [observedDelay=0] - Completed visits observed delay
 * @returns {number} Whole minutes over expected duration (>= 0)
 */
export function calculateActiveConsultationOverrun(currentQueueEntry, now = new Date(), observedDelay = 0) {
  if (!currentQueueEntry || currentQueueEntry.status !== 'CURRENT') {
    return 0;
  }

  const startTimeStr = currentQueueEntry.startedAt;
  if (!startTimeStr) {
    return 0;
  }

  try {
    const startedAt = new Date(startTimeStr);
    const elapsedMs = now.getTime() - startedAt.getTime();

    // Guard against invalid timestamp or clock skew (startedAt in future)
    if (isNaN(elapsedMs) || elapsedMs < 0) {
      return 0;
    }

    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    const safeDelay = typeof observedDelay === 'number' && observedDelay > 0 ? observedDelay : 0;
    const expectedDuration = DEFAULT_CONSULTATION_MINUTES + safeDelay;

    return Math.max(0, elapsedMinutes - expectedDuration);
  } catch (err) {
    console.warn('[etaService] Failed to calculate active overrun:', err);
    return 0;
  }
}

/**
 * Calculate floor transition time in minutes between two patients.
 * Adds DEFAULT_FLOOR_TRANSITION_MINUTES if moving to a different floor.
 * 
 * @param {object|null} fromPatient - Previous patient record
 * @param {object|null} toPatient - Current patient record
 * @param {object} structure - Hospital structure
 * @returns {number} Transition minutes (0 or DEFAULT_FLOOR_TRANSITION_MINUTES)
 */
export function calculateFloorTransitionMinutes(fromPatient, toPatient, structure) {
  if (!fromPatient || !toPatient || !fromPatient.floorId || !toPatient.floorId) {
    return 0;
  }

  if (fromPatient.floorId !== toPatient.floorId) {
    return DEFAULT_FLOOR_TRANSITION_MINUTES;
  }

  return 0;
}

/**
 * Calculate ETAs and delay intelligence for all queue entries in an active round.
 * 
 * Part 7B Refinement:
 *   - Keeps completed-visit observed delay separate from active-consultation overrun.
 *   - Exposes activeOverrunMinutes on the return object and within each queue entry.
 *   - Explanations for waiting patients transparently identify active overruns without
 *     blindly compounding the single overrun into future patients' baselines.
 *
 * @param {Array} queue - Sorted array of RoundPatientRecord
 * @param {Array} patients - Array of PatientRecord
 * @param {object} structure - Hospital structure
 * @param {Date} [now=new Date()] - Current timestamp
 * @returns {{ etaMap: Object.<string, { patientId: string, status: string, etaMinutes: number|null, label: string, remainingLabel?: string, explanation?: string, activeOverrunMinutes?: number }>, observedDelay: number, activeOverrunMinutes: number }}
 */
export function calculateQueueEtas(queue, patients = [], structure = {}, now = new Date()) {
  const etaMap = {};
  const observedDelay = calculateObservedRoundDelay(queue);
  const adjustedConsultationMinutes = DEFAULT_CONSULTATION_MINUTES + observedDelay;

  if (!Array.isArray(queue) || queue.length === 0) {
    return { etaMap, observedDelay: 0, activeOverrunMinutes: 0 };
  }

  // Derive active consultation overrun separately from completed visits (Part 7B)
  const currentEntry = queue.find((entry) => entry.status === 'CURRENT');
  const activeOverrunMinutes = currentEntry
    ? calculateActiveConsultationOverrun(currentEntry, now, observedDelay)
    : 0;

  let accumulatedMinutes = 0;
  let currentIsOverrun = false;
  let firstWaitingSeen = false;

  for (let i = 0; i < queue.length; i++) {
    const entry = queue[i];
    const patient = patients.find((p) => p.patientId === entry.patientId) || null;

    if (entry.status === 'COMPLETED') {
      const actual = calculateActualConsultationMinutes(entry);
      etaMap[entry.roundPatientId] = {
        patientId: entry.patientId,
        status: 'COMPLETED',
        etaMinutes: null,
        actualMinutes: actual,
        label: 'Completed',
      };
    } else if (entry.status === 'CURRENT') {
      const remainingMinutes = calculateRemainingConsultationMinutes(entry, now, observedDelay);
      accumulatedMinutes = remainingMinutes;

      // Calculate elapsed minutes for transparent overrun labeling
      let elapsedMinutes = 0;
      if (entry.startedAt) {
        const startMs = new Date(entry.startedAt).getTime();
        const nowMs = now.getTime();
        if (!isNaN(startMs) && nowMs >= startMs) {
          elapsedMinutes = Math.floor((nowMs - startMs) / (1000 * 60));
        }
      }

      currentIsOverrun = activeOverrunMinutes > 0;
      const remainingLabel = currentIsOverrun
        ? `Extended consultation (~${elapsedMinutes} min elapsed)`
        : `Estimated remaining: ~${remainingMinutes} min`;

      etaMap[entry.roundPatientId] = {
        patientId: entry.patientId,
        status: 'CURRENT',
        etaMinutes: remainingMinutes,
        label: 'Being visited now',
        remainingLabel,
        isOverrun: currentIsOverrun,
        activeOverrunMinutes,
        elapsedMinutes,
      };
    } else if (entry.status === 'WAITING') {
      // Preceding patient in queue
      const prevEntry = queue[i - 1];
      const prevPatient = prevEntry ? patients.find((p) => p.patientId === prevEntry.patientId) : null;

      const transitionTime = calculateFloorTransitionMinutes(prevPatient, patient, structure);
      accumulatedMinutes += transitionTime;

      const waitMinutes = accumulatedMinutes;

      const isImmediateNext = !firstWaitingSeen;
      firstWaitingSeen = true;

      // Position-aware transparent explanations (Part 7C)
      let explanation = null;
      const positionSuffix = isImmediateNext
        ? (currentEntry ? 'You are next in the queue once the current visit is complete.' : 'You are next in the queue.')
        : 'Visits are progressing in queue order.';

      if (activeOverrunMinutes > 0 && observedDelay > 0) {
        explanation = `Current visit running +${activeOverrunMinutes} min · Completed visits pace +${observedDelay} min · ${positionSuffix}`;
      } else if (activeOverrunMinutes > 0) {
        explanation = `Current visit running +${activeOverrunMinutes} min · ${positionSuffix}`;
      } else if (observedDelay > 0) {
        explanation = `Adjusted +${observedDelay} min based on current round pace · ${positionSuffix}`;
      }

      const isImmediateAfterOverrun = prevEntry?.status === 'CURRENT' && currentIsOverrun;

      let waitLabel;
      if (isImmediateAfterOverrun && waitMinutes <= 0) {
        // Transparent status when previous visit is still running long on same floor
        waitLabel = 'Current visit in progress';
      } else if (waitMinutes <= 0) {
        waitLabel = 'Doctor arriving shortly';
      } else if (waitMinutes === 1) {
        waitLabel = 'Doctor arriving shortly (~1 min)';
      } else {
        waitLabel = `Estimated wait: ~${waitMinutes} min`;
      }

      etaMap[entry.roundPatientId] = {
        patientId: entry.patientId,
        status: 'WAITING',
        etaMinutes: waitMinutes,
        label: waitLabel,
        explanation,
        delayMinutes: observedDelay,
        activeOverrunMinutes,
      };

      // Accumulate adjusted consultation time for subsequent waiting patients
      // Conservative explainable rule: future patients use completed-visit pace (DEFAULT + observedDelay)
      // rather than compounding the single active visit's overrun across every future patient.
      accumulatedMinutes += adjustedConsultationMinutes;
    }
  }

  return { etaMap, observedDelay, activeOverrunMinutes };
}
