import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { formatDate, statusClass, prettyStatus } from '../../utils/helpers';
import toast from 'react-hot-toast';
import StatCard from '../../components/statcard';
import { FiRefreshCw, FiCheck, FiX, FiUsers, FiPackage } from 'react-icons/fi';

const TABS = ['overview', 'donations', 'users'];

const AdminDashboard = () => {
  const [tab, setTab]           = useState('overview');
  const [stats, setStats]       = useState(null);
  const [donations, setDonations] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, donRes, usrRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/donations/all'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data.stats);
      setDonations(donRes.data.donations);
      setUsers(usrRes.data.users);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const reviewDonation = async (id, status) => {
    setActionId(id);
    try {
      await api.put(`/donations/${id}/review`, { status });
      toast.success(`Donation ${status}!`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const toggleUser = async (id) => {
    setActionId(id);
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      toast.success(data.message);
      fetchAll();
    } catch {
      toast.error('Failed to update user');
    } finally {
      setActionId(null);
    }
  };

  const pendingDonations = donations.filter(d => d.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard 🛡️</h1>
            <p className="text-gray-500 mt-1">Monitor and manage the FoodShare platform</p>
          </div>
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Pending alert banner */}
        {pendingDonations.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">
                {pendingDonations.length} donation{pendingDonations.length > 1 ? 's' : ''} awaiting your approval
              </p>
              <button onClick={() => setTab('donations')} className="text-sm text-amber-600 hover:underline">
                Review now →
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'overview' ? (
          /* ── Overview tab ── */
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users"      value={stats?.totalUsers}      icon="👥" color="blue"   />
              <StatCard label="Donors"           value={stats?.totalDonors}     icon="🎁" color="green"  />
              <StatCard label="Volunteers"       value={stats?.totalVolunteers} icon="🚴" color="purple" />
              <StatCard label="Total Donations"  value={stats?.totalDonations}  icon="📦" color="orange" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Pending Review"   value={stats?.pendingDonations}   icon="⏳" color="yellow" />
              <StatCard label="Approved"         value={stats?.approvedDonations}  icon="✅" color="green"  />
              <StatCard label="Delivered"        value={stats?.deliveredDonations} icon="🎉" color="blue"   />
              <StatCard label="Total Deliveries" value={stats?.totalDeliveries}    icon="🛵" color="orange" />
            </div>

            {/* Recent donations preview */}
            <div>
              <h2 className="font-display text-lg font-semibold text-gray-800 mb-4">Recent Donations</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-semibold text-gray-500 py-2 pr-4">Food</th>
                      <th className="text-left font-semibold text-gray-500 py-2 pr-4">Donor</th>
                      <th className="text-left font-semibold text-gray-500 py-2 pr-4">Location</th>
                      <th className="text-left font-semibold text-gray-500 py-2 pr-4">Status</th>
                      <th className="text-left font-semibold text-gray-500 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0, 8).map(d => (
                      <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-800">{d.foodName}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{d.donor?.name}</td>
                        <td className="py-2.5 pr-4 text-gray-500 truncate max-w-[120px]">{d.location}</td>
                        <td className="py-2.5 pr-4"><span className={statusClass(d.status)}>{prettyStatus(d.status)}</span></td>
                        <td className="py-2.5 text-gray-400">{formatDate(d.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        ) : tab === 'donations' ? (
          /* ── Donations tab ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-gray-800">All Donations ({donations.length})</h2>
            </div>
            {donations.map(d => (
              <div key={d._id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-gray-900">{d.foodName}</h3>
                      <span className={statusClass(d.status)}>{prettyStatus(d.status)}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                      <span>📦 {d.quantity}</span>
                      <span>📍 {d.location}</span>
                      <span>👤 {d.donor?.name}</span>
                      <span>⏰ {formatDate(d.expiryTime)}</span>
                    </div>
                  </div>

                  {/* Admin actions for pending */}
                  {d.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => reviewDonation(d._id, 'approved')}
                        disabled={actionId === d._id}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-3.5 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
                      >
                        {actionId === d._id
                          ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <FiCheck className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => reviewDonation(d._id, 'rejected')}
                        disabled={actionId === d._id}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-3.5 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
                      >
                        <FiX className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        ) : (
          /* ── Users tab ── */
          <div>
            <h2 className="font-display text-lg font-semibold text-gray-800 mb-4">All Users ({users.length})</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left font-semibold text-gray-500 py-2 pr-4">Name</th>
                    <th className="text-left font-semibold text-gray-500 py-2 pr-4">Email</th>
                    <th className="text-left font-semibold text-gray-500 py-2 pr-4">Role</th>
                    <th className="text-left font-semibold text-gray-500 py-2 pr-4">Status</th>
                    <th className="text-left font-semibold text-gray-500 py-2 pr-4">Joined</th>
                    <th className="text-left font-semibold text-gray-500 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-gray-800">{u.name}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`badge ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700'
                          : u.role === 'volunteer' ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-400">{formatDate(u.createdAt)}</td>
                      <td className="py-2.5">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => toggleUser(u._id)}
                            disabled={actionId === u._id}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              u.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {actionId === u._id ? '...' : u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;