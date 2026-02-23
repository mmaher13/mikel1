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

  // Calculate tile coordinates for a 3x3 grid centered on the location
  const zoom = 17; // Higher zoom for street-level detail with building/road names
  const centerTileX = Math.floor(((longitude + 180) / 360) * Math.pow(2, zoom));
  const latRad = (latitude * Math.PI) / 180;
  const centerTileY = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );

  // 3x3 grid of tiles
  const tiles: { x: number; y: number; col: number; row: number }[] = [];
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      tiles.push({ x: centerTileX + col, y: centerTileY + row, col: col + 1, row: row + 1 });
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div
        className="rounded-xl overflow-hidden border border-border relative cursor-pointer"
        style={{ height: 200 }}
        onClick={openMap}
      >
        <div
          className="absolute"
          style={{
            width: 256 * 3,
            height: 256 * 3,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {tiles.map((t) => (
            <img
              key={`${t.x}-${t.y}`}
              src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
              alt=""
              loading="lazy"
              style={{
                position: "absolute",
                width: 256,
                height: 256,
                left: t.col * 256,
                top: t.row * 256,
                display: "block",
              }}
            />
          ))}
        </div>
        {/* Center pin */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 bg-primary rounded-full border-2 border-white shadow-lg" />
            <div className="w-1.5 h-3 bg-primary -mt-0.5 rounded-b-full" />
          </div>
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
