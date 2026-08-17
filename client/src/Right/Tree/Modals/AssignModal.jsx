import Modal from '@mui/material/Modal';

const AssignModal = ({ assignModalOpen, setAssignModalOpen, handleConfirmAssign, selectedPositionNodeId, unassignedPersons, selectedPersonId, setSelectedPersonId }) => {
    return (
        <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)}>
            <div className="modal_content">
                <form onSubmit={handleConfirmAssign} className="property_form">
                    <h3>Призначити особу на посаду (ID: {selectedPositionNodeId})</h3>
                    <div className="form_group">
                        <label>Оберіть особу зі списку (Tree Node ID = none):</label>
                        {unassignedPersons.length === 0 ? (
                            <p>Вільні картки відсутні.</p>
                        ) : (
                            <select
                                value={selectedPersonId}
                                onChange={(e) => setSelectedPersonId(e.target.value)}
                                required
                            >
                                <option value="">-- Оберіть картку --</option>
                                {unassignedPersons.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {`${p.lastName} ${p.firstName} ${p.middleName}`.trim()}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="form_actions">
                        <button
                            type="submit"
                            className="btn_primary"
                            disabled={unassignedPersons.length === 0}
                        >
                            Призначити
                        </button>
                        <button
                            type="button"
                            onClick={() => setAssignModalOpen(false)}
                            className="btn_secondary"
                        >
                            Скасувати
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    )
}

export default AssignModal;