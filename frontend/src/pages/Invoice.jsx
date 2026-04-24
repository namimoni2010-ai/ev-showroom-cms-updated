import React, { useState, useRef } from 'react';
import { searchCustomers, getSpares } from '../api';

const emptySpare = () => ({ description: '', qty: 1, unitPrice: '' });
const emptyOther = () => ({ description: '', amount: '' });

export default function Invoice() {
  const printRef = useRef(null);

  // Customer search
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Spare search in invoice
  const [spareSearch, setSpareSearch] = useState({});
  const [spareSuggestions, setSpareSuggestions] = useState({});
  const [showSpareDrop, setShowSpareDrop] = useState({});
  const [allSpares, setAllSpares] = useState([]);
  const [sparesLoaded, setSparesLoaded] = useState(false);

  // Invoice form
  const [form, setForm] = useState({
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    vehicleName: '',
    vehicleType: '',
    vehicleCompany: '',
    vehicleModel: '',
    vehicleYear: '',
    serviceType: '',
    serviceDate: new Date().toISOString().split('T')[0],
    kmRun: '',
    labourCost: '',
    discount: '',
    paidAmount: '',
    paymentMode: 'Cash',
    notes: 'Thank you for choosing us. Please contact us for any queries.',
    companyName: 'Palani Motors EV Showroom',
    companyAddress: 'Tamil Nadu, India',
    companyPhone: '',
    companyEmail: '',
    companyGST: ''
  });

  const [spareRows, setSpareRows] = useState([emptySpare()]);
  const [otherRows, setOtherRows] = useState([emptyOther()]);

  // Load spares for search
  const loadSpares = async () => {
    if (sparesLoaded) return;
    try { const { data } = await getSpares(); setAllSpares(data); setSparesLoaded(true); }
    catch {}
  };

  // Customer search
  const handleSearch = async (val) => {
    setQuery(val);
    setForm(prev => ({ ...prev, customerName: val }));
    if (!val.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    setSearching(true);
    try { const { data } = await searchCustomers(val); setSuggestions(data); setShowDropdown(true); }
    catch { setSuggestions([]); }
    setSearching(false);
  };

  const handleSelectCustomer = (c) => {
    setQuery(c.name);
    setShowDropdown(false);
    setForm(prev => ({
      ...prev,
      customerName: c.name,
      customerPhone: c.phone || '',
      customerEmail: c.email || '',
      customerAddress: c.address || ''
    }));
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Spare search in invoice
  const handleSpareSearch = (idx, val) => {
    setSpareSearch(prev => ({ ...prev, [idx]: val }));
    // Update description in row
    setSpareRows(rows => rows.map((r, i) => i === idx ? { ...r, description: val } : r));
    if (!val.trim()) {
      setSpareSuggestions(prev => ({ ...prev, [idx]: [] }));
      setShowSpareDrop(prev => ({ ...prev, [idx]: false }));
      return;
    }
    const filtered = allSpares.filter(s =>
      s.spareName.toLowerCase().includes(val.toLowerCase())
    );
    setSpareSuggestions(prev => ({ ...prev, [idx]: filtered }));
    setShowSpareDrop(prev => ({ ...prev, [idx]: filtered.length > 0 }));
  };

  const handleSpareSelectInvoice = (idx, spare) => {
    setSpareRows(rows => rows.map((r, i) => i === idx
      ? { ...r, description: spare.spareName, unitPrice: spare.sellingPrice || '' }
      : r
    ));
    setSpareSearch(prev => ({ ...prev, [idx]: spare.spareName }));
    setShowSpareDrop(prev => ({ ...prev, [idx]: false }));
  };

  const handleSpareRowChange = (idx, field, val) =>
    setSpareRows(spareRows.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const handleOtherChange = (idx, field, val) =>
    setOtherRows(otherRows.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  // Calculations
  const sparesTotal = spareRows.reduce((s, r) =>
    s + (parseFloat(r.unitPrice) || 0) * (parseFloat(r.qty) || 1), 0);
  const labourTotal = parseFloat(form.labourCost) || 0;
  const otherTotal = otherRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const grossTotal = sparesTotal + labourTotal + otherTotal;
  const discount = parseFloat(form.discount) || 0;
  const totalBill = Math.max(0, grossTotal - discount);
  const paidAmount = parseFloat(form.paidAmount) || 0;
  const balanceDue = Math.max(0, totalBill - paidAmount);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => { try { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; } catch { return '—'; } };

  const handlePrint = () => {
    window.print();
  };

  const validSpares = spareRows.filter(r => r.description?.trim());
  const validOthers = otherRows.filter(r => r.description?.trim());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Invoice Generator</h1>
          <p className="text-slate-400 text-sm">Create and print professional service invoices</p>
        </div>
        <button onClick={handlePrint} className="btn-primary text-base px-6 py-3">
          🖨️ Print Invoice / Save PDF
        </button>
      </div>

      {/* ── FORM SECTION (hidden on print) ── */}
      <div className="no-print grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* Company */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">🏢 Company Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Company Name</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input name="companyAddress" value={form.companyAddress} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="companyPhone" value={form.companyPhone} onChange={handleChange} placeholder="+91 xxxxx xxxxx" className="input-field" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="companyEmail" value={form.companyEmail} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">GST Number</label>
              <input name="companyGST" value={form.companyGST} onChange={handleChange} placeholder="GST number" className="input-field" />
            </div>
            <div>
              <label className="label">Invoice Number</label>
              <input name="invoiceNo" value={form.invoiceNo} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Invoice Date</label>
              <input name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">👤 Customer Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Customer Name <span className="text-slate-500 text-xs font-normal">(search or type)</span></label>
              <div className="relative">
                <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search customer..." className="input-field" />
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>}
                {showDropdown && suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-40 overflow-y-auto">
                    {suggestions.map((c) => (
                      <li key={c._id} onClick={() => handleSelectCustomer(c)}
                        className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-700/50 last:border-0">
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-slate-400 text-xs">{c.phone}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="customerPhone" value={form.customerPhone} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="customerEmail" value={form.customerEmail} onChange={handleChange} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input name="customerAddress" value={form.customerAddress} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">🚗 Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vehicle Name / Model</label>
              <input name="vehicleName" value={form.vehicleName} onChange={handleChange} placeholder="e.g. Nexon EV Max" className="input-field" />
            </div>
            <div>
              <label className="label">Brand / Company</label>
              <input name="vehicleCompany" value={form.vehicleCompany} onChange={handleChange} placeholder="e.g. Tata Motors" className="input-field" />
            </div>
            <div>
              <label className="label">Vehicle Type</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className="input-field">
                <option value="">Select type</option>
                {['Sedan', 'SUV', 'Hatchback', 'MUV', '2-Wheeler', '3-Wheeler'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input name="vehicleYear" value={form.vehicleYear} onChange={handleChange} placeholder="e.g. 2023" className="input-field" />
            </div>
          </div>
        </div>

        {/* Service */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">🔧 Service Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Service Description</label>
              <textarea name="serviceType" value={form.serviceType} onChange={handleChange}
                placeholder="Describe the service..." rows={2} className="input-field resize-none" />
            </div>
            <div>
              <label className="label">Service Date</label>
              <input name="serviceDate" type="date" value={form.serviceDate} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">KM Run</label>
              <input name="kmRun" value={form.kmRun} onChange={handleChange} placeholder="Odometer" className="input-field" />
            </div>
          </div>
        </div>

        {/* Spare Parts */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">⚙️ Spare Parts</h3>
            <button type="button"
              onClick={() => { loadSpares(); setSpareRows([...spareRows, emptySpare()]); }}
              className="text-emerald-400 text-sm hover:text-emerald-300 bg-emerald-900/20 border border-emerald-800/50 px-3 py-1.5 rounded-lg">
              + Add Row
            </button>
          </div>
          <div className="border border-slate-600 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="text-left px-4 py-2 text-slate-400 text-xs">Spare Part Name</th>
                  <th className="text-left px-4 py-2 text-slate-400 text-xs w-20">Qty</th>
                  <th className="text-left px-4 py-2 text-slate-400 text-xs w-28">Unit Price (₹)</th>
                  <th className="text-right px-4 py-2 text-slate-400 text-xs w-24">Total</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {spareRows.map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-700">
                    <td className="px-3 py-2 relative">
                      <input
                        value={spareSearch[idx] !== undefined ? spareSearch[idx] : row.description}
                        onChange={(e) => { loadSpares(); handleSpareSearch(idx, e.target.value); }}
                        onFocus={() => loadSpares()}
                        placeholder="Search spare part name..."
                        className="input-field text-xs py-1.5"
                      />
                      {showSpareDrop[idx] && spareSuggestions[idx]?.length > 0 && (
                        <ul className="absolute z-50 left-3 right-3 bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-36 overflow-y-auto">
                          {spareSuggestions[idx].map((spare) => (
                            <li key={spare._id} onClick={() => handleSpareSelectInvoice(idx, spare)}
                              className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-xs border-b border-slate-700/50 last:border-0">
                              <p className="text-white font-medium">{spare.spareName}</p>
                              <p className="text-slate-400">Stock: {spare.quantity} · Price: {fmt(spare.sellingPrice)}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={row.qty}
                        onChange={(e) => handleSpareRowChange(idx, 'qty', e.target.value)}
                        className="input-field text-xs py-1.5" min="1" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={row.unitPrice}
                        onChange={(e) => handleSpareRowChange(idx, 'unitPrice', e.target.value)}
                        placeholder="0" className="input-field text-xs py-1.5" />
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-400 text-xs font-semibold">
                      {fmt((parseFloat(row.qty) || 1) * (parseFloat(row.unitPrice) || 0))}
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => spareRows.length > 1
                        ? setSpareRows(spareRows.filter((_, i) => i !== idx))
                        : setSpareRows([emptySpare()])}
                        className="text-red-400 hover:text-red-300 text-xs w-6 h-6 flex items-center justify-center">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Labour & Other Charges */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">💼 Labour & Other Charges</h3>
          <div className="mb-4">
            <label className="label">Labour Cost (₹)</label>
            <input name="labourCost" type="number" value={form.labourCost} onChange={handleChange} placeholder="0" className="input-field" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs font-semibold uppercase">Other Charges</p>
            <button onClick={() => setOtherRows([...otherRows, emptyOther()])}
              className="text-emerald-400 text-xs hover:text-emerald-300">+ Add</button>
          </div>
          <div className="space-y-2">
            {otherRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <input value={row.description} onChange={(e) => handleOtherChange(idx, 'description', e.target.value)}
                    placeholder="e.g. Courier" className="input-field text-sm py-2" />
                </div>
                <div className="col-span-4">
                  <input type="number" value={row.amount} onChange={(e) => handleOtherChange(idx, 'amount', e.target.value)}
                    placeholder="0" className="input-field text-sm py-2" />
                </div>
                <div className="col-span-1">
                  <button onClick={() => otherRows.length > 1
                    ? setOtherRows(otherRows.filter((_, i) => i !== idx))
                    : setOtherRows([emptyOther()])}
                    className="w-7 h-7 flex items-center justify-center rounded bg-red-900/40 text-red-400 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Notes */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">💰 Payment Details</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">🏷️ Discount (₹)</label>
              <input name="discount" type="number" value={form.discount} onChange={handleChange} placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="label">Amount Paid (₹)</label>
              <input name="paidAmount" type="number" value={form.paidAmount} onChange={handleChange} placeholder="0" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Payment Mode</label>
              <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className="input-field">
                {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Live Summary */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-1.5 text-sm mb-4">
            <div className="flex justify-between"><span className="text-slate-400">Spares</span><span className="text-white">{fmt(sparesTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Labour</span><span className="text-white">{fmt(labourTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Other</span><span className="text-white">{fmt(otherTotal)}</span></div>
            <div className="flex justify-between border-t border-slate-600 pt-1.5"><span className="text-slate-400">Gross Total</span><span className="text-white font-semibold">{fmt(grossTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Discount</span><span className="text-red-400">- {fmt(discount)}</span></div>
            <div className="flex justify-between border-t border-slate-600 pt-1.5"><span className="text-emerald-400 font-semibold">Total Bill</span><span className="text-emerald-400 font-bold text-lg">{fmt(totalBill)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Paid</span><span className="text-white">{fmt(paidAmount)}</span></div>
            <div className="flex justify-between border-t-2 border-slate-500 pt-1.5">
              <span className="font-bold" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>Balance Due</span>
              <span className="font-bold text-lg" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>{fmt(balanceDue)}</span>
            </div>
          </div>

          <div>
            <label className="label">Notes / Terms</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={3} className="input-field resize-none" />
          </div>
        </div>

      </div>

      {/* ── PRINTABLE INVOICE ── */}
      <div id="invoice-print" ref={printRef}
        className="bg-white text-gray-800 p-10 mx-auto"
        style={{ fontFamily: 'Arial, sans-serif', maxWidth: '900px', minHeight: '1100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '3px solid #111827', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{form.companyName}</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{form.companyAddress}</p>
            {form.companyPhone && <p style={{ color: '#6b7280', fontSize: '13px' }}>📞 {form.companyPhone}</p>}
            {form.companyEmail && <p style={{ color: '#6b7280', fontSize: '13px' }}>✉️ {form.companyEmail}</p>}
            {form.companyGST && <p style={{ color: '#6b7280', fontSize: '13px' }}>GST: {form.companyGST}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: '#111827', color: 'white', padding: '12px 24px', borderRadius: '8px', marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, letterSpacing: '1px' }}>SERVICE INVOICE</p>
              <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{form.invoiceNo}</p>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0' }}>Date: {fmtDate(form.invoiceDate)}</p>
            {form.dueDate && <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Due: {fmtDate(form.dueDate)}</p>}
          </div>
        </div>

        {/* Customer & Vehicle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', letterSpacing: '1px', margin: '0 0 8px 0' }}>BILL TO</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 6px 0' }}>{form.customerName || '—'}</p>
            {form.customerPhone && <p style={{ color: '#374151', fontSize: '13px', margin: '2px 0' }}>📞 {form.customerPhone}</p>}
            {form.customerEmail && <p style={{ color: '#374151', fontSize: '13px', margin: '2px 0' }}>✉️ {form.customerEmail}</p>}
            {form.customerAddress && <p style={{ color: '#374151', fontSize: '13px', margin: '2px 0' }}>📍 {form.customerAddress}</p>}
          </div>
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', letterSpacing: '1px', margin: '0 0 8px 0' }}>VEHICLE DETAILS</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>{form.vehicleName || '—'}</p>
            {form.vehicleCompany && <p style={{ color: '#374151', fontSize: '13px', margin: '2px 0' }}>Brand: {form.vehicleCompany}</p>}
            {form.vehicleType && <p style={{ color: '#374151', fontSize: '13px', margin: '2px 0' }}>Type: {form.vehicleType}</p>}
            {form.vehicleYear && <p style={{ color: '#374151', fontSize: '13px', margin: '2px 0' }}>Year: {form.vehicleYear}</p>}
            {form.kmRun && <p style={{ color: '#374151', fontSize: '13px', margin: '2px 0' }}>KM Run: {Number(form.kmRun).toLocaleString()} km</p>}
          </div>
        </div>

        {/* Service Description */}
        {(form.serviceType || form.serviceDate) && (
          <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6', letterSpacing: '1px', margin: '0 0 4px 0' }}>SERVICE DETAILS</p>
            <p style={{ color: '#1e40af', fontSize: '13px', margin: '2px 0' }}>Service Date: {fmtDate(form.serviceDate)}</p>
            {form.serviceType && <p style={{ color: '#1e40af', fontSize: '13px', margin: '2px 0' }}>Work Done: {form.serviceType}</p>}
          </div>
        )}

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#111827', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: '600' }}>#</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: '600' }}>Description</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '12px', fontWeight: '600' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '12px', fontWeight: '600' }}>Unit Price</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '12px', fontWeight: '600' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {validSpares.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280' }}>{idx + 1}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', color: '#111827' }}>{row.description}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'center', color: '#374151' }}>{row.qty}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'right', color: '#374151' }}>{fmt(row.unitPrice)}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                  {fmt((parseFloat(row.qty) || 1) * (parseFloat(row.unitPrice) || 0))}
                </td>
              </tr>
            ))}
            {labourTotal > 0 && (
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: validSpares.length % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280' }}>{validSpares.length + 1}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', color: '#111827', fontStyle: 'italic' }}>Labour Charges</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'center', color: '#374151' }}>1</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'right', color: '#374151' }}>{fmt(labourTotal)}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>{fmt(labourTotal)}</td>
              </tr>
            )}
            {validOthers.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280' }}>—</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', color: '#111827', fontStyle: 'italic' }}>{row.description}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'center', color: '#374151' }}>1</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'right', color: '#374151' }}>{fmt(row.amount)}</td>
                <td style={{ padding: '10px 16px', fontSize: '13px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>{fmt(row.amount)}</td>
              </tr>
            ))}
            {validSpares.length === 0 && labourTotal === 0 && validOthers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  No items added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ minWidth: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Subtotal (Spares + Labour + Other)</span>
              <span style={{ color: '#111827' }}>{fmt(grossTotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span style={{ color: '#6b7280' }}>Discount</span>
                <span style={{ color: '#dc2626' }}>- {fmt(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: 'bold', borderTop: '2px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', margin: '4px 0' }}>
              <span>Total Amount</span>
              <span>{fmt(totalBill)}</span>
            </div>
            {paidAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span style={{ color: '#6b7280' }}>Amount Paid ({form.paymentMode})</span>
                <span style={{ color: '#16a34a', fontWeight: '600' }}>{fmt(paidAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #111827', marginTop: '4px' }}>
              <span>Balance Due</span>
              <span style={{ color: balanceDue > 0 ? '#d97706' : '#16a34a' }}>{fmt(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {form.notes && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', letterSpacing: '1px', margin: '0 0 6px 0' }}>NOTES & TERMS</p>
            <p style={{ color: '#374151', fontSize: '13px', margin: 0 }}>{form.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '2px solid #111827', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>Thank you for choosing {form.companyName}</p>
            {form.companyPhone && <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0 0' }}>Contact: {form.companyPhone}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ height: '50px', borderBottom: '1px solid #9ca3af', width: '160px', marginBottom: '4px' }}></div>
            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* Print & Screen Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          #invoice-print {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
        }
        @media screen {
          #invoice-print {
            border: 1px solid #334155;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          }
        }
      `}</style>
    </div>
  );
}