import './Tree.css';

export default function PositionNode({
    position,
    person,
    isEditMode,
    onAssignClick,
    onUnassignClick,
    onEditPosition,
    onDeletePosition,
}) {
    return (
        <div className="position_node">
            <div className="position_info">
                <span className="position_id">{position.treeNodeId}</span>
                <span className="position_title">{position.shortTitle}</span>
            </div>

            <div className="position_right">
                <div className="position_person">
                    {person ? (
                        <div className="assigned_person">
                            <span>{`${person.lastName} ${person.firstName[0]}. ${person.middleName ? person.middleName[0] + '.' : ''}`}</span>
                            <button
                                type="button"
                                className="btn_unassign"
                                title="Зняти з посади"
                                onClick={() => onUnassignClick(person._id)}
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="btn_assign"
                            onClick={() => onAssignClick(position.treeNodeId)}
                        >
                            + Особа
                        </button>
                    )}
                </div>

                {isEditMode && (
                    <div className="node_actions">
                        <button
                            type="button"
                            className="btn_edit_node"
                            title="Редагувати посаду"
                            onClick={() => onEditPosition(position)}
                        >
                            ✎
                        </button>
                        <button
                            type="button"
                            className="btn_delete_node"
                            title="Видалити посаду"
                            onClick={() => onDeletePosition(position._id)}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}