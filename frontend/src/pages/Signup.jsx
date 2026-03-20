import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return setError('Invalid email format');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await signup({ name: form.name, email: form.email, password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">⚡</div>
          <h1 className="text-3xl font-bold text-white">EV Showroom</h1>
          <p className="text-slate-400 mt-1">Create your account</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">Register New Account</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="John Doe" className="input-field" required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="john@example.com" className="input-field" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="Min 6 characters" className="input-field" required />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input name="confirm" type="password" value={form.confirm} onChange={handleChange}
                placeholder="Repeat password" className="input-field" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
