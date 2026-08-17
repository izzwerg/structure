import { useState, useEffect, useMemo } from 'react';
import TableFilterModal from './TableFilterModal';
import './Table.css';

// Допоміжна функція форматування ПІБ
const formatFullName = (person, format) => {
    const lastName = person.lastName || '';
    const firstName = person.firstName || '';
    const middleName = person.middleName || '';

    const formatSurname = (sn) => {
        if (format === 'full_upper' || format === 'initials_upper') {
            return sn.toUpperCase();
        }
        return sn;
    };

    const sn = formatSurname(lastName);

    if (format === 'initials' || format === 'initials_upper') {
        const fInit = firstName ? `${firstName[0]}.` : '';
        const mInit = middleName ? `${middleName[0]}.` : '';
        return `${sn} ${fInit} ${mInit}`.trim();
    }

    return `${sn} ${firstName} ${middleName}`.trim();
};

export default function Table() {
    const [persons, setPersons] = useState([]);
    const [properties, setProperties] = useState([]);
    const [structure, setStructure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filterModalOpen, setFilterModalOpen] = useState(false);

    // Стан фільтрів
    const [filterState, setFilterState] = useState({
        statusFilter: 'active', // 'active' | 'archived' | 'all'
        nameFormat: 'full', // 'full' | 'initials' | 'full_upper' | 'initials_upper'
        columns: {}, // { [colId]: { show: boolean, filterType: 'all'|'not_empty'|'empty', dateFrom: '', dateTo: '' } }
        sort: { key: null, dir: null }, // key: colId, dir: 'asc'|'desc'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resPersons, resProps, resStruct] = await Promise.all([
                fetch('/api/persons/all'), // Якщо є ендпоінт усіх карток (включаючи архівні), або /api/persons
                fetch('/api/properties'),
                fetch('/api/structure'),
            ]);

            const personsData = resPersons.ok ? await resPersons.json() : [];
            const propsData = resProps.ok ? await resProps.json() : [];
            const structData = resStruct.ok ? await resStruct.json() : null;

            setPersons(personsData);
            setProperties(propsData.filter((p) => p.is_active));
            setStructure(structData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. Обхід дерева для формування списку впорядкованих treeNodeId
    const treeOrderedNodeIds = useMemo(() => {
        if (!structure) return [];

        const orderedIds = [];
        const { rootItems, subdivisions, positions } = structure;

        const subMap = (subdivisions || []).reduce((acc, s) => ({ ...acc, [s._id]: s }), {});
        const posMap = (positions || []).reduce((acc, p) => ({ ...acc, [p._id]: p }), {});

        const traverseItems = (items) => {
            if (!items) return;
            for (const item of items) {
                if (item.kind === 'position') {
                    const pos = posMap[item.itemId];
                    if (pos) orderedIds.push(pos.treeNodeId);
                } else if (item.kind === 'subdivision') {
                    const sub = subMap[item.itemId];
                    if (sub) traverseItems(sub.items);
                }
            }
        };

        traverseItems(rootItems);
        return orderedIds;
    }, [structure]);

    // Словник порядку у дереві
    const treeIndexMap = useMemo(() => {
        const map = {};
        treeOrderedNodeIds.forEach((id, idx) => {
            map[id] = idx;
        });
        return map;
    }, [treeOrderedNodeIds]);

    // 2. Фільтрація та сортування даних
    const processedPersons = useMemo(() => {
        let result = [...persons];

        // Фільтр за статусом (активні/архівні)
        if (filterState.statusFilter === 'active') {
            result = result.filter((p) => p.isActive);
        } else if (filterState.statusFilter === 'archived') {
            result = result.filter((p) => !p.isActive);
        }

        // Фільтри по колонках
        Object.entries(filterState.columns).forEach(([colId, conf]) => {
            if (!conf.show) return;

            const getValue = (person) => {
                if (colId.startsWith('extra_')) {
                    const propId = colId.replace('extra_', '');
                    return person.extraData?.[propId];
                }
                return person[colId];
            };

            // Фільтр "пусті / не пусті"
            if (conf.filterType === 'not_empty') {
                result = result.filter((p) => {
                    const val = getValue(p);
                    return val !== undefined && val !== null && val !== '';
                });
            } else if (conf.filterType === 'empty') {
                result = result.filter((p) => {
                    const val = getValue(p);
                    return val === undefined || val === null || val === '';
                });
            }

            // Фільтр за датою
            if (conf.dateFrom || conf.dateTo) {
                result = result.filter((p) => {
                    const val = getValue(p);
                    if (!val) return false;
                    const d = String(val).substring(0, 10);
                    if (conf.dateFrom && d < conf.dateFrom) return false;
                    if (conf.dateTo && d > conf.dateTo) return false;
                    return true;
                });
            }
        });

        // Сортування
        const { key: sortKey, dir: sortDir } = filterState.sort;

        if (sortKey && sortDir) {
            result.sort((a, b) => {
                let valA, valB;

                if (sortKey === 'fullName') {
                    valA = formatFullName(a, 'full');
                    valB = formatFullName(b, 'full');
                } else if (sortKey.startsWith('extra_')) {
                    const propId = sortKey.replace('extra_', '');
                    valA = a.extraData?.[propId] ?? '';
                    valB = b.extraData?.[propId] ?? '';
                } else {
                    valA = a[sortKey] ?? '';
                    valB = b[sortKey] ?? '';
                }

                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();

                const cmp = strA.localeCompare(strB, 'uk');
                return sortDir === 'asc' ? cmp : -cmp;
            });
        } else {
            // За замовчуванням — порядок як у Tree.jsx, потім решта карток
            result.sort((a, b) => {
                const idxA = treeIndexMap[a.treeNodeId] ?? 999999;
                const idxB = treeIndexMap[b.treeNodeId] ?? 999999;
                return idxA - idxB;
            });
        }

        return result;
    }, [persons, filterState, treeIndexMap]);

    if (loading) return <div className="table_container">Завантаження...</div>;

    // Активні видимі колонки для рендерингу заголовків
    const visibleColumns = [
        { id: 'fullName', name: 'ПІБ' },
        { id: 'rank', name: 'Звання' },
        { id: 'position', name: 'Посада' },
        { id: 'gender', name: 'Стать' },
        { id: 'treeNodeId', name: 'Tree Node ID' },
        ...properties.map((p) => ({
            id: `extra_${p.property_id}`,
            name: p.property_name,
            type: p.property_type,
            rawProp: p,
        })),
    ].filter((col) => {
        if (col.id === 'fullName') return true;
        const colConf = filterState.columns[col.id];
        // За замовчуванням показуємо тільки ПІБ, інші колонки — за прапорцем show
        return colConf ? colConf.show : false;
    });

    return (
        <div className="table_container">
            {/* Верхня панель дій */}
            <div className="table_top_bar">
                <button
                    type="button"
                    className="btn_primary"
                    onClick={() => setFilterModalOpen(true)}
                >
                    Фільтри та колонки
                </button>
            </div>

            {error && <div className="error_message">{error}</div>}

            {/* Таблиця */}
            <div className="table_workspace">
                {processedPersons.length === 0 ? (
                    <p>За заданими фільтрами карток не знайдено.</p>
                ) : (
                    <table className="data_table">
                        <thead>
                            <tr>
                                {visibleColumns.map((col) => (
                                    <th key={col.id}>{col.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {processedPersons.map((person) => (
                                <tr key={person._id}>
                                    {visibleColumns.map((col) => {
                                        if (col.id === 'fullName') {
                                            return (
                                                <td key={col.id}>
                                                    <strong>{formatFullName(person, filterState.nameFormat)}</strong>
                                                </td>
                                            );
                                        }

                                        let val;
                                        if (col.id.startsWith('extra_')) {
                                            const propId = col.id.replace('extra_', '');
                                            val = person.extraData?.[propId];
                                            if (col.type === 'boolean') val = val ? 'Так' : 'Ні';
                                            if (col.type === 'date' && val) val = String(val).substring(0, 10);
                                        } else {
                                            val = person[col.id];
                                            if (col.id === 'gender') val = val === 'M' ? 'Чоловіча' : 'Жіноча';
                                        }

                                        return (
                                            <td key={col.id}>
                                                {val !== undefined && val !== null && val !== '' ? (
                                                    String(val)
                                                ) : (
                                                    <span style={{ color: '#aaa' }}>—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Модалка фільтрів */}
            <TableFilterModal
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                filterState={filterState}
                setFilterState={setFilterState}
                properties={properties}
            />
        </div>
    );
}