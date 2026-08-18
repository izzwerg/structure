import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCurrentUser = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error('Помилка завантаження користувача:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const currentRole = user?.role ? String(user.role).trim().toLowerCase() : '';
    const isAdmin = currentRole === 'admin';
    const canMod = currentRole === 'admin' || currentRole === 'moderator';
    const canEdit = currentRole === 'admin' || currentRole === 'moderator' || currentRole === 'editor';
    const isViewer = currentRole === 'viewer';

    return (
        <AuthContext.Provider value={{ user, setUser, loading, isAdmin, canMod, canEdit, isViewer, fetchCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);