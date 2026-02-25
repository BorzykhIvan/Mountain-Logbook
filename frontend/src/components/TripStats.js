import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
const difficultyLabel = ["-", "Easy", "Medium", "Hard"];
const difficultyColor = { easy: "#FF9F1C", medium: "#FF6B6B", hard: "#8338EC" };

function TripStats({ trips }) {
  const totalDistance = trips.reduce((sum, trip) => sum + (Number(trip.distance) || 0), 0);
  const totalElevation = trips.reduce((sum, trip) => sum + (Number(trip.elevationGain) || 0), 0);

  const scored = trips
    .map((trip) => difficultyOrder[String(trip.difficulty || "").toLowerCase()] || 0)
    .filter(Boolean);

  const averageDifficulty =
    scored.length > 0
      ? ["-", "Easy", "Medium", "Hard"][Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)]
      : "N/A";

  // Builds per-day progression lines for distance, elevation, and average difficulty.
  const chartData = [...trips]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, trip) => {
      const key = new Date(trip.date).toISOString().slice(0, 10);
      const current = acc.byDate.get(key) || {
        date: key,
        distance: 0,
        elevationGain: 0,
        difficultyScoreSum: 0,
        difficultyCount: 0,
      };

      current.distance += Number(trip.distance) || 0;
      current.elevationGain += Number(trip.elevationGain) || 0;

      const score = difficultyOrder[String(trip.difficulty || "").toLowerCase()] || 0;
      if (score) {
        current.difficultyScoreSum += score;
        current.difficultyCount += 1;
      }

      acc.byDate.set(key, current);
      return acc;
    }, { byDate: new Map() });

  const progression = Array.from(chartData.byDate.values()).map((row) => {
    const averageDifficultyScore =
      row.difficultyCount > 0 ? Number((row.difficultyScoreSum / row.difficultyCount).toFixed(2)) : 0;

    return {
      date: row.date,
      distance: Number(row.distance.toFixed(2)),
      elevationGain: Math.round(row.elevationGain),
      difficultyScore: averageDifficultyScore,
    };
  });

  const chartCommonProps = {
    margin: { top: 8, right: 12, bottom: 8, left: 0 },
  };

  return (
    <section className="dashboard-grid">
      <article className="metric-panel">
        <h3>Daily Distance Progression</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progression} {...chartCommonProps}>
              <CartesianGrid stroke="#4a4a6b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#d7d7e3" tick={{ fontSize: 12 }} />
              <YAxis stroke="#d7d7e3" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#2E2E4D", border: "1px solid #FFC300", color: "#F5F5F5" }}
              />
              <Line type="monotone" dataKey="distance" stroke="#FF9F1C" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h4>Total Distance</h4>
          <strong>{totalDistance.toFixed(1)} km</strong>
        </div>
      </article>

      <article className="metric-panel">
        <h3>Daily Elevation Progression</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progression} {...chartCommonProps}>
              <CartesianGrid stroke="#4a4a6b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#d7d7e3" tick={{ fontSize: 12 }} />
              <YAxis stroke="#d7d7e3" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#2E2E4D", border: "1px solid #FFC300", color: "#F5F5F5" }}
              />
              <Line type="monotone" dataKey="elevationGain" stroke="#FF6B6B" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h4>Total Elevation</h4>
          <strong>{Math.round(totalElevation)} m</strong>
        </div>
      </article>

      <article className="metric-panel">
        <h3>Average Difficulty Progression</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progression} {...chartCommonProps}>
              <CartesianGrid stroke="#4a4a6b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#d7d7e3" tick={{ fontSize: 12 }} />
              <YAxis stroke="#d7d7e3" tick={{ fontSize: 12 }} domain={[1, 3]} />
              <Tooltip
                formatter={(value) => {
                  const rounded = Math.max(1, Math.min(3, Math.round(Number(value) || 1)));
                  return [difficultyLabel[rounded], "Difficulty"];
                }}
                contentStyle={{ background: "#2E2E4D", border: "1px solid #FFC300", color: "#F5F5F5" }}
              />
              <Line type="monotone" dataKey="difficultyScore" stroke="#8338EC" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h4>Average Difficulty</h4>
          <strong style={{ color: difficultyColor[String(averageDifficulty).toLowerCase()] || "#f4f8f7" }}>
            {averageDifficulty}
          </strong>
        </div>
      </article>
    </section>
  );
}

export default TripStats;
