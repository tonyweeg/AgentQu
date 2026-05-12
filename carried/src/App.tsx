/**
 * App.tsx - Main Application Shell
 * Carried - Motions carry, memory too
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FileDropProvider } from './contexts/FileDropContext';
import { Home } from './pages/Home';
import { NewGroup } from './pages/NewGroup';
import { GroupHome } from './pages/GroupHome';
import { Upload } from './pages/Upload';
import { Search } from './pages/Search';
import { MeetingDetail } from './pages/MeetingDetail';
import { Admin } from './pages/Admin';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FileDropProvider>
        <Router>
          <Routes>
          {/* Home / Dashboard */}
          <Route path="/" element={<Home />} />

          {/* Groups */}
          <Route path="/groups/new" element={<NewGroup />} />
          <Route path="/groups/:groupId" element={<GroupHome />} />
          <Route path="/groups/:groupId/upload" element={<Upload />} />
          <Route path="/groups/:groupId/search" element={<Search />} />
          <Route path="/groups/:groupId/meetings/:meetingId" element={<MeetingDetail />} />

          {/* Admin */}
          <Route path="/admin" element={<Admin />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </FileDropProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
