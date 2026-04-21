import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/Authcontext';
import PrivateRoute from './components/Privateroute';
import Navbar from './components/Navbar';

// Pages
import AuthPage         from './pages/Auth/AuthPage';
import DonorDashboard   from './pages/donor/DonorDashboard';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import AdminDashboard   from './pages/admin/AdminDashboard';

// Layout that shows Navbar for authenticated pages
const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login"  element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Protected: Donor */}
          <Route
            path="/donor-dashboard"
            element={
              <PrivateRoute role="donor">
                <AppLayout><DonorDashboard /></AppLayout>
              </PrivateRoute>
            }
          />

          {/* Protected: Volunteer */}
          <Route
            path="/volunteer-dashboard"
            element={
              <PrivateRoute role="volunteer">
                <AppLayout><VolunteerDashboard /></AppLayout>
              </PrivateRoute>
            }
          />

          {/* Protected: Admin */}
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute role="admin">
                <AppLayout><AdminDashboard /></AppLayout>
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;