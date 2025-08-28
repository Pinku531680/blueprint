import React, {useEffect, useState} from 'react';
import "./UserDisabled.css";


function UserDisabled({currentUserData, currentRoomData, ws}) {

  const [requested, setRequested] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  const startCountdown = (n) => {
    setSecondsRemaining(n);
    setRequested(true);
  }
  
  const requestEnable = () => {

    console.log("Request admin to enable");

    startCountdown(60);

    // send request enable event and set timer for 60 seconds
    // if those 60 are over and the user is still disabled, then he can send the request
    // again not twice within a minute
    // if request is accepted, the isDisabled boolean flag turns true and this compoeent disappears

    const data = {
      action: "REQUEST_ENABLE",
      payload: {
        userName: currentUserData.userName,
        roomId: currentRoomData.roomId
      }
    }

    ws.current.send(JSON.stringify(data));
  };


  useEffect(() => {

    let intervalId = null;

    if(secondsRemaining > 0 && requested) {

        intervalId = setInterval(() => {
            setSecondsRemaining((prev) => prev - 1);
        }, 1000)

    }    
    else if(secondsRemaining === 0) {
        setRequested(false);

        if(intervalId) {
            clearInterval(intervalId);
        }
    }

    return () => clearInterval(intervalId)

  }, [secondsRemaining, requested])
  
  return (
    <div className='user-disabled'>
        <p>Admin disabled you</p>
        <button onClick={requestEnable} disabled={requested}>
            <span>Request Enable</span>
            {requested && 
                <p>
                    {`(${secondsRemaining})`}
                </p>
            }
        </button>
    </div>
  )
}

export default UserDisabled