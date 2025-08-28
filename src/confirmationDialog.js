import React, { useEffect } from 'react'
import "./modalStyles.css";


function ConfirmationDialog({confirmationDialogMessage, confirmationDialogRef,
    closeConfirmationDialog, confirmationDialogType, confirmationDialogUserName,
    currentRoomData, currentUserData, pageIndex, ws
}) {


  const handleNevermind = () => {

    if(confirmationDialogType === "ENABLE_REQUEST") {
      // enable request was rejected by the admin
      const data = {
        action: "REJECT_ENABLE_REQUEST",
        payload: {
          userName: confirmationDialogUserName,
          roomId: currentRoomData.roomId
        }
      };
     
      ws.current.send(JSON.stringify(data));
    }

    // for all other actions, we don't need to do anything

    closeConfirmationDialog();
  }

  const handleConfirm = () => {
    // we decide the action to send to the backend from confirmationDIalogType
    // and confirmationDialogUsername
    // other than that, we can use currentRoomData.roomId

    if(confirmationDialogType === "REMOVE_PARTICIPANT") {

      console.log("Request to remove participant");
      
      const data = {
        action: "REMOVE_USER",
        payload: {
          userName: confirmationDialogUserName,
          roomId: currentRoomData.roomId
        }
      }

      ws.current.send(JSON.stringify(data));
    }
    else if(confirmationDialogType === "DISABLE_PARTICIPANT") {

      console.log("Request to disable participant");

      const data = {
        action: "DISABLE_USER",
        payload: {
          userName: confirmationDialogUserName,
          roomId: currentRoomData.roomId
        }
      }

      ws.current.send(JSON.stringify(data));
    }
    else if(confirmationDialogType === "ENABLE_PARTICIPANT") {

      console.log("Request to enable participant");

      const data = {
        action: "ENABLE_USER",
        payload: {
          userName: confirmationDialogUserName,
          roomId: currentRoomData.roomId
        }
      }

      ws.current.send(JSON.stringify(data));
    }
    else if(confirmationDialogType === "ENABLE_REQUEST") {
      // this is an incoming enable request
      // when a disabled user requests admin to enable him and admin enables him
      // send action with username = enableRequest.userName
      // which enables the user and broadcasts everyone in the room the updated users
      
      const data = {
        action: "ACCEPT_ENABLE_REQUEST",
        payload: {
          userName: confirmationDialogUserName,
          roomId: currentRoomData.roomId
        }
      };

      ws.current.send(JSON.stringify(data));
    }
    else if(confirmationDialogType === "CLEAR_CANVAS") {
      // when some user in the room sends request to clear the canvas
      // we send roomId, userName, pageIndex
      // all the other logic is handled in the server side

      const data = {
        action: "CLEAR_CANVAS",
        payload: {
          userName: currentUserData.userName,
          roomId: currentRoomData.roomId,
          pageIndex: pageIndex
        }
      }

      ws.current.send(JSON.stringify(data));
    }
    else if(confirmationDialogType === "LEAVE_ROOM") {
      // "Leave" button clicked
      // send "LEAVE_ROOM" action, the rest is handled on server-side

      const data = {
        action: "LEAVE_ROOM",
        payload: {
          userName: currentUserData.userName,
          roomId: currentRoomData.roomId
        }
      }

      ws.current.send(JSON.stringify(data));
    }

    closeConfirmationDialog();

    // reload the page, if room left
    if(confirmationDialogType === "LEAVE_ROOM") {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }

  }

  useEffect(() => {

  }, [])

  return (
    <dialog ref={confirmationDialogRef} id="confirmation-dialog">
        <p>
          {confirmationDialogUserName.length > 0 && 
            <span className='username'>{confirmationDialogUserName}</span> 
          }
          {confirmationDialogMessage}
        </p>
        <div className="confirmation-buttons">
            <button onClick={handleNevermind}>
              Nevermind
            </button>
            <button onClick={handleConfirm}>
              Confirm
            </button>
        </div>
    </dialog>
  )
}

export default ConfirmationDialog