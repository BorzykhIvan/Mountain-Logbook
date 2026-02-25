import React from "react";

function TripFilters({ filterDifficulty, sortOrder, onFilterChange, onSortChange }) {
  return (
    <section className="filters-row">
      <label>
        Difficulty
        <select value={filterDifficulty} onChange={(event) => onFilterChange(event.target.value)}>
          <option value="all">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>

      <label>
        Sort by date
        <select value={sortOrder} onChange={(event) => onSortChange(event.target.value)}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </label>
    </section>
  );
}

export default TripFilters;
