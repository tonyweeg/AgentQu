# 🌍 AgentQu Biome System

**Object-Oriented, Vector-Based, Dynamic Backgrounds**

The Biome System automatically detects your location and renders beautiful, minimal vector backgrounds that reflect your actual geographic biome. Edward Tufte-inspired: informative, elegant, and performant.

---

## 🎯 Features

- **OOP Architecture** - Clean class hierarchy with inheritance
- **Vector SVG** - Scalable, crisp graphics on all devices
- **Dynamic Detection** - Real-time biome detection from location
- **Time-Aware** - Backgrounds change with time of day (dawn, day, dusk, night)
- **State-Specific** - Tailored to each US state's geography
- **Extensible** - Easy to add new biomes

---

## 📁 Architecture

```
biomes/
├── core/
│   ├── BiomeSystem.ts         # Main orchestrator (Singleton)
│   ├── BiomeDetector.ts        # Location → Biome detection
│   ├── BiomeFactory.ts         # Creates biome instances
│   └── BiomeRenderer.tsx       # React component
├── types/
│   ├── Biome.ts                # Base abstract class
│   ├── CoastalBiome.ts         # Coastal variations
│   └── MountainBiome.ts        # Mountain variations
└── index.ts                    # Public API exports
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { BiomeRenderer } from './biomes';

function App() {
  const location = { lat: 38.324, lng: -75.215 }; // Ocean City, MD
  const state = 'MD';

  return (
    <BiomeRenderer
      location={location}
      state={state}
      timeOfDay="day"
    />
  );
}
```

---

## 🏗️ How It Works

### 1️⃣ **Biome Detection** (Location → Biome Type)

```typescript
import { BiomeDetector } from './biomes';

const detection = await BiomeDetector.detectBiome(
  { lat: 38.9072, lng: -77.0369 }, // Washington DC
  'DC'
);

console.log(detection);
// {
//   biomeType: 'coastal_sandy',
//   confidence: 0.85,
//   metadata: { state: 'DC', coastalDistance: 50000 }
// }
```

**Detection Logic:**
1. Check state-specific biome options
2. Use elevation data (if available)
3. Calculate distance to coast
4. Fallback to lat/lng heuristics

### 2️⃣ **Biome Factory** (Type → Instance)

```typescript
import { BiomeFactory } from './biomes';

const factory = BiomeFactory.getInstance();
const biome = factory.createBiome('coastal_sandy');

console.log(biome.name); // "Sandy Beach"
```

### 3️⃣ **Biome Rendering** (Instance → SVG)

```typescript
const svg = biome.render(
  1920,    // width
  1080,    // height
  'dusk'   // time of day
);

console.log(svg); // Complete SVG string with layers
```

---

## 🎨 Available Biomes

### **Coastal Biomes** (3 implemented)
- `coastal_sandy` - Sandy beaches (FL, CA, NC)
- `coastal_rocky` - Rocky coasts with lighthouse (ME, OR, WA)
- `coastal_tropical` - Palm trees, turquoise water (HI, FL Keys)

### **Mountain Biomes** (3 implemented)
- `mountain_rockies` - Snow-capped peaks (CO, WY, MT)
- `mountain_appalachian` - Rolling forested ridges (VA, NC, TN)
- `mountain_desert` - Red rock formations, cacti (NV, UT, AZ)

### **Coming Soon** (47 more to implement)
- Desert: Sonoran, Mojave, Great Basin
- Plains: Great Plains, Tallgrass Prairie
- Forest: Coniferous, Deciduous, Rainforest
- And 40+ more variations!

---

## 🧱 Creating Custom Biomes

### Step 1: Create Biome Class

```typescript
import { Biome } from './types/Biome';

export class DesertBiome extends Biome {
  constructor() {
    super({
      name: 'Sonoran Desert',
      type: 'desert_sonoran',
      palette: {
        sky: { start: '#F9E0C7', end: '#E8C4A0' },
        background: { start: '#D4A574', end: '#B8864C' },
        foreground: { start: '#7A5230', end: '#5C3D22' },
        accent: '#CD853F',
      },
    });
  }

  generateLayers(width: number, height: number): string[] {
    return [
      // Sand dunes
      `<path d="..." fill="${this.palette.background.start}" />`,

      // Saguaro cacti
      `<rect x="..." y="..." fill="#3A5F3A" />`,
    ];
  }
}
```

### Step 2: Register in Factory

```typescript
// In BiomeFactory.ts
this.biomeRegistry.set('desert_sonoran', () => new DesertBiome());
```

### Step 3: Add to Detector

```typescript
// In BiomeDetector.ts
const STATE_BIOME_MAP = {
  AZ: ['desert_sonoran', 'mountain_desert'],
  // ...
};
```

---

## 🎨 Design Philosophy (Edward Tufte Principles)

### 1. **Data-Ink Ratio**
- Every element conveys geographic information
- No decorative chartjunk
- Minimal but meaningful

### 2. **Layered Depth**
- Background → Midground → Foreground
- Parallax-ready structure
- Visual hierarchy

### 3. **Color Palettes**
- Muted, natural colors
- Time-of-day variations
- Accessible contrast ratios

### 4. **Performance**
- Vector SVG (scalable, sharp)
- Lightweight (<50KB per biome)
- No external dependencies

---

## 📊 State-to-Biome Mapping

| State | Primary Biome | Secondary Options |
|-------|---------------|-------------------|
| DE | `coastal_sandy` | - |
| MD | `coastal_sandy` | `mountain_appalachian` |
| VA | `mountain_appalachian` | `forest_deciduous` |
| CO | `mountain_rockies` | `plains_great` |
| FL | `coastal_tropical` | `coastal_sandy` |
| HI | `coastal_tropical` | - |
| AZ | `desert_sonoran` | `mountain_desert` |
| ME | `coastal_rocky` | - |

---

## ⏰ Time of Day Variations

Each biome supports 4 time periods:

```typescript
timeVariations: {
  dawn: {
    sky: { start: '#FFE4B5', end: '#FFB6C1' },  // Warm sunrise
  },
  day: {
    // Default palette
  },
  dusk: {
    sky: { start: '#FF6B9D', end: '#C44569' },  // Pink sunset
  },
  night: {
    sky: { start: '#1C1C3C', end: '#2C3E50' },  // Dark blue
  },
}
```

---

## 🔧 Advanced Usage

### BiomeSystem (Singleton Orchestrator)

```typescript
import { BiomeSystem } from './biomes';

const system = BiomeSystem.getInstance();

// Update location
await system.updateLocation(
  { lat: 39.9526, lng: -75.1652 },
  'PA'
);

// Get current biome
const biome = system.getCurrentBiome();
const type = system.getCurrentBiomeType(); // 'mountain_appalachian'

// Subscribe to changes
const unsubscribe = system.subscribe((state) => {
  console.log('Biome changed:', state.biomeType);
});

// Render
const svg = system.renderBiome(1920, 1080);
```

---

## 🎯 Next Steps

### **Phase 1: Expand Biome Library** (Implement remaining 47 biomes)
- Desert variations (Mojave, Great Basin, Chihuahuan)
- Plains (Great Plains, Tallgrass Prairie, Palouse)
- Forests (Coniferous, Deciduous, Rainforest)
- Special (Urban skylines, National Parks)

### **Phase 2: Enhanced Detection**
- Google Elevation API integration
- Real coastal distance calculation
- Landmark detection (Golden Gate, Space Needle, etc.)

### **Phase 3: Animation & Effects**
- Subtle cloud movements
- Parallax scrolling
- Weather overlays (rain, snow, fog)
- Bird/wildlife silhouettes

### **Phase 4: User Customization**
- Manual biome override
- Color palette preferences
- Landmark toggles

---

## 📚 Resources

- **Edward Tufte** - Visual design principles
- **Google Maps Platform** - Elevation & Geocoding APIs
- **SVG Patterns** - Path generation techniques
- **State Geography** - Biome classification data

---

## 🤝 Contributing

To add a new biome:
1. Create class in `types/` (extend `Biome`)
2. Register in `BiomeFactory.ts`
3. Add to `STATE_BIOME_MAP` in `BiomeDetector.ts`
4. Document color palette and landmarks

---

**Built with ❤️ for AgentQu - Making location-aware experiences beautiful**
