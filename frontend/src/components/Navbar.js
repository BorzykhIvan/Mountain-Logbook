import React from "react";

function Navbar({ userName, onLogout, onOpenTripModal }) {
  // Shows a compact surname in header title for the requested welcome format.
  const surname = String(userName || "").trim().split(" ").filter(Boolean).slice(-1)[0] || userName;

  return (
    <header className="app-nav">
      <div className="nav-inner">
        <div className="nav-left">
          <h1>Mountain Logbook - Welcome {surname}</h1>
        </div>

        <div className="nav-right">
          <span className="user-badge">{userName}</span>
          <button type="button" onClick={onOpenTripModal}>
            Add New Trip
          </button>
          <button type="button" className="danger-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
