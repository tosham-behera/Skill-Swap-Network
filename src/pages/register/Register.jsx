import { Link } from 'react-router-dom';
import '../login/Login.css';

function Register() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">SkillBridge</Link>
        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-sub">Start listing what you can teach and what you want to learn.</p>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-field">
            <span>Full name</span>
            <input type="text" placeholder="Your name" />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input type="email" placeholder="you@college.edu" />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input type="password" placeholder="Create a password" />
          </label>
          <button type="submit" className="auth-submit">Get started</button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
