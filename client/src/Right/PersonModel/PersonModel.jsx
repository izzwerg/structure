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
    optionsString: '',
    category: 'Загальне',
    order: 0,
    is_active: true,
};

export default function PersonModel() {
    const [properties, setProperties] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Форма властивості
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [open, setOpen] = useState(false);

    // Форма створення категорії
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryOrder, setNewCategoryOrder] = useState(0);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resProps, resCats] = await Promise.all([
                fetch('/api/properties'),
                fetch('/api/categories'),
            ]);

            if (!resProps.ok || !resCats.ok) {
                throw new Error('Помилка завантаження даних');
            }

            const propsData = await resProps.json();
            const catsData = await resCats.json();

            setProperties(propsData);
            setCategories(catsData);

            // Якщо є категорії, ставимо першу як дефолтну у формі
            if (catsData.length > 0 && !formData.category) {
                setFormData((prev) => ({ ...prev, category: catsData[0].name }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        handleCancel();
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleEdit = (prop) => {
        setEditingId(prop._id);
        setFormData({
            property_id: prop.property_id,
            property_name: prop.property_name,
            property_type: prop.property_type,
            optionsString: prop.options ? prop.options.join(', ') : '',
            category: prop.category || (categories[0]?.name ?? 'Загальне'),
            order: prop.order || 0,
            is_active: prop.is_active,
        });
        setOpen(true);
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            ...INITIAL_FORM_STATE,
            category: categories[0]?.name || 'Загальне',
        });
        setError('');
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

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
            if (!res.ok) throw new Error(data.message || 'Помилка при збереженні');

            handleCancel();
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Створення нової категорії
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName, order: Number(newCategoryOrder) }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Помилка створення категорії');

            setNewCategoryName('');
            setNewCategoryOrder(0);
            setCategoryModalOpen(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Переміщення категорії вгору/вниз у списку локально та збереження
    const handleMoveCategory = async (index, direction) => {
        const updatedCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= updatedCategories.length) return;

        // Міняємо місцями елементи
        const temp = updatedCategories[index];
        updatedCategories[index] = updatedCategories[targetIndex];
        updatedCategories[targetIndex] = temp;

        // Оновлюємо локальний стан для миттєвого відгуку UI
        setCategories(updatedCategories);

        // Відправляємо новий порядок на бекенд
        try {
            const res = await fetch('/api/categories/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderedCategories: updatedCategories.map((cat, i) => ({
                        _id: cat._id,
                        order: i,
                    })),
                }),
            });

            if (!res.ok) throw new Error('Помилка збереження порядку');
            fetchData(); // Синхронізуємо дані
        } catch (err) {
            setError(err.message);
        }
    };

    // Видалення категорії
    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Ви дійсно бажаєте видалити цю категорію?')) return;

        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Помилка при видаленні');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="person_model_container">Завантаження...</div>;

    return (
        <div className="person_model_container">
            <h2>Управління додатковими властивостями</h2>

            {error && <div className="error_message">{error}</div>}

            <div className="model_actions_bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={handleOpen} className="btn_primary">
                    Додати властивість
                </button>
                <button onClick={() => setCategoryModalOpen(true)} className="btn_secondary">
                    Управління категоріями
                </button>
            </div>

            {/* Список властивостей, відсортований за порядком категорій */}
            <div className="properties_list">
                {properties.length === 0 ? (
                    <p>Властивостей поки немає.</p>
                ) : (
                    <>
                        {/* 1. Виводимо категорії у порядку з масиву `categories` */}
                        {categories.map((cat) => {
                            const catProps = properties.filter((p) => p.category === cat.name);
                            if (catProps.length === 0) return null; // Перескочити порожні категорії

                            return (
                                <div key={cat._id} className="category_group_block" style={{ marginBottom: '1.5rem' }}>
                                    <h3 className="category_title" style={{ borderBottom: '2px solid #007bff', paddingBottom: '0.3rem' }}>
                                        Категорія: {cat.name}
                                    </h3>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Назва</th>
                                                <th>ID</th>
                                                <th>Тип</th>
                                                <th>Статус</th>
                                                <th>Дії</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {catProps.map((prop) => (
                                                <tr key={prop._id} className={!prop.is_active ? 'inactive_row' : ''}>
                                                    <td>{prop.order}</td>
                                                    <td><strong>{prop.property_name}</strong></td>
                                                    <td><code>{prop.property_id}</code></td>
                                                    <td>{prop.property_type}</td>
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
                                </div>
                            );
                        })}

                        {/* 2. Блок для властивостей без категорії або з невідомою категорією */}
                        {(() => {
                            const knownCategoryNames = categories.map((c) => c.name);
                            const uncategorizedProps = properties.filter(
                                (p) => !p.category || !knownCategoryNames.includes(p.category)
                            );

                            if (uncategorizedProps.length === 0) return null;

                            return (
                                <div className="category_group_block" style={{ marginBottom: '1.5rem' }}>
                                    <h3 className="category_title" style={{ borderBottom: '2px solid #6c757d', paddingBottom: '0.3rem' }}>
                                        Без категорії / Інше
                                    </h3>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Назва</th>
                                                <th>ID</th>
                                                <th>Тип</th>
                                                <th>Статус</th>
                                                <th>Дії</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {uncategorizedProps.map((prop) => (
                                                <tr key={prop._id} className={!prop.is_active ? 'inactive_row' : ''}>
                                                    <td>{prop.order}</td>
                                                    <td><strong>{prop.property_name}</strong></td>
                                                    <td><code>{prop.property_id}</code></td>
                                                    <td>{prop.property_type}</td>
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
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>

            {/* Модалка для додавання / редагування властивості */}
            <Modal open={open} onClose={handleClose}>
                <div className="modal_content">
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
                                disabled={!!editingId}
                                required
                            />
                        </div>

                        <div className="form_group">
                            <label>Тип поля:</label>
                            <select name="property_type" value={formData.property_type} onChange={handleChange}>
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
                            <select name="category" value={formData.category} onChange={handleChange}>
                                {categories.length === 0 && <option value="Загальне">Загальне</option>}
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form_group">
                            <label>Порядок сортування (order):</label>
                            <input type="number" name="order" value={formData.order} onChange={handleChange} />
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
                            <button type="button" onClick={handleClose} className="btn_secondary">
                                Скасувати
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Модалка створення категорії */}
            <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)}>
                <div className="modal_content">
                    <form onSubmit={handleCreateCategory} className="property_form">
                        <h3>Додати категорію</h3>
                        <div className="form_group">
                            <label>Назва категорії:</label>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="наприклад, Паспортні дані"
                                required
                            />
                        </div>
                        <div className="form_group">
                            <label>Порядок (order):</label>
                            <input
                                type="number"
                                value={newCategoryOrder}
                                onChange={(e) => setNewCategoryOrder(e.target.value)}
                            />
                        </div>
                        <div className="form_actions">
                            <button type="submit" className="btn_primary">
                                Створити
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryModalOpen(false)}
                                className="btn_secondary"
                            >
                                Скасувати
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
            {/* Модалка управління категоріями */}
            <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)}>
                <div className="modal_content" style={{ maxWidth: '500px' }}>
                    <h3>Управління категоріями</h3>

                    {/* Форма швидкого створення */}
                    <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Назва нової категорії..."
                            required
                            style={{ flex: 1, padding: '0.4rem' }}
                        />
                        <button type="submit" className="btn_primary">
                            Додати
                        </button>
                    </form>

                    {/* Список категорій з можливістю зміни порядку */}
                    <div className="categories_reorder_list">
                        <h4>Порядок виведення категорій:</h4>
                        {categories.length === 0 ? (
                            <p>Категорії відсутні.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {categories.map((cat, index) => (
                                    <li
                                        key={cat._id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.5rem 0.8rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            background: '#f9f9f9',
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{cat.name}</span>

                                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() => handleMoveCategory(index, 'up')}
                                                style={{ cursor: index === 0 ? 'not-allowed' : 'pointer', padding: '0.2rem 0.5rem' }}
                                                title="Перемістити вгору"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === categories.length - 1}
                                                onClick={() => handleMoveCategory(index, 'down')}
                                                style={{ cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer', padding: '0.2rem 0.5rem' }}
                                                title="Перемістити вниз"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCategory(cat._id)}
                                                className="btn_delete"
                                                style={{ marginLeft: '0.5rem' }}
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="form_actions" style={{ marginTop: '1.5rem' }}>
                        <button type="button" onClick={() => setCategoryModalOpen(false)} className="btn_secondary">
                            Закрити
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}