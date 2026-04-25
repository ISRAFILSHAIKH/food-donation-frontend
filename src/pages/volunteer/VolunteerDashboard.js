import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../utils/api';
import { formatDate, statusClass, prettyStatus } from '../../utils/helpers';
import toast from 'react-hot-toast';
import statcard from '../../components/statcard';
import { FiTruck, FiCheckCircle, FiPackage, FiRefreshCw, FiMapPin, FiAlertCircle } from 'react-icons/fi';

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const VolunteerDashboard = () => {
  const { user, updateUser } = useAuth();
  const [available, setAvailable]     = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('available');
  const [actionId, setActionId]       = useState(null);
  const [volunteerLoc, setVolunteerLoc] = useState(null);

  // Location update state
  const [showLocModal, setShowLocModal] = useState(false);
  const [locForm, setLocForm]           = useState({ state: user.state || '', city: user.city || '' });
  const [locLoading, setLocLoading]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [avRes, myRes] = await Promise.all([
        api.get('/donations/available'),
        api.get('/deliveries/my')
      ]);
      setAvailable(avRes.data.donations);
      setVolunteerLoc(avRes.data.volunteerLocation);
      setMyDeliveries(myRes.data.deliveries);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load data';
      // If location not set, show prompt
      if (msg.includes('location')) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateLocation = async () => {
    if (!locForm.state || !locForm.city.trim()) {
      toast.error('Please select state and enter city');
      return;
    }
    setLocLoading(true);
    try {
      const { data } = await api.put('/auth/location', {
        state: locForm.state,
        city: locForm.city.trim()
      });
      // Update only the user object in context — no need to touch the token
      updateUser({ state: data.user.state, city: data.user.city });
      toast.success('Location updated successfully!');
      setShowLocModal(false);
      // Small delay so context updates before refetch
      setTimeout(() => fetchData(), 300);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update location';
      toast.error(msg);
      console.error('Location update error:', err.response?.data);
    } finally {
      setLocLoading(false);
    }
  };

  const acceptDelivery = async (donationId) => {
    setActionId(donationId);
    try {
      await api.post(`/deliveries/accept/${donationId}`);
      toast.success('Delivery task accepted! 🚴');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    } finally {
      setActionId(null);
    }
  };

  const updateStatus = async (deliveryId, status) => {
    setActionId(deliveryId);
    try {
      await api.put(`/deliveries/${deliveryId}/status`, { status });
      toast.success(`Status updated to "${prettyStatus(status)}"!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setActionId(null);
    }
  };

  const stats = {
    available: available.length,
    accepted:  myDeliveries.filter(d => d.status === 'accepted').length,
    pickedUp:  myDeliveries.filter(d => d.status === 'picked_up').length,
    delivered: myDeliveries.filter(d => d.status === 'delivered').length,
  };

  const noLocation = !user.state || !user.city;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Hey {user.name.split(' ')[0]} 🚴</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-gray-500">Delivering food to those in need</p>
              {user.state ? (
                <button onClick={() => { setLocForm({ state: user.state, city: user.city }); setShowLocModal(true); }}
                  className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full hover:bg-brand-100 transition-colors">
                  <FiMapPin className="w-3 h-3" /> {user.city}, {user.state} · Edit
                </button>
              ) : (
                <button onClick={() => setShowLocModal(true)}
                  className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full hover:bg-red-100">
                  <FiAlertCircle className="w-3 h-3" /> Set location
                </button>
              )}
            </div>
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* No location warning banner */}
        {noLocation && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Location not set</p>
              <p className="text-sm text-red-600 mt-0.5">
                You need to set your state and city to see available donations near you.
                Volunteers only see donations from their own state.
              </p>
              <button onClick={() => setShowLocModal(true)} className="mt-2 text-sm font-semibold text-red-700 underline">
                Set my location →
              </button>
            </div>
          </div>
        )}

        {/* Location info banner */}
        {volunteerLoc && (
          <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <FiMapPin className="w-5 h-5 text-brand-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-brand-800">
                Showing donations available in <strong>{volunteerLoc.state}</strong> — your state.
                {available.length === 0 && ' No donations available in your area right now.'}
              </p>
            </div>
            <button onClick={() => { setLocForm({ state: user.state, city: user.city }); setShowLocModal(true); }}
              className="text-xs font-semibold text-brand-700 hover:underline shrink-0">
              Change location
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <statcard label="Available Tasks" value={stats.available} icon="📦" color="blue"   />
          <statcard label="Accepted"         value={stats.accepted}  icon="🤝" color="purple" />
          <statcard label="Picked Up"        value={stats.pickedUp}  icon="🛵" color="orange" />
          <statcard label="Delivered"        value={stats.delivered} icon="✅" color="green"  />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[['available', 'Available Tasks'], ['my', 'My Deliveries']].map(([key, lbl]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {lbl} {key === 'available' ? `(${stats.available})` : `(${myDeliveries.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'available' ? (
          available.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-display text-xl font-semibold text-gray-700">No tasks in your area</h3>
              <p className="text-gray-400 text-sm mt-1">
                {noLocation
                  ? 'Set your location to see nearby donations'
                  : `No donations available in ${user.state} right now. Check back soon!`}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {available.map((d) => (
                <div key={d._id} className="card hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display font-bold text-gray-900 text-lg">{d.foodName}</h3>
                    <span className={statusClass(d.status)}>{prettyStatus(d.status)}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 flex-1">
                    <div className="flex items-center gap-2">
                      <FiPackage className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {d.quantity}
                    </div>
                    <div className="flex items-start gap-2">
                      <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p>{d.location}</p>
                        <p className="text-xs text-brand-600 font-medium">{d.city}, {d.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">👤</span> Donor: {d.donor?.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⏰</span> Expires: {formatDate(d.expiryTime)}
                    </div>
                  </div>
                  {/* Same city highlight */}
                  {d.city?.toLowerCase() === user.city?.toLowerCase() && (
                    <div className="mt-2 text-xs text-brand-600 bg-brand-50 rounded-lg px-2 py-1">
                      📍 Same city as you — easy pickup!
                    </div>
                  )}
                  <button onClick={() => acceptDelivery(d._id)} disabled={actionId === d._id}
                    className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                    {actionId === d._id
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <FiTruck className="w-4 h-4" />}
                    Accept Task
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          myDeliveries.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-3">📭</div>
              <h3 className="font-display text-xl font-semibold text-gray-700">No deliveries yet</h3>
              <p className="text-gray-400 text-sm mt-1">Accept a task from the available tab</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myDeliveries.map((del) => (
                <div key={del._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-bold text-gray-900 text-lg">{del.donation?.foodName}</h3>
                        <span className={statusClass(del.status)}>{prettyStatus(del.status)}</span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2 text-sm text-gray-600">
                        <span>📍 {del.donation?.city}, {del.donation?.state}</span>
                        <span>📦 {del.donation?.quantity}</span>
                        <span>👤 {del.donation?.donor?.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Accepted: {formatDate(del.acceptedAt)}</p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {del.status === 'accepted' && (
                        <button onClick={() => updateStatus(del._id, 'picked_up')} disabled={actionId === del._id}
                          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors active:scale-95">
                          {actionId === del._id
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : '🛵'} Picked Up
                        </button>
                      )}
                      {del.status === 'picked_up' && (
                        <button onClick={() => updateStatus(del._id, 'delivered')} disabled={actionId === del._id}
                          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors active:scale-95">
                          {actionId === del._id
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <FiCheckCircle className="w-4 h-4" />} Delivered
                        </button>
                      )}
                      {del.status === 'delivered' && (
                        <span className="text-brand-600 font-semibold text-sm text-center">✅ Complete</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Location Update Modal */}
      {showLocModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-display text-xl font-bold text-gray-900">Update Your Location</h3>
                <p className="text-xs text-gray-500 mt-1">You'll only see donations from your state</p>
              </div>
              <button onClick={() => setShowLocModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                📍 Donations are matched by <strong>state</strong>. A volunteer in Kerala cannot accept a donation from Maharashtra.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State / UT *</label>
                <select value={locForm.state} onChange={e => setLocForm({...locForm, state: e.target.value})}
                  className="input-field">
                  <option value="">Select your state</option>
                  {INDIA_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                <input type="text" value={locForm.city} onChange={e => setLocForm({...locForm, city: e.target.value})}
                  placeholder="e.g. Mumbai, Pune, Kochi" className="input-field" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowLocModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={updateLocation} disabled={locLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {locLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
