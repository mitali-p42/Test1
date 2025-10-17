import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import { useAuth } from './auth/AuthContext';
import Interview from './pages/Interview';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/', element: <PrivateRoute><Home /></PrivateRoute> },
  { path: '/interview', element: <PrivateRoute><Interview /></PrivateRoute> },
  { path: '/login', element: <Login /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
