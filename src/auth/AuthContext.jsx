import { useEffect, useState } from 'react';
import api from '../api/client.js';
import AuthContext from './authContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, hydrate auth state from the httpOnly cookie via /auth/me.
  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function login(userData) {
    setUser(userData);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
