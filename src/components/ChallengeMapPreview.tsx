import { MapContainer, TileLayer, CircleMarker, Marker } from "react-leaflet";
import { Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface ChallengeMapPreviewProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  playerPosition?: { latitude: number; longitude: number } | null;
  title: string;
}

const ChallengeMapPreview = ({ latitude, longitude, radiusMeters, playerPosition, title }: ChallengeMapPreviewProps) => {
  const openDirections = () => {
    // Use Google Maps directions URL (works on both iOS and Android)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
    window.open(url, "_blank");
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 180 }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={false}
          dragging={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CircleMarker
            center={[latitude, longitude]}
            radius={8}
            pathOptions={{
              color: "hsl(340, 82%, 60%)",
              fillColor: "hsl(340, 82%, 60%)",
              fillOpacity: 0.3,
              weight: 2,
            }}
          />
          {playerPosition && (
            <Marker
              position={[playerPosition.latitude, playerPosition.longitude]}
              icon={defaultIcon}
            />
          )}
        </MapContainer>
      </div>
      <button
        onClick={openDirections}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-body text-sm font-medium"
      >
        <Navigation className="w-4 h-4" />
        Get Directions
      </button>
    </div>
  );
};

export default ChallengeMapPreview;
