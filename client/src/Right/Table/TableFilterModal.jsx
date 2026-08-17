import Modal from '@mui/material/Modal';

export default function TableFilterModal({
    open,
    onClose,
    filterState,
    setFilterState,
    properties,
}) {
    // Базові системні поля (окрім ПІБ)
    const baseFields = [
        { id: 'rank', name: 'Військове звання', type: 'text' },
        { id: 'position', name: 'Посада', type: 'text' },
        { id: 'gender', name: 'Стать', type: 'text' },
        { id: 'treeNodeId', name: 'Tree Node ID', type: 'text' },
    ];

    // Злиємо базові та динамічні властивості в один список
    const allColumns = [
        ...baseFields,
        ...properties.map((p) => ({
            id: `extra_${p.property_id}`,
            name: p.property_name,
            type: p.property_type,
            rawProp: p,
        })),
    ];

    const handleColumnToggle = (colId) => {
        setFilterState((prev) => {
            const current = prev.columns[colId] || { show: true, filterType: 'all', dateFrom: '', dateTo: '' };
            return {
                ...prev,
                columns: {
                    ...prev.columns,
                    [colId]: { ...current, show: !current.show },
                },
            };
        });
    };

    const handleColumnFilterChange = (colId, field, value) => {
        setFilterState((prev) => {
            const current = prev.columns[colId] || { show: true, filterType: 'all', dateFrom: '', dateTo: '' };
            return {
                ...prev,
                columns: {
                    ...prev.columns,
                    [colId]: { ...current, [field]: value },
                },
            };
        });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="modal_content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3>Налаштування фільтрів та відображення</h3>

                {/* 1. Фільтр статусу картки */}
                <div className="filter_section">
                    <h4>Статус карток</h4>
                    <select
                        value={filterState.statusFilter}
                        onChange={(e) => setFilterState({ ...filterState, statusFilter: e.target.value })}
                    >
                        <option value="active">Тільки активні</option>
                        <option value="archived">Тільки в архіві</option>
                        <option value="all">Усі (активні та архівні)</option>
                    </select>
                </div>

                {/* 2. Налаштування відображення ПІБ */}
                <div className="filter_section" style={{ marginTop: '1rem' }}>
                    <h4>Формат відображення ПІБ</h4>
                    <select
                        value={filterState.nameFormat}
                        onChange={(e) => setFilterState({ ...filterState, nameFormat: e.target.value })}
                    >
                        <option value="full">Прізвище, ім'я, по батькові повністю</option>
                        <option value="initials">Прізвище та ініціали</option>
                        <option value="full_upper">ПРІЗВИЩЕ, ім'я, по батькові повністю</option>
                        <option value="initials_upper">ПРІЗВИЩЕ та ініціали</option>
                    </select>
                </div>

                {/* 3. Налаштування колонок та фільтрів значень */}
                <div className="filter_section" style={{ marginTop: '1.5rem' }}>
                    <h4>Колонки та фільтрація полів</h4>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                                <th>Виводити</th>
                                <th>Властивість</th>
                                <th>Фільтр значення</th>
                                <th>Сортування</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Поле ПІБ завжди виводиться */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td><input type="checkbox" checked disabled /></td>
                                <td><strong>ПІБ</strong></td>
                                <td>—</td>
                                <td>
                                    <select
                                        value={filterState.sort.key === 'fullName' ? filterState.sort.dir : ''}
                                        onChange={(e) =>
                                            setFilterState({
                                                ...filterState,
                                                sort: { key: e.target.value ? 'fullName' : null, dir: e.target.value },
                                            })
                                        }
                                    >
                                        <option value="">За замовчуванням (Дерево)</option>
                                        <option value="asc">А-Я (Зростання)</option>
                                        <option value="desc">Я-А (Спадання)</option>
                                    </select>
                                </td>
                            </tr>

                            {allColumns.map((col) => {
                                const colConf = filterState.columns[col.id] || {
                                    show: true,
                                    filterType: 'all',
                                    dateFrom: '',
                                    dateTo: '',
                                };
                                const isBoolean = col.type === 'boolean';

                                return (
                                    <tr key={col.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={colConf.show}
                                                onChange={() => handleColumnToggle(col.id)}
                                            />
                                        </td>
                                        <td>{col.name}</td>
                                        <td>
                                            {colConf.show && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                    <select
                                                        value={colConf.filterType}
                                                        onChange={(e) =>
                                                            handleColumnFilterChange(col.id, 'filterType', e.target.value)
                                                        }
                                                    >
                                                        <option value="all">Всі</option>
                                                        <option value="not_empty">Тільки не пусті</option>
                                                        <option value="empty">Тільки пусті</option>
                                                    </select>

                                                    {col.type === 'date' && colConf.filterType === 'all' && (
                                                        <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.8rem' }}>
                                                            <input
                                                                type="date"
                                                                value={colConf.dateFrom || ''}
                                                                onChange={(e) =>
                                                                    handleColumnFilterChange(col.id, 'dateFrom', e.target.value)
                                                                }
                                                                placeholder="З"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={colConf.dateTo || ''}
                                                                onChange={(e) =>
                                                                    handleColumnFilterChange(col.id, 'dateTo', e.target.value)
                                                                }
                                                                placeholder="По"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {colConf.show && !isBoolean && (
                                                <select
                                                    value={filterState.sort.key === col.id ? filterState.sort.dir : ''}
                                                    onChange={(e) =>
                                                        setFilterState({
                                                            ...filterState,
                                                            sort: { key: e.target.value ? col.id : null, dir: e.target.value },
                                                        })
                                                    }
                                                >
                                                    <option value="">За замовчуванням</option>
                                                    <option value="asc">Зростання</option>
                                                    <option value="desc">Спадання</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="form_actions" style={{ marginTop: '1.5rem' }}>
                    <button type="button" onClick={onClose} className="btn_primary">
                        Застосувати
                    </button>
                </div>
            </div>
        </Modal>
    );
}