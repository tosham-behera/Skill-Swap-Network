import { Link } from 'react-router-dom';
import './Login.css';

function Login() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">SkillBridge</Link>
        <h1 className="auth-heading">Log in to your account</h1>
        <p className="auth-sub">Pick up your skill exchanges where you left off.</p>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-field">
            <span>Email</span>
            <input type="email" placeholder="you@college.edu" />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input type="password" placeholder="Enter your password" />
          </label>
          <button type="submit" className="auth-submit">Log in</button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Get started</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
