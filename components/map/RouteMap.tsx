"use client";

import * as React from "react";
import MaplibreMap, { Marker, Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAPTILER_KEY } from "@/lib/env";
import { getAirportCoordinate, greatCircleArc, type AirportCoordinate } from "@/lib/data/airport-coordinates";
import { EmptyState, Stack, Text } from "@/components/ui/primitives";
import { MapPin, MapPinOff } from "lucide-react";

export interface RouteMapLeg {
  from: string;
  to: string;
  active?: boolean;
}

export function RouteMap({ legs, className }: { legs: RouteMapLeg[]; className?: string }) {
  const uniquePoints = React.useMemo(() => {
    const map = new Map<string, AirportCoordinate>();
    for (const leg of legs) {
      const from = getAirportCoordinate(leg.from);
      const to = getAirportCoordinate(leg.to);
      if (from) map.set(from.iata, from);
      if (to) map.set(to.iata, to);
    }
    return Array.from(map.values());
  }, [legs]);

  if (!MAPTILER_KEY) {
    return (
      <EmptyState
        title="Map unavailable"
        description="Add a free NEXT_PUBLIC_MAPTILER_KEY to .env.local to render the live route map."
        icon={<MapPinOff className="w-10 h-10 text-text-secondary opacity-40" />}
        className={className}
      />
    );
  }

  if (uniquePoints.length === 0) {
    return (
      <EmptyState
        title="No route to plot"
        description="This airport isn't in the static coordinate lookup."
        icon={<MapPin className="w-10 h-10 text-text-secondary opacity-40" />}
        className={className}
      />
    );
  }

  const lats = uniquePoints.map((p) => p.lat);
  const lons = uniquePoints.map((p) => p.lon);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lons) - Math.min(...lons), 2);
  const zoom = Math.max(1, Math.min(6, 8 - Math.log2(span)));

  return (
    <Stack className={className}>
      <MaplibreMap
        initialViewState={{ latitude: centerLat, longitude: centerLon, zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={`https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`}
        renderWorldCopies={false}
        minZoom={1}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {legs.map((leg, i) => {
          const from = getAirportCoordinate(leg.from);
          const to = getAirportCoordinate(leg.to);
          if (!from || !to) return null;
          const arc = greatCircleArc({ lat: from.lat, lon: from.lon }, { lat: to.lat, lon: to.lon });
          return (
            <Source
              key={`arc-${i}`}
              id={`arc-${i}`}
              type="geojson"
              data={{
                type: "Feature",
                geometry: { type: "LineString", coordinates: arc },
                properties: {},
              }}
            >
              <Layer
                type="line"
                layout={{ "line-cap": "round" }}
                paint={{
                  "line-color": leg.active ? "#C2410C" : "#9A9284",
                  "line-width": leg.active ? 3 : 1.5,
                  "line-opacity": leg.active ? 0.95 : 0.55,
                  ...(leg.active ? {} : { "line-dasharray": [2, 2] }),
                }}
              />
            </Source>
          );
        })}
        {uniquePoints.map((p) => (
          <Marker key={p.iata} latitude={p.lat} longitude={p.lon} anchor="bottom">
            <Stack align="center" gap={0}>
              <MapPin className="w-5 h-5 text-accent fill-accent/20 drop-shadow" />
              <Text
                variant="mono"
                size="xs"
                weight="bold"
                className="bg-bg-surface/95 px-1 rounded border border-border-default shadow-sm"
              >
                {p.iata}
              </Text>
            </Stack>
          </Marker>
        ))}
      </MaplibreMap>
    </Stack>
  );
}
