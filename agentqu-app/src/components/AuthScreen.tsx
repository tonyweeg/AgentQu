import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationCity, setLocationCity] = useState<string>('');
  const [mapError, setMapError] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [weather, setWeather] = useState<'clear' | 'cloudy' | 'rainy'>('clear');

  // Determine time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) setTimeOfDay('dawn');
    else if (hour >= 8 && hour < 17) setTimeOfDay('day');
    else if (hour >= 17 && hour < 20) setTimeOfDay('dusk');
    else setTimeOfDay('night');
  }, []);

  // Try to get user's location and weather
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);

          // Reverse geocode to get city name and weather
          try {
            // Get city name
            const geoResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=AIzaSyBCWC0ELKy7sxdLPc-BGE8-zzAQu76gwcU`
            );
            const geoData = await geoResponse.json();
            if (geoData.results && geoData.results[0]) {
              const addressComponents = geoData.results[0].address_components;
              const cityComponent = addressComponents.find((c: any) =>
                c.types.includes('locality') || c.types.includes('administrative_area_level_2')
              );
              if (cityComponent) {
                setLocationCity(cityComponent.long_name);
              }
            }

            // Get actual weather from OpenWeatherMap API
            try {
              const weatherResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lng}&appid=a8b5f8c1e2d4a3b9c7f6e5d4c3b2a1f0`
              );
              const weatherData = await weatherResponse.json();

              if (weatherData.weather && weatherData.weather[0]) {
                const condition = weatherData.weather[0].main.toLowerCase();
                // Map weather conditions to our states
                if (condition.includes('clear')) {
                  setWeather('clear');
                } else if (condition.includes('cloud')) {
                  setWeather('cloudy');
                } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('storm')) {
                  setWeather('rainy');
                } else {
                  setWeather('clear'); // Default
                }
              }
            } catch (weatherErr) {
              console.error('Failed to get weather:', weatherErr);
              // Fallback to clear if weather API fails
              setWeather('clear');
            }
          } catch (err) {
            console.error('Failed to get location data:', err);
          }
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      // Force account selection every time
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('Signed in as:', user.displayName);
      onSuccess();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

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

  // Sun position based on time
  const getSunPosition = () => {
    const hour = new Date().getHours();
    if (timeOfDay === 'dawn') return 'top-20 left-12'; // Rising
    if (timeOfDay === 'dusk') return 'top-16 right-16'; // Setting
    return 'top-8 right-12'; // High noon
  };

  // Moon phase (simplified - shows current day of month)
  const moonPhase = new Date().getDate() % 30; // 0-29
  const isFullMoon = moonPhase >= 13 && moonPhase <= 16;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Wavy Mountain Background Layers */}
      <div className="absolute inset-0 -z-10">
        {/* Dynamic Sky gradient based on time */}
        <div className={`absolute inset-0 bg-gradient-to-b ${getSkyGradient()}`}></div>

        {/* Sun (daytime, clear weather) - positioned by time */}
        {showSun && (
          <div className={`absolute ${getSunPosition()} w-16 h-16 rounded-full ${timeOfDay === 'dusk' ? 'bg-orange-500' : 'bg-yellow-400'} shadow-lg`}></div>
        )}

        {/* Clouds (cloudy/rainy weather) */}
        {showClouds && (
          <>
            {/* Simple SVG clouds */}
            <svg className="absolute top-12 left-24 w-32 h-16 opacity-80" viewBox="0 0 100 50">
              <ellipse cx="25" cy="35" rx="25" ry="15" fill="white"/>
              <ellipse cx="45" cy="30" rx="30" ry="18" fill="white"/>
              <ellipse cx="70" cy="35" rx="25" ry="15" fill="white"/>
            </svg>
            <svg className="absolute top-20 right-32 w-40 h-20 opacity-70" viewBox="0 0 100 50">
              <ellipse cx="25" cy="35" rx="25" ry="15" fill="white"/>
              <ellipse cx="50" cy="30" rx="35" ry="18" fill="white"/>
              <ellipse cx="75" cy="35" rx="25" ry="15" fill="white"/>
            </svg>
            <svg className="absolute top-32 left-48 w-36 h-18 opacity-75" viewBox="0 0 100 50">
              <ellipse cx="30" cy="35" rx="30" ry="15" fill="white"/>
              <ellipse cx="60" cy="32" rx="30" ry="16" fill="white"/>
            </svg>
          </>
        )}

        {/* Moon (nighttime) - with phase */}
        {showMoon && (
          <div className="absolute top-8 right-12">
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

        {/* Stars (nighttime) - more stars! */}
        {showStars && (
          <>
            {/* Regular stars */}
            <div className="absolute top-12 left-24 w-1 h-1 rounded-full bg-white animate-pulse"></div>
            <div className="absolute top-20 left-48 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-16 right-32 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-24 right-48 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-32 left-64 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-16 left-32 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute top-28 right-24 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '1.2s' }}></div>
            <div className="absolute top-14 right-56 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.8s' }}></div>

            {/* Shooting star (occasional) */}
            {Math.random() > 0.5 && (
              <div className="absolute top-10 right-20 w-12 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-ping" style={{ animationDuration: '3s', transform: 'rotate(-45deg)' }}></div>
            )}
          </>
        )}

        {/* Wave layers - from back to front */}
        {/* Light blue wave */}
        <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#7dd3c0" fillOpacity="0.6" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>

        {/* Gray-blue wave */}
        <svg className="absolute bottom-0 w-full h-56" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#5b8ba3" fillOpacity="0.7" d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,90.7C672,75,768,85,864,106.7C960,128,1056,160,1152,154.7C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>

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
      </div>

      <div className="max-w-5xl w-full relative z-10">
        {/* Hero Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border border-blue-900/20">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Left side - Logo (top aligned) */}
            <div className="flex-shrink-0">
              <img
                src="/agentqu-logo.png"
                alt="AgentQu"
                className="h-32 md:h-40 w-auto"
              />
            </div>

            {/* Middle - Content */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-navy-text mb-3">AgentQu</h1>
              <p className="text-xl md:text-2xl text-ocean-bright font-semibold mb-4">
                Discover Amazing Activities Near You
              </p>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                Your personal AI-powered activity discovery assistant. Find the perfect things to do based on your location, interests, and preferences - from restaurants and events to outdoor adventures and hidden gems.
              </p>

              {/* Feature pills - horizontal */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/20 to-ocean-bright/10 px-4 py-2 rounded-full">
                  <span className="text-xl">📍</span>
                  <span className="text-sm font-semibold text-navy-text">Location-Based</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/20 to-ocean-bright/10 px-4 py-2 rounded-full">
                  <span className="text-xl">🎯</span>
                  <span className="text-sm font-semibold text-navy-text">Personalized</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/20 to-ocean-bright/10 px-4 py-2 rounded-full">
                  <span className="text-xl">✨</span>
                  <span className="text-sm font-semibold text-navy-text">AI-Powered</span>
                </div>
              </div>
            </div>

            {/* Right side - Map/Location Preview */}
            {location && !mapError ? (
              <div className="flex-shrink-0 w-full md:w-64 h-48 rounded-xl overflow-hidden shadow-lg relative">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=13&size=400x300&markers=color:0x1e40af%7C${location.lat},${location.lng}&key=AIzaSyBCWC0ELKy7sxdLPc-BGE8-zzAQu76gwcU`}
                  alt="Your Location"
                  className="w-full h-full object-cover"
                  onError={() => setMapError(true)}
                />
                {locationCity && (
                  <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-center">
                    <p className="text-sm font-semibold text-navy-text">📍 {locationCity}</p>
                  </div>
                )}
              </div>
            ) : location && mapError ? (
              <div className="flex-shrink-0 w-full md:w-64 h-48 rounded-xl bg-gradient-to-br from-ocean-bright/30 to-seafoam/40 flex items-center justify-center border-2 border-ocean-bright/20">
                <div className="text-center px-4">
                  <div className="text-4xl mb-2">📍</div>
                  {locationCity && <p className="text-lg font-bold text-navy-text mb-1">{locationCity}</p>}
                  <p className="text-sm text-gray-600">Location detected</p>
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 w-full md:w-64 h-48 rounded-xl bg-gradient-to-br from-ocean-bright/20 to-seafoam/30 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="text-sm text-gray-600">Allow location to see nearby activities</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-blue-900/20">
          <h2 className="text-2xl font-bold text-navy-text mb-6 text-center">
            Get Started
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 hover:border-ocean-bright text-navy-text font-medium py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-ocean-bright border-t-transparent"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-ocean-bright hover:text-ocean-mid font-medium underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-ocean-bright hover:text-ocean-mid font-medium underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Corporate Links */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-900/20">
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="/privacy" className="text-gray-700 hover:text-ocean-bright transition-colors font-medium">
              Privacy Policy
            </a>
            <span className="text-gray-400">•</span>
            <a href="/terms" className="text-gray-700 hover:text-ocean-bright transition-colors font-medium">
              Terms of Service
            </a>
            <span className="text-gray-400">•</span>
            <a href="/contact" className="text-gray-700 hover:text-ocean-bright transition-colors font-medium">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
