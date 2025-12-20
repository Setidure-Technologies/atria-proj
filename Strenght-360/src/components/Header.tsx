import React, { useEffect, useState } from 'react';

const BASE_PATH = import.meta.env.VITE_BASE_PATH || '/';
const CANDIDATE_NAMES = [
  'atria-logo.jpeg',
  'atria-logo.jpg',
  'atria-logo.png',
  'atria-logo.svg',
  'atria_logo.png',
].map(name => BASE_PATH + name);

export function Header() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Try loading a few common logo filenames from public/
    const tryLoad = async () => {
      for (const p of CANDIDATE_NAMES) {
        try {
          // Use fetch to check existence quickly
          const res = await fetch(p, { method: 'HEAD' });

          if (!mounted) return;
          if (res.ok) {
            setLogo(p);
            return;
          }
        } catch (e) {
          // ignore and try next
        }
      }
      setLogo(null);
    };

    void tryLoad();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="w-full bg-orange-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-center">
        {logo ? (
          <img
            src={encodeURI(logo)}
            alt="Atria"
            className="h-32 w-auto object-contain"
            style={{ display: 'block' }}
          />
        ) : (
          <div className="h-32 flex items-center">
            <div className="text-base font-semibold text-gray-800">Strength 360</div>
          </div>
        )}
      </div>
    </header>
  );
}
