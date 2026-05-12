import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface EnvironmentalDashboardProps {
  tripId: string;
  destination: {
    location: { lat: number; lng: number };
    address: string;
    city: string;
    state: string;
    country: string;
  };
  dates: {
    startDate: number;
    endDate: number;
  };
}

interface WeatherData {
  forecasts: Array<{
    date: string;
    hourly: Array<{
      time: string;
      temp: number;
      feelsLike: number;
      condition: string;
      conditionDescription: string;
      precipitation: number;
      windSpeed: number;
      humidity: number;
      icon: string;
    }>;
  }>;
}

interface AirQualityData {
  current: {
    date: string;
    aqi: number;
    category: string;
    pollutants: {
      pm25: string;
      pm10: string;
      o3: string;
      no2: string;
    };
  };
}

interface SolarData {
  solarData: Array<{
    date: string;
    sunrise: string;
    sunset: string;
    goldenHour: {
      morning: string;
      evening: string;
    };
    dayLength: number;
  }>;
}

const EnvironmentalDashboard: React.FC<EnvironmentalDashboardProps> = ({ tripId, destination, dates }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [solarData, setSolarData] = useState<SolarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnvironmentalData = async () => {
      setLoading(true);
      setError(null);

      try {
        const functions = getFunctions();

        // Fetch all environmental data in parallel
        const [weatherResult, aqResult, solarResult] = await Promise.all([
          httpsCallable(functions, 'getWeatherForecast')({
            lat: destination.location.lat,
            lng: destination.location.lng,
            startDate: dates.startDate,
            endDate: dates.endDate,
          }),
          httpsCallable(functions, 'getAirQuality')({
            lat: destination.location.lat,
            lng: destination.location.lng,
            startDate: dates.startDate,
            endDate: dates.endDate,
          }),
          httpsCallable(functions, 'getSolarData')({
            lat: destination.location.lat,
            lng: destination.location.lng,
            startDate: dates.startDate,
            endDate: dates.endDate,
          }),
        ]);

        const weatherData = weatherResult.data as { success: boolean; forecasts?: any; error?: string };
        const aqData = aqResult.data as { success: boolean; current?: any; error?: string };
        const solarDataResult = solarResult.data as { success: boolean; solarData?: any; error?: string };

        if (weatherData.success && weatherData.forecasts) {
          setWeatherData({ forecasts: weatherData.forecasts });
        }

        if (aqData.success && aqData.current) {
          setAirQualityData({ current: aqData.current });
        }

        if (solarDataResult.success && solarDataResult.solarData) {
          setSolarData({ solarData: solarDataResult.solarData });
        }
      } catch (err) {
        console.error('Error fetching environmental data:', err);
        setError('Failed to load environmental data');
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironmentalData();
  }, [destination.location.lat, destination.location.lng, dates.startDate, dates.endDate]);

  const getWeatherIcon = (iconCode: string) => {
    // OpenWeatherMap icon codes
    const iconMap: Record<string, string> = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌤️';
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 1) return 'bg-green-100 text-green-800 border-green-200';
    if (aqi === 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (aqi === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (aqi === 4) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-bright border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weather Forecast */}
      {weatherData && weatherData.forecasts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-navy-text mb-4">🌤️ Weather Forecast</h3>
          <div className="space-y-4">
            {weatherData.forecasts.map((day) => (
              <div key={day.date} className="border-2 border-gray-100 rounded-lg p-4">
                <h4 className="font-bold text-navy-text mb-3">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {day.hourly.slice(0, 8).map((hour, idx) => (
                    <div key={idx} className="bg-seafoam/10 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600 mb-1">{hour.time}</p>
                      <p className="text-3xl mb-1">{getWeatherIcon(hour.icon)}</p>
                      <p className="font-bold text-navy-text">{hour.temp}°F</p>
                      <p className="text-xs text-gray-600">Feels {hour.feelsLike}°F</p>
                      <p className="text-xs text-gray-600 mt-1">{hour.conditionDescription}</p>
                      {hour.precipitation > 20 && (
                        <p className="text-xs text-blue-600 mt-1">💧 {Math.round(hour.precipitation)}%</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Air Quality */}
      {airQualityData && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-navy-text mb-4">🌫️ Air Quality</h3>
          <div className={`border-2 rounded-lg p-4 ${getAQIColor(airQualityData.current.aqi)}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Air Quality Index</p>
                <p className="text-3xl font-bold">{airQualityData.current.category}</p>
              </div>
              <div className="text-5xl font-bold opacity-50">{airQualityData.current.aqi}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">PM2.5</p>
                <p className="font-bold">{airQualityData.current.pollutants.pm25} μg/m³</p>
              </div>
              <div>
                <p className="text-gray-600">PM10</p>
                <p className="font-bold">{airQualityData.current.pollutants.pm10} μg/m³</p>
              </div>
              <div>
                <p className="text-gray-600">O₃ (Ozone)</p>
                <p className="font-bold">{airQualityData.current.pollutants.o3} μg/m³</p>
              </div>
              <div>
                <p className="text-gray-600">NO₂</p>
                <p className="font-bold">{airQualityData.current.pollutants.no2} μg/m³</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solar Data */}
      {solarData && solarData.solarData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-navy-text mb-4">🌅 Sunrise & Sunset</h3>
          <div className="space-y-3">
            {solarData.solarData.map((day) => (
              <div key={day.date} className="bg-gradient-to-r from-orange-50 to-purple-50 border-2 border-orange-100 rounded-lg p-4">
                <h4 className="font-bold text-navy-text mb-3">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">🌅 Sunrise</p>
                    <p className="font-bold text-orange-600">
                      {new Date(day.sunrise).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">🌇 Sunset</p>
                    <p className="font-bold text-purple-600">
                      {new Date(day.sunset).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">✨ Golden Hour AM</p>
                    <p className="font-bold text-yellow-600">
                      {new Date(day.goldenHour.morning).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">✨ Golden Hour PM</p>
                    <p className="font-bold text-yellow-600">
                      {new Date(day.goldenHour.evening).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">Day length: {day.dayLength} hours</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentalDashboard;
