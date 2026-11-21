import React from 'react';
import {
  Sun,
  SunDim,
  CloudSun,
  CloudSunRain,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudLightning,
  CloudHail,
  CloudSnow,
  Snowflake,
  Wind
} from 'lucide-react';
import { getWeatherInfo } from '../constants/providers';

export function WeatherIcon({ code, iconName, className = 'w-6 h-6', ...props }) {
  // If iconName is passed directly (e.g. 'CloudRainWind')
  const icon = iconName || (code !== undefined ? getWeatherInfo(code).icon : 'CloudSun');

  switch (icon) {
    case 'Sun':
      return <Sun className={`text-amber-400 ${className}`} {...props} />;
    case 'SunDim':
      return <SunDim className={`text-amber-300 ${className}`} {...props} />;
    case 'CloudSun':
      return <CloudSun className={`text-amber-300 ${className}`} {...props} />;
    case 'CloudSunRain':
      return <CloudSunRain className={`text-cyan-400 ${className}`} {...props} />;
    case 'Cloud':
      return <Cloud className={`text-slate-300 ${className}`} {...props} />;
    case 'CloudFog':
      return <CloudFog className={`text-slate-400 ${className}`} {...props} />;
    case 'CloudDrizzle':
      return <CloudDrizzle className={`text-teal-300 ${className}`} {...props} />;
    case 'CloudRain':
      return <CloudRain className={`text-blue-400 ${className}`} {...props} />;
    case 'CloudRainWind':
      return <CloudRainWind className={`text-indigo-400 animate-pulse-subtle ${className}`} {...props} />;
    case 'CloudLightning':
      return <CloudLightning className={`text-purple-400 ${className}`} {...props} />;
    case 'CloudHail':
      return <CloudHail className={`text-cyan-300 ${className}`} {...props} />;
    case 'CloudSnow':
      return <CloudSnow className={`text-sky-200 ${className}`} {...props} />;
    case 'Snowflake':
      return <Snowflake className={`text-sky-100 ${className}`} {...props} />;
    case 'Wind':
      return <Wind className={`text-sky-300 ${className}`} {...props} />;
    default:
      return <Sun className={`text-amber-400 ${className}`} {...props} />;
  }
}
