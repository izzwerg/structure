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
        { id: 'treeNodeId', name: '№ з/п', type: 'text' },
        { id: 'vos', name: 'ВОС', type: 'text' },
        { id: 'vosByPos', name: 'ВОС за посадою', type: 'text' },
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

    const handleColumnFilterChange = (colId, field, value) => {
        setFilterState((prev) => {
            const current = prev.columns[colId] || { show: false, filterType: 'all', dateFrom: '', dateTo: '' };
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
                        className="sort_select"
                        value={filterState.statusFilter}
                        onChange={(e) => setFilterState({ ...filterState, statusFilter: e.target.value })}
                    >
                        <option value="active">Тільки активні</option>
                        <option value="archived">Тільки в архіві</option>
                        <option value="all">Усі (активні та архівні)</option>
                    </select>
                </div>

                {/* 2. Налаштування відображення ПІБ */}
                <div className="filter_section" >
                    <h4>Формат відображення ПІБ</h4>
                    <select
                        className="sort_select"
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
                <div>
                    <div className='filter_table_container' >
                        <div className="filter_table_header top">
                            <div className="filter_table_cell check top"></div>
                            <div className="filter_table_cell property top">Властивість</div>
                            <div className="filter_table_cell filter top">Фільтр значення</div>
                            <div className="filter_table_cell sort top">Сортування</div>
                        </div>
                        <div className='filter_table_body'>
                            <div className="filter_table_header">
                                <div className="filter_table_cell check">
                                    <input type="checkbox" checked disabled />
                                </div>
                                <div className="filter_table_cell property">
                                    ПІБ
                                </div>
                                <div className="filter_table_cell filter">
                                    —
                                </div>
                                <div className="filter_table_cell sort">
                                    <select
                                        className="sort_select"
                                        value={
                                            filterState.sort.key === 'fullName'
                                                ? filterState.sort.dir
                                                : filterState.sort.key === 'createdAt'
                                                    ? `created_${filterState.sort.dir}`
                                                    : ''
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) {
                                                setFilterState({ ...filterState, sort: { key: null, dir: null } });
                                            } else if (val === 'asc' || val === 'desc') {
                                                setFilterState({ ...filterState, sort: { key: 'fullName', dir: val } });
                                            } else if (val === 'created_asc') {
                                                setFilterState({ ...filterState, sort: { key: 'createdAt', dir: 'asc' } });
                                            } else if (val === 'created_desc') {
                                                setFilterState({ ...filterState, sort: { key: 'createdAt', dir: 'desc' } });
                                            }
                                        }}
                                    >
                                        <option value="">по структурі</option>
                                        <option value="asc">ПІБ: А-Я (Зростання)</option>
                                        <option value="desc">ПІБ: Я-А (Спадання)</option>
                                        <option value="created_asc">спочатку давніші</option>
                                        <option value="created_desc">спочатку новіші</option>
                                    </select>
                                </div>
                            </div>

                            {allColumns.map((col) => {
                                const colConf = filterState.columns[col.id] || {
                                    show: false,
                                    filterType: 'all',
                                    dateFrom: '',
                                    dateTo: '',
                                };
                                const isBoolean = col.type === 'boolean';

                                return (
                                    <div key={col.id} className='filter_table_header'>
                                        <div className="filter_table_cell check">
                                            <input
                                                type="checkbox"
                                                checked={colConf.show}
                                                onChange={(e) => {
                                                    setFilterState({
                                                        ...filterState,
                                                        columns: {
                                                            ...filterState.columns,
                                                            [col.id]: {
                                                                ...colConf,
                                                                show: e.target.checked
                                                            }
                                                        }
                                                    });
                                                }}
                                            />
                                            {col.label}
                                        </div>
                                        <div className="filter_table_cell property">
                                            {col.name}
                                        </div>
                                        <div className="filter_table_cell filter">
                                            {colConf.show && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                    <select
                                                        className="sort_select"
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
                                                                className="sort_select"
                                                                type="date"
                                                                value={colConf.dateFrom || ''}
                                                                onChange={(e) =>
                                                                    handleColumnFilterChange(col.id, 'dateFrom', e.target.value)
                                                                }
                                                                placeholder="З"
                                                            />
                                                            <input
                                                                className="sort_select"
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
                                        </div>
                                        <div className="filter_table_cell sort">
                                            {colConf.show && !isBoolean && (
                                                <select
                                                    className="sort_select"
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
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="btn_close">
                    <img src="close-square.svg" alt="закрити" />
                </button>
            </div>
        </Modal>
    );
}