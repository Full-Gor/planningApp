import { WeatherInfo } from '../types/Event';

const WEATHER_API_KEY = 'your-weather-api-key'; // Remplacez par votre clé API

export class WeatherService {
  static async getWeatherForLocation(
    latitude: number,
    longitude: number,
    date: Date
  ): Promise<WeatherInfo | null> {
    try {
      // Utilisation d'une API météo comme OpenWeatherMap
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données météo');
      }
      
      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      };
    } catch (error) {
      console.error('Erreur météo:', error);
      return null;
    }
  }

  static async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 5
  ): Promise<WeatherInfo[]> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=fr&cnt=${days * 8}`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des prévisions météo');
      }
      
      const data = await response.json();
      
      return data.list.map((item: any) => ({
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
      }));
    } catch (error) {
      console.error('Erreur prévisions météo:', error);
      return [];
    }
  }

  static getWeatherIcon(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
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
  }

  static shouldShowWeatherWarning(weather: WeatherInfo, isOutdoorEvent: boolean): boolean {
    if (!isOutdoorEvent) return false;
    
    const warningConditions = [
      'rain', 'snow', 'storm', 'thunderstorm', 'heavy',
      'pluie', 'neige', 'orage', 'tempête', 'forte'
    ];
    
    return warningConditions.some(condition => 
      weather.condition.toLowerCase().includes(condition)
    ) || weather.temperature < 0 || weather.temperature > 35;
  }
}