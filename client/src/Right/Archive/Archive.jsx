import { useState, useEffect } from 'react';
// import './Archive.css';

export default function Archive() {
    const [archivedPersons, setArchivedPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchArchived = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/persons/archived');
            if (!res.ok) throw new Error('Помилка завантаження архівних даних');
            const data = await res.json();
            setArchivedPersons(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchived();
    }, []);

    const handleRestore = async (id) => {
        try {
            const res = await fetch(`/api/persons/${id}/restore`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Помилка при відновленні');
            }

            fetchArchived();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="archive_container">Завантаження...</div>;

    return (
        <div className="archive_container">
            <h2>Архів карток (видалені)</h2>

            {error && <div className="error_message">{error}</div>}

            <div className="archive_list">
                {archivedPersons.length === 0 ? (
                    <p>В архіві немає жодної картки.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Tree Node ID</th>
                                <th>ПІБ</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archivedPersons.map((p) => (
                                <tr key={p._id}>
                                    <td><code>{p.treeNodeId}</code></td>
                                    <td>
                                        <strong>{`${p.lastName} ${p.firstName} ${p.middleName}`.trim()}</strong>
                                    </td>
                                    <td>
                                        <button onClick={() => handleRestore(p._id)} className="btn_restore">
                                            Відновити
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}