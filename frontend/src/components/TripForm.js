import React, { useEffect, useState } from "react";
import {
  fetchTatryMountains,
  filterMountainSuggestions,
  findMountainByName,
} from "../services/mountainsService";

const initialState = {
  mountain: "",
  date: "",
  distance: "",
  elevationGain: "",
  difficulty: "easy",
  notes: "",
};

function TripForm({ loading, editingTrip, onSubmit, onCancelEdit }) {
  const [form, setForm] = useState(initialState);
  const [imageFile, setImageFile] = useState(null);
  const [mountains, setMountains] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMountains() {
      const loaded = await fetchTatryMountains();
      if (isMounted) {
        setMountains(loaded);
        setSuggestions(loaded.slice(0, 20));
      }
    }

    loadMountains();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!editingTrip) {
      setForm(initialState);
      setImageFile(null);
      setLocalError("");
      return;
    }

    const dateValue = editingTrip.date ? new Date(editingTrip.date).toISOString().slice(0, 10) : "";

    setForm({
      mountain: editingTrip.title || "",
      date: dateValue,
      distance: editingTrip.distance ?? "",
      elevationGain: editingTrip.elevationGain ?? "",
      difficulty: editingTrip.difficulty || "easy",
      notes: editingTrip.notes || "",
    });
    setImageFile(null);
    setLocalError("");
  }, [editingTrip]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "mountain") {
      setSuggestions(filterMountainSuggestions(value, mountains));
      setLocalError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    // User must pick mountain from suggestions to keep map markers accurate.
    const selectedMountain = findMountainByName(form.mountain, mountains);
    if (!selectedMountain) {
      setLocalError("Wybierz górę z podpowiedzi, aby poprawnie ustawić metkę na mapie.");
      return;
    }

    const payload = new FormData();
    payload.append("title", selectedMountain.name);
    payload.append("location", "Tatry");
    payload.append("date", form.date);

    if (form.distance !== "") {
      payload.append("distance", form.distance);
    }

    if (form.elevationGain !== "") {
      payload.append("elevationGain", form.elevationGain);
    }

    if (form.difficulty) {
      payload.append("difficulty", form.difficulty);
    }

    if (form.notes.trim()) {
      payload.append("notes", form.notes.trim());
    }

    if (imageFile) {
      payload.append("image", imageFile);
    }

    await onSubmit(payload);

    if (!editingTrip) {
      setForm(initialState);
      setImageFile(null);
    }
  };

  return (
    <section className="panel">
      <h2>{editingTrip ? "Edit Trip" : "Add Trip"}</h2>

      <form className="grid-form" onSubmit={handleSubmit}>
        <label>
          Mountain
          <input
            name="mountain"
            value={form.mountain}
            onChange={handleChange}
            list="mountain-suggestions"
            placeholder="Start typing mountain name..."
            autoComplete="off"
            required
          />
          {/* Suggestions come from OSM Overpass (Polish Tatry peaks), with local fallback. */}
          <datalist id="mountain-suggestions">
            {suggestions.map((mountain) => (
              <option key={mountain.name} value={mountain.name} />
            ))}
          </datalist>
        </label>

        <label>
          Date
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>

        <label>
          Distance (km)
          <input
            type="number"
            min="0"
            step="0.1"
            name="distance"
            value={form.distance}
            onChange={handleChange}
          />
        </label>

        <label>
          Elevation Gain (m)
          <input
            type="number"
            min="0"
            step="1"
            name="elevationGain"
            value={form.elevationGain}
            onChange={handleChange}
          />
        </label>

        <label>
          Difficulty
          <select name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label>
          Photo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          />
        </label>

        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
        </label>

        <div className="row-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingTrip ? "Update Trip" : "Create Trip"}
          </button>
          {editingTrip && (
            <button type="button" className="text-btn" onClick={onCancelEdit}>
              Cancel edit
            </button>
          )}
        </div>

        {localError && <div className="error-box">{localError}</div>}
      </form>
    </section>
  );
}

export default TripForm;
