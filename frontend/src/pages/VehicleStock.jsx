import React, { useState, useEffect } from 'react';
import { addVehicle, getVehicles, updateVehicle, deleteVehicle, searchVehicles } from '../api';

const emptyForm = {
  vehicleName: '', vehicleModel: '', vehicleType: '', range: '',
  price: '', quantity: '', chassisNo: '', motorNo: '',
  controllerNo: '', chargerNo: ''
};

export default function VehicleStock() {
  const [form, setForm] = useState(emptyForm);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchVehicles = async () => {
    setFetchLoading(true);
    try { const { data } = await getVehicles(); setVehicles(data); } catch {}
    setFetchLoading(false);
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSearch = async (val) => {
    setSearch(val);
    if (!val.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try { const { data } = await searchVehicles(val); setSearchResults(data); }
    catch { setSearchResults([]); }
    setSearching(false);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.vehicleName || !form.price) return setError('Vehicle name and price are required');
    setLoading(true);
    try {
      if (editId) { await updateVehicle(editId, form); setSuccess('Vehicle updated!'); }
      else { await addVehicle(form); setSuccess('Vehicle added to stock!'); }
      setForm(emptyForm); setEditId(null); setShowForm(false); fetchVehicles();
    } catch (err) { setError(err.response?.data?.message || 'Operation failed'); }
    setLoading(false);
  };

  const handleEdit = (v) => {
    setForm({
      vehicleName: v.vehicleName || '', vehicleModel: v.vehicleModel || '',
      vehicleType: v.vehicleType || '', range: v.range || '',
      price: v.price || '', quantity: v.quantity || '',
      chassisNo: v.chassisNo || '', motorNo: v.motorNo || '',
      controllerNo: v.controllerNo || '', chargerNo: v.chargerNo || ''
    });
    setEditId(v._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle from stock?')) return;
    try { await deleteVehicle(id); fetchVehicles(); } catch { alert('Delete failed'); }
  };

  const displayList = searchResults !== null ? searchResults : vehicles;
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const lowStockVehicles = vehicles.filter(v => v.quantity <= 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Vehicle Stock</h1>
          <p className="text-slate-400 text-sm">EV inventory · Chassis · Motor · Controller tracking</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockVehicles.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-6">
          <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <span className="animate-pulse">⚠</span> Low Vehicle Stock Alert
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {lowStockVehicles.map(v => (
              <div key={v._id} className="bg-red-900/20 rounded-lg px-3 py-2 border border-red-800/50 flex justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{v.vehicleName}</p>
                  <p className="text-slate-400 text-xs">{v.vehicleModel || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold text-xl">{v.quantity}</p>
                  <p className="text-red-500 text-xs">{v.quantity === 0 ? 'Out of Stock' : 'Low'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5">
            {editId ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          {success && <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm">✓ {success}</div>}
          {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Vehicle Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label">Vehicle Name <span className="text-red-400">*</span></label>
                  <input name="vehicleName" value={form.vehicleName} onChange={handleChange}
                    placeholder="e.g. Tata Nexon EV Max" className="input-field" required />
                </div>
                <div>
                  <label className="label">Vehicle Model</label>
                  <input name="vehicleModel" value={form.vehicleModel} onChange={handleChange}
                    placeholder="e.g. XZ Plus Dark" className="input-field" />
                </div>
                <div>
                  <label className="label">Vehicle Type</label>
                  <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className="input-field">
                    <option value="">Select type</option>
                    {['Sedan', 'SUV', 'Hatchback', 'MUV', '2-Wheeler', '3-Wheeler'].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Range (km)</label>
                  <input name="range" value={form.range} onChange={handleChange}
                    placeholder="e.g. 465 km" className="input-field" />
                </div>
                <div>
                  <label className="label">Price (₹) <span className="text-red-400">*</span></label>
                  <input name="price" type="number" value={form.price} onChange={handleChange}
                    placeholder="0" className="input-field" required />
                </div>
                <div>
                  <label className="label">Quantity Available</label>
                  <input name="quantity" type="number" value={form.quantity} onChange={handleChange}
                    placeholder="0" className="input-field" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Vehicle Numbers</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label">Chassis Number <span className="text-slate-500 text-xs">(unique)</span></label>
                  <input name="chassisNo" value={form.chassisNo} onChange={handleChange}
                    placeholder="Chassis number" className="input-field" />
                </div>
                <div>
                  <label className="label">Motor Number</label>
                  <input name="motorNo" value={form.motorNo} onChange={handleChange}
                    placeholder="Motor number" className="input-field" />
                </div>
                <div>
                  <label className="label">Controller Number</label>
                  <input name="controllerNo" value={form.controllerNo} onChange={handleChange}
                    placeholder="Controller number" className="input-field" />
                </div>
                <div>
                  <label className="label">Charger Number</label>
                  <input name="chargerNo" value={form.chargerNo} onChange={handleChange}
                    placeholder="Charger number" className="input-field" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : editId ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(false); }}
                  className="btn-secondary">Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Vehicle Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Vehicle Inventory
            <span className="text-slate-400 text-sm font-normal ml-2">({displayList.length})</span>
          </h2>
          <div className="flex gap-3 items-center">
            {searching && <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
            <input type="text" value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search chassis / model / motor..."
              className="input-field w-64 text-sm" />
            {search && (
              <button onClick={() => { setSearch(''); setSearchResults(null); }}
                className="text-slate-400 hover:text-white text-sm">✕ Clear</button>
            )}
          </div>
        </div>

        {fetchLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No vehicles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Vehicle Name', 'Model', 'Type', 'Chassis No', 'Motor No', 'Controller No', 'Charger No', 'Range', 'Price', 'Qty', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayList.map((v) => {
                  const isLow = v.quantity <= 1;
                  return (
                    <tr key={v._id} className={`table-row ${isLow ? 'bg-red-900/5' : ''}`}>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{v.vehicleName}</td>
                      <td className="px-4 py-3 text-slate-300">{v.vehicleModel || '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{v.vehicleType || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-700 text-emerald-400 px-2 py-1 rounded font-mono">
                          {v.chassisNo || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{v.motorNo || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{v.controllerNo || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{v.chargerNo || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{v.range || '—'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(v.price)}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-lg"
                          style={{ color: v.quantity === 0 ? '#f87171' : v.quantity <= 1 ? '#fbbf24' : '#fff' }}>
                          {v.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          v.quantity === 0
                            ? 'text-xs text-red-400 bg-red-900/30 border border-red-800 px-2 py-0.5 rounded-full'
                            : v.quantity <= 1 ? 'badge-pending'
                            : v.quantity <= 5 ? 'text-xs text-amber-400 bg-amber-900/30 border border-amber-800 px-2 py-0.5 rounded-full'
                            : 'badge-paid'
                        }>
                          {v.quantity === 0 ? '❌ Out' : v.quantity <= 1 ? '⚠ Low' : v.quantity <= 5 ? '🟡 Limited' : '✅ In Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(v)} className="btn-secondary text-xs py-1 px-3">✏️</button>
                          <button onClick={() => handleDelete(v._id)} className="btn-danger text-xs py-1 px-3">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}