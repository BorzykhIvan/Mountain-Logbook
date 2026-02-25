import React from "react";

function TripCard({ trip, onEdit, onDelete }) {
  return (
    <article className="trip-card">
      {trip.imageUrl && <img src={trip.imageUrl} alt={trip.title} className="trip-image" />}

      <div className="trip-content">
        <h3>{trip.title}</h3>
        <p className="muted">
          {trip.location || "Tatry"} | {new Date(trip.date).toLocaleDateString()}
        </p>

        <div className="trip-meta">
          <span>{trip.distance || 0} km</span>
          <span>{trip.elevationGain || 0} m</span>
          <span>{trip.difficulty || "n/a"}</span>
        </div>

        <p>
          <strong>Weather:</strong> {trip.weather || "Weather unavailable"}
        </p>

        {trip.notes && <p>{trip.notes}</p>}

        <div className="row-actions">
          <button type="button" onClick={() => onEdit(trip)}>
            Edit
          </button>
          <button type="button" className="danger-btn" onClick={() => onDelete(trip._id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default TripCard;
