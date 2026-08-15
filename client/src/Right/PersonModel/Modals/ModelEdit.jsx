import Modal from '@mui/material/Modal';

const PROPERTY_TYPES = [
    { value: 'text', label: 'Текст (однорядковий)' },
    { value: 'textarea', label: 'Текстове поле (багаторядкове)' },
    { value: 'number', label: 'Число' },
    { value: 'date', label: 'Дата' },
    { value: 'boolean', label: 'Перемикач (так/ні)' },
    { value: 'select', label: 'Вибір зі списку' },
];

export default function ModelEdit({ open, handleClose, handleSubmit, formData, handleChange, editingId, categories }) {
    return (
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
    );
}
