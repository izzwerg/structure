import { useState } from 'react';
import Modal from '@mui/material/Modal';

export default function CreateUserModal({ open, onClose, onUserCreated }) {
    const [login, setLogin] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('editor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, name, password, role }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Помилка створення користувача');

            setLogin('');
            setName('');
            setPassword('');
            setRole('editor');
            onUserCreated();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="modal_content" style={{ maxWidth: '400px' }}>
                <h3>Створити користувача</h3>

                {error && <div className="error_message">{error}</div>}

                <form onSubmit={handleSubmit} className="property_form">
                    <div className="form_group">
                        <label>Логін:*</label>
                        <input
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form_group">
                        <label>Ім'я (ПІБ / Відображуване ім'я):*</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form_group">
                        <label>Пароль:*</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form_group">
                        <label>Рівень прав:*</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="viewer">Переглядач (Тільки перегляд)</option>
                            <option value="moderator">Модератор (Внесення та редагування даних)</option>
                            <option value="editor">Редактор (Внесення даних)</option>
                            <option value="admin">Адміністратор (Повний доступ)</option>
                        </select>
                    </div>

                    <div className="form_actions">
                        <button type="submit" className="btn_primary" disabled={loading}>
                            Створити
                        </button>
                        <button type="button" onClick={onClose} className="btn_secondary" disabled={loading}>
                            Скасувати
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}