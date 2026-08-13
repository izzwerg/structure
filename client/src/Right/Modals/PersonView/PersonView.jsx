import Modal from '@mui/material/Modal';

const renderFormattedValue = (prop, rawValue) => {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
        return <span style={{ color: '#999' }}>—</span>;
    }
    if (prop.property_type === 'boolean') {
        return rawValue ? 'Так' : 'Ні';
    }
    if (prop.property_type === 'date') {
        return String(rawValue).substring(0, 10);
    }
    return String(rawValue);
};

const PersonView = ({ open, onClose, person, properties }) => {
    if (!person) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="modal_content">
                {person && (
                    <div className="view_card">
                        <h3>
                            {`${person.lastName} ${person.firstName} ${person.middleName}`.trim()}
                        </h3>

                        <div className="view_section">
                            <h4>Основні дані</h4>
                            <p><strong>Стать:</strong> {person.gender === 'M' ? 'Чоловіча' : 'Жіноча'}</p>
                            <p><strong>Tree Node ID:</strong> <code>{person.treeNodeId}</code></p>
                        </div>

                        {properties.length > 0 && (
                            <div className="view_section">
                                <h4>Додаткова інформація</h4>
                                {properties.map((prop) => {
                                    const val = person.extraData?.[prop.property_id];
                                    return (
                                        <p key={prop._id}>
                                            <strong>{prop.property_name}:</strong> {renderFormattedValue(prop, val)}
                                        </p>
                                    );
                                })}
                            </div>
                        )}

                        <div className="form_actions">
                            <button onClick={onClose} className="btn_secondary">
                                Закрити
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default PersonView;