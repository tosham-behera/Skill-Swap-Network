import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../api/client.js';
import { useAuth } from '../../auth/useAuth.js';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => {
      setForm({ ...form, [field]: e.target.value });
      if (error) setError('');
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });
      // Store the user in context BEFORE navigating, otherwise
      // ProtectedRoute sees user === null and bounces back to /login.
      login(res.data?.user ?? null);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">SkillBridge</Link>
        <h1 className="auth-heading">Log in to your account</h1>
        <p className="auth-sub">Pick up your skill exchanges where you left off.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@college.edu"
              required
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="Enter your password"
              required
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Get started</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
