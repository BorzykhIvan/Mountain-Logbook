import FALLBACK_MOUNTAINS from "../data/mountains";

const TATRY_BBOX = {
  south: 49.12,
  west: 19.7,
  north: 49.34,
  east: 20.38,
};

let mountainsCache = null;

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const dedupeMountains = (items) => {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = normalizeText(item.name);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, "pl"));
};

const fallbackData = () =>
  dedupeMountains(
    FALLBACK_MOUNTAINS.map((mountain) => ({
      name: mountain.name,
      aliases: mountain.aliases || [],
      coordinates: mountain.coordinates,
    }))
  );

const buildOverpassQuery = () => `
[out:json][timeout:30];
area["ISO3166-1"="PL"][admin_level=2]->.pl;
(
  node["natural"="peak"](area.pl)(${TATRY_BBOX.south},${TATRY_BBOX.west},${TATRY_BBOX.north},${TATRY_BBOX.east});
);
out body;
`;

// Loads mountain list from OSM Overpass (Polish side Tatry peaks), with local fallback.
export async function fetchTatryMountains() {
  if (mountainsCache) {
    return mountainsCache;
  }

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: buildOverpassQuery(),
    });

    if (!response.ok) {
      throw new Error(`Overpass status ${response.status}`);
    }

    const data = await response.json();
    const fromOverpass = (data.elements || [])
      .filter((element) => element?.tags?.name && typeof element.lat === "number" && typeof element.lon === "number")
      .map((element) => ({
        name: element.tags.name,
        aliases: [element.tags["name:pl"], element.tags["name:en"]].filter(Boolean),
        coordinates: [element.lat, element.lon],
      }));

    mountainsCache = dedupeMountains(fromOverpass);
    if (!mountainsCache.length) {
      mountainsCache = fallbackData();
    }
  } catch (error) {
    console.error("Failed to fetch Tatry mountains from Overpass:", error.message);
    mountainsCache = fallbackData();
  }

  return mountainsCache;
}

export function findMountainByName(name, mountains) {
  const normalized = normalizeText(name);
  if (!normalized) {
    return null;
  }

  return (
    mountains.find((mountain) => normalizeText(mountain.name) === normalized) ||
    mountains.find((mountain) =>
      (mountain.aliases || []).some((alias) => normalizeText(alias) === normalized)
    ) ||
    null
  );
}

export function filterMountainSuggestions(query, mountains) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return mountains.slice(0, 20);
  }

  return mountains
    .filter((mountain) => {
      const allNames = [mountain.name, ...(mountain.aliases || [])].map(normalizeText);
      return allNames.some((value) => value.includes(normalizedQuery));
    })
    .slice(0, 20);
}

export { normalizeText };
