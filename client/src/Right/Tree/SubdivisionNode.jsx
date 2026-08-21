import React from 'react';
import PositionNode from './PositionNode';
import './Tree.css';

export default function SubdivisionNode({
    subdivision,
    subdivisionsMap,
    positionsMap,
    personsByNodeId,
    isEditMode,
    onOpenAddModal,
    onAssignClick,
    onUnassignClick,
    onViewPerson,
    onEditPosition,
    onDeletePosition,
    onEditSubdivision,
    onDeleteSubdivision,
}) {
    const items = subdivision.items || [];

    return (
        <div className="subdivision_node">
            <div className="subdivision_header">
                <span className="subdivision_title">{subdivision.title}</span>
                {isEditMode && (
                    <div className="node_actions">
                        <button
                            type="button"
                            className="btn_edit_node"
                            title="Редагувати підрозділ"
                            onClick={() => onEditSubdivision(subdivision)}
                        >
                            ✎ Редагувати
                        </button>
                        <button
                            type="button"
                            className="btn_delete_node"
                            title="Видалити підрозділ із усім вмістом"
                            onClick={() => onDeleteSubdivision(subdivision._id, subdivision.title)}
                        >
                            ✕ Видалити підрозділ
                        </button>
                    </div>
                )}
            </div>

            <div className="subdivision_content">
                {/* ВИНЯТОК: Якщо підрозділ ПОРОЖНІЙ (items.length === 0) — виводимо кнопки первинного додавання */}
                {isEditMode && items.length === 0 && (
                    <div className="action_buttons_group">
                        <button
                            type="button"
                            className="btn_tree_action"
                            onClick={() => onOpenAddModal('position', subdivision._id, -1)}
                        >
                            Додати посаду
                        </button>
                        <button
                            type="button"
                            className="btn_tree_action"
                            onClick={() => onOpenAddModal('subdivision', subdivision._id, -1)}
                        >
                            Додати підрозділ
                        </button>
                    </div>
                )}

                {/* Якщо підрозділ має елементи — проходимо мапом */}
                {items.map((item, index) => {
                    let renderedNode = null;

                    if (item.kind === 'position') {
                        const pos = positionsMap[item.itemId];
                        if (pos) {
                            const assignedPerson = personsByNodeId[pos.treeNodeId];
                            renderedNode = (
                                <PositionNode
                                    key={pos._id}
                                    position={pos}
                                    person={assignedPerson}
                                    isEditMode={isEditMode}
                                    onAssignClick={onAssignClick}
                                    onUnassignClick={onUnassignClick}
                                    onViewPerson={onViewPerson}
                                    onEditPosition={onEditPosition}
                                    onDeletePosition={onDeletePosition}
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
                                    onOpenAddModal={onOpenAddModal}
                                    onAssignClick={onAssignClick}
                                    onUnassignClick={onUnassignClick}
                                    onViewPerson={onViewPerson}
                                    onEditPosition={onEditPosition}
                                    onDeletePosition={onDeletePosition}
                                    onEditSubdivision={onEditSubdivision}
                                    onDeleteSubdivision={onDeleteSubdivision}
                                />
                            );
                        }
                    }

                    return (
                        <React.Fragment key={item.itemId || index}>
                            {renderedNode}

                            {isEditMode && (
                                <div className="action_buttons_group">
                                    <button
                                        type="button"
                                        className="btn_tree_action"
                                        onClick={() => onOpenAddModal('position', subdivision._id, index)}
                                    >
                                        Додати посаду
                                    </button>
                                    <button
                                        type="button"
                                        className="btn_tree_action"
                                        onClick={() => onOpenAddModal('subdivision', subdivision._id, index)}
                                    >
                                        Додати підрозділ
                                    </button>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}