"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { GOAT_SPECIES, GoatSpecies } from "./goatData";
import { createGoat3DModel } from "./goatModel";
import { playGoatBleat } from "./goatAudio";
import type { GlobeMethods } from "react-globe.gl";

// Load react-globe.gl on client side only
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const CATEGORIES = [
  "Toutes",
  "Laitière",
  "Laine & Cachemire",
  "Grimpeuse & Sauvage",
  "Rustique",
  "Miniature",
  "Insolite",
] as const;

export default function GlobeComponent() {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);

  // Interaction states
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [selectedGoat, setSelectedGoat] = useState<GoatSpecies | null>(null);
  const [hoveredGoat, setHoveredGoat] = useState<GoatSpecies | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Toutes");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [earthTheme, setEarthTheme] = useState<"night" | "day">("night");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"overview" | "anecdote" | "characteristics">("overview");

  // Filter goats by category and search
  const filteredGoats = useMemo(() => {
    return GOAT_SPECIES.filter((goat) => {
      const matchesCategory =
        activeCategory === "Toutes" || goat.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        goat.name.toLowerCase().includes(q) ||
        goat.country.toLowerCase().includes(q) ||
        goat.region.toLowerCase().includes(q) ||
        goat.category.toLowerCase().includes(q) ||
        goat.uses.some((u) => u.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Handle camera fly-to when selecting a goat
  const flyToGoat = useCallback(
    (goat: GoatSpecies) => {
      setSelectedGoat(goat);
      setIsRotating(false);
      setActiveTab("overview");

      if (soundEnabled) {
        playGoatBleat(goat.category);
      }

      if (globeEl.current) {
        globeEl.current.pointOfView(
          {
            lat: goat.lat,
            lng: goat.lng,
            altitude: 0.65,
          },
          1300
        );
      }
    },
    [soundEnabled]
  );

  // Navigate to next or previous goat in current filtered list
  const navigateGoat = useCallback(
    (direction: "next" | "prev") => {
      if (!selectedGoat || filteredGoats.length === 0) return;
      const currentIndex = filteredGoats.findIndex((g) => g.id === selectedGoat.id);
      let nextIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= filteredGoats.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = filteredGoats.length - 1;
      flyToGoat(filteredGoats[nextIndex]);
    },
    [selectedGoat, filteredGoats, flyToGoat]
  );

  // Reset to wide global view
  const resetView = useCallback(() => {
    setSelectedGoat(null);
    setIsTourActive(false);
    setIsRotating(false);
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 25, lng: 15, altitude: 2.2 }, 1000);
    }
  }, []);

  // Update auto-rotation controls
  useEffect(() => {
    const controls = globeEl.current?.controls();
    if (controls) {
      controls.autoRotate = isRotating && !selectedGoat && !isTourActive;
      controls.autoRotateSpeed = 0.5;
    }
  }, [isRotating, selectedGoat, isTourActive]);

  // World Tour automated cyclic voyage
  useEffect(() => {
    if (!isTourActive) return;
    let tourIndex = 0;
    const interval = setInterval(() => {
      if (filteredGoats.length > 0) {
        const nextGoat = filteredGoats[tourIndex % filteredGoats.length];
        flyToGoat(nextGoat);
        tourIndex++;
      }
    }, 7500);

    return () => clearInterval(interval);
  }, [isTourActive, filteredGoats, flyToGoat]);

  // Click handler on 3D object
  const handleObjectClick = useCallback(
    (obj: unknown) => {
      const candidate = obj as { id?: string; userData?: { species?: GoatSpecies } };
      const goat = candidate?.id
        ? (candidate as unknown as GoatSpecies)
        : candidate?.userData?.species;
      if (goat) {
        flyToGoat(goat);
      }
    },
    [flyToGoat]
  );

  // Hover handler on 3D object
  const handleObjectHover = useCallback((obj: unknown) => {
    if (!obj) {
      setHoveredGoat(null);
      return;
    }
    const candidate = obj as { id?: string; userData?: { species?: GoatSpecies } };
    const goat = candidate?.id
      ? (candidate as unknown as GoatSpecies)
      : candidate?.userData?.species;
    setHoveredGoat(goat || null);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const globeImageUrl =
    earthTheme === "night"
      ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
      : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  if (!isMounted) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060913",
          color: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 64 }}>
            🐐
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Atlas Mondial des Chèvres 3D
          </h2>
          <p style={{ fontSize: 14, color: "#38bdf8", margin: 0 }}>
            Modélisation du globe et chargement des 18 espèces caprines...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#060913" }}>
      {/* 1. Header Toolbar */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: "16px 24px",
          background: "linear-gradient(180deg, rgba(6, 9, 19, 0.95) 0%, rgba(6, 9, 19, 0.4) 75%, transparent 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              boxShadow: "0 0 20px rgba(56, 189, 248, 0.4)",
            }}
          >
            🐐
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.02em" }}>
                Joseph Lény Chèvre 3D
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                Atlas Mondial
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              {GOAT_SPECIES.length} espèces caprines modélisées en 3D sur le globe terrestre
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Rotation Toggle */}
          <button
            onClick={() => setIsRotating((prev) => !prev)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: isRotating ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
              background: isRotating ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.06)",
              color: isRotating ? "#38bdf8" : "#e2e8f0",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{isRotating ? "⏸️ Arrêter Rotation" : "🔄 Rotation"}</span>
          </button>

          {/* Earth Theme Toggle */}
          <button
            onClick={() => setEarthTheme((prev) => (prev === "night" ? "day" : "night"))}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#e2e8f0",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            title="Basculer entre la vue Nuit et la vue Jour"
          >
            <span>{earthTheme === "night" ? "🌙 Nuit" : "☀️ Jour"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: soundEnabled ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.06)",
              color: soundEnabled ? "#38bdf8" : "#94a3b8",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
            title="Activer ou désactiver les bêlements sonores"
          >
            {soundEnabled ? "🔊 Son ON" : "🔇 Son OFF"}
          </button>

          {/* Reset View Button */}
          <button
            onClick={resetView}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#e2e8f0",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            🌍 Vue Globale
          </button>
        </div>
      </header>

      {/* 2. Three.js Earth Globe with 3D Goats Layer */}
      <Globe
        ref={globeEl}
        globeImageUrl={globeImageUrl}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="#060913"
        showAtmosphere={true}
        atmosphereColor="#38bdf8"
        atmosphereAltitude={0.16}
        enablePointerInteraction={true}
        // 3D Objects: The Modeled Goats
        objectsData={filteredGoats}
        objectLat="lat"
        objectLng="lng"
        objectAltitude={0.012}
        objectFacesSurfaces={true}
        objectThreeObject={(d: object) => createGoat3DModel(d as GoatSpecies)}
        onObjectClick={handleObjectClick}
        onObjectHover={handleObjectHover}
        // Labels clearly indicating each goat name and flag without animation
        labelsData={filteredGoats}
        labelLat="lat"
        labelLng="lng"
        labelAltitude={0.032}
        labelText={(d: object) => `${(d as GoatSpecies).flag} ${(d as GoatSpecies).name}`}
        labelSize={1.15}
        labelColor={() => "#ffffff"}
        labelResolution={3}
        labelIncludeDot={true}
        labelDotRadius={0.35}
        labelDotOrientation="bottom"
        labelsTransitionDuration={0}
        onLabelClick={handleObjectClick}
        onGlobeClick={() => {
          setSelectedGoat(null);
        }}
      />

      {/* 3. Hover Tooltip (clean & static) */}
      {hoveredGoat && !selectedGoat && (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.94)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            borderRadius: 999,
            padding: "8px 18px",
            color: "#f8fafc",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6)",
            pointerEvents: "none",
            zIndex: 40,
          }}
        >
          <span>{hoveredGoat.flag}</span>
          <span style={{ color: "#38bdf8" }}>{hoveredGoat.name}</span>
          <span style={{ color: "#94a3b8" }}>—</span>
          <span>{hoveredGoat.country}</span>
          <span style={{ fontSize: 11, background: "rgba(56, 189, 248, 0.2)", padding: "2px 8px", borderRadius: 12 }}>
            {hoveredGoat.category}
          </span>
        </div>
      )}

      {/* 4. Active Selected Goat Modal Card (Detailed Info Panel) */}
      {selectedGoat && (
        <aside
          className="glass-panel"
          style={{
            position: "absolute",
            top: 86,
            right: 24,
            bottom: 24,
            width: "min(440px, calc(100vw - 48px))",
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {/* Card Header with background accent */}
          <div
            style={{
              padding: "20px 24px 16px",
              background: `linear-gradient(135deg, ${selectedGoat.coatColor}33 0%, rgba(15, 23, 42, 0.6) 100%)`,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedGoat(null);
              }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#e2e8f0",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
              aria-label="Fermer"
            >
              ✕
            </button>

            {/* Category tag & Country */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(56, 189, 248, 0.2)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                {selectedGoat.category}
              </span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>
                {selectedGoat.flag} {selectedGoat.country}
              </span>
            </div>

            {/* Goat title & scientific name */}
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {selectedGoat.name}
            </h2>
            <p style={{ fontSize: 13, fontStyle: "italic", color: "#7dd3fc", margin: 0 }}>
              {selectedGoat.scientificName}
            </p>

            {/* Interactive action bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => playGoatBleat(selectedGoat.category)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(56, 189, 248, 0.35)",
                }}
              >
                <span>🔊 Écouter son Bêêê !</span>
              </button>

              <button
                onClick={() => flyToGoat(selectedGoat)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#e2e8f0",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>🎯 Recadrer</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(15, 23, 42, 0.4)",
            }}
          >
            {[
              { id: "overview", label: "Vue d'ensemble" },
              { id: "anecdote", label: "✨ Le saviez-vous ?" },
              { id: "characteristics", label: "Caractéristiques" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  flex: 1,
                  padding: "11px 8px",
                  background: activeTab === tab.id ? "rgba(56, 189, 248, 0.12)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #38bdf8" : "2px solid transparent",
                  color: activeTab === tab.id ? "#38bdf8" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Content Body */}
          <div
            style={{
              padding: "18px 24px",
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {activeTab === "overview" && (
              <>
                {/* 4 Stat Badges Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={statCardStyle}>
                    <span style={statLabelStyle}>📊 Population</span>
                    <span style={statValueStyle}>{selectedGoat.population}</span>
                  </div>
                  <div style={statCardStyle}>
                    <span style={statLabelStyle}>⚖️ Poids</span>
                    <span style={statValueStyle}>{selectedGoat.weight}</span>
                  </div>
                  <div style={statCardStyle}>
                    <span style={statLabelStyle}>📏 Hauteur</span>
                    <span style={statValueStyle}>{selectedGoat.height}</span>
                  </div>
                  <div style={statCardStyle}>
                    <span style={statLabelStyle}>⏳ Espérance de vie</span>
                    <span style={statValueStyle}>{selectedGoat.lifespan}</span>
                  </div>
                </div>

                {/* Region & Habitat */}
                <div style={sectionCardStyle}>
                  <h4 style={sectionTitleStyle}>📍 Origine & Territoire</h4>
                  <p style={{ fontSize: 13, color: "#e2e8f0", margin: "0 0 6px" }}>
                    {selectedGoat.region} ({selectedGoat.country})
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                    <strong style={{ color: "#7dd3fc" }}>Climat :</strong> {selectedGoat.climate}
                  </p>
                </div>

                {/* Uses & Roles */}
                <div style={sectionCardStyle}>
                  <h4 style={sectionTitleStyle}>🏆 Rôles & Aptitudes principales</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selectedGoat.uses.map((use, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 8,
                          background: "rgba(56, 189, 248, 0.12)",
                          color: "#bae6fd",
                          border: "1px solid rgba(56, 189, 248, 0.25)",
                        }}
                      >
                        ✓ {use}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cheeses if any */}
                {selectedGoat.cheeses && selectedGoat.cheeses.length > 0 && (
                  <div style={{ ...sectionCardStyle, borderColor: "rgba(251, 191, 36, 0.3)" }}>
                    <h4 style={{ ...sectionTitleStyle, color: "#fbbf24" }}>🧀 Fromages emblématiques</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedGoat.cheeses.map((cheese, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 12,
                            padding: "4px 10px",
                            borderRadius: 8,
                            background: "rgba(251, 191, 36, 0.12)",
                            color: "#fef08a",
                            border: "1px solid rgba(251, 191, 36, 0.25)",
                          }}
                        >
                          🧀 {cheese}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "anecdote" && (
              <div
                style={{
                  padding: "20px",
                  borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)",
                  border: "1px solid rgba(251, 191, 36, 0.35)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>💡</span>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#fef08a", margin: 0 }}>
                    Histoire & Fait Surprenant
                  </h4>
                </div>
                <p style={{ fontSize: 14, lineHeight: "1.65", color: "#f1f5f9", margin: "0 0 16px" }}>
                  {selectedGoat.anecdote}
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                    TEMPÉRAMENT OBSERVÉ
                  </span>
                  <span style={{ fontSize: 13, color: "#bae6fd", fontWeight: 500 }}>
                    {selectedGoat.temperament}
                  </span>
                </div>
              </div>
            )}

            {activeTab === "characteristics" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={statCardStyle}>
                  <span style={statLabelStyle}>🧬 Type de cornes</span>
                  <span style={statValueStyle}>
                    {selectedGoat.hornType === "spiral"
                      ? "Spiralées hélicoïdales (tire-bouchon majestueux)"
                      : selectedGoat.hornType === "lyre"
                      ? "En lyre torsadée spectaculaire"
                      : selectedGoat.hornType === "massive"
                      ? "Massives annelées de haute montagne"
                      : selectedGoat.hornType === "short"
                      ? "Courtes et coniques"
                      : "Courbées régulières arquées vers l'arrière"}
                  </span>
                </div>

                <div style={statCardStyle}>
                  <span style={statLabelStyle}>👂 Morphologie des oreilles</span>
                  <span style={statValueStyle}>
                    {selectedGoat.earType === "drooping"
                      ? "Longues oreilles pendantes thermorégulatrices"
                      : selectedGoat.earType === "small"
                      ? "Petites oreilles alertes compactes"
                      : "Oreilles dressées vives et mobiles"}
                  </span>
                </div>

                <div style={statCardStyle}>
                  <span style={statLabelStyle}>🎨 Robe & Pelage</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: selectedGoat.coatColor,
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                      }}
                    />
                    <span style={statValueStyle}>
                      {selectedGoat.isBicolor
                        ? "Bicolore bicolore tranchée nette"
                        : selectedGoat.fluffyWool
                        ? "Toison laineuse épaisse & duvet isolant"
                        : "Pelage ras soyeux & rustique"}
                    </span>
                  </div>
                </div>

                <div style={statCardStyle}>
                  <span style={statLabelStyle}>🐐 Barbiche & Attributs</span>
                  <span style={statValueStyle}>
                    {selectedGoat.hasBeard ? "Oui (barbiche caprine proéminente)" : "Sans barbiche"}
                    {selectedGoat.hasBell ? " • Équipée d'une cloche d'alpage traditionnelle" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation (Prev / Next Goat) */}
          <div
            style={{
              padding: "14px 20px",
              background: "rgba(11, 19, 38, 0.95)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => navigateGoat("prev")}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Précédente
            </button>

            <span style={{ fontSize: 12, color: "#64748b" }}>
              {filteredGoats.findIndex((g) => g.id === selectedGoat.id) + 1} / {filteredGoats.length}
            </span>

            <button
              onClick={() => navigateGoat("next")}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Suivante →
            </button>
          </div>
        </aside>
      )}

      {/* 5. Bottom Quick Explorer Drawer (Goat Breed Carousel & Filters) */}
      <nav
        aria-label="Catalogue des chèvres"
        className="glass-panel"
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: selectedGoat ? "min(480px, calc(100vw - 20px))" : 20,
          borderRadius: 18,
          padding: "14px 18px",
          zIndex: 35,
          transition: "right 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Drawer Header with Search & Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
              🗺️ Explorer ({filteredGoats.length})
            </span>
            <button
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                color: "#7dd3fc",
                fontSize: 12,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              {isDrawerOpen ? "Masquer ▲" : "Afficher ▼"}
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: 200 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une race, pays..."
              style={{
                width: "100%",
                padding: "6px 28px 6px 12px",
                borderRadius: 8,
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                color: "#f8fafc",
                fontSize: 12,
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: activeCategory === cat ? "#38bdf8" : "rgba(255, 255, 255, 0.06)",
                  border: "1px solid",
                  borderColor: activeCategory === cat ? "#38bdf8" : "rgba(255, 255, 255, 0.12)",
                  color: activeCategory === cat ? "#041527" : "#cbd5e1",
                  fontSize: 11,
                  fontWeight: activeCategory === cat ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Goat Cards Scroll List */}
        {isDrawerOpen && (
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "thin",
            }}
          >
            {filteredGoats.map((goat) => {
              const isSelected = selectedGoat?.id === goat.id;
              return (
                <div
                  key={goat.id}
                  onClick={() => flyToGoat(goat)}
                  style={{
                    flex: "0 0 auto",
                    width: 175,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)"
                      : "rgba(15, 23, 42, 0.6)",
                    border: isSelected ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: isSelected ? "0 0 16px rgba(56, 189, 248, 0.35)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 18 }}>🐐</span>
                    <span style={{ fontSize: 15 }}>{goat.flag}</span>
                  </div>
                  <strong
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isSelected ? "#38bdf8" : "#f1f5f9",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {goat.name}
                  </strong>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{goat.country}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#7dd3fc",
                      marginTop: 2,
                    }}
                  >
                    {goat.category}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
}

// Reusable micro styles
const statCardStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.55)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: 600,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#f8fafc",
  lineHeight: 1.35,
};

const sectionCardStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  background: "rgba(15, 23, 42, 0.55)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#38bdf8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: "0 0 8px",
};
