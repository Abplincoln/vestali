import React from "react";

export default function Notification({ notification, onDismiss }) {
  if (!notification || !notification.message) return null;

  const { type, message, hash } = notification;

  return (
    <div className={`notification-toast notification-${type}`}>
      <div className="notification-icon">
        {type === "pending" && <span className="spinner">⏳</span>}
        {type === "success" && <span>✓</span>}
        {type === "error" && <span>⚠️</span>}
        {type === "info" && <span>ℹ️</span>}
      </div>

      <div className="notification-body">
        <div className="notification-message">{message}</div>
        {hash && (
          <div className="notification-hash">
            Tx: <code>{hash.substring(0, 10)}...{hash.substring(hash.length - 8)}</code>
          </div>
        )}
      </div>

      <button
        type="button"
        className="notification-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
