import { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import CreateUserModal from './CreateUserModal';

export default function UserManagementModal({ open, onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createUserOpen, setCreateUserOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Помилка завантаження користувачів');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchUsers();
    }, [open]);

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Ви дійсно бажаєте видалити користувача "${userName}"?`)) return;
        try {
            const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Помилка видалення');
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <Modal open={open} onClose={onClose}>
                <div className="modal_content" style={{ maxWidth: '700px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Управління користувачами</h3>
                        <button
                            type="button"
                            className="btn_primary"
                            onClick={() => setCreateUserOpen(true)}
                        >
                            <img src="user-plus.svg" alt="Додати користувача" className="icon" />
                        </button>
                    </div>

                    {error && <div className="error_message">{error}</div>}

                    {loading ? (
                        <p>Завантаження...</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Ім'я</th>
                                    <th style={{ padding: '0.5rem' }}>Логін</th>
                                    <th style={{ padding: '0.5rem' }}>Рівень прав</th>
                                    <th style={{ padding: '0.5rem' }}>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.5rem' }}><strong>{u.name}</strong></td>
                                        <td style={{ padding: '0.5rem', color: '#555' }}><code>{u.login}</code></td>
                                        <td style={{ padding: '0.5rem' }}><strong>{u.role}</strong></td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <button
                                                type="button"
                                                className="btn_danger"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                                                onClick={() => handleDeleteUser(u._id, u.name)}
                                            >
                                                Видалити
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div className="form_actions">
                        <button type="button" onClick={onClose} className="btn_secondary">
                            Закрити
                        </button>
                    </div>
                </div>
            </Modal>

            <CreateUserModal
                open={createUserOpen}
                onClose={() => setCreateUserOpen(false)}
                onUserCreated={fetchUsers}
            />
        </>
    );
}