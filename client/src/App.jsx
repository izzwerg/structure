import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return <div>Завантаження...</div>;

  if (!user) {
    return <LoginForm onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Вітаємо, {user.name}!</h1>
        <button onClick={handleLogout}>Вийти</button>
      </header>
      <main>
        <p>Ви авторизовані. Тут буде основний функціонал (список людей, створення картки, генерація PDF).</p>
      </main>
    </div>
  );
}