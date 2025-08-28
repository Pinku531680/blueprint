import React from 'react';
import "./modalStyles.css";


function ParticipantsModal({currentRoomData, currentUserData, closeParticipantsModal, 
    participantsModalRef, setConfirmationDialogMessage,
    setConfirmationDialogType, setConfirmationDialogUserName, 
    openConfirmationDialog
}) {

  const disableParticipant = (userName) => {

    // update confirmationType confirmationMessage, and username
    setConfirmationDialogType("DISABLE_PARTICIPANT");
    setConfirmationDialogUserName(userName);
    setConfirmationDialogMessage("will be disabled from making any changes. Are you sure?")

    openConfirmationDialog();
  }

  const enableParticipant = (userName) => {

    // update similar message and type
    setConfirmationDialogType("ENABLE_PARTICIPANT");
    setConfirmationDialogUserName(userName);
    setConfirmationDialogMessage("will be authorized to make any changes. Are you sure?")

    openConfirmationDialog();
  }

  const removeParticipant = (userName) => {

    // update confirmationType confirmationMessage, and username
    setConfirmationDialogType("REMOVE_PARTICIPANT");
    setConfirmationDialogUserName(userName);
    setConfirmationDialogMessage("will be removed from the room. Are you sure?")

    openConfirmationDialog();

  }

  return (
    <dialog id="participants-modal" ref={participantsModalRef}>
        <div className='heading'>
            <p>Participants({currentRoomData.users?.length})</p>
        </div>
        <div className='participants'>
            {currentRoomData.users?.map((user, index) => {
                const {_userName, _isDisabled, _isAdmin} = user;

                return (
                    <div key={index}>
                        {_isAdmin && 
                          <div className="admin-indicator">
                            Admin
                          </div>
                        }
                        {
                          _isDisabled && 
                          <div className="disabled-indicator">
                            Disabled
                          </div>
                        }
                        <div className="left-side">
                            <p>{_userName}{currentUserData.userName === _userName ? " (You)" : ""}</p>
                        </div>
                        <div className="right-side">
                            <span className="material-symbols-outlined"
                            style={{
                              display: (currentUserData.isAdmin && currentUserData.userName !== _userName) ? "flex" : "none"
                            }}
                            id={_isDisabled ? "disable-participant-disabled" : "disable-participant"} 
                            onClick={() => _isDisabled ? enableParticipant(_userName) : disableParticipant(_userName)}>
                                edit_off
                            </span>
                            <span className="material-symbols-outlined"
                            style={{
                              display: (currentUserData.isAdmin && currentUserData.userName !== _userName) ? "flex" : "none"
                            }}
                            id='remove-participant'
                            onClick={() => removeParticipant(_userName)}>
                                person_remove
                            </span>
                        </div>    
                    </div>
                )
            })}
        </div>

        <div className="close-modal"
        onClick={() => closeParticipantsModal()}>
          <span className="material-symbols-outlined">
            close
          </span>
        </div>
    </dialog>
  )
}

export default ParticipantsModal