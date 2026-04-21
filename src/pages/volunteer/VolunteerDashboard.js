import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../utils/api';
import { formatDate, statusClass, prettyStatus } from '../../utils/helpers';
import toast from 'react-hot-toast';
import StatCard from '../../components/statcard';
import { FiTruck, FiCheckCircle, FiPackage, FiRefreshCw } from 'react-icons/fi';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [available, setAvailable]   = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('available'); // 'available' | 'my'
  const [actionId, setActionId]     = useState(null); // loading state per card

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [avRes, myRes] = await Promise.all([
        api.get('/donations/available'),
        api.get('/deliveries/my')
      ]);
      setAvailable(avRes.data.donations);
      setMyDeliveries(myRes.data.deliveries);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    available:  available.length,
    accepted:   myDeliveries.filter(d => d.status === 'accepted').length,
    pickedUp:   myDeliveries.filter(d => d.status === 'picked_up').length,
    delivered:  myDeliveries.filter(d => d.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              Hey {user.name.split(' ')[0]} 🚴
            </h1>
            <p className="text-gray-500 mt-1">Pick up and deliver food to those in need</p>
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Available Tasks" value={stats.available} icon="📦" color="blue"   />
          <StatCard label="Accepted"         value={stats.accepted}  icon="🤝" color="purple" />
          <StatCard label="Picked Up"        value={stats.pickedUp}  icon="🛵" color="orange" />
          <StatCard label="Delivered"        value={stats.delivered} icon="✅" color="green"  />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[['available', 'Available Tasks'], ['my', 'My Deliveries']].map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {lbl} {key === 'available' ? `(${stats.available})` : `(${myDeliveries.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'available' ? (
          /* Available donations */
          available.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-display text-xl font-semibold text-gray-700">No tasks right now</h3>
              <p className="text-gray-400 text-sm mt-1">Check back soon for new donation pickups</p>
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
                      <FiPackage className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{d.quantity}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 shrink-0">📍</span>
                      <span>{d.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">👤</span>
                      <span>Donor: {d.donor?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⏰</span>
                      <span>Expires: {formatDate(d.expiryTime)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => acceptDelivery(d._id)}
                    disabled={actionId === d._id}
                    className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                  >
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
          /* My deliveries */
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
                        <h3 className="font-display font-bold text-gray-900 text-lg">
                          {del.donation?.foodName}
                        </h3>
                        <span className={statusClass(del.status)}>{prettyStatus(del.status)}</span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2 text-sm text-gray-600">
                        <span>📍 {del.donation?.location}</span>
                        <span>📦 {del.donation?.quantity}</span>
                        <span>👤 {del.donation?.donor?.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Accepted: {formatDate(del.acceptedAt)}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {del.status === 'accepted' && (
                        <button
                          onClick={() => updateStatus(del._id, 'picked_up')}
                          disabled={actionId === del._id}
                          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors active:scale-95"
                        >
                          {actionId === del._id
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : '🛵'}
                          Picked Up
                        </button>
                      )}
                      {del.status === 'picked_up' && (
                        <button
                          onClick={() => updateStatus(del._id, 'delivered')}
                          disabled={actionId === del._id}
                          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors active:scale-95"
                        >
                          {actionId === del._id
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <FiCheckCircle className="w-4 h-4" />}
                          Delivered
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
    </div>
  );
};

export default VolunteerDashboard;