import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../utils/api';
import { formatDate, statusClass, prettyStatus, isExpired } from '../../utils/helpers';
import toast from 'react-hot-toast';
import StatCard from '../../components/statcard';
import { FiPlus, FiX, FiPackage, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const INITIAL_FORM = { foodName: '', quantity: '', location: '', expiryTime: '', description: '' };

const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchDonations = useCallback(async () => {
    try {
      const { data } = await api.get('/donations/my');
      setDonations(data.donations);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/donations', form);
      toast.success('Donation added! Awaiting admin approval.');
      setShowModal(false);
      setForm(INITIAL_FORM);
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add donation');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const stats = {
    total:     donations.length,
    pending:   donations.filter(d => d.status === 'pending').length,
    active:    donations.filter(d => ['approved', 'accepted', 'picked_up'].includes(d.status)).length,
    delivered: donations.filter(d => d.status === 'delivered').length,
  };

  // Min datetime for expiry input (now)
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              Hello, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Manage your food donations</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            <span>Add Donation</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Donations" value={stats.total}     icon="📦" color="blue"   />
          <StatCard label="Pending Review"  value={stats.pending}   icon="⏳" color="yellow" />
          <StatCard label="In Progress"     value={stats.active}    icon="🚴" color="purple" />
          <StatCard label="Delivered"       value={stats.delivered} icon="✅" color="green"  />
        </div>

        {/* Donation list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : donations.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-3">🍱</div>
            <h3 className="font-display text-xl font-semibold text-gray-700 mb-1">No donations yet</h3>
            <p className="text-gray-400 text-sm mb-5">Add your first donation to get started</p>
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Add Donation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-gray-800">Your Donations</h2>
            {donations.map((d) => (
              <div key={d._id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-semibold text-gray-900 text-lg">{d.foodName}</h3>
                      <span className={statusClass(d.status)}>{prettyStatus(d.status)}</span>
                      {isExpired(d.expiryTime) && d.status !== 'delivered' && (
                        <span className="badge bg-red-100 text-red-700">Expired</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <FiPackage className="w-3.5 h-3.5 text-gray-400" />
                        <span>{d.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">📍</span>
                        <span className="truncate">{d.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FiClock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Expires: {formatDate(d.expiryTime)}</span>
                      </div>
                    </div>
                    {d.description && (
                      <p className="mt-2 text-sm text-gray-400 italic">{d.description}</p>
                    )}
                  </div>
                  {d.assignedVolunteer && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm">
                      <p className="text-xs text-blue-500 font-medium mb-0.5">Volunteer</p>
                      <p className="font-semibold text-blue-800">{d.assignedVolunteer.name}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-300 mt-3">{formatDate(d.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-bold text-gray-900">Add Food Donation</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Food Name *</label>
                <input type="text" value={form.foodName} onChange={e => setForm({...form, foodName: e.target.value})}
                  required placeholder="e.g. Biryani, Samosas, Rice" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
                <input type="text" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                  required placeholder="e.g. 10 plates, 5 kg, 20 boxes" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Location *</label>
                <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  required placeholder="e.g. 123 MG Road, Pune" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date & Time *</label>
                <input type="datetime-local" value={form.expiryTime} min={minDateTime}
                  onChange={e => setForm({...form, expiryTime: e.target.value})}
                  required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Any details about the food..." rows={2} className="input-field resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Submit Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;