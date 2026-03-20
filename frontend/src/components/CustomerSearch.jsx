import React, { useState, useRef, useEffect } from 'react';
import { searchCustomers } from '../api';

export default function CustomerSearch({ onSelect, placeholder = 'Search customer...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchCustomers(query);
        setResults(data);
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (customer) => {
    setQuery(customer.name);
    setOpen(false);
    onSelect(customer);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input-field pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-2xl max-h-52 overflow-y-auto">
          {results.map((c) => (
            <li
              key={c._id}
              onClick={() => handleSelect(c)}
              className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
            >
              <p className="text-white text-sm font-medium">{c.name}</p>
              <p className="text-slate-400 text-xs">{c.phone} {c.email ? `· ${c.email}` : ''}</p>
            </li>
          ))}
        </ul>
      )}
      {open && query && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 px-4 py-3 text-slate-400 text-sm">
          No customers found for "{query}"
        </div>
      )}
    </div>
  );
}
