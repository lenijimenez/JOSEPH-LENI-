"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

// react-globe.gl uses browser APIs so must be loaded client-side only
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// Sample goat data by country ISO code
const goatData: Record<string, { count: string; breeds: string; uses: string }> = {
  CN: { count: "185 millions", breeds: "Guanzhong, Boer, Saanen", uses: "Viande, lait, fibres" },
  IN: { count: "148 millions", breeds: "Beetal, Jamunapari, Black Bengal", uses: "Lait, viande, fibres" },
  PK: { count: "78 millions", breeds: "Beetal, Teddi, Kamori", uses: "Lait, viande" },
  NG: { count: "76 millions", breeds: "West African Dwarf, Sahel", uses: "Viande, lait" },
  BD: { count: "39 millions", breeds: "Black Bengal, Jamuna", uses: "Viande, lait, peaux" },
  ET: { count: "35 millions", breeds: "Afar, Somali, Hararghe Highland", uses: "Lait, viande" },
  ML: { count: "24 millions", breeds: "Sahel, Fulani", uses: "Viande, lait" },
  SD: { count: "33 millions", breeds: "Nubian, Saanen", uses: "Lait, viande" },
  ID: { count: "18 millions", breeds: "Peranakan Etawah, Kacang", uses: "Lait, viande" },
  FR: { count: "1,2 million", breeds: "Alpine, Saanen, Poitevine", uses: "Lait, fromage" },
  ES: { count: "3,1 millions", breeds: "Murciano-Granadina, Payoya", uses: "Lait, viande" },
  IT: { count: "970 000", breeds: "Garganica, Sarda", uses: "Lait, fromage" },
  GR: { count: "3,5 millions", breeds: "Skopelos, Capricorn", uses: "Lait, fromage, viande" },
  US: { count: "2,6 millions", breeds: "Boer, Nubian, Alpine", uses: "Lait, viande, fibres" },
  BR: { count: "12 millions", breeds: "Moxotó, Canindé, Boer", uses: "Viande, lait" },
  MX: { count: "9 millions", breeds: "Granadina, Nubian", uses: "Lait, viande" },
  MA: { count: "6 millions", breeds: "Draa, Atlas", uses: "Viande, lait, fibres" },
  MN: { count: "27 millions", breeds: "Mongolian cashmere", uses: "Fibres (cachemire), viande" },
};

type CountryData = {
  properties?: {
    ADMIN?: string;
    ISO_A2?: string;
    name?: string;
  };
};

type GoatInfo = { count: string; breeds: string; uses: string } | null;
type CountryInfo = { name: string; data: GoatInfo } | null;

export default function GlobeComponent() {
  const [selected, setSelected] = useState<CountryInfo>(null);

  const handleCountryClick = useCallback((polygon: object) => {
    const country = polygon as CountryData;
    const props = country?.properties;
    const name = props?.ADMIN || props?.name || "Pays inconnu";
    const iso = props?.ISO_A2 || "";
    const data = goatData[iso] ?? null;
    setSelected({ name, data });
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#0b0f1a" }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "16px 24px",
        background: "linear-gradient(180deg, rgba(11,15,26,0.95) 0%, transparent 100%)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>🐐</span>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e8f4ff", margin: 0 }}>Joseph Lény Chèvre</h1>
          <p style={{ fontSize: 13, color: "#7ab3d4", margin: 0 }}>Carte mondiale des populations caprines</p>
        </div>
        <p style={{ marginLeft: "auto", fontSize: 12, color: "#4a7a9b" }}>
          Cliquez sur un pays pour voir les données 🌍
        </p>
      </div>

      {/* Globe */}
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={[]}
        backgroundColor="rgba(0,0,0,0)"
        onGlobeClick={() => setSelected(null)}
        enablePointerInteraction={true}
      />

      {/* Info panel */}
      {selected && (
        <div style={{
          position: "absolute", top: 80, right: 20,
          width: 300,
          background: "rgba(13,20,40,0.92)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(100,160,220,0.3)",
          borderRadius: 16,
          padding: "20px 22px",
          color: "#e8f4ff",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 20,
          animation: "fadeIn 0.25s ease",
        }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute", top: 10, right: 14,
              background: "none", border: "none", color: "#7ab3d4",
              fontSize: 20, cursor: "pointer",
            }}
          >×</button>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: "#a8d8f0" }}>
            🌍 {selected.name}
          </h2>

          {selected.data ? (
            <>
              <div style={rowStyle}>
                <span style={labelStyle}>🐐 Nombre de chèvres</span>
                <span style={valueStyle}>{selected.data.count}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>🧬 Races principales</span>
                <span style={valueStyle}>{selected.data.breeds}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>🥛 Utilisations</span>
                <span style={valueStyle}>{selected.data.uses}</span>
              </div>
            </>
          ) : (
            <p style={{ color: "#4a7a9b", fontSize: 14, fontStyle: "italic" }}>
              Aucune donnée disponible pour ce pays.<br />
              (Données à renseigner)
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  marginBottom: 12,
  paddingBottom: 12,
  borderBottom: "1px solid rgba(100,160,220,0.1)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#4a7a9b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  color: "#c8e6f8",
};
