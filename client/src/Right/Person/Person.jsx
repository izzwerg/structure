import { useState, useEffect } from 'react';
import './Person.css';
import Modal from '@mui/material/Modal';

const INITIAL_PERSON_STATE = {
    lastName: '',
    firstName: '',
    middleName: '',
    gender: 'M',
    extraData: {},
};

export default function Person() {
    const [persons, setPersons] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Модалка створення/редагування
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_PERSON_STATE);

    // Модалка підтвердження видалення
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resPersons, resProps] = await Promise.all([
                fetch('/api/persons'),
                fetch('/api/properties'),
            ]);

            if (!resPersons.ok || !resProps.ok) {
                throw new Error('Помилка завантаження даних');
            }

            const personsData = await resPersons.json();
            const propsData = await resProps.json();

            setPersons(personsData);
            setProperties(propsData.filter((p) => p.is_active));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Хендлери для створення/редагування
    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData(INITIAL_PERSON_STATE);
        setOpen(true);
    };

    const handleOpenEdit = (person) => {
        setEditingId(person._id);
        setFormData({
            lastName: person.lastName || '',
            firstName: person.firstName || '',
            middleName: person.middleName || '',
            gender: person.gender || 'M',
            extraData: person.extraData || {},
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingId(null);
        setFormData(INITIAL_PERSON_STATE);
        setError('');
    };

    // Хендлери для видалення
    const handleOpenDelete = (person) => {
        setPersonToDelete(person);
        setDeleteOpen(true);
    };

    const handleCloseDelete = () => {
        setDeleteOpen(false);
        setPersonToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!personToDelete) return;

        try {
            const res = await fetch(`/api/persons/${personToDelete._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Помилка при видаленні');
            }

            handleCloseDelete();
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleMainChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleExtraChange = (propId, value) => {
        setFormData((prev) => ({
            ...prev,
            extraData: {
                ...prev.extraData,
                [propId]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const url = editingId ? `/api/persons/${editingId}` : '/api/persons';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Помилка при збереженні');
            }

            handleClose();
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const renderDynamicInput = (prop) => {
        const value = formData.extraData[prop.property_id] ?? '';

        switch (prop.property_type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleExtraChange(prop.property_id, e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleExtraChange(prop.property_id, e.target.value)}
                        rows={3}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleExtraChange(prop.property_id, e.target.value)}
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={value ? value.substring(0, 10) : ''}
                        onChange={(e) => handleExtraChange(prop.property_id, e.target.value)}
                    />
                );
            case 'boolean':
                return (
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => handleExtraChange(prop.property_id, e.target.checked)}
                    />
                );
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleExtraChange(prop.property_id, e.target.value)}
                    >
                        <option value="">-- Не обрано --</option>
                        {prop.options?.map((opt, i) => (
                            <option key={i} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                );
            default:
                return null;
        }
    };

    if (loading) return <div className="person_container">Завантаження...</div>;

    return (
        <div className="person_container">
            <h2>Картки осіб</h2>

            <button onClick={handleOpenCreate} className="btn_primary">
                Додати картку
            </button>

            {error && <div className="error_message">{error}</div>}

            <div className="persons_list">
                {persons.length === 0 ? (
                    <p>Картки відсутні.</p>
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
                            {persons.map((p) => (
                                <tr key={p._id}>
                                    <td><code>{p.treeNodeId}</code></td>
                                    <td>
                                        <strong>{`${p.lastName} ${p.firstName} ${p.middleName}`.trim()}</strong>
                                    </td>
                                    <td>
                                        <button onClick={() => handleOpenEdit(p)} className="btn_edit">
                                            Редагувати
                                        </button>
                                        <button onClick={() => handleOpenDelete(p)} className="btn_delete">
                                            Видалити
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Модальне вікно Створення / Редагування */}
            <Modal open={open} onClose={handleClose}>
                <div className="modal_content">
                    <form onSubmit={handleSubmit} className="person_form">
                        <h3>{editingId ? 'Редагувати картку' : 'Створити картку особи'}</h3>

                        <div className="form_section">
                            <h4>Основні дані</h4>

                            <div className="form_group">
                                <label>Прізвище:*</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleMainChange}
                                    required
                                />
                            </div>

                            <div className="form_group">
                                <label>Ім'я:*</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleMainChange}
                                    required
                                />
                            </div>

                            <div className="form_group">
                                <label>По батькові:</label>
                                <input
                                    type="text"
                                    name="middleName"
                                    value={formData.middleName}
                                    onChange={handleMainChange}
                                />
                            </div>

                            <div className="form_group">
                                <label>Стать:*</label>
                                <select name="gender" value={formData.gender} onChange={handleMainChange}>
                                    <option value="M">Чоловіча (M)</option>
                                    <option value="F">Жіноча (F)</option>
                                </select>
                            </div>
                        </div>

                        {properties.length > 0 && (
                            <div className="form_section">
                                <h4>Додаткові властивості</h4>
                                {properties.map((prop) => (
                                    <div key={prop._id} className="form_group">
                                        <label>{prop.property_name}:</label>
                                        {renderDynamicInput(prop)}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="form_actions">
                            <button type="submit" className="btn_primary">
                                {editingId ? 'Зберегти' : 'Створити'}
                            </button>
                            <button type="button" onClick={handleClose} className="btn_secondary">
                                Скасувати
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Модальне вікно Підтвердження видалення */}
            <Modal open={deleteOpen} onClose={handleCloseDelete}>
                <div className="modal_content modal_confirm">
                    <h3>Підтвердження видалення</h3>
                    <p>
                        Ви дійсно бажаєте видалити картку особи{' '}
                        <strong>
                            {personToDelete &&
                                `${personToDelete.lastName} ${personToDelete.firstName} ${personToDelete.middleName}`.trim()}
                        </strong>
                        ?
                    </p>
                    <div className="form_actions">
                        <button onClick={handleConfirmDelete} className="btn_danger">
                            Так, видалити
                        </button>
                        <button onClick={handleCloseDelete} className="btn_secondary">
                            Скасувати
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}