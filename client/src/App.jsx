import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import Left from './Left/Left.jsx'
import Right from './Right/Right.jsx'

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [navState, setNavState] = useState(false)
  const [page, setPage] = useState('tree')

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
    <>
      <div className='app_container'>
        <Left
          isNavOpen={navState}
          setIsNavOpen={setNavState}
          page={page}
          setPage={setPage}
          handleLogout={handleLogout}
        />
        <Right page={page} />
      </div>
    </>
  );
}