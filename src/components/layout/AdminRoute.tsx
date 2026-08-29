import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { adminService } from '../../services/adminService.js';

export const AdminRoute: React.FC = () => {
  const isAuthed = adminService.isAuthenticated();

  if (!isAuthed) {
    return <Navigate to="/back" replace />;
  }

  return <Outlet />;
};
