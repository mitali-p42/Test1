import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useNavigate } from 'react-router-dom';

export default function App() {
  return <RouterProvider router={router} />;
}

const navigate = useNavigate();
function handleConfirm() {
  
  navigate('/interview', { state: { profile } });
}
