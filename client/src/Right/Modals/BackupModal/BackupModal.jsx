import { useState } from 'react';
import Modal from '@mui/material/Modal';

export default function BackupModal({ open, onClose, onRestoreSuccess }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    // Створення та завантаження бекапу
    const handleCreateBackup = () => {
        window.location.href = '/api/backup/export';
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError('');
        }
    };

    // Запуск відновлення (після підтвердження)
    const handleConfirmRestore = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        setStatusMessage('Відновлення даних...');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const res = await fetch('/api/backup/restore', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Помилка відновлення');

            setStatusMessage('Дані успішно відновлено!');
            setConfirmOpen(false);
            setSelectedFile(null);

            setTimeout(() => {
                setStatusMessage('');
                onClose();
                if (onRestoreSuccess) onRestoreSuccess();
            }, 1500);
        } catch (err) {
            setError(err.message);
            setStatusMessage('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal open={open} onClose={onClose}>
                <div className="modal_content" style={{ maxWidth: '480px' }}>
                    <h3>Резервне копіювання даних</h3>

                    {error && <div className="error_message">{error}</div>}
                    {statusMessage && <div className="success_message" style={{ color: 'green', marginBottom: '1rem' }}>{statusMessage}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1.5rem 0' }}>
                        {/* Блок створення */}
                        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '6px' }}>
                            <h4>Створити резервну копію</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0 1rem 0' }}>
                                Завантажити повний архів бази даних у JSON-файл для збереження або перенесення.
                            </p>
                            <button type="button" onClick={handleCreateBackup} className="btn_primary">
                                Створити бекап
                            </button>
                        </div>

                        {/* Блок розгортання */}
                        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '6px' }}>
                            <h4>Розгорнути з бекапу</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0 1rem 0' }}>
                                Оберіть раніше завантажений JSON-файл бекапу для відновлення системи.
                            </p>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                style={{ marginBottom: '1rem', display: 'block' }}
                            />
                            <button
                                type="button"
                                className="btn_danger"
                                disabled={!selectedFile || loading}
                                onClick={() => setConfirmOpen(true)}
                            >
                                Розгорнути з бекапу
                            </button>
                        </div>
                    </div>

                    <div className="form_actions">
                        <button type="button" onClick={onClose} className="btn_secondary" disabled={loading}>
                            Закрити
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Модалка підтвердження розгортання */}
            <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <div className="modal_content modal_confirm" style={{ maxWidth: '420px' }}>
                    <h3 style={{ color: '#dc3545' }}>УВАГА! Незворотна дія</h3>
                    <p>
                        Ви дійсно бажаєте розгорнути базу з файлу <strong>{selectedFile?.name}</strong>?
                    </p>
                    <p style={{ fontWeight: 'bold', color: '#bd2130' }}>
                        Всі поточні дані в системі будуть повністю видалені та замінені даними з бекапу!
                    </p>
                    <div className="form_actions" style={{ marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={handleConfirmRestore}
                            className="btn_danger"
                            disabled={loading}
                        >
                            {loading ? 'Відновлення...' : 'Так, замінити всі дані'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(false)}
                            className="btn_secondary"
                            disabled={loading}
                        >
                            Скасувати
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}