/**
 * Smart Clothing & Gear Engine
 * Generates nuanced, itemized clothing suggestions based on Feels-Like,
 * actual temperature, wind chill, rain type, and sunshine deception factor!
 */

export function getClothingSuggestions({
  temp = 12,
  apparentTemp = 8,
  windSpeed = 25,
  rainType = { type: 'dry', intensity: 'Dry' },
  uvIndex = 1,
  weatherCode = 2,
  isDay = true,
  mode = 'casual', // 'casual' | 'commute' | 'active'
}) {
  const feels = apparentTemp !== null && apparentTemp !== undefined ? apparentTemp : temp;
  const windChillDelta = Math.round(temp - feels);
  const isWet = rainType && rainType.type !== 'dry';
  const isSunny = (weatherCode === 0 || weatherCode === 1 || weatherCode === 2);

  // 1. Thermal Sensation Level
  let thermalLevel = 'chilly';
  let thermalTitle = 'Chilly & Brisk';
  let thermalColor = 'text-cyan-300';
  let thermalBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

  if (feels < 2) {
    thermalLevel = 'freezing';
    thermalTitle = 'Freezing / Frosty Bite';
    thermalColor = 'text-indigo-200';
    thermalBadge = 'bg-indigo-500/25 text-indigo-200 border-indigo-500/40';
  } else if (feels < 7) {
    thermalLevel = 'cold';
    thermalTitle = 'Sharp Atlantic Cold';
    thermalColor = 'text-sky-300';
    thermalBadge = 'bg-sky-500/20 text-sky-200 border-sky-500/30';
  } else if (feels < 12) {
    thermalLevel = 'chilly';
    thermalTitle = 'Chilly / Brisk Air';
    thermalColor = 'text-cyan-300';
    thermalBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  } else if (feels < 16) {
    thermalLevel = 'mild';
    thermalTitle = 'Fresh & Mild';
    thermalColor = 'text-emerald-300';
    thermalBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  } else if (feels < 22) {
    thermalLevel = 'pleasant';
    thermalTitle = 'Pleasant & Warm';
    thermalColor = 'text-amber-300';
    thermalBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else {
    thermalLevel = 'hot';
    thermalTitle = 'Warm to Hot';
    thermalColor = 'text-orange-400';
    thermalBadge = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  }

  // 2. The Sunny Trick Reality Check
  let sunRealityCheck = null;
  if (isSunny && feels < 13) {
    sunRealityCheck = {
      title: '☀️ Sunny Deception Alert',
      message: `It looks bright and pleasant through the window, but the Atlantic air has a bite (${temp}°C feels like ${feels}°C). Sunglasses are great for low-angle glare, but DO NOT skip a proper coat!`,
      type: 'warning',
    };
  } else if (windChillDelta >= 3) {
    sunRealityCheck = {
      title: '🌬️ Wind Chill Warning',
      message: `25+ km/h breeze makes it feel ${windChillDelta}°C colder than the thermometer reading. A windproof outer shell is critical.`,
      type: 'info',
    };
  } else if (isWet && feels < 10) {
    sunRealityCheck = {
      title: '🌧️ Damp Cold Sensation',
      message: 'Moisture in the air accelerates heat loss. Damp coats make cold bite much harder; waterproof outer layer needed.',
      type: 'warning',
    };
  }

  // 3. Layer by Layer Suggestions based on Thermal Level & Rain
  let outerwear = {};
  let midLayer = {};
  let bottoms = {};
  let footwear = {};
  const accessories = [];

  // OUTERWEAR
  if (isWet) {
    if (rainType.type === 'heavy_rain' || rainType.type === 'torrential') {
      outerwear = {
        name: 'Heavy Waterproof Storm Parka / Technical Raincoat',
        desc: 'Fully taped seams, high collar, deep hood. Regular coats will soak through.',
        icon: 'Shield',
      };
    } else {
      outerwear = {
        name: feels < 9 ? 'Insulated Waterproof Trench or Mac' : 'Water-resistant Shell Jacket',
        desc: 'Repels drizzle and Atlantic mist while blocking wind chill.',
        icon: 'Umbrella',
      };
    }
  } else {
    // Dry weather
    if (feels < 4) {
      outerwear = {
        name: 'Heavy Down Puffer Coat or Thick Wool Overcoat',
        desc: 'Maximum thermal insulation against biting cold.',
        icon: 'Layers',
      };
    } else if (feels < 9) {
      outerwear = {
        name: 'Fleece-lined Softshell or Tailored Wool Coat',
        desc: 'Wind-blocking jacket with warmth. Perfect for brisk sunny walks.',
        icon: 'Layers',
      };
    } else if (feels < 14) {
      outerwear = {
        name: 'Light Quilted Jacket, Bomber, or Denim with Overshirt',
        desc: 'Versatile layer; zip up in the shade or breeze, unzip in the sun.',
        icon: 'Layers',
      };
    } else if (feels < 19) {
      outerwear = {
        name: 'Light Cardigan, Overshirt, or Lightweight Windbreaker',
        desc: 'Just in case the breeze picks up in the evening.',
        icon: 'Sun',
      };
    } else {
      outerwear = {
        name: 'No jacket needed',
        desc: 'Comfortable in short sleeves or light linen shirt.',
        icon: 'Sun',
      };
    }
  }

  // MID / BASE LAYER
  if (feels < 6) {
    midLayer = {
      name: 'Merino Wool Sweater + Thermal Undershirt',
      desc: 'Traps body heat efficiently without excessive bulk.',
    };
  } else if (feels < 11) {
    midLayer = {
      name: 'Knit Cotton Jumper, Fleece, or Heavy Flannel Shirt',
      desc: 'Comfortable indoor/outdoor warmth.',
    };
  } else if (feels < 16) {
    midLayer = {
      name: 'Long-sleeve Henley or Light Sweater over T-shirt',
      desc: 'Adaptable layers you can shed indoors.',
    };
  } else {
    midLayer = {
      name: 'Breathable Cotton T-Shirt or Linen Shirt',
      desc: 'Keeps you cool and aerated.',
    };
  }

  // BOTTOMS
  if (feels < 6) {
    bottoms = {
      name: 'Heavyweight Denim Jeans, Corduroys, or Lined Chinos',
      desc: 'Thicker weave stops cold drafts at the ankles.',
    };
  } else if (isWet && (rainType.type === 'heavy_rain' || rainType.type === 'torrential')) {
    bottoms = {
      name: 'Dark Denim or Water-resistant Trousers',
      desc: 'Resists puddle splashback and stays dry.',
    };
  } else if (feels < 17) {
    bottoms = {
      name: 'Classic Jeans, Chinos, or Tailored Trousers',
      desc: 'Standard everyday comfort.',
    };
  } else {
    bottoms = {
      name: 'Light Chinos, Linen Trousers, or Shorts',
      desc: 'Relaxed and breathable.',
    };
  }

  // FOOTWEAR
  if (isWet) {
    footwear = {
      name: 'Waterproof Leather Boots (Chelsea/Blundstone) or Gore-Tex Trainers',
      desc: 'Prevents soaked socks from surface puddles and wet grass.',
    };
  } else if (feels < 6) {
    footwear = {
      name: 'Leather Boots or Sturdy Shoes with Warm Wool Socks',
      desc: 'Ground radiates cold; thick soles and wool socks keep toes warm.',
    };
  } else {
    footwear = {
      name: 'Comfortable Leather Sneakers or Casual Walking Shoes',
      desc: 'Dry pavements allow standard everyday shoes.',
    };
  }

  // ACCESSORIES
  if (feels < 8) {
    accessories.push({
      item: 'Wool Scarf / Neck Warmer',
      reason: 'Prevents cold Atlantic drafts down your collar.',
      icon: '🧣',
    });
  }
  if (feels < 5) {
    accessories.push({
      item: 'Knit Beanie / Wool Cap',
      reason: 'Blocks sharp ear chill in the wind.',
      icon: '🧢',
    });
    accessories.push({
      item: 'Fleece or Leather Gloves',
      reason: 'Keeps fingers warm during extended outdoor walks.',
      icon: '🧤',
    });
  }
  if (isWet && rainType.umbrellaNeeded) {
    accessories.push({
      item: 'Stout Windproof Umbrella',
      reason: 'Standard umbrellas invert in 25 km/h Atlantic gusts; use windproof.',
      icon: '☂️',
    });
  }
  if (isSunny && isDay) {
    accessories.push({
      item: 'Polarized Sunglasses',
      reason: 'Low autumn/winter sun angle causes severe horizontal glare while driving or walking.',
      icon: '🕶️',
    });
  }
  if (windSpeed >= 30) {
    accessories.push({
      item: 'Secure Hat / Hair tie',
      reason: `Coastal wind gusts up to ${Math.round(windSpeed * 1.3)} km/h.`,
      icon: '💨',
    });
  }

  return {
    thermalLevel,
    thermalTitle,
    thermalColor,
    thermalBadge,
    windChillDelta,
    sunRealityCheck,
    outerwear,
    midLayer,
    bottoms,
    footwear,
    accessories,
    layeringSummary: feels < 9 ? '3-Layer System (Base + Sweater + Windproof Outer)' : '2-Layer System (T-shirt/Shirt + Jacket)',
  };
}
