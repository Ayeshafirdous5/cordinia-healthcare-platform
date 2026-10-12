/**
 * Cordinia Notification Service (Frontend localStorage Prototype)
 * Manages in-app notifications for patients, doctors, nurses, and admins.
 * Key: cordinia_notifications  →  NotificationRecord[]
 *
 * NOTE (Part 6A): This is the foundation layer only.
 * Automatic round-triggered notifications are NOT wired here;
 * that is Part 6B. Part 6A exposes the full CRUD surface and a
 * service-level test helper (createNotification) for manual verification.
 */

const STORAGE_KEY = 'cordinia_notifications';

/**
 * @typedef {'patient'|'doctor'|'nurse'|'admin'} RecipientType
 * @typedef {'info'|'important'} NotificationPriority
 *
 * @typedef {Object} NotificationRecord
 * @property {string}            notificationId  - "notif-<base36ts>-<rand4>"
 * @property {RecipientType}     recipientType
 * @property {string}            recipientId
 * @property {string}            type            - free-text event name, e.g. "ROUND_STARTED"
 * @property {string}            title
 * @property {string}            message
 * @property {NotificationPriority} priority
 * @property {boolean}           read
 * @property {string}            createdAt       - ISO 8601
 */

// ─── ID generation ───────────────────────────────────────────────────────────

function generateNotifId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `notif-${ts}-${rand}`;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** @returns {NotificationRecord[]} */
function getAllNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Cordinia notificationService: failed to read storage:', err);
    return [];
  }
}

/** @param {NotificationRecord[]} notifications */
function saveAllNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.warn('Cordinia notificationService: failed to write storage:', err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve notifications for a specific recipient, sorted newest first.
 * Never exposes another recipient's notifications.
 *
 * @param {RecipientType} recipientType
 * @param {string} recipientId
 * @returns {NotificationRecord[]}
 */
export function getNotifications(recipientType, recipientId) {
  if (!recipientType || !recipientId) return [];
  return getAllNotifications()
    .filter(
      (n) =>
        n.recipientType === recipientType &&
        n.recipientId === recipientId,
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Count unread notifications for a specific recipient.
 *
 * @param {RecipientType} recipientType
 * @param {string} recipientId
 * @returns {number}
 */
export function getUnreadCount(recipientType, recipientId) {
  return getNotifications(recipientType, recipientId).filter((n) => !n.read).length;
}

/**
 * Create a new notification.
 * This is the primary write path — used by Part 6B event hooks and the
 * service-level test helper.
 *
 * @param {{
 *   recipientType: RecipientType,
 *   recipientId: string,
 *   type: string,
 *   title: string,
 *   message: string,
 *   priority?: NotificationPriority,
 * }} notification
 * @returns {NotificationRecord} the created record
 */
export function createNotification({
  recipientType,
  recipientId,
  type,
  title,
  message,
  priority = 'info',
  roundId,
  eventId,
}) {
  if (!recipientType || !recipientId) {
    console.warn('Cordinia notificationService: recipientType and recipientId are required');
    return null;
  }

  const all = getAllNotifications();

  // Idempotency: if eventId is provided, prevent duplicate notifications
  if (eventId) {
    const existing = all.find((n) => n.eventId === eventId);
    if (existing) {
      return existing;
    }
  }

  const record = {
    notificationId: generateNotifId(),
    recipientType,
    recipientId,
    type: type || 'GENERAL',
    title: title || 'Notification',
    message: message || '',
    priority: priority === 'important' ? 'important' : 'info',
    read: false,
    createdAt: new Date().toISOString(),
    ...(roundId ? { roundId } : {}),
    ...(eventId ? { eventId } : {}),
  };
  all.push(record);
  saveAllNotifications(all);
  return record;
}

/**
 * Mark a single notification as read.
 *
 * @param {string} notificationId
 */
export function markAsRead(notificationId) {
  if (!notificationId) return;
  const all = getAllNotifications();
  let changed = false;
  const updated = all.map((n) => {
    if (n.notificationId === notificationId && !n.read) {
      changed = true;
      return { ...n, read: true };
    }
    return n;
  });
  if (changed) {
    saveAllNotifications(updated);
  }
}

/**
 * Mark all notifications for a recipient as read.
 * Strictly scoped to the specified recipientType and recipientId.
 *
 * @param {RecipientType} recipientType
 * @param {string} recipientId
 */
export function markAllAsRead(recipientType, recipientId) {
  if (!recipientType || !recipientId) return;
  const all = getAllNotifications();
  let changed = false;
  const updated = all.map((n) => {
    if (
      n.recipientType === recipientType &&
      n.recipientId === recipientId &&
      !n.read
    ) {
      changed = true;
      return { ...n, read: true };
    }
    return n;
  });
  if (changed) {
    saveAllNotifications(updated);
  }
}

/**
 * Delete a single notification by ID.
 *
 * @param {string} notificationId
 */
export function deleteNotification(notificationId) {
  if (!notificationId) return;
  const all = getAllNotifications();
  saveAllNotifications(all.filter((n) => n.notificationId !== notificationId));
}

/**
 * Delete all notifications for a specific recipient.
 *
 * @param {RecipientType} recipientType
 * @param {string} recipientId
 */
export function clearNotifications(recipientType, recipientId) {
  if (!recipientType || !recipientId) return;
  const all = getAllNotifications();
  saveAllNotifications(
    all.filter(
      (n) => !(n.recipientType === recipientType && n.recipientId === recipientId),
    ),
  );
}
