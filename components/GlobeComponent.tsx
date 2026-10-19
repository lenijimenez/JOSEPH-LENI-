import { useEffect, useState } from 'react';
import Globe from 'react-globe.gl';

export default function GlobeComponent() {
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  // Update the info panel whenever a country is selected
  useEffect(() => {
    const panel = document.getElementById('info-panel');
    if (!panel) return;
    if (selectedCountry) {
      panel.classList.remove('hidden');
      const nameEl = document.getElementById('country-name');
      const countEl = document.querySelector('#goat-count span');
      const breedsEl = document.querySelector('#goat-breeds span');
      const usesEl = document.querySelector('#goat-uses span');
      if (nameEl) nameEl.textContent = selectedCountry.name || selectedCountry.ADMIN || 'Country';
      if (countEl) countEl.textContent = '0';
      if (breedsEl) breedsEl.textContent = '-';
      if (usesEl) usesEl.textContent = '-';
    } else {
      panel.classList.add('hidden');
    }
  }, [selectedCountry]);

  return (
    <Globe
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      backgroundColor="rgba(0,0,0,0)"
      onCountryClick={setSelectedCountry}
      // optional: enable auto-rotate for a nicer experience
      enableAutoRotate={true}
      autoRotateSpeed={0.5}
    />
  );
}
