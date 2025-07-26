import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './components/Login';
import AccountSetup from './pages/AccountSetup';
import Home from './pages/Home';
import NewMeeting from './pages/NewMeeting';
import Notifications from './pages/Notifications';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/setup-account" element={<AccountSetup />} />

              {/* Protected Routes */}
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
              <Route path="/" element={<Navigate to="/home" />} />

              {/* Optional: Catch-all 404 redirect */}
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
