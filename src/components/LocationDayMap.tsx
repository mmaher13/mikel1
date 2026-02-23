import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPoint {
  id: string;
  player_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  player_name: string;
}

interface LocationDayMapProps {
  date: string;
  locations: LocationPoint[];
}

// Assign consistent colors per player
const PLAYER_COLORS = [
  "hsl(340, 82%, 60%)", // pink
  "hsl(280, 70%, 60%)", // purple
  "hsl(200, 80%, 55%)", // blue
  "hsl(30, 90%, 55%)",  // orange
  "hsl(160, 60%, 45%)", // teal
  "hsl(0, 75%, 55%)",   // red
];

const LocationDayMap = ({ date, locations }: LocationDayMapProps) => {
  const center = useMemo(() => {
    if (locations.length === 0) return [0, 0] as [number, number];
    const avgLat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
    const avgLng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length;
    return [avgLat, avgLng] as [number, number];
  }, [locations]);

  const playerColorMap = useMemo(() => {
    const uniquePlayers = [...new Set(locations.map((l) => l.player_id))];
    const map: Record<string, string> = {};
    uniquePlayers.forEach((id, i) => {
      map[id] = PLAYER_COLORS[i % PLAYER_COLORS.length];
    });
    return map;
  }, [locations]);

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (locations.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <h3 className="font-display text-sm font-bold text-romantic mb-2">{formattedDate}</h3>
        <p className="text-muted-foreground text-xs font-body text-center py-6">No location data</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="font-display text-sm font-bold text-romantic mb-2">
        {formattedDate}
        <span className="text-muted-foreground font-body font-normal text-xs ml-2">
          {locations.length} points
        </span>
      </h3>
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 280 }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((l) => (
            <CircleMarker
              key={l.id}
              center={[l.latitude, l.longitude]}
              radius={6}
              pathOptions={{
                color: playerColorMap[l.player_id],
                fillColor: playerColorMap[l.player_id],
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Tooltip>
                <span className="font-body text-xs">
                  <strong>{l.player_name}</strong>
                  <br />
                  {new Date(l.recorded_at).toLocaleTimeString()}
                </span>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationDayMap;
