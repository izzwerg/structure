import Modal from '@mui/material/Modal';

export default function ConfirmUnassign({ unassignModalOpen, handleCloseUnassignConfirm, personToUnassign, handleConfirmUnassign }) {

    return (
        <Modal open={unassignModalOpen} onClose={handleCloseUnassignConfirm}>
            <div className="modal_content modal_confirm">
                <h3>Підтвердження зняття з посади</h3>
                <p>
                    Ви дійсно бажаєте зняти з посади особу{' '}
                    <strong>
                        {personToUnassign &&
                            `${personToUnassign.lastName} ${personToUnassign.firstName} ${personToUnassign.middleName}`.trim()}
                    </strong>
                    ?
                </p>
                <div className="form_actions">
                    <button onClick={handleConfirmUnassign} className="btn_danger">
                        Так, зняти
                    </button>
                    <button onClick={handleCloseUnassignConfirm} className="btn_secondary">
                        Скасувати
                    </button>
                </div>
            </div>
        </Modal>
    )
}