import './Tree.css';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '@mui/material';

export default function PositionNode({
    position,
    person,
    isEditMode,
    onAssignClick,
    onUnassignClick,
    onViewPerson,
    onEditPosition,
    onDeletePosition,
}) {
    const { canEdit } = useAuth();
    return (
        <div className="position_node">
            <div className="position_info">
                <Tooltip title={"Тариф: " + position.tariff} leaveDelay={200}>
                    <span
                        className="position_id"
                    >{position.treeNodeId}</span>
                </Tooltip>
                <Tooltip title={"ШПК: " + position.rank} leaveDelay={200}>
                    <span
                        className="position_title"
                    >
                        {position.shortTitle}
                    </span>
                </Tooltip>
            </div>

            <div className="position_right">
                <div className="position_person">
                    {person ? (
                        <div className="assigned_person">
                            <span className="person_name">{`${person.rank} ${person.lastName} ${person.firstName[0]}. ${person.middleName ? person.middleName[0] + '.' : ''}`}</span>
                            <button
                                type="button"
                                className="btn_view_person"
                                title="Переглянути картку особи"
                                onClick={() => onViewPerson(person)}
                            >
                                <img src="eye.svg" alt="View Person" className="btn_icon" />
                            </button>
                            {canEdit && <button
                                type="button"
                                className="btn_unassign"
                                title="Зняти з посади"
                                onClick={() => onUnassignClick(person)}
                            >
                                <img src="close.svg" alt="remove person" className="btn_icon" />
                            </button>}
                        </div>
                    ) : (
                        <div className="unassigned">
                            {canEdit && <button
                                type="button"
                                className="btn_assign"
                                onClick={() => onAssignClick(position.treeNodeId)}
                            >
                                + Особа
                            </button>}
                        </div>
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
        </div >
    );
}