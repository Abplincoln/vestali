import React, { useState } from "react";

export default function CreateCampaignModal({
  isOpen,
  onClose,
  onCreate,
  isPending,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [customDeadline, setCustomDeadline] = useState("");
  const [useCustomDeadline, setUseCustomDeadline] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !goal || parseFloat(goal) <= 0) {
      alert("Please fill in all fields with valid values.");
      return;
    }

    let deadlineTimestamp;
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (useCustomDeadline && customDeadline) {
      deadlineTimestamp = Math.floor(new Date(customDeadline).getTime() / 1000);
      if (deadlineTimestamp <= nowSeconds) {
        alert("The selected deadline must be in the future.");
        return;
      }
    } else {
      const days = parseInt(durationDays, 10) || 7;
      deadlineTimestamp = nowSeconds + days * 24 * 60 * 60;
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      goal,
      deadline: deadlineTimestamp,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🌱</span>
            <h2>Create New Campaign</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isPending}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Campaign Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Decentralized Green Energy Grid"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control form-textarea"
              placeholder="Explain your vision, why it matters, and how funds will be deployed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              disabled={isPending}
            />
          </div>

          {/* Goal */}
          <div className="form-group">
            <label className="form-label">Funding Goal (in BOT)</label>
            <div className="input-group">
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                className="form-control"
                placeholder="e.g. 5.0"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                disabled={isPending}
              />
              <span className="input-addon">BOT</span>
            </div>
            <small className="form-hint">
              Target amount in native BOT on Bohr Testnet.
            </small>
          </div>

          {/* Duration / Deadline */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Campaign Duration</label>
              <button
                type="button"
                className="btn-link"
                onClick={() => setUseCustomDeadline(!useCustomDeadline)}
              >
                {useCustomDeadline ? "Use Quick Days" : "Set Custom Date"}
              </button>
            </div>

            {!useCustomDeadline ? (
              <div className="duration-pill-group">
                {[
                  { label: "1 Day", val: "1" },
                  { label: "3 Days", val: "3" },
                  { label: "7 Days", val: "7" },
                  { label: "14 Days", val: "14" },
                  { label: "30 Days", val: "30" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    className={`duration-pill ${
                      durationDays === item.val ? "duration-pill-active" : ""
                    }`}
                    onClick={() => setDurationDays(item.val)}
                    disabled={isPending}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="datetime-local"
                className="form-control"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                required={useCustomDeadline}
                disabled={isPending}
              />
            )}
            <small className="form-hint">
              Contributions are automatically rejected once the deadline passes.
            </small>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? "Creating on Bohr..." : "Deploy Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
