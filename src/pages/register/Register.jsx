import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../api/client.js';
import { useAuth } from '../../auth/useAuth.js';
import '../login/Login.css';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
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
      const res = await api.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      // Same as Login: hydrate context before navigating, or
      // ProtectedRoute bounces the fresh session back to /login.
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
        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-sub">Start listing what you can teach and what you want to learn.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-field">
            <span>Full name</span>
            <input
              type="text"
              value={form.fullName}
              onChange={update('fullName')}
              placeholder="Your name"
              required
            />
          </label>
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
              placeholder="Create a password"
              required
              minLength={8}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Creating account…' : 'Get started'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
