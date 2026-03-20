import React, { useState, useEffect } from 'react';
import { addSpare, getSpares, updateSpare, deleteSpare } from '../api';

const emptyForm = { spareName: '', buyingPrice: '', sellingPrice: '', quantity: '', minStockLevel: '5' };

export default function SpareStock() {
  const [form, setForm] = useState(emptyForm);
  const [spares, setSpares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchSpares = async () => {
    setFetchLoading(true);
    try { const { data } = await getSpares(); setSpares(data); } catch {}
    setFetchLoading(false);
  };

  useEffect(() => { fetchSpares(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.spareName || !form.sellingPrice) return setError('Name and selling price are required');
    setLoading(true);
    try {
      if (editId) { await updateSpare(editId, form); setSuccess('Spare part updated!'); }
      else { await addSpare(form); setSuccess('Spare part added to stock!'); }
      setForm(emptyForm); setEditId(null); setShowForm(false); fetchSpares();
    } catch (err) { setError(err.response?.data?.message || 'Operation failed'); }
    setLoading(false);
  };

  const handleEdit = (s) => {
    setForm({ spareName: s.spareName, buyingPrice: s.buyingPrice || '', sellingPrice: s.sellingPrice, quantity: s.quantity, minStockLevel: s.minStockLevel ?? 5 });
    setEditId(s._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this spare part?')) return;
    try { await deleteSpare(id); fetchSpares(); } catch { alert('Delete failed'); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const filtered = spares.filter(s => s.spareName.toLowerCase().includes(search.toLowerCase()));
  const lowCount = spares.filter(s => s.quantity <= (s.minStockLevel ?? 5)).length;
  const outCount = spares.filter(s => s.quantity === 0).length;
  const totalValue = spares.reduce((a, s) => a + (s.sellingPrice * s.quantity), 0);

  const getStatus = (s) => {
    if (s.quantity === 0) return { label: '❌ Out of Stock', cls: 'text-xs text-red-400 bg-red-900/30 border border-red-800 px-2.5 py-0.5 rounded-full' };
    if (s.quantity <= (s.minStockLevel ?? 5)) return { label: '⚠ Low Stock', cls: 'badge-pending' };
    return { label: '✅ In Stock', cls: 'badge-paid' };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Spare Parts Stock</h1>
          <p className="text-slate-400 text-sm">Manage inventory · Admin sets min stock alert level per item</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ Add Spare Part'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card"><p className="text-slate-400 text-sm">Total Parts</p><p className="text-2xl font-bold text-white mt-1">{spares.length}</p></div>
        <div className="card"><p className="text-slate-400 text-sm">Total Qty</p><p className="text-2xl font-bold text-white mt-1">{spares.reduce((a, s) => a + (s.quantity || 0), 0)}</p></div>
        <div className="card"><p className="text-slate-400 text-sm">Low / Out of Stock</p>
          <p className="text-2xl font-bold mt-1" style={{ color: lowCount > 0 ? '#fbbf24' : '#34d399' }}>{lowCount} / {outCount}</p>
        </div>
        <div className="card"><p className="text-slate-400 text-sm">Stock Value</p><p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(totalValue)}</p></div>
      </div>

      {/* Low Stock Banner */}
      {lowCount > 0 && (
        <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="animate-pulse text-xl">⚠️</span>
            <h3 className="text-orange-400 font-semibold">{lowCount} item(s) at or below minimum stock level</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {spares.filter(s => s.quantity <= (s.minStockLevel ?? 5)).map(s => (
              <div key={s._id} className="bg-orange-900/20 rounded-lg px-3 py-2 border border-orange-800/50 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium">{s.spareName}</p>
                  <p className="text-slate-400 text-xs">Min: {s.minStockLevel ?? 5}</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-bold text-xl">{s.quantity}</p>
                  <p className="text-blue-400 text-xs">Need: {Math.max(0, (s.minStockLevel ?? 5) - s.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5">{editId ? 'Edit Spare Part' : 'Add New Spare Part'}</h2>
          {success && <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm">✓ {success}</div>}
          {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="label">Spare Part Name <span className="text-red-400">*</span></label>
                <input name="spareName" value={form.spareName} onChange={handleChange} placeholder="e.g. Brake Pad Set" className="input-field" required />
              </div>
              <div>
                <label className="label">Buying Price (₹)</label>
                <input name="buyingPrice" type="number" value={form.buyingPrice} onChange={handleChange} placeholder="Cost price" className="input-field" />
              </div>
              <div>
                <label className="label">Selling Price (₹) <span className="text-red-400">*</span></label>
                <input name="sellingPrice" type="number" value={form.sellingPrice} onChange={handleChange} placeholder="Sale price" className="input-field" required />
              </div>
              <div>
                <label className="label">Quantity Available</label>
                <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div>
                <label className="label">🔔 Min Stock Level <span className="text-slate-500 font-normal text-xs">(alert threshold)</span></label>
                <input name="minStockLevel" type="number" value={form.minStockLevel} onChange={handleChange} placeholder="5" className="input-field" />
                <p className="text-slate-500 text-xs mt-1">Dashboard alert shows when qty ≤ this value</p>
              </div>
            </div>
            {form.buyingPrice && form.sellingPrice && (
              <div className="bg-slate-700/50 rounded-lg px-4 py-3 border border-slate-600 flex gap-6 text-sm">
                <div><span className="text-slate-400">Buying: </span><span className="text-white font-semibold">{fmt(form.buyingPrice)}</span></div>
                <div><span className="text-slate-400">Selling: </span><span className="text-white font-semibold">{fmt(form.sellingPrice)}</span></div>
                <div><span className="text-slate-400">Margin: </span>
                  <span className="font-semibold" style={{ color: form.sellingPrice > form.buyingPrice ? '#34d399' : '#f87171' }}>
                    {fmt(form.sellingPrice - form.buyingPrice)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : editId ? 'Update Part' : 'Add Part'}</button>
              {editId && <button type="button" onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(false); }} className="btn-secondary">Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Spare Parts Inventory ({filtered.length})</h2>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parts..." className="input-field w-48 text-sm" />
        </div>
        {fetchLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No spare parts in stock.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Spare Part Name', 'Buying Price', 'Selling Price', 'Margin', 'Qty', 'Min Level', 'Reorder Qty', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const margin = (s.sellingPrice || 0) - (s.buyingPrice || 0);
                  const minLevel = s.minStockLevel ?? 5;
                  const reorder = Math.max(0, minLevel - s.quantity);
                  const st = getStatus(s);
                  return (
                    <tr key={s._id} className={`table-row ${s.quantity <= minLevel ? 'bg-orange-900/5' : ''}`}>
                      <td className="px-4 py-3 text-white font-medium">{s.spareName}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(s.buyingPrice)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(s.sellingPrice)}</td>
                      <td className="px-4 py-3" style={{ color: margin >= 0 ? '#34d399' : '#f87171' }}>{fmt(margin)}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-lg" style={{ color: s.quantity === 0 ? '#f87171' : s.quantity <= minLevel ? '#fbbf24' : '#fff' }}>{s.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-medium">{minLevel}</td>
                      <td className="px-4 py-3">{reorder > 0 ? <span className="text-blue-400 font-semibold">{reorder}</span> : <span className="text-slate-500">—</span>}</td>
                      <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(s)} className="btn-secondary text-xs py-1 px-3">✏️ Edit</button>
                          <button onClick={() => handleDelete(s._id)} className="btn-danger text-xs py-1 px-3">🗑</button>
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
