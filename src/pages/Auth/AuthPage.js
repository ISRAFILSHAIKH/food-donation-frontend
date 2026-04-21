import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';

const ROLES = [
  { value: 'donor',     label: 'Donor',     emoji: '🎁', desc: 'Donate surplus food' },
  { value: 'volunteer', label: 'Volunteer',  emoji: '🚴', desc: 'Deliver food to those in need' },
];

const AuthPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin]       = useState(true);
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', password: '', role: 'donor' });

  // Already logged in → redirect
  if (user) return <Navigate to={`/${user.role}-dashboard`} replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload  = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };

      const { data } = await api.post(endpoint, payload);
      login(data.user, data.token);
      toast.success(data.message || 'Welcome!');
      navigate(`/${data.user.role}-dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-700 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🍱</div>
          <span className="font-display font-bold text-xl">FoodShare</span>
        </div>
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight mb-6">
            Fighting hunger,<br />one meal at a time.
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed mb-10">
            Connect food donors with volunteers to ensure no meal goes to waste. Join our community and make a difference today.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[['🏠', '500+', 'Donors'], ['🚴', '200+', 'Volunteers'], ['🍽️', '10k+', 'Meals Saved']].map(([emoji, num, lbl]) => (
              <div key={lbl} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="font-display font-bold text-xl">{num}</div>
                <div className="text-brand-300 text-sm">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-brand-300 text-sm">© 2024 FoodShare. Reducing food waste across India.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md page-enter">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl">🍱</span>
            <span className="font-display font-bold text-xl text-gray-900">FoodShare</span>
          </div>

          {/* Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
            {['Login', 'Sign Up'].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isLogin === (i === 0)
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </h2>
          <p className="text-gray-500 text-sm mb-7">
            {isLogin ? 'Login to access your dashboard.' : 'Join the FoodShare community today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Priya Sharma"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="priya@example.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Min 6 characters"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role picker (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I want to join as</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                        form.role === r.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{r.emoji}</span>
                      <span className={`text-sm font-semibold block ${form.role === r.value ? 'text-brand-700' : 'text-gray-700'}`}>
                        {r.label}
                      </span>
                      <span className="text-xs text-gray-400">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs font-semibold text-amber-700 mb-2">🔑 Demo Credentials</p>
            <div className="space-y-1 text-xs text-amber-600 font-mono">
              <p>Admin: admin@foodshare.com / admin123</p>
              <p>Donor: donor@test.com / donor123</p>
              <p>Volunteer: volunteer@test.com / vol123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;