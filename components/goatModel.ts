import * as THREE from "three";
import { GoatSpecies } from "./goatData";

// Shared materials cache to optimize WebGL draw calls & memory
const materialCache = new Map<string, THREE.Material>();

function getStandardMaterial(color: string, roughness = 0.6, metalness = 0.1): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}_${metalness}`;
  if (!materialCache.has(key)) {
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness,
        metalness,
      })
    );
  }
  return materialCache.get(key) as THREE.MeshStandardMaterial;
}

export function createGoat3DModel(species: GoatSpecies): THREE.Group {
  const root = new THREE.Group();
  root.name = `goat_${species.id}`;

  const scale = (species.scale || 1.0) * 0.85;

  // Base materials
  const coatColor = species.coatColor || "#ffffff";
  const headColor = species.headColor || coatColor;
  const hornColor = species.hornColor || "#333333";
  const darkHoofMat = getStandardMaterial("#171717", 0.5, 0.2);
  const eyeWhiteMat = getStandardMaterial("#ffffff", 0.2, 0.0);
  const eyePupilMat = getStandardMaterial("#09090b", 0.1, 0.0);
  const noseMat = getStandardMaterial("#262626", 0.8, 0.0);
  const bellMat = getStandardMaterial("#f59e0b", 0.2, 0.9);
  const collarMat = getStandardMaterial("#b91c1c", 0.7, 0.1);

  // 1. Holographic pedestal / Beacon base
  const pedestalGroup = new THREE.Group();
  
  // Glowing disc
  const discGeo = new THREE.CylinderGeometry(0.75, 0.82, 0.08, 16);
  const discMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(coatColor),
    emissive: new THREE.Color(coatColor),
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  const discMesh = new THREE.Mesh(discGeo, discMat);
  discMesh.position.y = 0.04;
  pedestalGroup.add(discMesh);

  // Outer glowing ring
  const ringGeo = new THREE.RingGeometry(0.85, 1.05, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.01;
  pedestalGroup.add(ringMesh);

  root.add(pedestalGroup);

  // 2. Goat Body Subgroup
  const goatBodyGroup = new THREE.Group();

  // A. Four Legs
  const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.85, 6);
  const hoofGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.12, 6);

  const legPositions = [
    { x: -0.2, z: 0.32 }, // Front Left
    { x: 0.2, z: 0.32 },  // Front Right
    { x: -0.2, z: -0.32 }, // Back Left
    { x: 0.2, z: -0.32 },  // Back Right
  ];

  legPositions.forEach((pos, idx) => {
    // For bicolor goats, back legs match back color
    const legColor = species.isBicolor && idx >= 2 ? (species.bicolorBack || "#ffffff") : (species.bicolorFront || coatColor);
    const legMat = getStandardMaterial(legColor, 0.7, 0.1);

    const legMesh = new THREE.Mesh(legGeo, legMat);
    legMesh.position.set(pos.x, 0.46, pos.z);

    const hoofMesh = new THREE.Mesh(hoofGeo, darkHoofMat);
    hoofMesh.position.set(pos.x, 0.08, pos.z);

    goatBodyGroup.add(legMesh);
    goatBodyGroup.add(hoofMesh);
  });

  // B. Torso (Barrel body)
  if (species.isBicolor) {
    // Front half
    const frontMat = getStandardMaterial(species.bicolorFront || "#111111", 0.7);
    const frontGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.52, 8);
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.rotation.x = Math.PI / 2;
    frontMesh.position.set(0, 0.95, 0.26);
    goatBodyGroup.add(frontMesh);

    // Back half
    const backMat = getStandardMaterial(species.bicolorBack || "#ffffff", 0.7);
    const backGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.52, 8);
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.rotation.x = Math.PI / 2;
    backMesh.position.set(0, 0.95, -0.26);
    goatBodyGroup.add(backMesh);
  } else {
    const bodyMat = getStandardMaterial(coatColor, 0.7);
    const bodyGeo = new THREE.CylinderGeometry(0.34, 0.34, 1.05, 8);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.position.set(0, 0.95, 0);
    goatBodyGroup.add(bodyMesh);
  }

  // Fluffy fleece bumps for Cashmere / Angora / Criollo
  if (species.fluffyWool) {
    const woolMat = getStandardMaterial(species.coatColor || "#fafafa", 0.9, 0.0);
    const woolGeo = new THREE.SphereGeometry(0.14, 6, 6);
    const bumps = [
      { x: 0, y: 1.25, z: 0.1 },
      { x: -0.2, y: 1.15, z: -0.15 },
      { x: 0.2, y: 1.15, z: -0.15 },
      { x: -0.18, y: 1.12, z: 0.2 },
      { x: 0.18, y: 1.12, z: 0.2 },
      { x: 0, y: 1.22, z: -0.3 },
    ];
    bumps.forEach((b) => {
      const w = new THREE.Mesh(woolGeo, woolMat);
      w.position.set(b.x, b.y, b.z);
      goatBodyGroup.add(w);
    });
  }

  // C. Tail (short, upright, perky)
  const tailGeo = new THREE.ConeGeometry(0.08, 0.26, 5);
  const tailColor = species.isBicolor ? (species.bicolorBack || "#ffffff") : coatColor;
  const tailMesh = new THREE.Mesh(tailGeo, getStandardMaterial(tailColor, 0.7));
  tailMesh.position.set(0, 1.08, -0.56);
  tailMesh.rotation.x = -Math.PI / 3.5;
  goatBodyGroup.add(tailMesh);

  // D. Neck
  const neckMat = getStandardMaterial(species.headColor || (species.isBicolor ? (species.bicolorFront || coatColor) : coatColor), 0.7);
  const neckGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.65, 7);
  const neckMesh = new THREE.Mesh(neckGeo, neckMat);
  neckMesh.position.set(0, 1.28, 0.44);
  neckMesh.rotation.x = -Math.PI / 5;
  goatBodyGroup.add(neckMesh);

  // E. Collar and Golden Bell
  if (species.hasBell) {
    const collarGeo = new THREE.TorusGeometry(0.23, 0.035, 6, 12);
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.set(0, 1.22, 0.44);
    collarMesh.rotation.x = Math.PI / 3.2;
    goatBodyGroup.add(collarMesh);

    const bellGeo = new THREE.SphereGeometry(0.075, 8, 8);
    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.position.set(0, 1.12, 0.56);
    goatBodyGroup.add(bellMesh);
  }

  // F. Head & Snout
  const headMat = getStandardMaterial(headColor, 0.7);
  const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.45);
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.set(0, 1.62, 0.68);
  headMesh.rotation.x = Math.PI / 12;
  goatBodyGroup.add(headMesh);

  // Snout tip / Nose
  const snoutGeo = new THREE.BoxGeometry(0.2, 0.16, 0.12);
  const snoutMesh = new THREE.Mesh(snoutGeo, noseMat);
  snoutMesh.position.set(0, 1.55, 0.92);
  snoutMesh.rotation.x = Math.PI / 12;
  goatBodyGroup.add(snoutMesh);

  // Eyes with characteristic horizontal pupils
  const eyeScleraGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const pupilGeo = new THREE.BoxGeometry(0.015, 0.02, 0.05);

  [-0.15, 0.15].forEach((eyeX) => {
    const sclera = new THREE.Mesh(eyeScleraGeo, eyeWhiteMat);
    sclera.position.set(eyeX, 1.68, 0.74);
    goatBodyGroup.add(sclera);

    const pupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    pupil.position.set(eyeX > 0 ? eyeX + 0.02 : eyeX - 0.02, 1.68, 0.74);
    goatBodyGroup.add(pupil);
  });

  // G. Goatee (Barbiche)
  if (species.hasBeard) {
    const beardColor = species.headColor || coatColor;
    const beardGeo = new THREE.ConeGeometry(0.08, 0.28, 4);
    const beardMat = getStandardMaterial(beardColor, 0.9);
    const beardMesh = new THREE.Mesh(beardGeo, beardMat);
    beardMesh.position.set(0, 1.4, 0.82);
    beardMesh.rotation.x = -Math.PI / 6;
    beardMesh.rotation.z = Math.PI; // upside down cone
    goatBodyGroup.add(beardMesh);
  }

  // H. Ears
  if (species.earType === "drooping") {
    // Long drooping ears (Nubienne, Boer)
    const earGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.42, 6);
    [-0.17, 0.17].forEach((earX) => {
      const earMesh = new THREE.Mesh(earGeo, headMat);
      earMesh.position.set(earX > 0 ? earX + 0.06 : earX - 0.06, 1.5, 0.62);
      earMesh.rotation.z = earX > 0 ? -Math.PI / 7 : Math.PI / 7;
      earMesh.rotation.x = Math.PI / 14;
      goatBodyGroup.add(earMesh);
    });
  } else if (species.earType === "small") {
    // Small alert ears
    const earGeo = new THREE.ConeGeometry(0.05, 0.18, 4);
    [-0.15, 0.15].forEach((earX) => {
      const earMesh = new THREE.Mesh(earGeo, headMat);
      earMesh.position.set(earX > 0 ? earX + 0.04 : earX - 0.04, 1.76, 0.6);
      earMesh.rotation.z = earX > 0 ? -Math.PI / 3 : Math.PI / 3;
      earMesh.rotation.x = -Math.PI / 8;
      goatBodyGroup.add(earMesh);
    });
  } else {
    // Standard alert ears
    const earGeo = new THREE.ConeGeometry(0.06, 0.26, 4);
    [-0.16, 0.16].forEach((earX) => {
      const earMesh = new THREE.Mesh(earGeo, headMat);
      earMesh.position.set(earX > 0 ? earX + 0.05 : earX - 0.05, 1.76, 0.6);
      earMesh.rotation.z = earX > 0 ? -Math.PI / 3 : Math.PI / 3;
      earMesh.rotation.x = -Math.PI / 7;
      goatBodyGroup.add(earMesh);
    });
  }

  // I. Horns! (The most iconic distinguishing feature)
  const hornMat = getStandardMaterial(hornColor, 0.4, 0.2);

  if (species.hornType === "spiral") {
    // Markhor corkscrew / spiral horns
    [-0.08, 0.08].forEach((hornX) => {
      const spiralGroup = new THREE.Group();
      // Segments twisting up and out
      const numSegments = 5;
      for (let s = 0; s < numSegments; s++) {
        const segGeo = new THREE.CylinderGeometry(0.045 - s * 0.007, 0.055 - s * 0.007, 0.22, 5);
        const seg = new THREE.Mesh(segGeo, hornMat);
        const t = s / numSegments;
        const angle = t * Math.PI * 2.2 * (hornX > 0 ? 1 : -1);
        seg.position.set(Math.sin(angle) * 0.08, s * 0.18, Math.cos(angle) * 0.06);
        seg.rotation.z = (hornX > 0 ? -0.2 : 0.2) + Math.cos(angle) * 0.2;
        spiralGroup.add(seg);
      }
      spiralGroup.position.set(hornX, 1.82, 0.62);
      spiralGroup.rotation.x = -Math.PI / 5;
      spiralGroup.rotation.z = hornX > 0 ? -Math.PI / 8 : Math.PI / 8;
      goatBodyGroup.add(spiralGroup);
    });
  } else if (species.hornType === "lyre") {
    // Rove wide lyre horns
    [-0.08, 0.08].forEach((hornX) => {
      const lyreGroup = new THREE.Group();
      // Base going outwards
      const baseGeo = new THREE.CylinderGeometry(0.045, 0.065, 0.38, 5);
      const baseMesh = new THREE.Mesh(baseGeo, hornMat);
      baseMesh.rotation.z = hornX > 0 ? -Math.PI / 3.2 : Math.PI / 3.2;
      baseMesh.rotation.x = -Math.PI / 6;
      lyreGroup.add(baseMesh);

      // Tip curving up and slightly in
      const tipGeo = new THREE.ConeGeometry(0.045, 0.38, 5);
      const tipMesh = new THREE.Mesh(tipGeo, hornMat);
      tipMesh.position.set(hornX > 0 ? 0.24 : -0.24, 0.36, -0.05);
      tipMesh.rotation.z = hornX > 0 ? Math.PI / 8 : -Math.PI / 8;
      tipMesh.rotation.x = -Math.PI / 5;
      lyreGroup.add(tipMesh);

      lyreGroup.position.set(hornX, 1.8, 0.6);
      goatBodyGroup.add(lyreGroup);
    });
  } else if (species.hornType === "massive") {
    // Bouquetin / Ibex long sweeping backward ribbed horns
    [-0.09, 0.09].forEach((hornX) => {
      const hornGroup = new THREE.Group();
      const segments = 6;
      for (let s = 0; s < segments; s++) {
        const segGeo = new THREE.CylinderGeometry(0.07 - s * 0.009, 0.08 - s * 0.009, 0.22, 6);
        const seg = new THREE.Mesh(segGeo, hornMat);
        const curveAngle = (s / segments) * (Math.PI / 2.2);
        seg.position.set(0, Math.cos(curveAngle) * 0.5 + 0.2, -Math.sin(curveAngle) * 0.5);
        seg.rotation.x = -curveAngle - 0.2;
        hornGroup.add(seg);
      }
      hornGroup.position.set(hornX, 1.76, 0.6);
      hornGroup.rotation.z = hornX > 0 ? -0.15 : 0.15;
      goatBodyGroup.add(hornGroup);
    });
  } else if (species.hornType === "short") {
    // Short horns (Naine, Tokara, Black Bengal)
    [-0.08, 0.08].forEach((hornX) => {
      const hornGeo = new THREE.ConeGeometry(0.045, 0.24, 5);
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.position.set(hornX, 1.82, 0.62);
      horn.rotation.x = -Math.PI / 4.5;
      horn.rotation.z = hornX > 0 ? -Math.PI / 7 : Math.PI / 7;
      goatBodyGroup.add(horn);
    });
  } else {
    // Standard sleek curved horns (Alpine, Saanen, Murciano)
    [-0.08, 0.08].forEach((hornX) => {
      const hornGeo = new THREE.ConeGeometry(0.05, 0.48, 6);
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.position.set(hornX, 1.95, 0.52);
      horn.rotation.x = -Math.PI / 3.8;
      horn.rotation.z = hornX > 0 ? -Math.PI / 7 : Math.PI / 7;
      goatBodyGroup.add(horn);
    });
  }

  // 3. Floating Beacon marker above head
  const beaconGeo = new THREE.OctahedronGeometry(0.14, 0);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: false,
  });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 2.5, 0.4);
  root.add(beaconMesh);

  // 4. Large Invisible Hit Sphere for effortless clicking & hover detection
  const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.set(0, 1.2, 0);
  root.add(hitMesh);

  // Apply species scaling and add body group
  goatBodyGroup.scale.set(scale, scale, scale);
  root.add(goatBodyGroup);

  // Attach metadata
  root.userData = {
    species,
    id: species.id,
    beaconMesh,
    discMat,
  };

  return root;
}
