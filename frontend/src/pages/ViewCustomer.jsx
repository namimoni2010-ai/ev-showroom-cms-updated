import React, { useState } from 'react';
import { searchCustomers, getCustomerById, getSalesByCustomer, getServicesByCustomer } from '../api';

export default function ViewCustomer() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sales, setSales] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    setSearching(true);
    try {
      const { data } = await searchCustomers(val);
      setSuggestions(data);
      setShowDropdown(true);
    } catch {}
    setSearching(false);
  };

  const handleSelect = async (customer) => {
    setShowDropdown(false);
    setQuery(customer.name);
    setLoading(true);
    try {
      const [cRes, saleRes, svcRes] = await Promise.all([
        getCustomerById(customer._id),
        getSalesByCustomer(customer._id),
        getServicesByCustomer(customer._id)
      ]);
      setSelected(cRes.data);
      setSales(saleRes.data);
      setServices(svcRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  const totalSalesPending = sales.filter(s => s.paymentStatus === 'Pending').reduce((a, s) => a + s.pendingAmount, 0);
  const totalSvcPending = services.filter(s => s.paymentStatus === 'Pending').reduce((a, s) => a + s.pendingAmount, 0);

  return (
    <div>
      <h1 className="page-title">View Customer</h1>
      <p className="page-subtitle">Search and view complete customer profile with history</p>

      {/* Search Box */}
      <div className="card mb-6">
        <label className="label">Search by Name or Phone Number</label>
        <div className="relative max-w-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type customer name or phone..."
            className="input-field pr-10"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-52 overflow-y-auto">
              {suggestions.map((c) => (
                <li
                  key={c._id}
                  onClick={() => handleSelect(c)}
                  className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                >
                  <p className="text-white text-sm font-medium">{c.name}</p>
                  <p className="text-slate-400 text-xs">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
          {showDropdown && query && suggestions.length === 0 && !searching && (
            <div className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 px-4 py-3 text-slate-400 text-sm">
              No customers found
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {selected && !loading && (
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="card">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                {selected.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                    <p className="text-slate-400 text-xs">Phone</p>
                    <p className="text-white font-medium mt-0.5">{selected.phone}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                    <p className="text-slate-400 text-xs">Email</p>
                    <p className="text-white font-medium mt-0.5">{selected.email || '—'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                    <p className="text-slate-400 text-xs">Address</p>
                    <p className="text-white font-medium mt-0.5">{selected.address || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3 text-center">
                    <p className="text-slate-400 text-xs">Total Sales</p>
                    <p className="text-emerald-400 text-xl font-bold">{sales.length}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3 text-center">
                    <p className="text-slate-400 text-xs">Total Services</p>
                    <p className="text-blue-400 text-xl font-bold">{services.length}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3 text-center">
                    <p className="text-slate-400 text-xs">Total Pending</p>
                    <p className="text-amber-400 text-xl font-bold">{fmt(totalSalesPending + totalSvcPending)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales History */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🚗 Sales History
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{sales.length}</span>
              {totalSalesPending > 0 && (
                <span className="ml-auto text-xs text-amber-400">Pending: {fmt(totalSalesPending)}</span>
              )}
            </h3>
            {sales.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No sales records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      {['Vehicle', 'Type', 'Price', 'Discount', 'Final Price', 'Paid', 'Pending', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s._id} className="table-row">
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{s.vehicleName}</td>
                        <td className="px-4 py-3 text-slate-400">{s.vehicleType || '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{fmt(s.price)}</td>
                        <td className="px-4 py-3 text-red-400">- {fmt(s.discount)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(s.finalPrice)}</td>
                        <td className="px-4 py-3 text-slate-300">{fmt(s.paidAmount)}</td>
                        <td className="px-4 py-3 text-amber-400">{fmt(s.pendingAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={s.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}>{s.paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(s.salesDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Service History */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🔧 Service History
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{services.length}</span>
              {totalSvcPending > 0 && (
                <span className="ml-auto text-xs text-amber-400">Pending: {fmt(totalSvcPending)}</span>
              )}
            </h3>
            {services.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No service records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      {['Vehicle', 'KM Run', 'Service Type', 'Labour', 'Spare Parts', 'Total', 'Paid', 'Pending', 'Status', 'Date', 'Next Due'].map(h => (
                        <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <React.Fragment key={s._id}>
                        <tr className="table-row">
                          <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{s.vehicleName}</td>
                          <td className="px-4 py-3 text-slate-400">{s.kmRun?.toLocaleString() || '—'}</td>
                          <td className="px-4 py-3 text-slate-300 max-w-[160px] truncate" title={s.serviceType}>{s.serviceType || '—'}</td>
                          <td className="px-4 py-3 text-slate-300">{fmt(s.labourCost)}</td>
                          <td className="px-4 py-3 text-slate-300">
                            {s.spareItems?.length > 0 ? (
                              <div>
                                <p className="text-white font-semibold">{fmt(s.spareCost)}</p>
                                <div className="mt-1 space-y-0.5">
                                  {s.spareItems.map((item, i) => (
                                    <p key={i} className="text-slate-500 text-xs">
                                      {item.spareName} ×{item.quantity} @ {fmt(item.price)}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : fmt(s.spareCost)}
                          </td>
                          <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(s.totalBill)}</td>
                          <td className="px-4 py-3 text-slate-300">{fmt(s.paidAmount)}</td>
                          <td className="px-4 py-3 text-amber-400">{fmt(s.pendingAmount)}</td>
                          <td className="px-4 py-3">
                            <span className={s.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}>{s.paymentStatus}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(s.serviceDate)}</td>
                          <td className="px-4 py-3 text-blue-400 whitespace-nowrap">{fmtDate(s.nextServiceDate)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
