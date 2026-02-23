import { useState } from "react";
import { Navigation } from "lucide-react";

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

  // Use OpenStreetMap static tile as a simple map preview
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.003},${longitude + 0.005},${latitude + 0.003}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 180 }}>
        <iframe
          src={mapUrl}
          style={{ width: "100%", height: "100%", border: 0 }}
          loading="lazy"
          title={`Map for ${title}`}
        />
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
