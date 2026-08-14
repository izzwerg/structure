import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import SubdivisionNode from './SubdivisionNode';
import PositionNode from './PositionNode';
import './Tree.css';

const INITIAL_SUBDIVISION_FORM = { title: '', fullTitle: '', shortTitle: '' };
const INITIAL_POSITION_FORM = {
    treeNodeId: '',
    shortTitle: '',
    fullTitle: '',
    rank: '',
    specialtyCode: '',
    tariff: '',
};

export default function Tree() {
    const [structureData, setStructureData] = useState({
        rootItems: [],
        subdivisions: [],
        positions: [],
        persons: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Режим редагування
    const [isEditMode, setIsEditMode] = useState(false);

    // Модалки додавання (+p / +s)
    const [modalType, setModalType] = useState(null);
    const [targetParentId, setTargetParentId] = useState(null);
    const [insertIndex, setInsertIndex] = useState(null);

    const [subForm, setSubForm] = useState(INITIAL_SUBDIVISION_FORM);
    const [posForm, setPosForm] = useState(INITIAL_POSITION_FORM);

    // Модалка призначення людини
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedPositionNodeId, setSelectedPositionNodeId] = useState(null);
    const [selectedPersonId, setSelectedPersonId] = useState('');

    const fetchStructure = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/structure');
            if (!res.ok) throw new Error('Помилка завантаження структури');
            const data = await res.json();
            setStructureData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStructure();
    }, []);

    const subdivisionsMap = structureData.subdivisions.reduce((acc, item) => {
        acc[item._id] = item;
        return acc;
    }, {});

    const positionsMap = structureData.positions.reduce((acc, item) => {
        acc[item._id] = item;
        return acc;
    }, {});

    const personsByNodeId = structureData.persons.reduce((acc, person) => {
        if (person.treeNodeId && person.treeNodeId !== 'none') {
            acc[person.treeNodeId] = person;
        }
        return acc;
    }, {});

    const unassignedPersons = structureData.persons.filter(
        (p) => !p.treeNodeId || p.treeNodeId === 'none'
    );

    const handleOpenAddModal = (type, parentId = null, index = null) => {
        setModalType(type);
        setTargetParentId(parentId);
        setInsertIndex(index);
        setSubForm(INITIAL_SUBDIVISION_FORM);
        setPosForm(INITIAL_POSITION_FORM);
    };

    const handleCloseAddModal = () => {
        setModalType(null);
        setTargetParentId(null);
        setInsertIndex(null);
    };

    const handleCreateSubdivision = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/structure/subdivision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...subForm,
                    parentId: targetParentId,
                    insertIndex,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Помилка створення підрозділу');
            }
            handleCloseAddModal();
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCreatePosition = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/structure/position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...posForm,
                    parentId: targetParentId,
                    insertIndex,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Помилка створення посади');
            }
            handleCloseAddModal();
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    // Видалення посади
    const handleDeletePosition = async (id) => {
        if (!window.confirm('Ви дійсно бажаєте видалити цю посаду?')) return;
        try {
            const res = await fetch(`/api/structure/position/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Помилка видалення посади');
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    // Видалення підрозділу (і всього вкладеного)
    const handleDeleteSubdivision = async (id, title) => {
        if (!window.confirm(`Ви дійсно бажаєте видалити підрозділ "${title}" та ВСІ вкладені підрозділи й посади?`)) return;
        try {
            const res = await fetch(`/api/structure/subdivision/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Помилка видалення підрозділу');
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleOpenAssign = (treeNodeId) => {
        setSelectedPositionNodeId(treeNodeId);
        setSelectedPersonId('');
        setAssignModalOpen(true);
    };

    const handleConfirmAssign = async (e) => {
        e.preventDefault();
        if (!selectedPersonId) return;

        try {
            const res = await fetch('/api/structure/assign-person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personId: selectedPersonId,
                    treeNodeId: selectedPositionNodeId,
                }),
            });
            if (!res.ok) throw new Error('Помилка призначення особи');

            setAssignModalOpen(false);
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUnassignPerson = async (personId) => {
        try {
            const res = await fetch('/api/structure/assign-person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personId, treeNodeId: 'none' }),
            });
            if (!res.ok) throw new Error('Помилка зняття з посади');
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="tree_container">Завантаження...</div>;

    const rootItems = structureData.rootItems || [];

    return (
        <div className="tree_container">
            {/* Верхня панель з заголовком і перемикачем режиму редагування */}
            <div className="tree_top_bar">
                <h2>Організаційна структура</h2>
                <button
                    type="button"
                    className={`btn_toggle_edit ${isEditMode ? 'active' : ''}`}
                    onClick={() => setIsEditMode(!isEditMode)}
                >
                    {isEditMode ? 'Режим редагування: УВІМКНЕНО' : 'Режим редагування: ВИМКНЕНО'}
                </button>
            </div>

            {error && <div className="error_message">{error}</div>}

            <div className="tree_workspace">
                {/* Якщо кореневий рівень порожній */}
                {isEditMode && rootItems.length === 0 && (
                    <div className="action_buttons_group">
                        <button
                            type="button"
                            className="btn_tree_action"
                            onClick={() => handleOpenAddModal('position', null, -1)}
                        >
                            Додати посаду
                        </button>
                        <button
                            type="button"
                            className="btn_tree_action"
                            onClick={() => handleOpenAddModal('subdivision', null, -1)}
                        >
                            Додати підрозділ
                        </button>
                    </div>
                )}

                {/* Кореневі елементи з кнопками вставки після кожного з них */}
                {rootItems.map((item, index) => {
                    let renderedNode = null;

                    if (item.kind === 'position') {
                        const pos = positionsMap[item.itemId];
                        if (pos) {
                            renderedNode = (
                                <PositionNode
                                    key={pos._id}
                                    position={pos}
                                    person={personsByNodeId[pos.treeNodeId]}
                                    isEditMode={isEditMode}
                                    onAssignClick={handleOpenAssign}
                                    onUnassignClick={handleUnassignPerson}
                                    onDeletePosition={handleDeletePosition}
                                />
                            );
                        }
                    } else if (item.kind === 'subdivision') {
                        const sub = subdivisionsMap[item.itemId];
                        if (sub) {
                            renderedNode = (
                                <SubdivisionNode
                                    key={sub._id}
                                    subdivision={sub}
                                    subdivisionsMap={subdivisionsMap}
                                    positionsMap={positionsMap}
                                    personsByNodeId={personsByNodeId}
                                    isEditMode={isEditMode}
                                    onOpenAddModal={handleOpenAddModal}
                                    onAssignClick={handleOpenAssign}
                                    onUnassignClick={handleUnassignPerson}
                                    onDeletePosition={handleDeletePosition}
                                    onDeleteSubdivision={handleDeleteSubdivision}
                                />
                            );
                        }
                    }

                    return (
                        <React.Fragment key={item.itemId || index}>
                            {renderedNode}

                            {/* Кнопки вставки строго після кожного кореневого елемента */}
                            {isEditMode && (
                                <div className="action_buttons_group">
                                    <button
                                        type="button"
                                        className="btn_tree_action"
                                        onClick={() => handleOpenAddModal('position', null, index)}
                                    >
                                        Додати посаду
                                    </button>
                                    <button
                                        type="button"
                                        className="btn_tree_action"
                                        onClick={() => handleOpenAddModal('subdivision', null, index)}
                                    >
                                        Додати підрозділ
                                    </button>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Модальне вікно створення підрозділу */}
            <Modal open={modalType === 'subdivision'} onClose={handleCloseAddModal}>
                <div className="modal_content">
                    <form onSubmit={handleCreateSubdivision} className="property_form">
                        <h3>Створити новий підрозділ</h3>
                        <div className="form_group">
                            <label>Звичайна назва:*</label>
                            <input
                                type="text"
                                value={subForm.title}
                                onChange={(e) => setSubForm({ ...subForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form_group">
                            <label>Повна назва:*</label>
                            <input
                                type="text"
                                value={subForm.fullTitle}
                                onChange={(e) => setSubForm({ ...subForm, fullTitle: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form_group">
                            <label>Скорочена назва:*</label>
                            <input
                                type="text"
                                value={subForm.shortTitle}
                                onChange={(e) => setSubForm({ ...subForm, shortTitle: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form_actions">
                            <button type="submit" className="btn_primary">Створити</button>
                            <button type="button" onClick={handleCloseAddModal} className="btn_secondary">Скасувати</button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Модальне вікно створення посади */}
            <Modal open={modalType === 'position'} onClose={handleCloseAddModal}>
                <div className="modal_content">
                    <form onSubmit={handleCreatePosition} className="property_form">
                        <h3>Створити нову посаду</h3>
                        <div className="form_group">
                            <label>Номер за порядком (Tree Node ID):*</label>
                            <input
                                type="text"
                                value={posForm.treeNodeId}
                                onChange={(e) => setPosForm({ ...posForm, treeNodeId: e.target.value })}
                                placeholder="наприклад, 123"
                                required
                            />
                        </div>
                        <div className="form_group">
                            <label>Коротка назва посади:*</label>
                            <input
                                type="text"
                                value={posForm.shortTitle}
                                onChange={(e) => setPosForm({ ...posForm, shortTitle: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form_group">
                            <label>Повна назва посади:</label>
                            <input
                                type="text"
                                value={posForm.fullTitle}
                                onChange={(e) => setPosForm({ ...posForm, fullTitle: e.target.value })}
                            />
                        </div>
                        <div className="form_group">
                            <label>Потрібне звання:</label>
                            <input
                                type="text"
                                value={posForm.rank}
                                onChange={(e) => setPosForm({ ...posForm, rank: e.target.value })}
                            />
                        </div>
                        <div className="form_group">
                            <label>Номер спеціальності:</label>
                            <input
                                type="text"
                                value={posForm.specialtyCode}
                                onChange={(e) => setPosForm({ ...posForm, specialtyCode: e.target.value })}
                            />
                        </div>
                        <div className="form_group">
                            <label>Тариф:</label>
                            <input
                                type="text"
                                value={posForm.tariff}
                                onChange={(e) => setPosForm({ ...posForm, tariff: e.target.value })}
                            />
                        </div>
                        <div className="form_actions">
                            <button type="submit" className="btn_primary">Створити</button>
                            <button type="button" onClick={handleCloseAddModal} className="btn_secondary">Скасувати</button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Модальне вікно призначення людини */}
            <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)}>
                <div className="modal_content">
                    <form onSubmit={handleConfirmAssign} className="property_form">
                        <h3>Призначити особу на посаду (ID: {selectedPositionNodeId})</h3>
                        <div className="form_group">
                            <label>Оберіть особу зі списку (Tree Node ID = none):</label>
                            {unassignedPersons.length === 0 ? (
                                <p>Вільні картки відсутні.</p>
                            ) : (
                                <select
                                    value={selectedPersonId}
                                    onChange={(e) => setSelectedPersonId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Оберіть картку --</option>
                                    {unassignedPersons.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {`${p.lastName} ${p.firstName} ${p.middleName}`.trim()}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="form_actions">
                            <button
                                type="submit"
                                className="btn_primary"
                                disabled={unassignedPersons.length === 0}
                            >
                                Призначити
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssignModalOpen(false)}
                                className="btn_secondary"
                            >
                                Скасувати
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}