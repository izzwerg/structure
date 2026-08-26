import { useState, useEffect } from 'react';
import './Person.css';
import Modal from '@mui/material/Modal';
import PersonView from '../Modals/PersonView/PersonView';
import PersonEdit from '../Modals/PersonEdit/PersonEdit';

const INITIAL_PERSON_STATE = {
    lastName: '',
    firstName: '',
    middleName: '',
    rank: '',
    vos: '',
    position: '',
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

    const [viewOpen, setViewOpen] = useState(false);
    const [personToView, setPersonToView] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const filteredPersons = persons.filter((p) => {
        const fullName = `${p.subdivisionMark} ${p.lastName} ${p.firstName} ${p.middleName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    const handleOpenView = (person) => {
        setPersonToView(person);
        setViewOpen(true);
    };

    const handleCloseView = () => {
        setViewOpen(false);
        setPersonToView(null);
    };

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
            lastName: person.lastName || INITIAL_PERSON_STATE.lastName,
            firstName: person.firstName || INITIAL_PERSON_STATE.firstName,
            middleName: person.middleName || INITIAL_PERSON_STATE.middleName,
            gender: person.gender || INITIAL_PERSON_STATE.gender,
            rank: person.rank || INITIAL_PERSON_STATE.rank,
            vos: person.vos || INITIAL_PERSON_STATE.vos,
            extraData: person.extraData || INITIAL_PERSON_STATE.extraData,
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

    if (loading) return <div className="person_container">Завантаження...</div>;

    return (
        <div className="person_container">
            <div className="person_filters">
                <h2>Картки осіб</h2>
                <input
                    type="text"
                    placeholder="Пошук за ПІБ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={handleOpenCreate} className="btn_primary" title="Додати картку">
                    <img src="user-plus.svg" alt="Додати картку" />
                </button>
            </div>

            {error && <div className="error_message">{error}</div>}

            <div className="persons_list">
                {filteredPersons.length === 0 ? (
                    <p>Картки відсутні.</p>
                ) : (
                    <div className='list'>
                        {filteredPersons.map((p) => (
                            <div
                                key={p._id}
                                className='person_item'
                            >
                                <div className='number'>{p.treeNodeId}</div>
                                <div className='mark'>{p.subdivisionMark}</div>
                                <div className='name'>{`${p.lastName} ${p.firstName} ${p.middleName}`.trim()}</div>
                                <div className='actions'>
                                    <button onClick={() => handleOpenView(p)} className="btn_view">
                                        <img src="eye.svg" alt="Перегляд" />
                                    </button>
                                    <button onClick={() => handleOpenEdit(p)} className="btn_edit">
                                        <img src="edit.svg" alt="Перегляд" />
                                    </button>
                                    <button onClick={() => handleOpenDelete(p)} className="btn_delete">
                                        <img src="close.svg" alt="Перегляд" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Модальне вікно Перегляду */}
            <PersonView
                open={viewOpen}
                onClose={handleCloseView}
                person={personToView}
                properties={properties}
            />
            {/* Модальне вікно Створення / Редагування */}
            <PersonEdit
                open={open}
                onClose={handleClose}
                handleSubmit={handleSubmit}
                editingId={editingId}
                formData={formData}
                setFormData={setFormData}
                handleMainChange={handleMainChange}
                properties={properties}
            />

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