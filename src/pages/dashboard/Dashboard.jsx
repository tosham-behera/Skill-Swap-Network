import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, LogOut, Plus, RefreshCw } from 'lucide-react';
import api, { getApiErrorMessage } from '../../api/client.js';
import { useAuth } from '../../auth/useAuth.js';
import '../landing/Landing.css';
import './Dashboard.css';

function initialAddForm(type) {
  return { value: '', type };
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState([]);
  const [mySkills, setMySkills] = useState({ teach: [], wanted: [] });
  const [matches, setMatches] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  const [teachForm, setTeachForm] = useState(initialAddForm('teach'));
  const [wantedForm, setWantedForm] = useState(initialAddForm('wanted'));
  const [saving, setSaving] = useState({ teach: false, wanted: false });
  const [sectionError, setSectionError] = useState('');
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const [respondingId, setRespondingId] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const refreshRequests = useCallback(async () => {
    const res = await api.get('/swap-requests');
    setRequests({ incoming: res.data.incoming ?? [], outgoing: res.data.outgoing ?? [] });
  }, []);

  const refreshMatches = useCallback(async () => {
    const res = await api.get('/matches');
    setMatches(res.data.matches ?? []);
  }, []);

  // Initial load: catalog + my skills, then matches + requests.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [skillsRes, myRes] = await Promise.all([
          api.get('/skills'),
          api.get('/users/me/skills'),
        ]);
        if (cancelled) return;
        setCatalog(skillsRes.data.skills ?? []);
        setMySkills({ teach: myRes.data.teach ?? [], wanted: myRes.data.wanted ?? [] });
        await Promise.all([refreshMatches(), refreshRequests()]);
      } catch (err) {
        if (!cancelled) setDataError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMatches, refreshRequests]);

  function clearTransient() {
    setSectionError('');
    setNotice('');
  }

  async function handleAddSkill(type, form, setForm) {
    clearTransient();
    const value = form.value.trim();
    if (!value) return;
    setSaving((s) => ({ ...s, [type]: true }));
    try {
      const body = Number.isInteger(Number(value)) && Number(value) > 0
        ? { type, skillId: Number(value) }
        : { type, name: value };
      const res = await api.post('/users/me/skills', body);
      setMySkills({ teach: res.data.teach ?? [], wanted: res.data.wanted ?? [] });
      setForm(initialAddForm(type));
      setNotice(`Skill added.`);
    } catch (err) {
      setSectionError(getApiErrorMessage(err));
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  }

  async function handleSendRequest(match, pair) {
    clearTransient();
    setRequestError('');
    try {
      await api.post('/swap-requests', {
        recipientId: match.user.id,
        skillRequesterTeaches: pair.youTeach.id,
        skillRecipientTeaches: pair.youLearn.id,
      });
      setNotice(`Swap request sent to ${match.user.fullName}.`);
      await Promise.all([refreshRequests(), refreshMatches()]);
    } catch (err) {
      setRequestError(getApiErrorMessage(err));
    }
  }

  async function handleRespond(requestId, status) {
    clearTransient();
    setRequestError('');
    setRespondingId(requestId);
    try {
      await api.patch(`/swap-requests/${requestId}`, { status });
      setNotice(`Request ${status}.`);
      await Promise.all([refreshRequests(), refreshMatches()]);
    } catch (err) {
      setRequestError(getApiErrorMessage(err));
    } finally {
      setRespondingId(null);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout(); // calls POST /auth/logout then clears client state
      navigate('/login');
    } catch {
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  }

  const hasTeachSkills = mySkills.teach.length > 0;
  const hasWantedSkills = mySkills.wanted.length > 0;

  return (
    <div className="dashboard">
      {/* NAV */}
      <header className="dash-nav">
        <div className="dash-nav-inner">
          <Link to="/dashboard" className="nav-logo">SkillBridge</Link>
          <div className="dash-nav-actions">
            <span className="dash-user-chip" title={user?.email}>
              {user?.fullName ?? 'Student'}
            </span>
            <button
              type="button"
              className="btn-outline btn-small"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={14} strokeWidth={2} />
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
          {user && <span className="sr-only">Logged in as {user.email}</span>}
        </div>
      </header>

      <main className="dash-main">
        {/* Skill name suggestions for the add-skill inputs */}
        <datalist id="skill-suggestions">
          {catalog.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>

        <section className="dash-hero">
          <p className="label"><span className="label-mark" />Your dashboard</p>
          <h1 className="dash-heading">Welcome back, {user?.fullName ?? 'Student'}.</h1>
          <p className="dash-sub">
            Manage what you teach, what you want to learn, and your active exchanges.
          </p>
        </section>

        {(sectionError || requestError || dataError) && (
          <div className="dash-banner dash-banner-error" role="alert">
            {dataError || sectionError || requestError}
          </div>
        )}
        {notice && (
          <div className="dash-banner dash-banner-ok" role="status">
            {notice}
          </div>
        )}

        <div className="dash-grid">
          {/* MY SKILLS */}
          <section className="dash-card">
            <div className="dash-card-head">
              <h2 className="dash-card-title">Skills I teach</h2>
            </div>
            {loadingData ? (
              <p className="dash-muted">Loading…</p>
            ) : hasTeachSkills ? (
              <ul className="skill-chip-list">
                {mySkills.teach.map((s) => (
                  <li key={s.id} className="skill-chip skill-chip-teach">{s.name}</li>
                ))}
              </ul>
            ) : (
              <p className="dash-muted">No teaching skills yet — add one below so others can find you.</p>
            )}

            <form
              className="dash-add-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSkill('teach', teachForm, setTeachForm);
              }}
            >
              <input
                type="text"
                value={teachForm.value}
                onChange={(e) => setTeachForm({ ...teachForm, value: e.target.value })}
                placeholder="e.g. React, SQL, Public Speaking…"
                aria-label="Add a skill you can teach"
                maxLength={80}
                list="skill-suggestions"
              />
              <button type="submit" className="btn-solid btn-small" disabled={saving.teach} aria-busy={saving.teach}>
                <Plus size={14} strokeWidth={2.5} />
                Add
              </button>
            </form>
          </section>

          {/* WANT TO LEARN */}
          <section className="dash-card">
            <div className="dash-card-head">
              <h2 className="dash-card-title">Skills I want to learn</h2>
            </div>
            {loadingData ? (
              <p className="dash-muted">Loading…</p>
            ) : hasWantedSkills ? (
              <ul className="skill-chip-list">
                {mySkills.wanted.map((s) => (
                  <li key={s.id} className="skill-chip skill-chip-wanted">{s.name}</li>
                ))}
              </ul>
            ) : (
              <p className="dash-muted">No learning goals yet — add one to unlock matches.</p>
            )}

            <form
              className="dash-add-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSkill('wanted', wantedForm, setWantedForm);
              }}
            >
              <input
                type="text"
                value={wantedForm.value}
                onChange={(e) => setWantedForm({ ...wantedForm, value: e.target.value })}
                placeholder="e.g. Python, UI Design…"
                aria-label="Add a skill you want to learn"
                maxLength={80}
                list="skill-suggestions"
              />
              <button type="submit" className="btn-solid btn-small" disabled={saving.wanted} aria-busy={saving.wanted}>
                <Plus size={14} strokeWidth={2.5} />
                Add
              </button>
            </form>
          </section>

          {/* MATCHES */}
          <section className="dash-card dash-card-wide">
            <div className="dash-card-head">
              <h2 className="dash-card-title">Available skill matches</h2>
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  clearTransient();
                  refreshMatches().catch((err) => setRequestError(getApiErrorMessage(err)));
                }}
              >
                <RefreshCw size={13} strokeWidth={2} />
                Refresh
              </button>
            </div>

            {loadingData ? (
              <p className="dash-muted">Loading…</p>
            ) : matches.length === 0 ? (
              <p className="dash-muted">
                No two-way matches yet. Add a skill you teach and one you want to learn —
                matches appear when another student wants exactly that exchange.
              </p>
            ) : (
              <ul className="match-list">
                {matches.map((m) => (
                  <li key={m.user.id} className="match-item">
                    <div className="match-item-head">
                      <span className="match-avatar">{getInitials(m.user.fullName)}</span>
                      <div>
                        <p className="match-item-name">{m.user.fullName}</p>
                        <p className="match-item-sub">{m.user.email}</p>
                      </div>
                    </div>
                    <ul className="pair-list">
                      {m.pairs.map((p) => (
                        <li key={`${p.youLearn.id}-${p.youTeach.id}`} className="pair-row">
                          <span className="pair-col">
                            <span className="pair-label">You learn</span>
                            <span className="pair-skill">{p.youLearn.name}</span>
                          </span>
                          <span className="pair-arrow">&#8596;</span>
                          <span className="pair-col pair-col-right">
                            <span className="pair-label">You teach</span>
                            <span className="pair-skill">{p.youTeach.name}</span>
                          </span>
                          <button
                            type="button"
                            className="btn-solid btn-small"
                            onClick={() => handleSendRequest(m, p)}
                          >
                            Request swap
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* SWAP REQUESTS */}
          <section className="dash-card dash-card-wide">
            <div className="dash-card-head">
              <h2 className="dash-card-title">Swap requests</h2>
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  clearTransient();
                  refreshRequests().catch((err) => setRequestError(getApiErrorMessage(err)));
                }}
              >
                <RefreshCw size={13} strokeWidth={2} />
                Refresh
              </button>
            </div>

            {loadingData ? (
              <p className="dash-muted">Loading…</p>
            ) : (
              <div className="requests-grid">
                <div>
                  <h3 className="requests-col-title">Incoming</h3>
                  {requests.incoming.length === 0 ? (
                    <p className="dash-muted">No incoming requests.</p>
                  ) : (
                    <ul className="request-list">
                      {requests.incoming.map((r) => (
                        <li key={r.id} className="request-item">
                          <p className="request-line">
                            <strong>{r.requester.fullName}</strong> wants to exchange{' '}
                            <span className="pill pill-teach">{r.skillRequesterTeaches.name}</span> for{' '}
                            <span className="pill pill-wanted">{r.skillRecipientTeaches.name}</span>
                          </p>
                          {r.status === 'pending' ? (
                            <div className="request-actions">
                              <button
                                type="button"
                                className="btn-solid btn-small"
                                disabled={respondingId === r.id}
                                onClick={() => handleRespond(r.id, 'accepted')}
                              >
                                <Check size={13} strokeWidth={2.5} />
                                Accept
                              </button>
                              <button
                                type="button"
                                className="btn-outline btn-small"
                                disabled={respondingId === r.id}
                                onClick={() => handleRespond(r.id, 'declined')}
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className={`status-badge status-${r.status}`}>{r.status}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="requests-col-title">Outgoing</h3>
                  {requests.outgoing.length === 0 ? (
                    <p className="dash-muted">No outgoing requests.</p>
                  ) : (
                    <ul className="request-list">
                      {requests.outgoing.map((r) => (
                        <li key={r.id} className="request-item">
                          <p className="request-line">
                            You asked <strong>{r.recipient.fullName}</strong> to exchange{' '}
                            <span className="pill pill-teach">{r.skillRequesterTeaches.name}</span> for{' '}
                            <span className="pill pill-wanted">{r.skillRecipientTeaches.name}</span>
                          </p>
                          <span className={`status-badge status-${r.status}`}>{r.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function getInitials(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
