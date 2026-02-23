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

  const openMap = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, "_blank");
  };

  // Static tile image from OpenStreetMap
  const zoom = 15;
  const tileX = Math.floor(((longitude + 180) / 360) * Math.pow(2, zoom));
  const latRad = (latitude * Math.PI) / 180;
  const tileY = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );

  return (
    <div className="mt-3 space-y-2">
      <div
        className="rounded-xl overflow-hidden border border-border relative cursor-pointer"
        style={{ height: 180 }}
        onClick={openMap}
      >
        <img
          src={`https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`}
          alt={`Map for ${title}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Center pin overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg" />
        </div>
        <div className="absolute bottom-1 right-1 bg-background/80 text-muted-foreground text-[10px] px-1 rounded">
          © OpenStreetMap
        </div>
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
