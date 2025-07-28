import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

import ProtectedRoute from './components/ProtectedRoute';

import Login from './components/Login';
import Home from './pages/Home';
import NewMeeting from './pages/NewMeeting';
import Notifications from './pages/Notifications';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-meeting"
              element={
                <ProtectedRoute>
                  <NewMeeting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to /home */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
