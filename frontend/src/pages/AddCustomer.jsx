import React, { useState, useEffect } from 'react';
import { addCustomer, getCustomers, updateCustomer, deleteCustomer } from '../api';

export default function AddCustomer() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [customers, setCustomers] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try { const { data } = await getCustomers(); setCustomers(data); } catch {}
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.phone) return setError('Name and Phone are required');
    setLoading(true);
    try {
      if (editId) {
        await updateCustomer(editId, form);
        setSuccess(`Customer "${form.name}" updated successfully!`);
      } else {
        await addCustomer(form);
        setSuccess(`Customer "${form.name}" added successfully!`);
      }
      setForm({ name: '', email: '', phone: '', address: '' });
      setEditId(null);
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
    setLoading(false);
  };

  const handleEdit = (c) => {
    setForm({ name: c.name, email: c.email || '', phone: c.phone, address: c.address || '' });
    setEditId(c._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try { await deleteCustomer(id); fetchCustomers(); }
    catch { alert('Delete failed'); }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-slate-400 text-sm">Manage customer records</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', email: '', phone: '', address: '' }); }}
          className="btn-primary">
          {showForm ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-5">{editId ? 'Edit Customer' : 'Add New Customer'}</h2>
          {success && <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm">✓ {success}</div>}
          {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name <span className="text-red-400">*</span></label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Customer full name" className="input-field" required />
              </div>
              <div>
                <label className="label">Phone Number <span className="text-red-400">*</span></label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="input-field" required />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="customer@example.com" className="input-field" />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="Full address..." rows={3} className="input-field resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : editId ? 'Update Customer' : '+ Add Customer'}
              </button>
              <button type="button" onClick={() => { setForm({ name: '', email: '', phone: '', address: '' }); setEditId(null); setShowForm(false); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {success && !showForm && (
        <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm max-w-2xl">✓ {success}</div>
      )}

      {/* Customer List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Customers ({filtered.length})</h2>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..." className="input-field w-56 text-sm" />
        </div>
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Name', 'Phone', 'Email', 'Address', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="table-row">
                    <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-slate-300">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-400">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{c.address || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(c)} className="btn-secondary text-xs py-1 px-3">✏️ Edit</button>
                        <button onClick={() => handleDelete(c._id, c.name)} className="btn-danger text-xs py-1 px-3">🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
