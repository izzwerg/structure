import Modal from '@mui/material/Modal';

export default function CatCreate({ categoryModalOpen, setCategoryModalOpen, handleCreateCategory, newCategoryName, setNewCategoryName, categories, handleMoveCategory, handleDeleteCategory }) {
    return (
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
    );
}
