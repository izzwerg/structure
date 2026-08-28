import { useState, useEffect } from 'react';
import './PersonModel.css';
import ModelEdit from './Modals/ModelEdit';
import CatCreate from './Modals/CatCreate';
import BackupModal from '../Modals/BackupModal/BackupModal';
import { useAuth } from '../../context/AuthContext';
import UserManagementModal from '../Modals/UserManagementModal';
import { Tooltip } from '@mui/material';


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
    const [backupModalOpen, setBackupModalOpen] = useState(false);

    const { isAdmin } = useAuth();
    const [userModalOpen, setUserModalOpen] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [open, setOpen] = useState(false);

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
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleMoveCategory = async (index, direction) => {
        const updatedCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= updatedCategories.length) return;

        const temp = updatedCategories[index];
        updatedCategories[index] = updatedCategories[targetIndex];
        updatedCategories[targetIndex] = temp;

        setCategories(updatedCategories);

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
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

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

            <div className="model_actions_bar">
                <button onClick={handleOpen} className="btn_primary">
                    Додати властивість
                </button>
                <button onClick={() => setCategoryModalOpen(true)} className="btn_secondary">
                    Управління категоріями
                </button>
                <button onClick={() => setBackupModalOpen(true)} className="btn_secondary">
                    Резервне копіювання
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setUserModalOpen(true)}
                        className="btn_primary"
                        style={{ backgroundColor: '#28a745' }}
                    >
                        Управління користувачами
                    </button>
                )}
            </div>

            <div className="properties_list">
                {properties.length === 0 ? (
                    <p>Властивостей поки немає.</p>
                ) : (
                    <>
                        {categories.map((cat) => {
                            const catProps = properties.filter((p) => p.category === cat.name);
                            if (catProps.length === 0) return null;

                            return (
                                <div key={cat._id} className="category_group_block">
                                    <h3 className="category_title">
                                        Категорія: {cat.name}
                                    </h3>
                                    {catProps.map((prop) => (
                                        <div className='category_item' key={prop._id}>
                                            <Tooltip title={"Order"} leaveDelay={200}>
                                                <div className='order'>
                                                    <code>
                                                        {prop.order}
                                                    </code>
                                                </div>
                                            </Tooltip>
                                            <div className='name'>{prop.property_name}</div>
                                            <Tooltip title={"ID"} leaveDelay={200}>
                                                <div className='id'>
                                                    <code>
                                                        {prop.property_id}
                                                    </code>
                                                </div>
                                            </Tooltip>
                                            <div className='type'>{prop.property_type}</div>
                                            <div className='edit'>
                                                <button onClick={() => handleEdit(prop)} className="btn_edit">
                                                    Редагувати
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            <ModelEdit
                open={open}
                handleClose={handleClose}
                handleSubmit={handleSubmit}
                formData={formData}
                handleChange={handleChange}
                editingId={editingId}
                categories={categories}
            />

            <CatCreate
                categoryModalOpen={categoryModalOpen}
                setCategoryModalOpen={setCategoryModalOpen}
                handleCreateCategory={handleCreateCategory}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                categories={categories}
                handleMoveCategory={handleMoveCategory}
                handleDeleteCategory={handleDeleteCategory}
            />

            <BackupModal
                open={backupModalOpen}
                onClose={() => setBackupModalOpen(false)}
                onRestoreSuccess={() => fetchData()}
            />
            {isAdmin && (
                <UserManagementModal
                    open={userModalOpen}
                    onClose={() => setUserModalOpen(false)}
                />
            )}
        </div>
    );
}