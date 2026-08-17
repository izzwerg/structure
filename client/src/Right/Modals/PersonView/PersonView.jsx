import { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import {
    inNominative,
    inGenitive,
    inDative,
    inAccusative,
    inAblative,
    inLocative,
    inVocative,
} from 'shevchenko';

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

const groupPropertiesByCategory = (propsList) => {
    return propsList.reduce((acc, prop) => {
        const cat = prop.category || 'Загальне';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(prop);
        return acc;
    }, {});
};

const CASES_CONFIG = [
    { name: 'Називний', question: 'хто? що?', fn: inNominative },
    { name: 'Родовий', question: 'кого? чого?', fn: inGenitive },
    { name: 'Давальний', question: 'кому? чому?', fn: inDative },
    { name: 'Знахідний', question: 'кого? що?', fn: inAccusative },
    { name: 'Орудний', question: 'ким? чим?', fn: inAblative },
    { name: 'Місцевий', question: 'на кому? на чому?', fn: inLocative },
    { name: 'Кличний', question: 'звертання', fn: inVocative },
];

const PersonView = ({ open, onClose, person, properties }) => {
    const [declensionOpen, setDeclensionOpen] = useState(false);
    const [isUppercase, setIsUppercase] = useState(false);
    const [declinedCases, setDeclinedCases] = useState([]);

    // Асинхронний розрахунок відмінків ПІБ
    useEffect(() => {
        if (!person || !declensionOpen) return;

        const inputPerson = {
            gender: person.gender === 'F' ? 'feminine' : 'masculine',
            familyName: person.lastName || '',
            givenName: person.firstName || '',
            patronymicName: person.middleName || '',
        };

        const computeDeclensions = async () => {
            const results = await Promise.all(
                CASES_CONFIG.map(async ({ name, question, fn }) => {
                    try {
                        const result = await fn(inputPerson);
                        return { name, question, result };
                    } catch {
                        return { name, question, result: inputPerson };
                    }
                })
            );
            setDeclinedCases(results);
        };

        computeDeclensions();
    }, [person, declensionOpen]);

    if (!person) return null;

    const groupedProperties = groupPropertiesByCategory(properties);

    const formatDeclinedName = (declinedObj) => {
        if (!declinedObj) return '—';
        const familyName = isUppercase
            ? (declinedObj.familyName || '').toUpperCase()
            : declinedObj.familyName || '';
        return `${familyName} ${declinedObj.givenName || ''} ${declinedObj.patronymicName || ''}`.trim();
    };

    return (
        <>
            <Modal open={open} onClose={onClose}>
                <div className="modal_content">
                    <div className="view_card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <h3>
                                {`${person.rank ? `${person.rank} ` : ''}${person.lastName} ${person.firstName} ${person.middleName}`.trim()}
                            </h3>
                            <button
                                type="button"
                                className="btn_declension_trigger"
                                onClick={() => setDeclensionOpen(true)}
                                title="Відмінювання ПІБ"
                            >
                                Відмінки
                            </button>
                        </div>

                        <h4>{person.position || 'Позиція не вказана'}</h4>

                        <div className="view_section">
                            <h4>Основні дані</h4>
                            <p><strong>Стать:</strong> {person.gender === 'M' ? 'Чоловіча' : 'Жіноча'}</p>
                            <p><strong>Tree Node ID:</strong> <code>{person.treeNodeId}</code></p>
                        </div>

                        {properties.length > 0 && Object.entries(groupedProperties).map(([categoryName, propsGroup]) => (
                            <div key={categoryName} className="view_section">
                                <h4>{categoryName}</h4>
                                {propsGroup.map((prop) => {
                                    const val = person.extraData?.[prop.property_id];
                                    return (
                                        <p key={prop._id}>
                                            <strong>{prop.property_name}:</strong> {renderFormattedValue(prop, val)}
                                        </p>
                                    );
                                })}
                            </div>
                        ))}

                        <div className="form_actions">
                            <button onClick={onClose} className="btn_secondary">
                                Закрити
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Модальне вікно відмінювання ПІБ */}
            <Modal open={declensionOpen} onClose={() => setDeclensionOpen(false)}>
                <div className="modal_content" style={{ maxWidth: '500px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Відмінювання ПІБ</h3>
                        <button
                            type="button"
                            className="btn_secondary"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => setIsUppercase((prev) => !prev)}
                        >
                            Прізвище: {isUppercase ? 'ВЕЛИКИМИ' : 'Звичайне'}
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                                <th style={{ padding: '0.5rem' }}>Відмінок</th>
                                <th style={{ padding: '0.5rem' }}>Форма ПІБ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {declinedCases.map(({ name, question, result }) => (
                                <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
                                        <strong>{name}</strong>
                                        <br />
                                        <small style={{ color: '#666' }}>({question})</small>
                                    </td>
                                    <td style={{ padding: '0.5rem', fontSize: '0.95rem' }}>
                                        {formatDeclinedName(result)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="form_actions">
                        <button type="button" onClick={() => setDeclensionOpen(false)} className="btn_secondary">
                            Закрити
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PersonView;