import React, { useState, useEffect, useRef } from 'react';

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

// Region-specific tree types - OUTSIDE component
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

interface DynamicBackgroundProps {
  location?: { lat: number; lng: number } | null;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ location }) => {
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [weather, setWeather] = useState<'clear' | 'cloudy' | 'rainy'>('clear');
  const [activeBirds, setActiveBirds] = useState<Array<{
    type: string;
    flies: boolean;
    perches: boolean;
    walks: boolean;
    size: 'small' | 'medium' | 'large';
    behavior: 'flying' | 'perching' | 'walking';
    position: number;
    depth: 'front' | 'back';
  }>>([]);
  const [activeTrees, setActiveTrees] = useState<Array<{
    type: string;
    shape: 'conifer' | 'deciduous' | 'palm' | 'tropical';
    position: number;
    depth: 'front' | 'back';
  }>>([]);

  // Use ref to track last fetched location to prevent repeated API calls
  const lastFetchedLocation = useRef<{ lat: number; lng: number } | null>(null);

  // Detect time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) setTimeOfDay('dawn');
    else if (hour >= 7 && hour < 17) setTimeOfDay('day');
    else if (hour >= 17 && hour < 20) setTimeOfDay('dusk');
    else setTimeOfDay('night');
  }, []);

  // Helper function to calculate distance between two coordinates in meters
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
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

  // Get location and weather data
  useEffect(() => {
    if (!location) return;

    // Check if location has changed significantly (more than 100 meters)
    if (lastFetchedLocation.current) {
      const distance = getDistanceInMeters(
        lastFetchedLocation.current.lat,
        lastFetchedLocation.current.lng,
        location.lat,
        location.lng
      );

      // If less than 100 meters, skip API calls
      if (distance < 100) {
        return;
      }
    }

    // Update last fetched location
    lastFetchedLocation.current = location;

    // Fetch region and weather data
    (async () => {
      try {
        // Get region from geocoding
        const geoResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=AIzaSyDKTAxMKuQ4-KsuP7vr7HbvteNTYvDyWjw`
        );
        const geoData = await geoResponse.json();

        if (geoData.results && geoData.results[0]) {
          const addressComponents = geoData.results[0].address_components;
          const countryComponent = addressComponents.find((c: any) =>
            c.types.includes('country')
          );

          if (countryComponent) {
            const countryCode = countryComponent.short_name;

            // Map country codes to regions
            let region = 'north-america'; // Default
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

            // Create 2-3 random birds native to this region
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

            // Create 3-5 random trees native to this region
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
        console.error('Background geocoding error:', geoErr);
      }

      // Get weather from OpenWeatherMap API
      try {
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=ced5512b9799c4333d48ab97a0e716f5`
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
        console.error('Background weather error:', weatherErr);
        setWeather('clear');
      }
    })();
  }, [location]);

  // Sky gradient based on time
  const getSkyGradient = () => {
    const base = {
      dawn: 'from-orange-300 via-pink-200 to-blue-200',
      day: 'from-blue-300 via-blue-200 to-blue-100',
      dusk: 'from-purple-400 via-orange-300 to-pink-200',
      night: 'from-indigo-900 via-purple-900 to-blue-900',
    };
    return base[timeOfDay];
  };

  // Show sun or moon based on time and weather
  const showSun = (timeOfDay === 'day' || timeOfDay === 'dusk' || timeOfDay === 'dawn') && weather !== 'rainy';
  const showMoon = timeOfDay === 'night' && weather !== 'rainy';
  const showNiceClouds = true; // Always show a few nice clouds

  // Bird SVG component
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
            top: bird.depth === 'back' ? '20%' : '30%',
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
    const bottom = 'bottom-0'; // All trees sit on the coastal waves
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

  // Sun position based on time - positioned below header+tray (157px total)
  const getSunPosition = () => {
    if (timeOfDay === 'dawn') return 'top-44 left-12'; // Below header+tray on left (176px)
    if (timeOfDay === 'dusk') return 'top-40 right-16'; // Below header+tray on right (160px)
    return 'top-40 right-12'; // Below header+tray, high in sky (160px)
  };

  // Moon phase
  const moonPhase = new Date().getDate() % 30;
  const isFullMoon = moonPhase >= 13 && moonPhase <= 16;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -10 }}>
      {/* Dynamic Sky gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getSkyGradient()}`}></div>

      {/* Sun */}
      {showSun && (
        <div className={`absolute ${getSunPosition()} w-16 h-16 rounded-full ${timeOfDay === 'dusk' ? 'bg-orange-500' : 'bg-yellow-400'} shadow-lg`}></div>
      )}

      {/* Moon */}
      {showMoon && (
        <div className={`absolute top-40 right-20 w-16 h-16 rounded-full ${isFullMoon ? 'bg-gray-200' : 'bg-gray-300'} shadow-lg`}></div>
      )}

      {/* Clouds */}
      {showNiceClouds && (
        <>
          <svg className="absolute top-44 left-32 w-28 h-14 opacity-40 animate-pulse" style={{ animationDuration: '8s' }} viewBox="0 0 100 50">
            <ellipse cx="25" cy="35" rx="22" ry="13" fill="white"/>
            <ellipse cx="45" cy="30" rx="28" ry="16" fill="white"/>
            <ellipse cx="68" cy="35" rx="22" ry="13" fill="white"/>
          </svg>
          <svg className="absolute top-48 right-24 w-32 h-16 opacity-35 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} viewBox="0 0 100 50">
            <ellipse cx="30" cy="35" rx="25" ry="14" fill="white"/>
            <ellipse cx="55" cy="32" rx="30" ry="17" fill="white"/>
            <ellipse cx="75" cy="36" rx="20" ry="12" fill="white"/>
          </svg>
        </>
      )}

      {/* Wavy Mountains - Beautiful colored waves matching login page */}
      {/* Dark blue wave */}
      <svg className="absolute bottom-0 w-full h-48" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#1e3a5f" fillOpacity="0.8" d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,170.7C672,160,768,160,864,170.7C960,181,1056,203,1152,202.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Orange wave */}
      <svg className="absolute bottom-0 w-full h-40" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#f97316" fillOpacity="0.9" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Brown wave */}
      <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#78350f" fillOpacity="0.95" d="M0,256L48,261.3C96,267,192,277,288,272C384,267,480,245,576,234.7C672,224,768,224,864,234.7C960,245,1056,267,1152,266.7C1248,267,1344,245,1392,234.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Birds */}
      {activeBirds.map((bird, i) => getBirdSVG(bird, i))}

      {/* Trees */}
      {activeTrees.map((tree, i) => getTreeSVG(tree, i))}
    </div>
  );
};

export default DynamicBackground;
