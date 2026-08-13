import { useState, useEffect } from 'react';
import './Archive.css';
import PersonView from '../Modals/PersonView/PersonView';

export default function Archive() {
    const [archivedPersons, setArchivedPersons] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Модалка перегляду
    const [viewOpen, setViewOpen] = useState(false);
    const [personToView, setPersonToView] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const filteredPersons = archivedPersons.filter((p) => {
        const fullName = `${p.lastName} ${p.firstName} ${p.middleName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resArchived, resProps] = await Promise.all([
                fetch('/api/persons/archived'),
                fetch('/api/properties'),
            ]);

            if (!resArchived.ok || !resProps.ok) {
                throw new Error('Помилка завантаження даних');
            }

            const archivedData = await resArchived.json();
            const propsData = await resProps.json();

            setArchivedPersons(archivedData);
            setProperties(propsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenView = (person) => {
        setPersonToView(person);
        setViewOpen(true);
    };

    const handleCloseView = () => {
        setViewOpen(false);
        setPersonToView(null);
    };

    const handleRestore = async (id) => {
        try {
            const res = await fetch(`/api/persons/${id}/restore`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Помилка при відновленні');
            }

            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="archive_container">Завантаження...</div>;

    return (
        <div className="archive_container">
            <h2>Архів карток (видалені)</h2>
            <div className="person_filters">
                <input
                    type="text"
                    placeholder="Пошук за ПІБ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {error && <div className="error_message">{error}</div>}

            <div className="archive_list">
                {filteredPersons.length === 0 ? (
                    <p>В архіві немає жодної картки.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>ПІБ</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPersons.map((p) => (
                                <tr key={p._id}>
                                    <td>
                                        <strong>{`${p.lastName} ${p.firstName} ${p.middleName}`.trim()}</strong>
                                    </td>
                                    <td>
                                        <button onClick={() => handleOpenView(p)} className="btn_view">
                                            Перегляд
                                        </button>
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

            {/* Модальне вікно Перегляду */}
            <PersonView
                open={viewOpen}
                onClose={handleCloseView}
                person={personToView}
                properties={properties}
            />
        </div>
    );
}