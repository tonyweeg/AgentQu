/**
 * WavyMountainBackground - Shared beautiful background component
 * Used by both AuthScreen and main app
 * Features: wavy mountains, regional birds/trees, time-of-day, weather-aware
 */

import React, { useState, useEffect, useRef } from 'react';

interface WavyMountainBackgroundProps {
  className?: string;
}

// Move regional libraries OUTSIDE component to prevent recreation on every render
const regionalBirds: Record<string, Array<{ type: string; flies: boolean; perches: boolean; walks: boolean; size: 'small' | 'medium' | 'large' }>> = {
  'north-america': [
    { type: 'cardinal', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'blue-jay', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'robin', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'chickadee', flies: true, perches: true, walks: false, size: 'small' },
    { type: 'red-tailed-hawk', flies: true, perches: true, walks: false, size: 'large' },
    { type: 'mourning-dove', flies: true, perches: true, walks: true, size: 'medium' },
    { type: 'crow', flies: true, perches: true, walks: true, size: 'medium' },
  ],
  'europe': [
    { type: 'european-robin', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'blackbird', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'sparrow', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'magpie', flies: true, perches: true, walks: true, size: 'medium' },
    { type: 'wood-pigeon', flies: true, perches: true, walks: true, size: 'medium' },
    { type: 'buzzard', flies: true, perches: true, walks: false, size: 'large' },
  ],
  'asia': [
    { type: 'oriental-magpie-robin', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'red-whiskered-bulbul', flies: true, perches: true, walks: false, size: 'small' },
    { type: 'asian-koel', flies: true, perches: true, walks: false, size: 'medium' },
    { type: 'spotted-dove', flies: true, perches: true, walks: true, size: 'medium' },
    { type: 'crested-serpent-eagle', flies: true, perches: true, walks: false, size: 'large' },
  ],
  'australia': [
    { type: 'magpie', flies: true, perches: true, walks: true, size: 'medium' },
    { type: 'kookaburra', flies: true, perches: true, walks: false, size: 'medium' },
    { type: 'cockatoo', flies: true, perches: true, walks: true, size: 'medium' },
    { type: 'willie-wagtail', flies: true, perches: true, walks: true, size: 'small' },
    { type: 'wedge-tailed-eagle', flies: true, perches: true, walks: false, size: 'large' },
  ],
  'south-america': [
    { type: 'tanager', flies: true, perches: true, walks: false, size: 'small' },
    { type: 'toucan', flies: true, perches: true, walks: false, size: 'medium' },
    { type: 'macaw', flies: true, perches: true, walks: true, size: 'large' },
    { type: 'hummingbird', flies: true, perches: true, walks: false, size: 'small' },
    { type: 'caracara', flies: true, perches: true, walks: true, size: 'large' },
  ],
};

// Region-specific tree types
const regionalTrees: Record<string, Array<{ type: string; shape: 'conifer' | 'deciduous' | 'palm' | 'tropical' }>> = {
  'north-america': [
    { type: 'oak', shape: 'deciduous' },
    { type: 'pine', shape: 'conifer' },
    { type: 'maple', shape: 'deciduous' },
  ],
  'europe': [
    { type: 'oak', shape: 'deciduous' },
    { type: 'birch', shape: 'deciduous' },
    { type: 'pine', shape: 'conifer' },
  ],
  'asia': [
    { type: 'bamboo', shape: 'tropical' },
    { type: 'cherry', shape: 'deciduous' },
    { type: 'banyan', shape: 'tropical' },
  ],
  'australia': [
    { type: 'eucalyptus', shape: 'deciduous' },
    { type: 'acacia', shape: 'deciduous' },
  ],
  'south-america': [
    { type: 'palm', shape: 'palm' },
    { type: 'brazil-nut', shape: 'tropical' },
    { type: 'kapok', shape: 'tropical' },
  ],
};

const WavyMountainBackground: React.FC<WavyMountainBackgroundProps> = ({ className = '' }) => {
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [weather, setWeather] = useState<'clear' | 'cloudy' | 'rainy'>('clear');

  // Use ref to track last fetched location to prevent repeated API calls
  const lastFetchedLocation = useRef<{ lat: number; lng: number } | null>(null);

  // Region-aware birds and trees
  const [activeBirds, setActiveBirds] = useState<Array<{
    type: string;
    flies: boolean;
    perches: boolean;
    walks: boolean;
    size: 'small' | 'medium' | 'large';
    behavior: 'flying' | 'perching' | 'walking';
    position: number;
    depth: 'front' | 'back';
  }>>(() => {
    const defaultBirds = [
      { type: 'cardinal', flies: true, perches: true, walks: true, size: 'small' as const },
      { type: 'robin', flies: true, perches: true, walks: true, size: 'small' as const },
      { type: 'blue-jay', flies: true, perches: true, walks: true, size: 'small' as const },
    ];
    return defaultBirds.map(bird => ({
      ...bird,
      behavior: 'flying' as const,
      position: Math.random() * 80 + 10,
      depth: (Math.random() > 0.5 ? 'front' : 'back') as 'front' | 'back',
    }));
  });

  const [activeTrees, setActiveTrees] = useState<Array<{
    type: string;
    shape: 'conifer' | 'deciduous' | 'palm' | 'tropical';
    position: number;
    depth: 'front' | 'back';
  }>>(() => {
    const defaultTrees = [
      { type: 'oak', shape: 'deciduous' as const },
      { type: 'pine', shape: 'conifer' as const },
      { type: 'maple', shape: 'deciduous' as const },
      { type: 'oak', shape: 'deciduous' as const },
    ];
    return defaultTrees.map(tree => ({
      ...tree,
      position: Math.random() * 90 + 5,
      depth: (Math.random() > 0.5 ? 'front' : 'back') as 'front' | 'back',
    }));
  });

  // Determine time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) setTimeOfDay('dawn');
    else if (hour >= 8 && hour < 17) setTimeOfDay('day');
    else if (hour >= 17 && hour < 20) setTimeOfDay('dusk');
    else setTimeOfDay('night');
  }, []);

  // Helper function to calculate distance between two coordinates in meters
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Try to get user's location and weather
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Check if location has changed significantly
          if (lastFetchedLocation.current) {
            const distance = getDistanceInMeters(
              lastFetchedLocation.current.lat,
              lastFetchedLocation.current.lng,
              loc.lat,
              loc.lng
            );

            if (distance < 100) {
              return;
            }
          }

          lastFetchedLocation.current = loc;

          // Reverse geocode to get region
          try {
            const geoResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=AIzaSyDKTAxMKuQ4-KsuP7vr7HbvteNTYvDyWjw`
            );
            const geoData = await geoResponse.json();

            if (geoData.results && geoData.results[0]) {
              const addressComponents = geoData.results[0].address_components;

              // Determine region based on country
              const countryComponent = addressComponents.find((c: any) =>
                c.types.includes('country')
              );
              if (countryComponent) {
                const countryCode = countryComponent.short_name;

                let region = 'north-america';
                if (['US', 'CA', 'MX'].includes(countryCode)) {
                  region = 'north-america';
                } else if (['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'CZ', 'AT', 'CH'].includes(countryCode)) {
                  region = 'europe';
                } else if (['CN', 'JP', 'IN', 'TH', 'VN', 'KR', 'ID', 'MY', 'PH', 'SG'].includes(countryCode)) {
                  region = 'asia';
                } else if (['AU', 'NZ'].includes(countryCode)) {
                  region = 'australia';
                } else if (['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO'].includes(countryCode)) {
                  region = 'south-america';
                }

                // Generate region-specific birds and trees
                const birdLibrary = regionalBirds[region] || regionalBirds['north-america'];
                const treeLibrary = regionalTrees[region] || regionalTrees['north-america'];

                const numBirds = Math.floor(Math.random() * 2) + 2;
                const birds = Array.from({ length: numBirds }, () => {
                  const bird = birdLibrary[Math.floor(Math.random() * birdLibrary.length)];
                  const behavior = Math.random() > 0.5 ?
                    (bird.flies ? 'flying' : 'walking') :
                    (bird.perches ? 'perching' : 'flying');

                  return {
                    ...bird,
                    behavior: behavior as 'flying' | 'perching' | 'walking',
                    position: Math.random() * 80 + 10,
                    depth: (Math.random() > 0.5 ? 'front' : 'back') as 'front' | 'back',
                  };
                });
                setActiveBirds(birds);

                const numTrees = Math.floor(Math.random() * 3) + 3;
                const trees = Array.from({ length: numTrees }, () => {
                  const tree = treeLibrary[Math.floor(Math.random() * treeLibrary.length)];
                  return {
                    ...tree,
                    position: Math.random() * 90 + 5,
                    depth: (Math.random() > 0.5 ? 'front' : 'back') as 'front' | 'back',
                  };
                });
                setActiveTrees(trees);
              }
            }
          } catch (geoErr) {
            console.error('Geocoding error:', geoErr);
          }

          // Get weather
          try {
            const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lng}&appid=ced5512b9799c4333d48ab97a0e716f5`
            );
            const weatherData = await weatherResponse.json();

            if (weatherData.weather && weatherData.weather[0]) {
              const condition = weatherData.weather[0].main.toLowerCase();
              if (condition.includes('clear')) {
                setWeather('clear');
              } else if (condition.includes('cloud')) {
                setWeather('cloudy');
              } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('storm')) {
                setWeather('rainy');
              } else {
                setWeather('clear');
              }
            }
          } catch (weatherErr) {
            console.error('Weather API error:', weatherErr);
            setWeather('clear');
          }
        },
        (error: GeolocationPositionError) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Sky colors based on time of day
  const getSkyGradient = () => {
    switch (timeOfDay) {
      case 'dawn':
        return 'from-orange-300 via-pink-200 to-sky-200';
      case 'day':
        return weather === 'clear' ? 'from-sky-400 via-sky-300 to-sky-200' : 'from-gray-400 via-gray-300 to-gray-200';
      case 'dusk':
        return 'from-orange-400 via-purple-300 to-blue-300';
      case 'night':
        return 'from-indigo-900 via-indigo-800 to-indigo-700';
    }
  };

  const showSun = timeOfDay !== 'night' && weather === 'clear';
  const showMoon = timeOfDay === 'night';
  const showStars = timeOfDay === 'night';
  const showClouds = weather === 'cloudy' || weather === 'rainy';
  const showNiceClouds = true;

  // Bird SVG component (below 160px navbar)
  const getBirdSVG = (bird: typeof activeBirds[0], index: number) => {
    const sizeMap = { small: 12, medium: 20, large: 28 };
    const size = sizeMap[bird.size as keyof typeof sizeMap];
    const scale = bird.depth === 'back' ? 0.6 : 1;
    const actualSize = size * scale;

    if (bird.behavior === 'flying') {
      return (
        <div
          key={index}
          className="absolute animate-pulse"
          style={{
            left: `${bird.position}%`,
            top: bird.depth === 'back' ? '180px' : '220px', // Below 160px navbar
            animationDuration: '3s',
            animationDelay: `${index * 1.5}s`
          }}
        >
          <svg width={actualSize * 2} height={actualSize} viewBox="0 0 40 20" fill="none">
            <path d="M2 10 Q10 5, 20 10 Q30 5, 38 10" stroke={timeOfDay === 'night' ? '#fff' : '#1e293b'} strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  // Tree SVG component
  const getTreeSVG = (tree: typeof activeTrees[0], index: number) => {
    const isBackground = tree.depth === 'back';
    const width = isBackground ? (tree.shape === 'palm' ? 'w-12' : 'w-16') : (tree.shape === 'palm' ? 'w-20' : 'w-24');
    const height = isBackground ? (tree.shape === 'palm' ? 'h-24' : 'h-32') : (tree.shape === 'palm' ? 'h-40' : 'h-48');
    const opacity = isBackground ? 'opacity-35' : 'opacity-65';
    const bottom = isBackground ? 'bottom-32' : 'bottom-0';
    const fillColor = isBackground ? '#2f4f2f' : '#0f4f0f';

    let treePath = '';
    switch (tree.shape) {
      case 'conifer':
        treePath = 'M50 20 L30 80 L40 80 L20 140 L40 140 L40 200 L60 200 L60 140 L80 140 L60 80 L70 80 Z';
        break;
      case 'deciduous':
        treePath = 'M45 190 L55 190 L55 140 Q50 130, 45 140 Z M50 40 Q20 60, 25 100 Q10 110, 20 130 Q15 145, 30 150 L70 150 Q85 145, 80 130 Q90 110, 75 100 Q80 60, 50 40 Z';
        break;
      case 'palm':
        treePath = 'M48 200 L52 200 L51 80 L49 80 Z M50 80 Q30 60, 20 70 M50 80 Q70 60, 80 70 M50 80 Q35 75, 25 85 M50 80 Q65 75, 75 85 M50 80 Q40 85, 30 100 M50 80 Q60 85, 70 100';
        break;
      case 'tropical':
        treePath = 'M45 190 L55 190 L55 140 M50 140 Q15 130, 10 110 Q5 90, 20 85 Q10 70, 25 60 Q20 45, 35 40 Q40 25, 50 30 Q60 25, 65 40 Q80 45, 75 60 Q90 70, 80 85 Q95 90, 90 110 Q85 130, 50 140';
        break;
    }

    return (
      <svg
        key={`tree-${index}`}
        className={`absolute ${bottom} ${width} ${height} ${opacity}`}
        style={{ left: `${tree.position}%` }}
        viewBox="0 0 100 200"
      >
        <path d={treePath} fill={fillColor} stroke={fillColor} strokeWidth="0.5"/>
      </svg>
    );
  };

  // Sun position based on time (below 160px navbar/tray)
  const getSunPosition = () => {
    if (timeOfDay === 'dawn') return 'top-44 left-12'; // 176px - rising
    if (timeOfDay === 'dusk') return 'top-44 right-16'; // 176px - setting
    return 'top-44 right-12'; // 176px - high noon
  };

  // Moon phase
  const moonPhase = new Date().getDate() % 30;
  const isFullMoon = moonPhase >= 13 && moonPhase <= 16;

  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      {/* Dynamic Sky gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getSkyGradient()}`}></div>

      {/* Sun */}
      {showSun && (
        <div className={`absolute ${getSunPosition()} w-16 h-16 rounded-full ${timeOfDay === 'dusk' ? 'bg-orange-500' : 'bg-yellow-400'} shadow-lg`}></div>
      )}

      {/* Nice Clouds (below 160px navbar) */}
      {showNiceClouds && (
        <>
          <svg className="absolute top-44 left-32 w-28 h-14 opacity-40 animate-pulse" style={{ animationDuration: '8s' }} viewBox="0 0 100 50">
            <ellipse cx="25" cy="35" rx="22" ry="13" fill="white"/>
            <ellipse cx="45" cy="30" rx="28" ry="16" fill="white"/>
            <ellipse cx="68" cy="35" rx="22" ry="13" fill="white"/>
          </svg>
          <svg className="absolute top-52 right-24 w-32 h-16 opacity-35 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} viewBox="0 0 100 50">
            <ellipse cx="30" cy="35" rx="25" ry="14" fill="white"/>
            <ellipse cx="55" cy="32" rx="30" ry="17" fill="white"/>
          </svg>
          <svg className="absolute top-60 left-56 w-24 h-12 opacity-30 animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} viewBox="0 0 100 50">
            <ellipse cx="35" cy="35" rx="28" ry="14" fill="white"/>
            <ellipse cx="62" cy="33" rx="26" ry="15" fill="white"/>
          </svg>
        </>
      )}

      {/* More Clouds (below 160px navbar) */}
      {showClouds && (
        <>
          <svg className="absolute top-44 left-24 w-36 h-18 opacity-70" viewBox="0 0 100 50">
            <ellipse cx="25" cy="35" rx="25" ry="15" fill="#9ca3af"/>
            <ellipse cx="45" cy="30" rx="30" ry="18" fill="#9ca3af"/>
            <ellipse cx="70" cy="35" rx="25" ry="15" fill="#9ca3af"/>
          </svg>
          <svg className="absolute top-52 right-32 w-40 h-20 opacity-65" viewBox="0 0 100 50">
            <ellipse cx="25" cy="35" rx="25" ry="15" fill="#9ca3af"/>
            <ellipse cx="50" cy="30" rx="35" ry="18" fill="#9ca3af"/>
            <ellipse cx="75" cy="35" rx="25" ry="15" fill="#9ca3af"/>
          </svg>
        </>
      )}

      {/* Flying Birds */}
      {activeBirds.map((bird, index) => getBirdSVG(bird, index))}

      {/* Moon (below 160px navbar) */}
      {showMoon && (
        <div className="absolute top-44 right-12">
          {isFullMoon ? (
            <div className="w-14 h-14 rounded-full bg-gray-100 shadow-lg shadow-gray-300"></div>
          ) : (
            <div className="relative w-14 h-14">
              <div className="absolute w-14 h-14 rounded-full bg-gray-100 shadow-lg"></div>
              <div className="absolute w-14 h-14 rounded-full bg-indigo-900 opacity-40" style={{ clipPath: `inset(0 ${moonPhase * 3}% 0 0)` }}></div>
            </div>
          )}
        </div>
      )}

      {/* Stars (below 160px navbar) */}
      {showStars && (
        <>
          <div className="absolute top-44 left-24 w-1 h-1 rounded-full bg-white animate-pulse"></div>
          <div className="absolute top-52 left-48 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-48 right-32 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-56 right-48 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-64 left-64 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-48 left-32 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute top-60 right-24 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute top-46 right-56 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.8s' }}></div>

          {Math.random() > 0.5 && (
            <div className="absolute top-42 right-20 w-12 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-ping" style={{ animationDuration: '3s', transform: 'rotate(-45deg)' }}></div>
          )}
        </>
      )}

      {/* Wavy Mountain Layers */}
      <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#7dd3c0" fillOpacity="0.6" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      <svg className="absolute bottom-0 w-full h-56" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#5b8ba3" fillOpacity="0.7" d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,90.7C672,75,768,85,864,106.7C960,128,1056,160,1152,154.7C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      <svg className="absolute bottom-0 w-full h-48" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#1e3a5f" fillOpacity="0.8" d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,170.7C672,160,768,160,864,170.7C960,181,1056,203,1152,202.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      <svg className="absolute bottom-0 w-full h-40" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#f97316" fillOpacity="0.9" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#78350f" fillOpacity="0.95" d="M0,256L48,261.3C96,267,192,277,288,272C384,267,480,245,576,234.7C672,224,768,224,864,234.7C960,245,1056,267,1152,266.7C1248,267,1344,245,1392,234.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Region-Specific Trees */}
      {activeTrees.map((tree, index) => getTreeSVG(tree, index))}
    </div>
  );
};

export default WavyMountainBackground;
