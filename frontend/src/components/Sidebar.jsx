import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { path: '/add-customer', label: 'Add Customer', icon: '👤' },
  { path: '/sales', label: 'Sales', icon: '🚗' },
  { path: '/service', label: 'Service', icon: '🔧' },
  { path: '/payments', label: 'Payments', icon: '💳' },
  { path: '/view-customer', label: 'View Customer', icon: '🔍' },
  { path: '/invoice', label: 'Invoice', icon: '🧾' },
  { path: '/invoice-history', label: 'Invoice History', icon: '📂' },
  { path: '/vehicle-stock', label: 'Vehicle Stock', icon: '📦' },
  { path: '/spare-stock', label: 'Spare Stock', icon: '⚙️' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-700 flex flex-col z-50">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-lg">⚡</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">EV Showroom</p>
            <p className="text-emerald-400 text-xs">Management System</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon }) => (
          <NavLink key={path} to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }>
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name || 'User'}</p>
            <p className="text-slate-400 text-xs truncate">{user.email || ''}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}