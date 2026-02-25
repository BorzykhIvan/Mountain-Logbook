import React from "react";
import TripCard from "./TripCard";

function TripList({ trips, onEdit, onDelete }) {
  if (trips.length === 0) {
    return <div className="panel">No trips yet. Add your first mountain trip.</div>;
  }

  return (
    <section className="trip-grid">
      {trips.map((trip) => (
        <TripCard key={trip._id} trip={trip} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </section>
  );
}

export default TripList;
