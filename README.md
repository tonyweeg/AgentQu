# 🤖 AgentQu Platform

**Real-time activity discovery platform** - "I'm here, I have X time - what can I do?"

AgentQu combines smart location-based discovery with geocaching adventures, volunteer opportunities, and hiking trails to help people find meaningful activities in their available time.

## 🎯 Core Concept

AgentQu answers the question: **"What should I do right now?"**

Based on:
- 📍 Your current location
- ⏰ How much time you have
- ✨ Your interests and accessibility needs

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore + Functions + Auth)
- **Styling**: Atkinson Hyperlegible font, warm color palette
- **Architecture**: Based on Zipquest platform principles

## 🏗️ Project Structure

```
AgentQu/
├── agentqu-app/           # React TypeScript app
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Firebase config & types
│   │   └── App.tsx        # Main app component
│   ├── .env.example       # Environment variables template
│   └── package.json
├── docs/                  # Documentation
│   ├── AGENTQU-1.0-GAME-DESIGN.md
│   └── birth-docs.txt     # Zipquest platform spec
└── README.md
```

## 🛠️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/tonyweeg/AgentQu.git
cd AgentQu/agentqu-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 4. Run the app
```bash
npm start
```

App will open at [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

- **Font**: Atkinson Hyperlegible (accessibility-first)
- **Colors**:
  - Cream background: `#F5EDE4`
  - Peach accent: `#D4906B`
  - Dark text: `#2D2D2D`
- **Style**: Warm, soft buttons, rounded cards, minimal shadows

## 📱 Features (Planned)

### MVP
- [x] Location detection
- [x] Beautiful UI with Atkinson Hyperlegible
- [x] Activity card components
- [ ] Firestore integration
- [ ] Real activity data

### Future
- [ ] AR camera for QR verification
- [ ] Geocache locations
- [ ] Volunteer site check-ins
- [ ] Hike activity tracking (GPS + motion sensors)
- [ ] Qus reward system
- [ ] Social features

## 🔧 Development

### Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Key Technologies

- **React Hooks**:
  - `useLocation` - Get user's GPS location
  - `useDiscovery` - Find nearby activities

- **Firebase Services**:
  - Firestore - Activity database
  - Functions - Discovery algorithm
  - Auth - User management

## 📊 Activity Types

1. **🎁 Caches** - Geocaching locations with QR codes
2. **🤝 Volunteer** - Community service opportunities
3. **🥾 Hikes** - Trail recommendations
4. **🎪 Events** - Local happenings
5. **🍽️ Venues** - Restaurants, cafes, attractions

## 🌟 Inspiration

Built on the **Zipquest platform** architecture:
- Accessibility-first design
- Deterministic scoring algorithms
- Real-time context awareness
- Privacy-focused

## 📝 License

MIT

## 👨‍💻 Author

Tony Weeg

---

**Status**: 🚧 Active Development - MVP Phase
