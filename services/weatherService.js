const WEATHER_API_TIMEOUT_MS = 10000;

// Uses Open-Meteo weather code mapping for concise readable summaries.
const WEATHER_CODE_MAP = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

// Fetch helper with timeout support for stable API handling.
const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_API_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

// Converts any date-like input to YYYY-MM-DD for archive API calls.
const toDateString = (dateInput) => {
  const parsedDate = new Date(dateInput);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid trip date for weather lookup");
  }

  return parsedDate.toISOString().split("T")[0];
};

// Returns location coordinates for a mountain/place query.
const resolveCoordinates = async (place) => {
  const encodedPlace = encodeURIComponent(place);
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedPlace}&count=1&language=en&format=json`;

  const geocodingData = await fetchJson(geocodingUrl);
  const firstResult = geocodingData?.results?.[0];

  if (!firstResult) {
    throw new Error("No coordinates found for provided mountain/location");
  }

  return {
    latitude: firstResult.latitude,
    longitude: firstResult.longitude,
    resolvedName: firstResult.name,
  };
};

// Fetches historical weather and returns a short human-readable summary.
const fetchHistoricalWeather = async ({ date, mountain }) => {
  const dateString = toDateString(date);
  const { latitude, longitude, resolvedName } = await resolveCoordinates(mountain);

  const apiKeyParam = process.env.WEATHER_API_KEY
    ? `&apikey=${encodeURIComponent(process.env.WEATHER_API_KEY)}`
    : "";

  const archiveUrl =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&start_date=${dateString}` +
    `&end_date=${dateString}` +
    "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum" +
    "&timezone=auto" +
    apiKeyParam;

  const weatherData = await fetchJson(archiveUrl);
  const daily = weatherData?.daily;

  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
    throw new Error("No historical weather data returned");
  }

  const weatherCode = daily.weathercode?.[0];
  const tempMax = daily.temperature_2m_max?.[0];
  const tempMin = daily.temperature_2m_min?.[0];
  const precipitation = daily.precipitation_sum?.[0];

  const weatherText = WEATHER_CODE_MAP[weatherCode] || "Unknown conditions";
  const tempPart =
    typeof tempMin === "number" && typeof tempMax === "number"
      ? `${tempMin}C to ${tempMax}C`
      : "temperature n/a";
  const precipitationPart =
    typeof precipitation === "number" ? `${precipitation} mm precipitation` : "precipitation n/a";

  return `${resolvedName}: ${weatherText}, ${tempPart}, ${precipitationPart}`;
};

module.exports = {
  fetchHistoricalWeather,
};
