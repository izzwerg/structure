import Modal from '@mui/material/Modal';

const PersonEdit = ({ open, onClose, handleSubmit, editingId, formData, setFormData, handleMainChange, properties }) => {

    const handleExtraChange = (propId, value) => {
        setFormData((prev) => ({
            ...prev,
            extraData: {
                ...prev.extraData,
                [propId]: value,
            },
        }));
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
                        value={value ? String(value).substring(0, 10) : ''}
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

    return (
        <Modal open={open} onClose={onClose} hideBackdrop>
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
                        <button type="button" onClick={onClose} className="btn_secondary">
                            Скасувати
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );

}

export default PersonEdit;