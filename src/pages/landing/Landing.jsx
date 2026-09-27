import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import './Landing.css';

function Landing() {
  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">SkillBridge</Link>
          <nav className="nav-links">
            <a href="#how-it-works" onClick={scrollTo('how-it-works')}>How it works</a>
            <a href="#why-skillbridge" onClick={scrollTo('why-skillbridge')}>Why SkillBridge</a>
          </nav>
          <div className="nav-actions">
            <Link to="/login" className="btn-text">Log in</Link>
            <Link to="/register" className="btn-solid btn-small">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="hero-content">
            <p className="label"><span className="label-mark" />Student skill exchange</p>
            <h1 className="hero-heading">
              Learn what you need.
              <br />
              Teach what you know.
            </h1>
            <p className="hero-sub">
              SkillBridge connects students who want to exchange knowledge through
              verified skills, structured sessions, and meaningful peer learning.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-solid">Find your skill match</Link>
              <a href="#how-it-works" className="btn-outline" onClick={scrollTo('how-it-works')}>
                See how it works
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="match-card">
              <div className="match-card-top">
                <span className="match-card-label">Suggested match</span>
                <span className="match-percent">92% match</span>
              </div>

              <div className="match-person">
                <div className="match-avatar">AR</div>
                <div>
                  <p className="match-name">Arjun Rao</p>
                  <p className="match-skills">React &middot; UI Design</p>
                </div>
              </div>

              <div className="match-exchange">
                <div className="match-exchange-col">
                  <span className="match-exchange-label">You learn</span>
                  <span className="match-exchange-skill">React</span>
                </div>
                <span className="match-exchange-arrow">&#8596;</span>
                <div className="match-exchange-col match-exchange-col-right">
                  <span className="match-exchange-label">You teach</span>
                  <span className="match-exchange-skill">Java</span>
                </div>
              </div>

              <div className="match-verified">
                <Check size={15} strokeWidth={2.5} />
                Skill verified
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="section how-it-works">
          <div className="section-head">
            <p className="label"><span className="label-mark" />How it works</p>
            <h2 className="section-heading">
              From skill discovery to
              <br />
              completed exchange.
            </h2>
          </div>

          <ol className="steps">
            <li className="step">
              <span className="step-number">01</span>
              <h3 className="step-title">Build your profile</h3>
              <p className="step-desc">
                Tell the community what you can teach and what you want to learn.
              </p>
            </li>
            <li className="step">
              <span className="step-number">02</span>
              <h3 className="step-title">Verify your skills</h3>
              <p className="step-desc">
                Complete short assessments so your matches know what you actually understand.
              </p>
            </li>
            <li className="step">
              <span className="step-number">03</span>
              <h3 className="step-title">Exchange &amp; grow</h3>
              <p className="step-desc">
                Schedule sessions, learn together, track progress, and build your reputation.
              </p>
            </li>
          </ol>
        </section>

        {/* WHY SKILLBRIDGE */}
        <section id="why-skillbridge" className="section why">
          <div className="section-head">
            <p className="label"><span className="label-mark" />Why SkillBridge</p>
            <h2 className="section-heading">
              More than a student
              <br />
              networking platform.
            </h2>
          </div>

          <div className="why-grid">
            <div className="why-item">
              <h3 className="why-title">Verified skills</h3>
              <p className="why-desc">
                Skills aren&apos;t simply self-declared. Students can demonstrate their
                knowledge through assessments.
              </p>
            </div>
            <div className="why-item">
              <h3 className="why-title">Structured sessions</h3>
              <p className="why-desc">
                Exchanges have defined goals, time slots, attendance, and completion status.
              </p>
            </div>
            <div className="why-item">
              <h3 className="why-title">Reputation that matters</h3>
              <p className="why-desc">
                Ratings, attendance, and completed exchanges help build a reliable
                learning community.
              </p>
            </div>
          </div>
        </section>

        {/* EXCHANGE SHOWCASE */}
        <section className="section exchange">
          <h2 className="exchange-heading">
            Learn from someone.
            <br />
            Teach someone.
          </h2>

          <div className="exchange-diagram">
            <div className="exchange-side">
              <span className="exchange-side-label">You</span>
              <div className="exchange-side-row">
                <span className="exchange-side-key">Want to learn</span>
                <span className="exchange-side-val">React</span>
              </div>
              <div className="exchange-side-row">
                <span className="exchange-side-key">Can teach</span>
                <span className="exchange-side-val">Java</span>
              </div>
            </div>

            <span className="exchange-center">Exchange</span>

            <div className="exchange-side">
              <span className="exchange-side-label">Other student</span>
              <div className="exchange-side-row">
                <span className="exchange-side-key">Want to learn</span>
                <span className="exchange-side-val">Java</span>
              </div>
              <div className="exchange-side-row">
                <span className="exchange-side-key">Can teach</span>
                <span className="exchange-side-val">React</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section cta">
          <h2 className="cta-heading">Your next skill could come from your next classmate.</h2>
          <Link to="/register" className="btn-solid">Get started</Link>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <p className="footer-logo">SkillBridge</p>
            <p className="footer-tag">Learn together. Grow together.</p>
          </div>
          <div className="footer-links">
            <a href="#how-it-works" onClick={scrollTo('how-it-works')}>How it works</a>
            <a href="#why-skillbridge" onClick={scrollTo('why-skillbridge')}>Why SkillBridge</a>
            <Link to="/login">Log in</Link>
            <Link to="/register">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
