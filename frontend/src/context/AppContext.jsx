import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user,        setUser]    = useState(null);
  const [sidebarOpen, setSidebar] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('ss_token');
      const savedUser  = localStorage.getItem('ss_user');
      if (savedToken && savedUser) {
        const parsed = JSON.parse(savedUser);
        // Normalize: ensure both _id and id exist
        const normalized = { ...parsed, _id: parsed._id || parsed.id, id: parsed._id || parsed.id };
        setUser(normalized);
      }
    } catch { /* corrupt storage — ignore */ }
    setAuthLoading(false);
  }, []);

  const login = useCallback((userData, jwt) => {
    if (jwt) localStorage.setItem('ss_token', jwt);
    // Normalize ids
    const normalized = { ...userData, _id: userData._id || userData.id, id: userData._id || userData.id };
    setUser(normalized);
    localStorage.setItem('ss_user', JSON.stringify(normalized));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
  }, []);

  const update = useCallback((data) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data, _id: prev._id || prev.id, id: prev._id || prev.id };
      localStorage.setItem('ss_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleSidebar = useCallback(() => setSidebar(p => !p), []);

  return (
    <Ctx.Provider value={{ user, login, logout, update, sidebarOpen, toggleSidebar, authLoading }}>
      {children}
    </Ctx.Provider>
  );
}
