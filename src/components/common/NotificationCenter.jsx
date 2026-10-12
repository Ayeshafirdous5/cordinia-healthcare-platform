import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../services/notificationService';

/**
 * NotificationCenter
 *
 * Reusable notification inbox rendered inline in any dashboard.
 * Reads notifications strictly scoped to the given recipientType + recipientId.
 *
 * Props
 * ─────
 * @param {'patient'|'doctor'|'nurse'|'admin'} recipientType
 * @param {string} recipientId
 */
export default function NotificationCenter({ recipientType, recipientId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  const refresh = useCallback(() => {
    if (!recipientType || !recipientId) return;
    setNotifications(getNotifications(recipientType, recipientId));
    setUnreadCount(getUnreadCount(recipientType, recipientId));
  }, [recipientType, recipientId]);

  // Initial load + live sync (periodic polling + storage event across tabs)
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2500);
    const handleStorage = (e) => {
      if (!e.key || e.key === 'cordinia_notifications') {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        refresh();
      }
      return next;
    });
  };

  const handleMarkRead = (notifId) => {
    markAsRead(notifId);
    refresh();
  };

  const handleDelete = (notifId) => {
    deleteNotification(notifId);
    refresh();
  };

  const handleMarkAllRead = () => {
    markAllAsRead(recipientType, recipientId);
    refresh();
  };

  // ── helpers ────────────────────────────────────────────────────────────────

  function formatRelativeTime(isoString) {
    const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="nc-root" ref={rootRef}>
      {/* Trigger button */}
      <button
        type="button"
        className="nc-trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <span className="nc-bell">🔔</span>
        <span className="nc-label">Notifications</span>
        {unreadCount > 0 && (
          <span className="nc-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="nc-panel">
          {/* Panel header */}
          <div className="nc-panel-header">
            <span className="nc-panel-title">Notifications</span>
            {notifications.length > 0 && notifications.some((n) => !n.read) && (
              <button
                type="button"
                className="nc-action-link"
                onClick={handleMarkAllRead}
                aria-label="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="nc-empty">
              <span className="nc-empty-icon">🔕</span>
              <p className="nc-empty-text">No notifications yet.</p>
              <p className="nc-empty-sub">Updates about your doctor's rounds will appear here.</p>
            </div>
          ) : (
            <ul className="nc-list" role="list">
              {notifications.map((n) => (
                <li
                  key={n.notificationId}
                  className={`nc-item${n.read ? '' : ' nc-item-unread'}${n.priority === 'important' ? ' nc-item-important' : ''}`}
                >
                  <div className="nc-item-body">
                    <div className="nc-item-top">
                      {n.priority === 'important' && (
                        <span className="nc-priority-dot" aria-label="Important" />
                      )}
                      <span className="nc-item-title">{n.title}</span>
                      {!n.read && <span className="nc-unread-dot" aria-label="Unread" />}
                    </div>
                    <p className="nc-item-message">{n.message}</p>
                    <span className="nc-item-time">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <div className="nc-item-actions">
                    {!n.read && (
                      <button
                        type="button"
                        className="nc-action-link"
                        onClick={() => handleMarkRead(n.notificationId)}
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      type="button"
                      className="nc-action-link nc-action-delete"
                      onClick={() => handleDelete(n.notificationId)}
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
