import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import {
  FiHome, FiLogOut, FiMenu, FiX,
  FiPackage, FiTruck, FiShield, FiUser
} from 'react-icons/fi';

const roleConfig = {
  donor: {
    label: 'Donor',
    color: 'bg-green-100 text-green-700',
    icon: <FiPackage className="w-4 h-4" />,
    links: [{ to: '/donor-dashboard', label: 'Dashboard', icon: <FiHome /> }],
  },
  volunteer: {
    label: 'Volunteer',
    color: 'bg-blue-100 text-blue-700',
    icon: <FiTruck className="w-4 h-4" />,
    links: [{ to: '/volunteer-dashboard', label: 'Dashboard', icon: <FiHome /> }],
  },
  admin: {
    label: 'Admin',
    color: 'bg-purple-100 text-purple-700',
    icon: <FiShield className="w-4 h-4" />,
    links: [{ to: '/admin-dashboard', label: 'Dashboard', icon: <FiHome /> }],
  },
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!user) return null;
  const cfg = roleConfig[user.role] || roleConfig.donor;

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={`/${user.role}-dashboard`} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-brand-700 transition-colors">
              <span className="text-white text-lg">🍱</span>
            </div>
            <span className="font-display font-bold text-gray-900 text-lg leading-none hidden sm:block">
              FoodShare
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {cfg.links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
              <FiUser className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-2">
            <FiUser className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          {cfg.links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;