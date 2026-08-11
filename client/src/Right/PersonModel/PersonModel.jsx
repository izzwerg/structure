import { useState, useEffect } from 'react';
import './PersonModel.css';
import Modal from '@mui/material/Modal';

const PROPERTY_TYPES = [
    { value: 'text', label: 'Текст (однорядковий)' },
    { value: 'textarea', label: 'Текстове поле (багаторядкове)' },
    { value: 'number', label: 'Число' },
    { value: 'date', label: 'Дата' },
    { value: 'boolean', label: 'Перемикач (так/ні)' },
    { value: 'select', label: 'Вибір зі списку' },
];

const INITIAL_FORM_STATE = {
    property_id: '',
    property_name: '',
    property_type: 'text',
    optionsString: '', // Рядок варіантів, розділених комами (для select)
    category: 'Загальне',
    order: 0,
    is_active: true,
};

export default function PersonModel() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Завантаження списку властивостей
    const fetchProperties = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/properties');
            if (!res.ok) throw new Error('Помилка завантаження властивостей');
            const data = await res.json();
            setProperties(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    // Обробка зміни полів форми
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Початок редагування існуючої властивості
    const handleEdit = (prop) => {
        setEditingId(prop._id);
        setFormData({
            property_id: prop.property_id,
            property_name: prop.property_name,
            property_type: prop.property_type,
            optionsString: prop.options ? prop.options.join(', ') : '',
            category: prop.category || 'Загальне',
            order: prop.order || 0,
            is_active: prop.is_active,
        });
    };

    // Скидання формы
    const handleCancel = () => {
        setEditingId(null);
        setFormData(INITIAL_FORM_STATE);
        setError('');
    };

    // Збереження (Створення або Оновлення)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Формуємо масив options, якщо обрано тип 'select'
        const optionsArray = formData.property_type === 'select'
            ? formData.optionsString.split(',').map((item) => item.trim()).filter(Boolean)
            : [];

        const payload = {
            property_id: formData.property_id,
            property_name: formData.property_name,
            property_type: formData.property_type,
            options: optionsArray,
            category: formData.category,
            order: Number(formData.order),
            is_active: formData.is_active,
        };

        try {
            const url = editingId ? `/api/properties/${editingId}` : '/api/properties';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Помилка при збереженні');
            }

            handleCancel();
            fetchProperties();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="person_model_container">Завантаження...</div>;

    return (
        <div className="person_model_container">
            <h2>Управління додатковими властивостями</h2>

            {error && <div className="error_message">{error}</div>}

            <div className="model_workspace">
                {/* Форма створення/редагування */}
                <form onSubmit={handleSubmit} className="property_form">
                    <h3>{editingId ? 'Редагувати властивість' : 'Створити нову властивість'}</h3>

                    <div className="form_group">
                        <label>Назва для відображення:</label>
                        <input
                            type="text"
                            name="property_name"
                            value={formData.property_name}
                            onChange={handleChange}
                            placeholder="наприклад, ІНН"
                            required
                        />
                    </div>

                    <div className="form_group">
                        <label>Унікальний ID (property_id):</label>
                        <input
                            type="text"
                            name="property_id"
                            value={formData.property_id}
                            onChange={handleChange}
                            placeholder="наприклад, inn"
                            disabled={!!editingId} // ID краще блокувати при редагуванні
                            required
                        />
                    </div>

                    <div className="form_group">
                        <label>Тип поля:</label>
                        <select
                            name="property_type"
                            value={formData.property_type}
                            onChange={handleChange}
                        >
                            {PROPERTY_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.property_type === 'select' && (
                        <div className="form_group">
                            <label>Варіанти (через кому):</label>
                            <input
                                type="text"
                                name="optionsString"
                                value={formData.optionsString}
                                onChange={handleChange}
                                placeholder="I+, II+, III+, IV+"
                                required
                            />
                        </div>
                    )}

                    <div className="form_group">
                        <label>Категорія:</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form_group">
                        <label>Порядок сортування (order):</label>
                        <input
                            type="number"
                            name="order"
                            value={formData.order}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form_group checkbox_group">
                        <label>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                            Активна властивість
                        </label>
                    </div>

                    <div className="form_actions">
                        <button type="submit" className="btn_primary">
                            {editingId ? 'Оновити' : 'Створити'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancel} className="btn_secondary">
                                Скасувати
                            </button>
                        )}
                    </div>
                </form>

                {/* Таблиця/список існуючих властивостей */}
                <button onClick={handleOpen} className="btn_primary">
                    Відкрити модальне вікно
                </button>
                <div className="properties_list">
                    <h3>Існуючі властивості ({properties.length})</h3>
                    {properties.length === 0 ? (
                        <p>Властивостей поки немає.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Назва</th>
                                    <th>ID</th>
                                    <th>Тип</th>
                                    <th>Категорія</th>
                                    <th>Статус</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {properties.map((prop) => (
                                    <tr key={prop._id} className={!prop.is_active ? 'inactive_row' : ''}>
                                        <td>{prop.order}</td>
                                        <td><strong>{prop.property_name}</strong></td>
                                        <td><code>{prop.property_id}</code></td>
                                        <td>{prop.property_type}</td>
                                        <td>{prop.category}</td>
                                        <td>{prop.is_active ? 'Активна' : 'В архіві'}</td>
                                        <td>
                                            <button onClick={() => handleEdit(prop)} className="btn_edit">
                                                Редагувати
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <Modal
                open={open}
                onClose={handleClose}
            >
                <div className="modal_content">
                    <h2>Modal Title</h2>
                    <p>Modal content goes here.</p>
                </div>
            </Modal>
        </div>
    );
}