import React, { useEffect, useRef } from 'react'
import "./modalStyles.css";


function CollaborateModal({userName, setUserName, createRoom, roomId,
    setRoomId, joinRoom, closeCollaborateModal, collaborateError,
    collaborateModalRef, createLoading, joinLoading
}) {

  const userNameRef = useRef(null);

  useEffect(() => {

    userNameRef.current.focus();

  }, []);

  return (
    <dialog className="collaborate-modal" id="collaborate-modal"
    ref={collaborateModalRef}>
        <div className="top-section">
          <input placeholder="Enter name" id="user-name" maxLength={18}
          value={userName} onChange={(e) => setUserName(e.target.value.trim())} autoComplete='off'
          ref={userNameRef} />
        </div>
        <div className="bottom-section">
          <button onClick={() => createRoom()}
            disabled={userName.trim().length <= 2 || roomId.length > 0 || createLoading}
          >
          {createLoading ? 
            <div className='loading-spinner'></div>
            :
            "Create Room"
          }
          </button>
          <p>OR</p>
          <input placeholder="Room ID" id="room-id" 
          value={roomId} onChange={(e) => setRoomId(e.target.value.trim())} autoComplete='off'/>
          <button onClick={() => joinRoom()}
            disabled={userName.trim().length === 0 || roomId.length === 0 || joinLoading} 
          >
          {joinLoading ? 
            <div className='loading-spinner'></div>
            :
            "Join Room"
          }
          </button>
        </div>
        <div className="close-modal"
        onClick={() => closeCollaborateModal()}>
          <span className="material-symbols-outlined">
            close
          </span>
        </div>
        {collaborateError !== "" && 
            <div className="collaborate-error">
              {collaborateError}
            </div>
        }
      </dialog>
  )
}

export default CollaborateModal