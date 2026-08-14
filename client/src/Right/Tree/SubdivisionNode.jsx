// import React from 'react';
import PositionNode from './PositionNode';
import './Tree.css';

export default function SubdivisionNode({
    subdivision,
    subdivisionsMap,
    positionsMap,
    personsByNodeId,
    onOpenAddModal,
    onAssignClick,
    onUnassignClick,
}) {
    return (
        <div className="subdivision_node">
            <div className="subdivision_header">
                <span className="subdivision_title">{subdivision.title}</span>
            </div>

            <div className="subdivision_content">
                {subdivision.items?.map((item) => {
                    if (item.kind === 'position') {
                        const pos = positionsMap[item.itemId];
                        if (!pos) return null;
                        const assignedPerson = personsByNodeId[pos.treeNodeId];

                        return (
                            <PositionNode
                                key={pos._id}
                                position={pos}
                                person={assignedPerson}
                                onAssignClick={onAssignClick}
                                onUnassignClick={onUnassignClick}
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
                                onOpenAddModal={onOpenAddModal}
                                onAssignClick={onAssignClick}
                                onUnassignClick={onUnassignClick}
                            />
                        );
                    }

                    return null;
                })}

                {/* Кнопки додавання елементів всередині поточного підрозділу */}
                <div className="action_buttons_group">
                    <button
                        type="button"
                        className="btn_tree_action"
                        onClick={() => onOpenAddModal('position', subdivision._id)}
                    >
                        Додати посаду
                    </button>
                    <button
                        type="button"
                        className="btn_tree_action"
                        onClick={() => onOpenAddModal('subdivision', subdivision._id)}
                    >
                        Додати підрозділ
                    </button>
                </div>
            </div>
        </div>
    );
}