import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { fetchTatryMountains, findMountainByName } from "../services/mountainsService";

const TATRY_CENTER = [49.23, 20.05];

// Fits map view to markers when trips change.
function FitToMarkers({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(TATRY_CENTER, 9);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0].coordinates, 11);
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => point.coordinates));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

const mountainIcon = L.divIcon({
  className: "mountain-marker",
  html: '<span class="marker-glyph">&#9650;</span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function TripMap({ trips }) {
  const [mountains, setMountains] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMountains() {
      const loaded = await fetchTatryMountains();
      if (isMounted) {
        setMountains(loaded);
      }
    }

    loadMountains();

    return () => {
      isMounted = false;
    };
  }, []);

  const markerPoints = useMemo(
    () =>
      trips.map((trip) => {
        const selectedMountain = findMountainByName(trip.title, mountains);
        return {
          ...trip,
          coordinates: selectedMountain?.coordinates || TATRY_CENTER,
        };
      }),
    [trips, mountains]
  );

  return (
    <section className="map-panel panel">
      <h2>Mountain Map</h2>
      <div className="map-wrap">
        <MapContainer center={TATRY_CENTER} zoom={9} scrollWheelZoom className="trip-map">
          <TileLayer
            // Dark tiles to match existing app theme.
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          />

          <FitToMarkers points={markerPoints} />

          {markerPoints.map((trip) => (
            <Marker key={trip._id} position={trip.coordinates} icon={mountainIcon}>
              <Popup className="trip-popup">
                <div className="popup-content">
                  <h3>{trip.title}</h3>
                  <p>{new Date(trip.date).toLocaleDateString()}</p>
                  <p>Distance: {trip.distance || 0} km</p>
                  <p>Elevation: {trip.elevationGain || 0} m</p>
                  {trip.imageUrl && <img src={trip.imageUrl} alt={trip.title} className="popup-image" />}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

export default TripMap;
