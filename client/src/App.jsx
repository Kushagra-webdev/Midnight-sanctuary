import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layouts/AppLayout';
import Landing from './pages/public/Landing';
import Dashboard from './pages/app/Dashboard';
import Profile from './pages/app/Profile';
import Communities from './pages/app/Communities';
import ToDo from './pages/app/ToDo';
import Blocker from './pages/app/Blocker';
import Health from './pages/app/Health';
import AICoach from './pages/app/AIGuide';
import Journal from './pages/app/Journal';
import Settings from './pages/app/Settings';
import Auth from './pages/public/Auth';
import Pricing from './pages/public/Pricing';
import NotFound from './pages/public/NotFound';
import ResetPassword from './pages/public/ResetPassword';
import ProtectedRoute from './components/layouts/ProtectedRoute';
import OnboardingFlow from './components/OnboardingFlow';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="coach" element={<AICoach />} />
          <Route path="communities" element={<Communities />} />
          <Route path="todo" element={<ToDo />} />
          <Route path="health" element={<Health />} />
          <Route path="blocker" element={<Blocker />} />
          <Route path="journal" element={<Journal />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <OnboardingFlow />
    </BrowserRouter>
  );
}
