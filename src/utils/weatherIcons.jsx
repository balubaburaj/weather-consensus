import React from 'react';
import {
  Sun,
  SunDim,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { getWeatherInfo } from '../constants/providers';

export function WeatherIcon({ code, className = 'w-6 h-6', ...props }) {
  const info = getWeatherInfo(code);

  switch (info.icon) {
    case 'Sun':
      return <Sun className={`text-amber-400 ${className}`} {...props} />;
    case 'SunDim':
      return <SunDim className={`text-amber-300 ${className}`} {...props} />;
    case 'CloudSun':
      return <CloudSun className={`text-sky-300 ${className}`} {...props} />;
    case 'Cloud':
      return <Cloud className={`text-slate-300 ${className}`} {...props} />;
    case 'CloudFog':
      return <CloudFog className={`text-slate-400 ${className}`} {...props} />;
    case 'CloudDrizzle':
      return <CloudDrizzle className={`text-cyan-400 ${className}`} {...props} />;
    case 'CloudRain':
      return <CloudRain className={`text-blue-400 ${className}`} {...props} />;
    case 'Snowflake':
      return <Snowflake className={`text-indigo-200 ${className}`} {...props} />;
    case 'CloudLightning':
      return <CloudLightning className={`text-purple-400 ${className}`} {...props} />;
    default:
      return <Sun className={`text-amber-400 ${className}`} {...props} />;
  }
}
