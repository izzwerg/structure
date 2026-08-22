import { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import SubdivisionNode from './SubdivisionNode';
import PositionNode from './PositionNode';
import './Tree.css';
import { POSITION_RANKS } from '../../constants/ranks';
import PersonView from '../Modals/PersonView/PersonView';
import ConfirmUnassign from './Modals/ConfirmUnassign';
import AssignModal from './Modals/AssignModal';
import { useAuth } from '../../context/AuthContext';

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
    const { canMod } = useAuth();
    const [structureData, setStructureData] = useState({
        rootItems: [],
        subdivisions: [],
        positions: [],
        persons: [],
    });
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Режим редагування
    const [isEditMode, setIsEditMode] = useState(false);

    // Модалки додавання/редагування (+p / +s)
    const [modalType, setModalType] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [targetParentId, setTargetParentId] = useState(null);
    const [insertIndex, setInsertIndex] = useState(null);

    const [subForm, setSubForm] = useState(INITIAL_SUBDIVISION_FORM);
    const [posForm, setPosForm] = useState(INITIAL_POSITION_FORM);

    // Модалка призначення людини
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedPositionNodeId, setSelectedPositionNodeId] = useState(null);
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [selectedPositionVos, setSelectedPositionVos] = useState(''); // Додано для збереження vosByPos при призначенні

    // Модальне вікно перегляду картки особи
    const [viewPersonOpen, setViewPersonOpen] = useState(false);
    const [personToView, setPersonToView] = useState(null);

    const [unassignModalOpen, setUnassignModalOpen] = useState(false);
    const [personToUnassign, setPersonToUnassign] = useState(null);

    const fetchStructure = async () => {
        try {
            setLoading(true);
            const [resStructure, resProps] = await Promise.all([
                fetch('/api/structure'),
                fetch('/api/properties'),
            ]);

            if (!resStructure.ok || !resProps.ok) {
                throw new Error('Помилка завантаження даних');
            }

            const data = await resStructure.json();
            const propsData = await resProps.json();

            setStructureData(data);
            setProperties(propsData.filter((p) => p.is_active));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStructure();
    }, []);

    // Хендлер відкриття модалки підтвердження зняття
    const handleOpenUnassignConfirm = (person) => {
        setPersonToUnassign(person);
        setUnassignModalOpen(true);
    };

    const handleCloseUnassignConfirm = () => {
        setUnassignModalOpen(false);
        setPersonToUnassign(null);
    };

    // Підтверджене зняття з посади
    const handleConfirmUnassign = async () => {
        if (!personToUnassign) return;

        try {
            const res = await fetch('/api/structure/assign-person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personId: personToUnassign._id, treeNodeId: '', vosByPos: '' }),
            });

            if (!res.ok) throw new Error('Помилка зняття з посади');

            handleCloseUnassignConfirm();
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    // Хендлери перегляду особи
    const handleOpenViewPerson = (person) => {
        setPersonToView(person);
        setViewPersonOpen(true);
    };

    const handleCloseViewPerson = () => {
        setViewPersonOpen(false);
        setPersonToView(null);
    };

    const subdivisionsMap = structureData.subdivisions.reduce((acc, item) => {
        acc[item._id] = item;
        return acc;
    }, {});

    const positionsMap = structureData.positions.reduce((acc, item) => {
        acc[item._id] = item;
        return acc;
    }, {});

    const personsByNodeId = structureData.persons.reduce((acc, person) => {
        if (person.treeNodeId && person.treeNodeId !== '') {
            acc[person.treeNodeId] = person;
        }
        return acc;
    }, {});

    const unassignedPersons = structureData.persons.filter(
        (p) => !p.treeNodeId || p.treeNodeId === ''
    );

    // Відкриття модалок створення
    const handleOpenAddModal = (type, parentId = null, index = null) => {
        setEditingId(null);
        setModalType(type);
        setTargetParentId(parentId);
        setInsertIndex(index);
        setSubForm(INITIAL_SUBDIVISION_FORM);
        setPosForm(INITIAL_POSITION_FORM);
    };

    // Відкриття модалки редагування підрозділу
    const handleOpenEditSubdivision = (sub) => {
        setEditingId(sub._id);
        setSubForm({
            title: sub.title || '',
            fullTitle: sub.fullTitle || '',
            shortTitle: sub.shortTitle || '',
        });
        setModalType('subdivision');
    };

    // Відкриття модалки редагування посади
    const handleOpenEditPosition = (pos) => {
        setEditingId(pos._id);
        setPosForm({
            treeNodeId: pos.treeNodeId || '',
            shortTitle: pos.shortTitle || '',
            fullTitle: pos.fullTitle || '',
            rank: pos.rank || '',
            specialtyCode: pos.specialtyCode || '',
            tariff: pos.tariff || '',
        });
        setModalType('position');
    };

    const handleCloseAddModal = () => {
        setModalType(null);
        setEditingId(null);
        setTargetParentId(null);
        setInsertIndex(null);
    };

    // Збереження підрозділу (Створення або Оновлення)
    const handleSaveSubdivision = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/structure/subdivision/${editingId}` : '/api/structure/subdivision';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...subForm,
                    parentId: targetParentId,
                    insertIndex,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Помилка збереження підрозділу');
            }

            handleCloseAddModal();
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    // Збереження посади (Створення або Оновлення)
    const handleSavePosition = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/structure/position/${editingId}` : '/api/structure/position';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...posForm,
                    parentId: targetParentId,
                    insertIndex,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Помилка збереження посади');
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

    // Видалення підрозділу
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

    const handleOpenAssign = (treeNodeId, vosByPos) => {
        console.log('Opening assign modal for treeNodeId:', vosByPos);
        setSelectedPositionNodeId(treeNodeId);
        setSelectedPersonId('');
        setSelectedPositionVos(vosByPos);
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
                    vosByPos: selectedPositionVos,
                }),
            });
            if (!res.ok) throw new Error('Помилка призначення особи');

            setAssignModalOpen(false);
            fetchStructure();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="tree_container">Завантаження...</div>;

    const rootItems = structureData.rootItems || [];

    return (
        <div className="tree_container">
            <div className="tree_top_bar">
                <h2>Організаційна структура</h2>
                {canMod && <button
                    type="button"
                    className={`btn_toggle_edit ${isEditMode ? 'active' : ''}`}
                    onClick={() => setIsEditMode(!isEditMode)}
                >
                    {isEditMode ? 'Режим редагування: УВІМКНЕНО' : 'Режим редагування: ВИМКНЕНО'}
                </button>}
            </div>

            {error && <div className="error_message">{error}</div>}

            <div className="tree_workspace">
                {rootItems.map((item) => {
                    if (item.kind === 'position') {
                        const pos = positionsMap[item.itemId];
                        if (!pos) return null;
                        return (
                            <PositionNode
                                key={pos._id}
                                position={pos}
                                person={personsByNodeId[pos.treeNodeId]}
                                isEditMode={isEditMode}
                                onAssignClick={handleOpenAssign}
                                onUnassignClick={handleOpenUnassignConfirm}
                                onViewPerson={handleOpenViewPerson}
                                onEditPosition={handleOpenEditPosition}
                                onDeletePosition={handleDeletePosition}
                            />
                        );
                    }

                    if (item.kind === 'subdivision') {
                        const sub = subdivisionsMap[item.itemId];
                        if (!sub) return null;
                        return (
                            <SubdivisionNode
                                key={sub._id}
                                subdivision={sub}
                                subdivisionsMap={subdivisionsMap}
                                positionsMap={positionsMap}
                                personsByNodeId={personsByNodeId}
                                isEditMode={isEditMode}
                                onOpenAddModal={handleOpenAddModal}
                                onAssignClick={handleOpenAssign}
                                onUnassignClick={handleOpenUnassignConfirm}
                                onViewPerson={handleOpenViewPerson}
                                onEditPosition={handleOpenEditPosition}
                                onDeletePosition={handleDeletePosition}
                                onEditSubdivision={handleOpenEditSubdivision}
                                onDeleteSubdivision={handleDeleteSubdivision}
                            />
                        );
                    }

                    return null;
                })}

                {/* ЄДИНИЙ блок кнопок для кореневого рівня у самому низу */}
                {isEditMode && (
                    <div className="action_buttons_group">
                        <button
                            type="button"
                            className="btn_tree_action"
                            onClick={() => handleOpenAddModal('position', null)}
                        >
                            Додати посаду
                        </button>
                        <button
                            type="button"
                            className="btn_tree_action"
                            onClick={() => handleOpenAddModal('subdivision', null)}
                        >
                            Додати підрозділ
                        </button>
                    </div>
                )}
            </div>

            {/* Модальне вікно підрозділу (створення / редагування) */}
            <Modal open={modalType === 'subdivision'} onClose={handleCloseAddModal}>
                <div className="modal_content">
                    <form onSubmit={handleSaveSubdivision} className="property_form">
                        <h3>{editingId ? 'Редагувати підрозділ' : 'Створити новий підрозділ'}</h3>
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
                            <button type="submit" className="btn_primary">
                                {editingId ? 'Зберегти' : 'Створити'}
                            </button>
                            <button type="button" onClick={handleCloseAddModal} className="btn_secondary">
                                Скасувати
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Модальне вікно посади (створення / редагування) */}
            <Modal open={modalType === 'position'} onClose={handleCloseAddModal}>
                <div className="modal_content">
                    <form onSubmit={handleSavePosition} className="property_form">
                        <h3>{editingId ? 'Редагувати посаду' : 'Створити нову посаду'}</h3>
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
                            <select
                                value={posForm.rank}
                                onChange={(e) => setPosForm({ ...posForm, rank: e.target.value })}
                            >
                                <option value="">-- Не обрано --</option>
                                {POSITION_RANKS.map((rank) => (
                                    <option key={rank} value={rank}>
                                        {rank}
                                    </option>
                                ))}
                            </select>
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
                            <button type="submit" className="btn_primary">
                                {editingId ? 'Зберегти' : 'Створити'}
                            </button>
                            <button type="button" onClick={handleCloseAddModal} className="btn_secondary">
                                Скасувати
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Модальне вікно призначення людини */}
            <AssignModal
                assignModalOpen={assignModalOpen}
                setAssignModalOpen={setAssignModalOpen}
                handleConfirmAssign={handleConfirmAssign}
                selectedPositionNodeId={selectedPositionNodeId}
                unassignedPersons={unassignedPersons}
                selectedPersonId={selectedPersonId}
                setSelectedPersonId={setSelectedPersonId}
            />
            {/* Модальне вікно перегляду картки особи */}
            <PersonView
                open={viewPersonOpen}
                onClose={handleCloseViewPerson}
                person={personToView}
                properties={properties}
            />
            {/* Модальне вікно підтвердження зняття з посади */}
            <ConfirmUnassign
                unassignModalOpen={unassignModalOpen}
                handleCloseUnassignConfirm={handleCloseUnassignConfirm}
                personToUnassign={personToUnassign}
                handleConfirmUnassign={handleConfirmUnassign}
            />
        </div>
    );
}