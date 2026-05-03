import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import toast, { Toaster } from 'react-hot-toast';
import { Activity, CheckCircle, LogOut, MapPin, RefreshCw, ShieldCheck, Users, Vote, XCircle } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return { success: false, message: 'Invalid server response' };
  }
};

function useAuth() {
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem('secureVoteAuth') || 'null'));
  const save = (value) => {
    setAuth(value);
    if (value) localStorage.setItem('secureVoteAuth', JSON.stringify(value));
    else localStorage.removeItem('secureVoteAuth');
  };
  return { auth, save };
}

async function api(path, options = {}, token) {
  console.log('[API]', path, options.method || 'GET');
  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    return await safeJson(res);
  } catch (err) {
    console.error('[API error]', err);
    return { success: false, message: 'Service unavailable. Showing safe fallback.', data: null };
  }
}

function Button({ children, busy, ...props }) {
  return <button {...props} disabled={busy || props.disabled}>{busy ? <span className="spinner" /> : children}</button>;
}

function Skeleton() {
  return <div className="skeleton"><span /><span /><span /></div>;
}

function Shell({ auth, onLogout, children }) {
  return (
    <>
      <header>
        <div className="brand"><ShieldCheck />SecureVote</div>
        <div className="session">
          <span>{auth?.email}</span>
          <button className="icon" onClick={onLogout} title="Logout"><LogOut size={18} /></button>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: 'voter@vote.local',
    password: 'Password123!',
    fullName: 'Demo Voter',
    role: 'VOTER',
    zoneId: 'zone-north'
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const path = mode === 'login' ? '/auth/login' : '/auth/register';
    const body = mode === 'login' ? { email: form.email, password: form.password } : form;
    const res = await api(path, { method: 'POST', body: JSON.stringify(body) });
    setLoading(false);
    if (res.success) {
      toast.success(res.message);
      onAuth(res.data);
    } else {
      toast.error(res.message);
    }
  };

  const otp = async () => {
    setLoading(true);
    const res = await api('/auth/otp/send', { method: 'POST', body: JSON.stringify({ email: form.email }) });
    setLoading(false);
    res.success ? toast.success(res.message) : toast.error(res.message);
  };

  return (
    <div className="auth">
      <section className="authPanel">
        <ShieldCheck size={44} />
        <h1>SecureVote</h1>
        <p>Production-style secure voting demo with graceful failure paths.</p>
        <form onSubmit={submit}>
          {mode === 'register' && <input placeholder="Full name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />}
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          {mode === 'register' && <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option>VOTER</option><option>SUPERVISOR</option></select>}
          <Button busy={loading}>{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
        </form>
        <div className="row">
          <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Register' : 'Back to login'}</button>
          <button className="link" onClick={otp}>Send OTP</button>
          <a className="link" href={`${API}/oauth2/authorization/google`}>Google OAuth</a>
        </div>
      </section>
    </div>
  );
}

function Dashboard({ auth, save }) {
  const [me, setMe] = useState(null);
  const [voteData, setVoteData] = useState({ elections: [], candidates: [] });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = auth?.token;

  const load = async () => {
    setLoading(true);
    const [profile, voting, zoneRes] = await Promise.all([
      api('/users/me', {}, token),
      api('/vote/dashboard', {}, token),
      api('/zones', {}, token)
    ]);
    setMe(profile.data);
    setVoteData(voting.data || { elections: [], candidates: [] });
    setZones(zoneRes.data || []);
    if (auth.role === 'ADMIN') {
      const [u, l] = await Promise.all([api('/admin/users', {}, token), api('/admin/audit-logs', {}, token)]);
      setUsers(u.data || []);
      setLogs(l.data || []);
    }
    if (auth.role === 'SUPERVISOR') {
      const u = await api('/supervisor/zone-users', {}, token);
      setUsers(u.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cast = async (electionId, candidateId) => {
    const res = await api('/vote/cast', { method: 'POST', body: JSON.stringify({ electionId, candidateId }) }, token);
    res.success ? toast.success(res.message) : toast.error(res.message);
    load();
  };

  const adminAction = async (path, options = {}) => {
    const res = await api(path, options, token);
    res.success ? toast.success(res.message) : toast.error(res.message);
    load();
  };

  if (loading) return <Shell auth={auth} onLogout={() => save(null)}><Skeleton /></Shell>;

  return (
    <Shell auth={auth} onLogout={() => save(null)}>
      <div className="toolbar">
        <h2>{auth.role} Dashboard</h2>
        <button className="icon" onClick={load} title="Refresh"><RefreshCw size={18} /></button>
      </div>
      <div className="grid">
        <section>
          <h3><Users /> Profile</h3>
          <p>{me?.fullName}</p>
          <div className="badges">
            <span>{me?.isVerified ? 'Verified' : 'Pending'}</span>
            <span>{me?.isActive ? 'Active' : 'Inactive'}</span>
            <span>{me?.hasVoted ? 'Voted' : 'Not voted'}</span>
          </div>
        </section>
        <section>
          <h3><MapPin /> Zone</h3>
          <p>{zones.find(z => z.id === me?.zoneId)?.name || me?.zoneId || 'Unassigned'}</p>
        </section>
      </div>
      {auth.role === 'VOTER' && (
        <section>
          <h3><Vote /> Ballot</h3>
          {voteData.elections.length === 0 && <p className="muted">No active elections for your zone.</p>}
          {voteData.elections.map(el => (
            <div className="ballot" key={el.id}>
              <strong>{el.title}</strong>
              <div>
                {voteData.candidates.filter(c => c.electionId === el.id).map(c => (
                  <button key={c.id} onClick={() => cast(el.id, c.id)} disabled={me?.hasVoted}>{c.name} - {c.party}</button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {['ADMIN', 'SUPERVISOR'].includes(auth.role) && (
        <section>
          <h3><Users /> {auth.role === 'ADMIN' ? 'User Administration' : 'Zone Monitoring'}</h3>
          <div className="table">
            {users.map(u => (
              <div className="tr" key={u.id}>
                <span>{u.fullName}<small>{u.email}</small></span>
                <span>{u.role}</span>
                <span>{u.zoneId}</span>
                {auth.role === 'ADMIN' && (
                  <span className="actions">
                    <button title="Approve" onClick={() => adminAction(`/admin/users/${u.id}/approve`, { method: 'POST' })}><CheckCircle size={16} /></button>
                    <button title="Reject" onClick={() => adminAction(`/admin/users/${u.id}/reject`, { method: 'POST' })}><XCircle size={16} /></button>
                    <button onClick={() => adminAction(`/admin/users/${u.id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !u.isActive }) })}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {auth.role === 'ADMIN' && (
        <section>
          <h3><Activity /> Audit Logs</h3>
          <div className="logs">{logs.slice().reverse().slice(0, 20).map(l => <p key={l.id}><strong>{l.action}</strong> {l.details}</p>)}</div>
        </section>
      )}
    </Shell>
  );
}

function App() {
  const { auth, save } = useAuth();
  return (
    <>
      <Toaster position="top-right" />
      {auth?.token ? <Dashboard auth={auth} save={save} /> : <AuthPage onAuth={save} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
