import React, { useState, useRef } from 'react';
import { searchCustomers, getSpares, getVehicleByChassis, searchVehicles, saveInvoice } from '../api';

const emptySpare = () => ({ description: '', qty: 1, unitPrice: '' });
const emptyOther = () => ({ description: '', amount: '' });

export default function Invoice() {
  const printRef = useRef(null);
  const [invoiceType, setInvoiceType] = useState('Service Bill');
  const [saveMsg, setSaveMsg] = useState('');
  const [saveMsgType, setSaveMsgType] = useState('success');
  const [saving, setSaving] = useState(false);

  // Customer search
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Chassis search (Sales Bill)
  const [chassisQuery, setChassisQuery] = useState('');
  const [chassisSuggestions, setChassisSuggestions] = useState([]);
  const [chassisSearching, setChassisSearching] = useState(false);
  const [showChassisDrop, setShowChassisDrop] = useState(false);
  const [chassisError, setChassisError] = useState('');

  // Spare search
  const [spareSearch, setSpareSearch] = useState({});
  const [spareSuggestions, setSpareSuggestions] = useState({});
  const [showSpareDrop, setShowSpareDrop] = useState({});
  const [allSpares, setAllSpares] = useState([]);
  const [sparesLoaded, setSparesLoaded] = useState(false);

  const [form, setForm] = useState({
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerName: '', customerPhone: '', customerEmail: '', customerAddress: '',
    vehicleName: '', vehicleModel: '', vehicleType: '', vehicleCompany: '',
    vehicleYear: '', chassisNo: '', motorNo: '', controllerNo: '', chargerNo: '',
    serviceType: '', serviceDate: new Date().toISOString().split('T')[0], kmRun: '',
    labourCost: '', discount: '', gstPercent: '', paidAmount: '', paymentMode: 'Cash',
    notes: 'Thank you for choosing us.',
    companyName: 'Palani Motors EV Showroom',
    companyAddress: 'Tamil Nadu, India',
    companyPhone: '', companyEmail: '', companyGST: ''
  });

  const [spareRows, setSpareRows] = useState([emptySpare()]);
  const [otherRows, setOtherRows] = useState([emptyOther()]);

  const loadSpares = async () => {
    if (sparesLoaded) return;
    try { const { data } = await getSpares(); setAllSpares(data); setSparesLoaded(true); } catch {}
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
    setForm(prev => ({ ...prev, customerName: c.name, customerPhone: c.phone || '', customerEmail: c.email || '', customerAddress: c.address || '' }));
  };

  // Chassis search for Sales Bill
  const handleChassisSearch = async (val) => {
    setChassisQuery(val);
    setForm(prev => ({ ...prev, chassisNo: val }));
    setChassisError('');
    if (!val.trim()) { setChassisSuggestions([]); setShowChassisDrop(false); return; }
    setChassisSearching(true);
    try {
      const { data } = await searchVehicles(val);
      setChassisSuggestions(data);
      setShowChassisDrop(data.length > 0);
    } catch { setChassisSuggestions([]); }
    setChassisSearching(false);
  };

  const handleChassisSelect = (vehicle) => {
    setChassisQuery(vehicle.chassisNo || '');
    setShowChassisDrop(false);
    setChassisError('');
    setForm(prev => ({
      ...prev,
      chassisNo: vehicle.chassisNo || '',
      vehicleName: vehicle.vehicleName || '',
      vehicleModel: vehicle.vehicleModel || '',
      vehicleType: vehicle.vehicleType || '',
      motorNo: vehicle.motorNo || '',
      controllerNo: vehicle.controllerNo || '',
      chargerNo: vehicle.chargerNo || ''
    }));
  };

  const handleChassisLookup = async () => {
    if (!chassisQuery.trim()) return;
    setChassisSearching(true);
    setChassisError('');
    try {
      const { data } = await getVehicleByChassis(chassisQuery);
      handleChassisSelect(data);
    } catch {
      setChassisError('Vehicle details not found.');
    }
    setChassisSearching(false);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Spare search
  const handleSpareSearch = (idx, val) => {
    setSpareSearch(prev => ({ ...prev, [idx]: val }));
    setSpareRows(rows => rows.map((r, i) => i === idx ? { ...r, description: val } : r));
    if (!val.trim()) { setSpareSuggestions(prev => ({ ...prev, [idx]: [] })); setShowSpareDrop(prev => ({ ...prev, [idx]: false })); return; }
    const filtered = allSpares.filter(s => s.spareName.toLowerCase().includes(val.toLowerCase()));
    setSpareSuggestions(prev => ({ ...prev, [idx]: filtered }));
    setShowSpareDrop(prev => ({ ...prev, [idx]: filtered.length > 0 }));
  };

  const handleSpareSelectInvoice = (idx, spare) => {
    setSpareRows(rows => rows.map((r, i) => i === idx ? { ...r, description: spare.spareName, unitPrice: spare.sellingPrice || '' } : r));
    setSpareSearch(prev => ({ ...prev, [idx]: spare.spareName }));
    setShowSpareDrop(prev => ({ ...prev, [idx]: false }));
  };

  const handleSpareRowChange = (idx, field, val) =>
    setSpareRows(spareRows.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const handleOtherChange = (idx, field, val) =>
    setOtherRows(otherRows.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  // Calculations
  const sparesTotal = spareRows.reduce((s, r) => s + (parseFloat(r.unitPrice) || 0) * (parseFloat(r.qty) || 1), 0);
  const labourTotal = parseFloat(form.labourCost) || 0;
  const otherTotal = otherRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const grossTotal = sparesTotal + labourTotal + otherTotal;
  const discount = parseFloat(form.discount) || 0;
  const afterDiscount = Math.max(0, grossTotal - discount);
  const gstPercent = parseFloat(form.gstPercent) || 0;
  const gstAmount = (afterDiscount * gstPercent) / 100;
  const totalBill = afterDiscount + gstAmount;
  const paidAmount = parseFloat(form.paidAmount) || 0;
  const balanceDue = Math.max(0, totalBill - paidAmount);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => { try { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; } catch { return '—'; } };

  const validSpares = spareRows.filter(r => r.description?.trim());
  const validOthers = otherRows.filter(r => r.description?.trim());

  // ── SAVE ──────────────────────────────────────────
  const handleSave = async () => {
    if (!form.customerName) {
      setSaveMsg('⚠ Please enter customer name before saving'); setSaveMsgType('warn');
      setTimeout(() => setSaveMsg(''), 3000); return;
    }
    setSaving(true);
    try {
      await saveInvoice({
        invoiceType,
        invoiceNo: form.invoiceNo,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || undefined,
        companyName: form.companyName,
        companyAddress: form.companyAddress,
        companyPhone: form.companyPhone,
        companyEmail: form.companyEmail,
        companyGST: form.companyGST,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        vehicleName: form.vehicleName,
        vehicleModel: form.vehicleModel,
        vehicleType: form.vehicleType,
        vehicleCompany: form.vehicleCompany,
        vehicleYear: form.vehicleYear,
        chassisNo: form.chassisNo,
        motorNo: form.motorNo,
        controllerNo: form.controllerNo,
        chargerNo: form.chargerNo,
        serviceType: form.serviceType,
        serviceDate: form.serviceDate,
        kmRun: form.kmRun,
        spareItems: validSpares,
        labourCost: labourTotal,
        otherCharges: validOthers,
        sparesTotal, otherTotal, grossTotal, discount,
        gstPercent, gstAmount, totalBill, paidAmount, balanceDue,
        paymentMode: form.paymentMode,
        notes: form.notes
      });
      setSaveMsg(`✅ Invoice ${form.invoiceNo} saved to database!`);
      setSaveMsgType('success');
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Save failed'));
      setSaveMsgType('error');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 5000);
  };

  const handlePrint = () => window.print();

  return (
    <div>
      {/* Top Bar */}
      <div className="no-print flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Invoice Generator</h1>
          <p className="text-slate-400 text-sm">Create · Save · Print professional invoices</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-secondary text-base px-5 py-2.5">
            {saving ? 'Saving...' : '💾 Save Invoice'}
          </button>
          <button onClick={handlePrint} className="btn-primary text-base px-5 py-2.5">
            🖨️ Print Invoice
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMsg && (
        <div className={`no-print mb-4 px-4 py-3 rounded-lg text-sm border ${
          saveMsgType === 'success' ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400'
          : saveMsgType === 'error' ? 'bg-red-900/30 border-red-700 text-red-400'
          : 'bg-amber-900/30 border-amber-700 text-amber-400'
        }`}>{saveMsg}</div>
      )}

      {/* ── INVOICE TYPE SELECTOR ── */}
      <div className="no-print card mb-5">
        <h3 className="text-white font-semibold mb-3">Select Invoice Type</h3>
        <div className="flex gap-4">
          {['Service Bill', 'Sales Bill'].map(type => (
            <label key={type} className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all ${
              invoiceType === type
                ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400'
                : 'border-slate-600 bg-slate-700/30 text-slate-400 hover:border-slate-500'
            }`}>
              <input type="radio" name="invoiceType" value={type}
                checked={invoiceType === type}
                onChange={() => setInvoiceType(type)}
                className="hidden" />
              <span className="text-xl">{type === 'Service Bill' ? '🔧' : '🚗'}</span>
              <div>
                <p className="font-semibold text-sm">{type}</p>
                <p className="text-xs opacity-70">
                  {type === 'Service Bill' ? 'Spare parts, labour, repairs' : 'Vehicle purchase bill'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── FORM SECTION ── */}
      <div className="no-print grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">

        {/* Company */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">🏢 Company Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Company Name</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} className="input-field" /></div>
            <div className="col-span-2"><label className="label">Address</label>
              <input name="companyAddress" value={form.companyAddress} onChange={handleChange} className="input-field" /></div>
            <div><label className="label">Phone</label>
              <input name="companyPhone" value={form.companyPhone} onChange={handleChange} className="input-field" /></div>
            <div><label className="label">Email</label>
              <input name="companyEmail" value={form.companyEmail} onChange={handleChange} className="input-field" /></div>
            <div><label className="label">GST Number</label>
              <input name="companyGST" value={form.companyGST} onChange={handleChange} className="input-field" /></div>
            <div><label className="label">Invoice Number</label>
              <input name="invoiceNo" value={form.invoiceNo} onChange={handleChange} className="input-field" /></div>
            <div><label className="label">Invoice Date</label>
              <input name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleChange} className="input-field" /></div>
            <div><label className="label">Due Date</label>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="input-field" /></div>
          </div>
        </div>

        {/* Customer */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">👤 Customer Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Customer Name</label>
              <div className="relative">
                <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search customer..." className="input-field" />
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}
                {showDropdown && suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-40 overflow-y-auto">
                    {suggestions.map(c => (
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
            <div><label className="label">Phone</label>
              <input name="customerPhone" value={form.customerPhone} onChange={handleChange} className="input-field" /></div>
            <div><label className="label">Email</label>
              <input name="customerEmail" value={form.customerEmail} onChange={handleChange} className="input-field" /></div>
            <div className="col-span-2"><label className="label">Address</label>
              <input name="customerAddress" value={form.customerAddress} onChange={handleChange} className="input-field" /></div>
          </div>
        </div>

        {/* Vehicle Details — Sales Bill gets chassis auto-fill */}
        <div className={`card ${invoiceType === 'Sales Bill' ? 'xl:col-span-2' : ''}`}>
          <h3 className="text-white font-semibold mb-4">🚗 Vehicle Details</h3>

          {/* Chassis Auto-fill — only for Sales Bill */}
          {invoiceType === 'Sales Bill' && (
            <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 mb-4">
              <p className="text-emerald-400 text-sm font-semibold mb-2">
                🔍 Chassis Number Lookup — Auto-fills vehicle details
              </p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chassisQuery}
                    onChange={(e) => handleChassisSearch(e.target.value)}
                    placeholder="Type chassis number to search..."
                    className="input-field"
                  />
                  {chassisSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {showChassisDrop && chassisSuggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-48 overflow-y-auto">
                      {chassisSuggestions.map(v => (
                        <li key={v._id} onClick={() => handleChassisSelect(v)}
                          className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0">
                          <p className="text-white text-sm font-medium">{v.vehicleName} — {v.vehicleModel || '—'}</p>
                          <p className="text-emerald-400 text-xs font-mono">Chassis: {v.chassisNo}</p>
                          <p className="text-slate-400 text-xs">Motor: {v.motorNo || '—'} · Controller: {v.controllerNo || '—'}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button onClick={handleChassisLookup} disabled={chassisSearching}
                  className="btn-primary px-4 py-2 text-sm">
                  🔍 Lookup
                </button>
              </div>
              {chassisError && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                  <span>❌</span> {chassisError}
                </p>
              )}
              {form.chassisNo && !chassisError && (
                <p className="text-emerald-400 text-xs mt-2">✅ Vehicle details auto-filled from stock database</p>
              )}
            </div>
          )}

          <div className={`grid gap-4 ${invoiceType === 'Sales Bill' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
            <div>
              <label className="label">Vehicle Name</label>
              <input name="vehicleName" value={form.vehicleName} onChange={handleChange}
                placeholder="e.g. Nexon EV" className="input-field" />
            </div>
            <div>
              <label className="label">Vehicle Model</label>
              <input name="vehicleModel" value={form.vehicleModel} onChange={handleChange}
                placeholder="e.g. XZ Plus" className="input-field" />
            </div>
            <div>
              <label className="label">Brand / Company</label>
              <input name="vehicleCompany" value={form.vehicleCompany} onChange={handleChange}
                placeholder="e.g. Tata" className="input-field" />
            </div>
            <div>
              <label className="label">Year</label>
              <input name="vehicleYear" value={form.vehicleYear} onChange={handleChange}
                placeholder="2024" className="input-field" />
            </div>
            <div>
              <label className="label">Vehicle Type</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className="input-field">
                <option value="">Select type</option>
                {['Sedan', 'SUV', 'Hatchback', 'MUV', '2-Wheeler', '3-Wheeler'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Sales Bill specific numbers */}
            {invoiceType === 'Sales Bill' && (
              <>
                <div>
                  <label className="label">Chassis Number</label>
                  <input name="chassisNo" value={form.chassisNo} onChange={handleChange}
                    className="input-field font-mono" />
                </div>
                <div>
                  <label className="label">Motor Number</label>
                  <input name="motorNo" value={form.motorNo} onChange={handleChange}
                    className="input-field font-mono" />
                </div>
                <div>
                  <label className="label">Controller Number</label>
                  <input name="controllerNo" value={form.controllerNo} onChange={handleChange}
                    className="input-field font-mono" />
                </div>
                <div>
                  <label className="label">Charger Number</label>
                  <input name="chargerNo" value={form.chargerNo} onChange={handleChange}
                    className="input-field font-mono" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Service Details — only for Service Bill */}
        {invoiceType === 'Service Bill' && (
          <div className="card">
            <h3 className="text-white font-semibold mb-4">🔧 Service Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Service Description</label>
                <textarea name="serviceType" value={form.serviceType} onChange={handleChange}
                  placeholder="Describe service work..." rows={2} className="input-field resize-none" />
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
        )}

        {/* Spare Parts — Service Bill only */}
        {invoiceType === 'Service Bill' && (
          <div className="card xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">⚙️ Spare Parts</h3>
              <button onClick={() => { loadSpares(); setSpareRows([...spareRows, emptySpare()]); }}
                className="text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800/50 px-3 py-1.5 rounded-lg">
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
                    <th className="w-10"></th>
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
                          placeholder="Search spare part..."
                          className="input-field text-xs py-1.5" />
                        {showSpareDrop[idx] && spareSuggestions[idx]?.length > 0 && (
                          <ul className="absolute z-50 left-3 right-3 bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-36 overflow-y-auto">
                            {spareSuggestions[idx].map(spare => (
                              <li key={spare._id} onClick={() => handleSpareSelectInvoice(idx, spare)}
                                className="px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0">
                                <p className="text-white text-xs font-medium">{spare.spareName}</p>
                                <p className="text-slate-400 text-xs">Stock: {spare.quantity} · {fmt(spare.sellingPrice)}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={row.qty} min="1"
                          onChange={(e) => handleSpareRowChange(idx, 'qty', e.target.value)}
                          className="input-field text-xs py-1.5" />
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
        )}

        {/* Labour & Other — Service Bill */}
        {invoiceType === 'Service Bill' && (
          <div className="card">
            <h3 className="text-white font-semibold mb-4">💼 Labour & Other Charges</h3>
            <div className="mb-4">
              <label className="label">Labour Cost (₹)</label>
              <input name="labourCost" type="number" value={form.labourCost}
                onChange={handleChange} placeholder="0" className="input-field" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-xs font-semibold uppercase">Other Charges</p>
              <button onClick={() => setOtherRows([...otherRows, emptyOther()])}
                className="text-emerald-400 text-xs">+ Add</button>
            </div>
            <div className="space-y-2">
              {otherRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <input value={row.description}
                      onChange={(e) => handleOtherChange(idx, 'description', e.target.value)}
                      placeholder="e.g. Courier" className="input-field text-sm py-2" />
                  </div>
                  <div className="col-span-4">
                    <input type="number" value={row.amount}
                      onChange={(e) => handleOtherChange(idx, 'amount', e.target.value)}
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
        )}

        {/* Sales Bill Amount */}
        {invoiceType === 'Sales Bill' && (
          <div className="card">
            <h3 className="text-white font-semibold mb-4">💰 Sales Amount</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Vehicle Price (₹)</label>
                <input name="labourCost" type="number" value={form.labourCost}
                  onChange={handleChange} placeholder="Vehicle sale amount" className="input-field" />
              </div>
              <div>
                <label className="label">🏷️ Discount (₹)</label>
                <input name="discount" type="number" value={form.discount}
                  onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div>
                <label className="label">GST / Tax (%)</label>
                <input name="gstPercent" type="number" value={form.gstPercent}
                  onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div>
                <label className="label">Amount Paid (₹)</label>
                <input name="paidAmount" type="number" value={form.paidAmount}
                  onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="label">Payment Mode</label>
                <select name="paymentMode" value={form.paymentMode}
                  onChange={handleChange} className="input-field">
                  {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details — Service Bill */}
        {invoiceType === 'Service Bill' && (
          <div className="card">
            <h3 className="text-white font-semibold mb-4">💰 Payment Details</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="label">🏷️ Discount (₹)</label>
                <input name="discount" type="number" value={form.discount}
                  onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div>
                <label className="label">GST / Tax (%)</label>
                <input name="gstPercent" type="number" value={form.gstPercent}
                  onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div>
                <label className="label">Amount Paid (₹)</label>
                <input name="paidAmount" type="number" value={form.paidAmount}
                  onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div>
                <label className="label">Payment Mode</label>
                <select name="paymentMode" value={form.paymentMode}
                  onChange={handleChange} className="input-field">
                  {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Live Summary */}
            <div className="bg-slate-700/50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Spares</span><span>{fmt(sparesTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Labour</span><span>{fmt(labourTotal)}</span></div>
              {otherTotal > 0 && <div className="flex justify-between"><span className="text-slate-400">Other</span><span>{fmt(otherTotal)}</span></div>}
              <div className="flex justify-between border-t border-slate-600 pt-1.5"><span className="text-slate-400">Gross</span><span className="font-semibold">{fmt(grossTotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-slate-400">Discount</span><span className="text-red-400">- {fmt(discount)}</span></div>}
              {gstPercent > 0 && <div className="flex justify-between"><span className="text-slate-400">GST ({gstPercent}%)</span><span>{fmt(gstAmount)}</span></div>}
              <div className="flex justify-between border-t border-slate-600 pt-1.5"><span className="text-emerald-400 font-semibold">Total Bill</span><span className="text-emerald-400 font-bold text-lg">{fmt(totalBill)}</span></div>
              {paidAmount > 0 && <div className="flex justify-between"><span className="text-slate-400">Paid</span><span>{fmt(paidAmount)}</span></div>}
              <div className="flex justify-between border-t-2 border-slate-500 pt-1.5">
                <span className="font-bold" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>Balance Due</span>
                <span className="font-bold text-lg" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>{fmt(balanceDue)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="card">
          <label className="label">Notes / Terms</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            rows={3} className="input-field resize-none" />
        </div>

        {/* Sales Bill Summary */}
        {invoiceType === 'Sales Bill' && (
          <div className="card bg-slate-700/40">
            <h3 className="text-white font-semibold mb-3">💰 Bill Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Vehicle Amount</span><span className="text-white">{fmt(labourTotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-slate-400">Discount</span><span className="text-red-400">- {fmt(discount)}</span></div>}
              {gstPercent > 0 && <div className="flex justify-between"><span className="text-slate-400">GST ({gstPercent}%)</span><span>{fmt(gstAmount)}</span></div>}
              <div className="flex justify-between border-t border-slate-600 pt-2"><span className="text-emerald-400 font-semibold text-base">Total Amount</span><span className="text-emerald-400 font-bold text-xl">{fmt(totalBill)}</span></div>
              {paidAmount > 0 && <div className="flex justify-between"><span className="text-slate-400">Paid</span><span className="text-white">{fmt(paidAmount)}</span></div>}
              <div className="flex justify-between border-t-2 border-slate-500 pt-2">
                <span className="font-bold" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>Balance Due</span>
                <span className="font-bold text-lg" style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>{fmt(balanceDue)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
          PRINTABLE INVOICE
          ══════════════════════════════════ */}
      <div id="invoice-print" ref={printRef}
        style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#111827', padding: '32px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111827', paddingBottom: '18px', marginBottom: '22px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>{form.companyName}</div>
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '3px' }}>{form.companyAddress}</div>
            {form.companyPhone && <div style={{ color: '#6b7280', fontSize: '12px' }}>📞 {form.companyPhone}</div>}
            {form.companyEmail && <div style={{ color: '#6b7280', fontSize: '12px' }}>✉️ {form.companyEmail}</div>}
            {form.companyGST && <div style={{ color: '#6b7280', fontSize: '12px' }}>GST: {form.companyGST}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: '#111827', color: 'white', padding: '10px 20px', borderRadius: '8px', marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', letterSpacing: '1px' }}>
                {invoiceType.toUpperCase()}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{form.invoiceNo}</div>
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>Date: {fmtDate(form.invoiceDate)}</div>
            {form.dueDate && <div style={{ color: '#6b7280', fontSize: '12px' }}>Due: {fmtDate(form.dueDate)}</div>}
          </div>
        </div>

        {/* Customer + Vehicle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', marginBottom: '6px' }}>BILL TO</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '3px' }}>{form.customerName || '—'}</div>
            {form.customerPhone && <div style={{ color: '#374151', fontSize: '12px', marginBottom: '2px' }}>📞 {form.customerPhone}</div>}
            {form.customerEmail && <div style={{ color: '#374151', fontSize: '12px', marginBottom: '2px' }}>✉️ {form.customerEmail}</div>}
            {form.customerAddress && <div style={{ color: '#374151', fontSize: '12px' }}>📍 {form.customerAddress}</div>}
          </div>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', marginBottom: '6px' }}>VEHICLE DETAILS</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', marginBottom: '3px' }}>{form.vehicleName || '—'}</div>
            {form.vehicleModel && <div style={{ color: '#374151', fontSize: '12px', marginBottom: '2px' }}>Model: {form.vehicleModel}</div>}
            {form.vehicleCompany && <div style={{ color: '#374151', fontSize: '12px', marginBottom: '2px' }}>Brand: {form.vehicleCompany}</div>}
            {form.vehicleType && <div style={{ color: '#374151', fontSize: '12px', marginBottom: '2px' }}>Type: {form.vehicleType}</div>}
            {form.vehicleYear && <div style={{ color: '#374151', fontSize: '12px', marginBottom: '2px' }}>Year: {form.vehicleYear}</div>}
            {form.kmRun && <div style={{ color: '#374151', fontSize: '12px' }}>KM Run: {form.kmRun}</div>}
          </div>
        </div>

        {/* Vehicle Numbers — Sales Bill */}
        {invoiceType === 'Sales Bill' && (form.chassisNo || form.motorNo || form.controllerNo || form.chargerNo) && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '18px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', letterSpacing: '1px', marginBottom: '8px' }}>VEHICLE NUMBERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {form.chassisNo && (
                <div>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>Chassis No: </span>
                  <span style={{ color: '#111827', fontSize: '12px', fontWeight: '600', fontFamily: 'monospace' }}>{form.chassisNo}</span>
                </div>
              )}
              {form.motorNo && (
                <div>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>Motor No: </span>
                  <span style={{ color: '#111827', fontSize: '12px', fontWeight: '600', fontFamily: 'monospace' }}>{form.motorNo}</span>
                </div>
              )}
              {form.controllerNo && (
                <div>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>Controller No: </span>
                  <span style={{ color: '#111827', fontSize: '12px', fontWeight: '600', fontFamily: 'monospace' }}>{form.controllerNo}</span>
                </div>
              )}
              {form.chargerNo && (
                <div>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>Charger No: </span>
                  <span style={{ color: '#111827', fontSize: '12px', fontWeight: '600', fontFamily: 'monospace' }}>{form.chargerNo}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Info */}
        {invoiceType === 'Service Bill' && (form.serviceType || form.serviceDate) && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '18px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#3b82f6', letterSpacing: '1px', marginBottom: '5px' }}>SERVICE DETAILS</div>
            {form.serviceDate && <div style={{ color: '#1e40af', fontSize: '12px', marginBottom: '2px' }}>Date: {fmtDate(form.serviceDate)}</div>}
            {form.serviceType && <div style={{ color: '#1e40af', fontSize: '12px' }}>Work: {form.serviceType}</div>}
          </div>
        )}

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', pageBreakInside: 'avoid' }}>
          <thead>
            <tr style={{ backgroundColor: '#111827', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: '9px 14px', fontSize: '11px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '9px 14px', fontSize: '11px' }}>Description</th>
              <th style={{ textAlign: 'center', padding: '9px 14px', fontSize: '11px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '9px 14px', fontSize: '11px' }}>Unit Price</th>
              <th style={{ textAlign: 'right', padding: '9px 14px', fontSize: '11px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceType === 'Sales Bill' ? (
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '9px 14px', fontSize: '12px', color: '#6b7280' }}>1</td>
                <td style={{ padding: '9px 14px', fontSize: '12px', color: '#111827' }}>
                  {form.vehicleName} {form.vehicleModel && `— ${form.vehicleModel}`}
                  {form.vehicleYear && ` (${form.vehicleYear})`}
                </td>
                <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>1</td>
                <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right', color: '#374151' }}>{fmt(labourTotal)}</td>
                <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>{fmt(labourTotal)}</td>
              </tr>
            ) : (
              <>
                {validSpares.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '9px 14px', fontSize: '12px', color: '#6b7280' }}>{idx + 1}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', color: '#111827' }}>{row.description}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>{row.qty}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right', color: '#374151' }}>{fmt(row.unitPrice)}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>
                      {fmt((parseFloat(row.qty) || 1) * (parseFloat(row.unitPrice) || 0))}
                    </td>
                  </tr>
                ))}
                {labourTotal > 0 && (
                  <tr style={{ borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '9px 14px', fontSize: '12px', color: '#6b7280' }}>{validSpares.length + 1}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', color: '#111827', fontStyle: 'italic' }}>Labour Charges</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'center', color: '#374151' }}>1</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right', color: '#374151' }}>{fmt(labourTotal)}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>{fmt(labourTotal)}</td>
                  </tr>
                )}
                {validOthers.map((row, idx) => (
                  <tr key={`o${idx}`} style={{ borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '9px 14px', fontSize: '12px', color: '#6b7280' }}>—</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', color: '#111827', fontStyle: 'italic' }}>{row.description}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right' }}>{fmt(row.amount)}</td>
                    <td style={{ padding: '9px 14px', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>{fmt(row.amount)}</td>
                  </tr>
                ))}
              </>
            )}
            {((invoiceType === 'Service Bill' && validSpares.length === 0 && labourTotal === 0) || (invoiceType === 'Sales Bill' && labourTotal === 0)) && (
              <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No items added</td></tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px', pageBreakInside: 'avoid' }}>
          <div style={{ minWidth: '260px' }}>
            {invoiceType === 'Service Bill' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                  <span style={{ color: '#6b7280' }}>Subtotal</span><span>{fmt(grossTotal)}</span>
                </div>
              </>
            )}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                <span style={{ color: '#6b7280' }}>Discount</span>
                <span style={{ color: '#dc2626' }}>- {fmt(discount)}</span>
              </div>
            )}
            {gstPercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                <span style={{ color: '#6b7280' }}>GST ({gstPercent}%)</span>
                <span>{fmt(gstAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: 'bold', borderTop: '2px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', margin: '4px 0' }}>
              <span>Total Amount</span><span>{fmt(totalBill)}</span>
            </div>
            {paidAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                <span style={{ color: '#6b7280' }}>Paid ({form.paymentMode})</span>
                <span style={{ color: '#16a34a', fontWeight: '600' }}>{fmt(paidAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '17px', fontWeight: 'bold', borderTop: '2px solid #111827', marginTop: '4px' }}>
              <span>Balance Due</span>
              <span style={{ color: balanceDue > 0 ? '#d97706' : '#16a34a' }}>{fmt(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {form.notes && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginBottom: '18px', pageBreakInside: 'avoid' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', marginBottom: '5px' }}>NOTES & TERMS</div>
            <div style={{ color: '#374151', fontSize: '12px' }}>{form.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '2px solid #111827', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pageBreakInside: 'avoid' }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>Thank you for choosing {form.companyName}</div>
            {form.companyPhone && <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>Contact: {form.companyPhone}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ height: '46px', borderBottom: '1px solid #9ca3af', width: '160px', marginBottom: '4px' }}></div>
            <div style={{ color: '#6b7280', fontSize: '11px' }}>Authorized Signature</div>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; max-width: 100% !important;
            margin: 0 !important; padding: 20px !important;
            background: white !important; color: black !important;
            box-shadow: none !important; border: none !important;
          }
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
          @page { size: A4; margin: 10mm; }
        }
        @media screen {
          #invoice-print { border: 1px solid #334155; border-radius: 12px; }
        }
      `}</style>
    </div>
  );
}