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
    onDeletePosition,
    onDeleteSubdivision,
}) {
    const items = subdivision.items || [];

    return (
        <div className="subdivision_node">
            <div className="subdivision_header">
                <span className="subdivision_title">{subdivision.title}</span>
                {isEditMode && (
                    <button
                        type="button"
                        className="btn_delete_node"
                        title="Видалити підрозділ із усім вмістом"
                        onClick={() => onDeleteSubdivision(subdivision._id, subdivision.title)}
                    >
                        ✕ Видалити підрозділ
                    </button>
                )}
            </div>

            <div className="subdivision_content">
                {/* 1. Якщо підрозділ порожній — виводимо кнопки для першого елемента */}
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

                {/* 2. Якщо підрозділ містить елементи — виводимо кожен елемент і кнопки ПІСЛЯ нього */}
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
                                    onDeletePosition={onDeletePosition}
                                    onDeleteSubdivision={onDeleteSubdivision}
                                />
                            );
                        }
                    }

                    return (
                        <React.Fragment key={item.itemId || index}>
                            {renderedNode}

                            {/* Кнопки вставки строго після кожного елемента */}
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