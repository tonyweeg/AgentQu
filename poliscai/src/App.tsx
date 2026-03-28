/**
 * App.tsx - Main Application Shell
 * PoliScai - Democracy V2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { ConstitutionV2 } from './pages/ConstitutionV2';
import { Review } from './pages/Review';
import { Query } from './pages/Query';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/constitution" element={<ConstitutionV2 />} />
          <Route path="/constitution/:clauseId" element={<ConstitutionV2 />} />
          <Route path="/review" element={<Review />} />
          <Route path="/query" element={<Query />} />
          {/* Phase 5+ routes */}
          <Route path="/analysis" element={<ComingSoon title="Deep Analysis" />} />
          <Route path="/discover" element={<ComingSoon title="Discover Shadow Notes" />} />
          <Route path="/record/:id" element={<ComingSoon title="Public Record" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Placeholder for future pages
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-poliscai-light flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-3xl font-serif font-bold text-poliscai-dark mb-4">{title}</h1>
        <p className="text-gray-600">This feature is coming in a future phase.</p>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-2 bg-poliscai-primary text-white rounded-lg hover:bg-poliscai-primary/90"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default App;
