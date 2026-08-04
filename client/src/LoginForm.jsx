import { useState } from 'react';

export default function LoginForm({ onLoginSuccess }) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Помилка входу');
            }

            onLoginSuccess(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <h2>Вхід у систему</h2>
                {error && <div style={styles.error}>{error}</div>}

                <div style={styles.field}>
                    <label>Логін:</label>
                    <input
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>

                <div style={styles.field}>
                    <label>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Увійти...' : 'Увійти'}
                </button>
            </form>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' },
    card: { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    field: { marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' },
    button: { width: '100%', padding: '0.7rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', marginBottom: '1rem', fontSize: '0.9rem' },
};