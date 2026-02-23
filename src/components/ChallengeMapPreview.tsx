import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface ChallengeMapPreviewProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  hasGps: boolean;
  title: string;
}

const ChallengeMapPreview = ({ latitude, longitude, radiusMeters, hasGps, title }: ChallengeMapPreviewProps) => {
  const [dirError, setDirError] = useState<string | null>(null);

  const openDirections = () => {
    if (!hasGps) {
      setDirError("Please enable location access to get directions.");
      return;
    }
    setDirError(null);
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
        </MapContainer>
      </div>
      <button
        onClick={openDirections}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-body text-sm font-medium"
      >
        <Navigation className="w-4 h-4" />
        Get Directions
      </button>
      {dirError && (
        <p className="text-destructive text-sm font-body text-center">{dirError}</p>
      )}
    </div>
  );
};

export default ChallengeMapPreview;
