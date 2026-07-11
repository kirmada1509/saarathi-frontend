// Static airport coordinate lookup, limited to the 35 IATA codes that
// actually appear in the flights dataset. The provided data has no
// geo-coordinates (only IATA codes/city names), so this is a one-time,
// committed data-prep step sourced from public airport data — not a live
// external API call.
export interface AirportCoordinate {
  iata: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export const AIRPORT_COORDINATES: Record<string, AirportCoordinate> = {
  AKL: { iata: "AKL", city: "Auckland", country: "New Zealand", lat: -37.0082, lon: 174.785 },
  AMS: { iata: "AMS", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lon: 4.7683 },
  BCN: { iata: "BCN", city: "Barcelona", country: "Spain", lat: 41.2971, lon: 2.0785 },
  BKK: { iata: "BKK", city: "Bangkok", country: "Thailand", lat: 13.69, lon: 100.7501 },
  BOM: { iata: "BOM", city: "Mumbai", country: "India", lat: 19.0896, lon: 72.8656 },
  CDG: { iata: "CDG", city: "Paris", country: "France", lat: 49.0097, lon: 2.5479 },
  CPT: { iata: "CPT", city: "Cape Town", country: "South Africa", lat: -33.9715, lon: 18.6021 },
  DEL: { iata: "DEL", city: "Delhi", country: "India", lat: 28.5562, lon: 77.1 },
  DOH: { iata: "DOH", city: "Doha", country: "Qatar", lat: 25.2731, lon: 51.608 },
  DPS: { iata: "DPS", city: "Bali", country: "Indonesia", lat: -8.7482, lon: 115.1672 },
  DXB: { iata: "DXB", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lon: 55.3657 },
  FCO: { iata: "FCO", city: "Rome", country: "Italy", lat: 41.8003, lon: 12.2389 },
  FRA: { iata: "FRA", city: "Frankfurt", country: "Germany", lat: 50.0379, lon: 8.5622 },
  GIG: { iata: "GIG", city: "Rio de Janeiro", country: "Brazil", lat: -22.8099, lon: -43.2505 },
  GRU: { iata: "GRU", city: "São Paulo", country: "Brazil", lat: -23.4356, lon: -46.4731 },
  HKG: { iata: "HKG", city: "Hong Kong", country: "China", lat: 22.308, lon: 113.9185 },
  ICN: { iata: "ICN", city: "Seoul", country: "South Korea", lat: 37.4602, lon: 126.4407 },
  IST: { iata: "IST", city: "Istanbul", country: "Turkey", lat: 41.2753, lon: 28.7519 },
  JFK: { iata: "JFK", city: "New York", country: "United States", lat: 40.6413, lon: -73.7781 },
  KUL: { iata: "KUL", city: "Kuala Lumpur", country: "Malaysia", lat: 2.7456, lon: 101.7099 },
  LAX: { iata: "LAX", city: "Los Angeles", country: "United States", lat: 33.9416, lon: -118.4085 },
  LHR: { iata: "LHR", city: "London", country: "United Kingdom", lat: 51.47, lon: -0.4543 },
  LIS: { iata: "LIS", city: "Lisbon", country: "Portugal", lat: 38.7813, lon: -9.1359 },
  MAA: { iata: "MAA", city: "Chennai", country: "India", lat: 12.9941, lon: 80.1709 },
  MEL: { iata: "MEL", city: "Melbourne", country: "Australia", lat: -37.669, lon: 144.841 },
  MEX: { iata: "MEX", city: "Mexico City", country: "Mexico", lat: 19.4363, lon: -99.0721 },
  NRT: { iata: "NRT", city: "Tokyo", country: "Japan", lat: 35.772, lon: 140.3929 },
  ORD: { iata: "ORD", city: "Chicago", country: "United States", lat: 41.9742, lon: -87.9073 },
  PEK: { iata: "PEK", city: "Beijing", country: "China", lat: 40.0801, lon: 116.5846 },
  PVG: { iata: "PVG", city: "Shanghai", country: "China", lat: 31.1443, lon: 121.8083 },
  SFO: { iata: "SFO", city: "San Francisco", country: "United States", lat: 37.6213, lon: -122.379 },
  SIN: { iata: "SIN", city: "Singapore", country: "Singapore", lat: 1.3644, lon: 103.9915 },
  SVO: { iata: "SVO", city: "Moscow", country: "Russia", lat: 55.9726, lon: 37.4146 },
  SYD: { iata: "SYD", city: "Sydney", country: "Australia", lat: -33.9399, lon: 151.1753 },
  YYZ: { iata: "YYZ", city: "Toronto", country: "Canada", lat: 43.6777, lon: -79.6248 },
};

export function getAirportCoordinate(iata: string | undefined | null): AirportCoordinate | undefined {
  if (!iata) return undefined;
  return AIRPORT_COORDINATES[iata.toUpperCase()];
}

// Simple client-side geodesic (great-circle) interpolation — no turf.js needed.
export function greatCircleArc(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  points = 64
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(from.lat);
  const lon1 = toRad(from.lon);
  const lat2 = toRad(to.lat);
  const lon2 = toRad(to.lon);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );

  if (d === 0) return [[from.lon, from.lat]];

  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const f = i / points;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    coords.push([toDeg(lon), toDeg(lat)]);
  }
  return coords;
}
