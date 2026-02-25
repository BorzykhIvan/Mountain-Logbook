import React, { useEffect, useMemo, useState } from "react";
import { createTrip, deleteTrip, getTrips, updateTrip } from "../api";
import Navbar from "../components/Navbar";
import TripFilters from "../components/TripFilters";
import TripForm from "../components/TripForm";
import TripList from "../components/TripList";
import TripMap from "../components/TripMap";
import TripStats from "../components/TripStats";

function TripsPage({ user, token, onLogout }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingTrip, setEditingTrip] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTrips() {
      setLoading(true);
      setError("");
      try {
        const response = await getTrips(token);
        if (isMounted) {
          setTrips(response.trips || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const visibleTrips = useMemo(() => {
    let next = [...trips];

    if (filterDifficulty !== "all") {
      next = next.filter(
        (trip) => String(trip.difficulty || "").toLowerCase() === filterDifficulty.toLowerCase()
      );
    }

    next.sort((a, b) => {
      const first = new Date(a.date).getTime();
      const second = new Date(b.date).getTime();
      return sortOrder === "asc" ? first - second : second - first;
    });

    return next;
  }, [trips, filterDifficulty, sortOrder]);

  const handleTripSubmit = async (formData) => {
    setSubmitting(true);
    setError("");

    try {
      if (editingTrip) {
        const response = await updateTrip(token, editingTrip._id, formData);
        setTrips((prev) => prev.map((trip) => (trip._id === editingTrip._id ? response.trip : trip)));
        setEditingTrip(null);
        setIsTripModalOpen(false);
      } else {
        const response = await createTrip(token, formData);
        setTrips((prev) => [response.trip, ...prev]);
        setIsTripModalOpen(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTripDelete = async (tripId) => {
    const confirmed = window.confirm("Delete this trip?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteTrip(token, tripId);
      setTrips((prev) => prev.filter((trip) => trip._id !== tripId));
      if (editingTrip && editingTrip._id === tripId) {
        setEditingTrip(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Opens edit form in modal while preserving existing submit/update logic.
  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setIsTripModalOpen(true);
  };

  // Opens clean add form in modal.
  const handleOpenAddTrip = () => {
    setEditingTrip(null);
    setIsTripModalOpen(true);
  };

  // Closes modal from overlay click, close button, or cancel action.
  const handleCloseTripModal = () => {
    setIsTripModalOpen(false);
    setEditingTrip(null);
  };

  return (
    <div className="app-shell">
      <Navbar userName={user.name} onLogout={onLogout} onOpenTripModal={handleOpenAddTrip} />

      <main className="app-main">
        {error && <div className="error-box">{error}</div>}

        <TripStats trips={visibleTrips} />

        <TripFilters
          filterDifficulty={filterDifficulty}
          sortOrder={sortOrder}
          onFilterChange={setFilterDifficulty}
          onSortChange={setSortOrder}
        />

        {loading ? (
          <div className="panel">Loading trips...</div>
        ) : (
          <TripList trips={visibleTrips} onEdit={handleEditTrip} onDelete={handleTripDelete} />
        )}

        <TripMap trips={visibleTrips} />
      </main>

      {isTripModalOpen && (
        <div className="modal-overlay" onClick={handleCloseTripModal}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={handleCloseTripModal}>
              x
            </button>
            <TripForm
              loading={submitting}
              editingTrip={editingTrip}
              onSubmit={handleTripSubmit}
              onCancelEdit={handleCloseTripModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TripsPage;
