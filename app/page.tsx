import GlobeComponent from "@/components/GlobeComponent";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#e0f7fa] to-[#e1f5fe] font-sans">
      {/* 3D Globe */}
      <div className="w-full h-[80vh]">
        <GlobeComponent />
      </div>

      {/* Info panel */}
      <div id="info-panel" className="absolute top-4 right-4 w-80 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 hidden">
        <h2 className="text-xl font-bold mb-2" id="country-name">Country</h2>
        <p className="text-sm" id="goat-count">🐐 Nombre de chèvres: <span className="font-mono">0</span></p>
        <p className="text-sm mt-2" id="goat-breeds">Races: <span className="font-mono">-</span></p>
        <p className="text-sm" id="goat-uses">Utilisations: <span className="font-mono">-</span></p>
      </div>
    </main>
  );
}
