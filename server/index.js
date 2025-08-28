const express = require("express");
const cors = require("cors");
const fs = require("fs");
const WebSocket = require("ws");
const http = require("http")
const crypto = require("crypto");
const process = require("process");
const User = require("./classes/User");
const Room = require("./classes/Room");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

app.use(express.json());
app.use(cors({origin: "*"}))


const ROOM_LIMIT = 5;

const rooms = {};

app.get("/", (req, res) => {
    res.send({message: "Hello World"});
})

app.get("/wake-up", (req, res) => {

    console.log("Received wake up request!");

    res.send(JSON.stringify({message: "Backend awake"}));
})

// rooms -> {"roomId1": {Room Object}, "roomId2" : {RoomObject}}
// RoomObject -> {users: [UserObject, UserObject, ....]
//                inContol: userName}
//  UserObject -> {ws: WebSocket, userName: String, isAdmin: boolean}
//

// rooms -> {"roomID": new Room(...), "roomID": new Room(...)}
// we need to have rooms as an hashmap so that we can access the Room object in constant time
// rather than linear time which would have happened if we use array
// Room - {users: [new User(..), new User()],
//         boardLock: {Object with properties}, roomId: "......" }
// User - {userName, ws, isAdmin, isDisabled}
//

const generateUniqueRoomId = () => {

    let ID = crypto.randomUUID();

    while(rooms[ID] !== undefined) {
        // same ID exists
        ID = crypto.randomUUID();
        // the loop goes on until a unique ID is found
    } 

    return ID;
}

const memoryUsageBefore = (pathsLength) => {

    const megaBytes = (process.memoryUsage().heapUsed / 1048576).toFixed(2);

    console.log("-".repeat(20));
    console.log(`Before for len = ${pathsLength}: ${megaBytes} MB`);
    console.log("-".repeat(20));
}

const memoryUsageAfter = (pathsLength) => {

    const megaBytes = (process.memoryUsage().heapUsed / 1048576).toFixed(2);

    console.log("-".repeat(20));
    console.log(`After for len = ${pathsLength}: ${megaBytes} MB`);
    console.log("-".repeat(20));
}

const broadcastToRoom = (roomId, action, payload) => {

    // we will broadcase to all in the room except the user specified in the 'userName' parameter
    if(rooms[roomId] === undefined) return;

    // if(action === "BOARD_STATE_UPDATE") {
    //     memoryUsageBefore(payload.pages[payload.pageIndex].length);
    // }

    const room = rooms[roomId];

    room.getUsers().forEach((user) => {
        if(user._userName !== payload.userName) {

            user._ws.send(JSON.stringify({
                action: action,
                payload: payload
            }), (err) => {
                if(action === "BOARD_STATE_UPDATE") {
                    //console.log("Finished Broadcasting!");
                }
            })
        }
    })

    
    // if(action === "BOARD_STATE_UPDATE") {
    //     memoryUsageAfter(payload.pages[payload.pageIndex].length);

    //     setTimeout(() => {
    //         memoryUsageAfter(payload.pages[payload.pageIndex].length);
    //     }, 2000);
    // }
}


const handleCreateRoom = (ws, payload) => {

    const roomId = generateUniqueRoomId();
    const userObj = new User(payload.userName, ws, true, false);

    rooms[roomId] = new Room(roomId, payload.userName, [userObj]);

    // console.log("Objects created");
    // console.log(rooms[roomId]);

    const data = {
        roomId: roomId,
        users: rooms[roomId].getUsers(),
        admin: rooms[roomId].getAdmin(),
        boardLock: rooms[roomId].getBoardLock()
    }

    try {
        ws.send(JSON.stringify({
            action: "ROOM_CREATED",
            payload: data
        }))

        console.log("ROOM CREATED");
    }
    catch(err) {
        ws.send(JSON.stringify({
            action: "ROOM_CREATION_ERROR",
        }))
    }
}

const handleJoinRoom = (ws, payload) => {

    // when joinging room, current user object needs to be added to the room object's
    // users array and then every other user in that array needs to be broadcasted about the event
    const newUserObj = new User(payload.userName, ws, false, false);
    
    // make sure room with given roomId exists
    if(rooms[payload.roomId] === undefined) {
        ws.send(JSON.stringify({
            action: "ROOM_NOT_FOUND",
        }))
        return;
    }

    // roomId is valid

    const room = rooms[payload.roomId];
    const output = room.addUser(newUserObj);

    switch(output.message) {
        case "USER_NOT_AN_OBJECT":
            console.log("newUserObj is not an Object!");

            ws.send(JSON.stringify({
                action: "USER_NOT_AN_OBJECT"
            }))

            break;
        case "ROOM_IS_FULL":
            console.log("Room is full!");

            ws.send(JSON.stringify({
                action: "ROOM_IS_FULL"
            }))

            break;
        case "DUPLICATE_USERNAME":
        
            ws.send(JSON.stringify({
                action: "DUPLICATE_USERNAME"
            }))

            break;
        case "USER_ADDED":
            console.log("User Added Successfully!");

            const data = {
                roomId: payload.roomId,
                users: room.getUsers(),
                admin: room.getAdmin(),
                boardLock: room.getBoardLock()
            }

            ws.send(JSON.stringify({
                action: "ROOM_JOINED",
                payload: data
            }))

            // now, inform the admin about the new user, and admin sends the updated
            // pages state and pageIndex to the new user
            const adminWS = room.getAdminWS();

            adminWS.send(JSON.stringify({
                action: "SEND_EXISTING_BOARD_DATA",
                payload: {
                    roomId: room.getRoomId(),
                    targetUserName: payload.userName
                }
            }))

            const broadcastPayload = {
                userName: payload.userName,
                users: room.getUsers()
            }

            // broadcast to others about the new user 
            broadcastToRoom(payload.roomId, "NEW_USER_JOINED", broadcastPayload);
            break;
        default:
            
            ws.send(JSON.stringify({
                action: "ROOM_JOIN_ERROR"
            }))
    }

}

const destroyRoom = (userName, roomId) => {
    // admin leaves the room, so broadcast to all and then delete the room

    console.log(`DESTROY ROOM! as Admin left!`);

    const payload = {
        userName: userName,
    }

    broadcastToRoom(roomId, "ADMIN_LEFT", payload);

    // delete the room, after broadcasting
    delete rooms[roomId];
}

const leaveRoom = (userName, roomId) => {
    // some user other than admin leaves the room, just broadcast to all
    // delete the user that left, and send the new array of users object

    console.log("LEAVE ROOM");

    // make sure that admin did not leave, if he did, call destroy room function
    const room = rooms[roomId];

    if(room.getAdmin() === userName) {
        // destroyRoom
        destroyRoom(userName, roomId);
        return;
    }
    // else continue with removing user who left (not admin)
    // and broadcast everyone in the room

    const output = room.removeUser(userName);

    if(output.success === true) {
        console.log("User Removed from Room!");
    }
    else {
        console.log("User not removed from Room");
    }

    const payload = {
        userName: userName,
        users: room.getUsers(),
        admin: room.getAdmin(),
        boardLock: room.getBoardLock()
    }

    broadcastToRoom(roomId, "USER_LEFT", payload);
}

const removeUser = (userName, roomId) => {

    // console.log("REMOVE USER CALLED for", userName);
    // console.log(userName, roomId);
    // when admin kicks out some user
    const room = rooms[roomId];
    const userToBeRemoved = room.getUsers().find((user) => user._userName === userName);

    if(!userToBeRemoved) {
        console.log("userToBeRemoved not found");
        return;
    }

    // send a final event to this user, as "KICK_OUT"
    userToBeRemoved._ws.send(JSON.stringify({
        action: "KICK_OUT",
        payload: {
            adminName: room.getAdmin()
        }
    }))

    // this method handles resetting the boardLocks
    room.removeUser(userToBeRemoved._userName);

    const payload = {
        userName: userName,
        users: room.getUsers(),
        admin: room.getAdmin(),
        boardLock: room.getBoardLock()
    }

    setTimeout(() => {
        broadcastToRoom(roomId, "USER_LEFT", payload);
    }, 500)

}

const disableUser = (userName, roomId) => {

    console.log("DISABLE USER CALLED for", userName);

    const room = rooms[roomId];

    const output = room.disableUser(userName);

    if(output.success === false) {
        console.log(output.message);
        return;
    }

    // user has been disabled, broadcast everyone with new updated users array
    // also inform the disabled user, and send updated users  
    output.ws.send(JSON.stringify({
        action: "DISABLED",
        payload: {
            adminName: room.getAdmin(),
            users: room.getUsers()
        }
    }))

    const data = {
        userName: userName,
        users: room.getUsers()
    }

    setTimeout(() => {
        broadcastToRoom(roomId, "UPDATED_USERS", data);
    }, 500)
}

const enableUser = (userName, roomId) => {

    const room = rooms[roomId];

    const output = room.enableUser(userName);

    if(output.success === false) {
        console.log(output.message);
        return;
    }

    // the user was enabled, so inform that particular user
    // broadcast updated users array to evreyone in the room 

    output.ws.send(JSON.stringify({
        action: "ENABLED",
        payload: {
            adminName: room.getAdmin(),
            users: room.getUsers()
        }
    }))

    // now broadcast updated users to everyone
    const data = {
        userName: userName,
        users: room.getUsers()
    }

    setTimeout(() => {
        broadcastToRoom(roomId, "UPDATED_USERS", data);
    }, 500)
}

const requestEnable = (userName, roomId) => {

    // send admin of the room an event "ENABLE_REQUEST" with the "userName" 
    // of the user who requested
    const room = rooms[roomId];

    const data = {
        userName: userName
    }

    const adminWS = room.getAdminWS();

    if(adminWS !== null) {

        setTimeout(() => {

            adminWS.send(JSON.stringify({
                action: "ENABLE_REQUEST",
                payload: data
            }));

        }, 200)
    }

}

const rejectEnableRequest = (userName, roomId) => {

    // we get the ws object by userName
    // and update that user about the rejection of enable request

    const room = rooms[roomId];

    const targetUserWS = room.getWsByUserName(userName);

    if(targetUserWS !== null) {

        targetUserWS.send(JSON.stringify({
            action: "ENABLE_REQUEST_REJECTED"
        }))
    }
}

const acceptEnableRequest = (userName, roomId) => {

    // this can be same as the enableUser() function
    enableUser(userName, roomId);
}


const requestLock = (ws, userName, mode, roomId) => {

    const room = rooms[roomId];

    const isLockAvailable = room.requestLock(userName, mode);

    if(isLockAvailable) {

        const data = {
            boardLock: room.getBoardLock(),
            userName: userName
        }

        console.log("LOCK AQUIRED by", userName, "for", room.getBoardLock().mode);

        ws.send(JSON.stringify({
            action: "LOCK_ACQUIRED",
            payload: data
        }));

        // if this user acquired the lock, all others should be notified
        // and update their lock available status
        broadcastToRoom(roomId, "LOCK_UPDATED", data);
    }
    else {

        const data = {
            boardLock: room.getBoardLock()
        }

        console.log("LOCK NOT ACQUIRED BY", userName);
        console.log("LOCK WITH = ", room.getBoardLock().userName);

        ws.send(JSON.stringify({
            action: "LOCK_NOT_ACQUIRED",
            payload: data
        }))
    }
}

const updateBoardActivity = (userName, roomId, page, pageIndex) => {

    // broadcasted to all in the room if the user in control draws, adds text or erases some path

    // first call room.updateActivity(userName)
    // to update the lastInteractionTime
    const room = rooms[roomId];

    if(room.hasSingleUser()) {
        //console.log("No one else in the room!");
        return;
    }

    room.updateBoardActivity(userName);
    // updates the lastInteractionTime only and nothing else

    // then send update "pages" and pageIndex to all the others in the room

    const data = {
        page: page,
        pageIndex: pageIndex,
        userName: userName
    }

    broadcastToRoom(roomId, "BOARD_STATE_UPDATE", data);
}

const updateTempTextData = (payload) => {

    // broadcast text data to everyone in the room while the user in control
    // is adding the text
    const data = {
        text: payload.text,
        font: payload.font,
        normalizedFontSize: payload.normalizedFontSize,
        normalizedCoordinates: payload.normalizedCoordinates,
        fontColor: payload.fontColor,
        userName: payload.userName
    }

    broadcastToRoom(payload.roomId, "TEMP_TEXT_DATA_UPDATE", data);
}

const removeTempTextData = (payload) => {

    broadcastToRoom(payload.roomId, "REMOVE_TEMP_TEXT_DATA", {});
}

const updatePageType = (payload) => {

    const data = {
        pageType: payload.pageType,
        ruleColor: payload.ruleColor,
        ruleHeight: payload.ruleHeight,
        userName: payload.userName
    }

    broadcastToRoom(payload.roomId, "PAGE_TYPE_UPDATE", data);
}

const addNewPage = (payload) => {

    // just send "NEW_PAGE_ADDED" event to all
    const data = {
        userName: payload.userName
    }

    broadcastToRoom(payload.roomId, "NEW_PAGE_ADDED", data);
}

const incrementPage = (payload) => {
    // page can only be moved forward if no one is currently focused
    // we need to check if boardLock.isFocused is false
    // then only, we broadcast event to change the page to next
    const room = rooms[payload.roomId];
    const canIncrement = !room.getBoardLock().isFocused;
    
    if(canIncrement) {
        const data = {
            pageIndex: payload.pageIndex
        }
        // the same event is sent to all in the room
        // including the user who requested
        broadcastToRoom(payload.roomId, "PAGE_INCREMENT", data);
    }
    else {
        // inform user about the failed increment request
        const targetUserWS = room.getWsByUserName(payload.userName);

        targetUserWS.send(JSON.stringify({
            action: "BOARD_IS_BUSY"
        }))
    }
}

const decrementPage = (payload) => {
    // same as increment page, we focus on whether the board is in use or not

    const room = rooms[payload.roomId];
    const canDecrement = !room.getBoardLock().isFocused;

    if(canDecrement) {
        // if we don't provide the userName in this object
        // the event is broadcasted to everyone including the user decrementing the page
        // this makes sure everything is consistent
        const data = {
            pageIndex: payload.pageIndex
        }
        
        broadcastToRoom(payload.roomId, "PAGE_DECREMENT", data);
    }
    else {
        // inform user about failed rqeuest
        const targetUserWS = room.getWsByUserName(payload.userName);

        targetUserWS.send(JSON.stringify({
            action: "BOARD_IS_BUSY"
        }))
    }
}

const clearCanvas = (payload) => {
    // make sure the payload.userName is admin
    // if not send "ACTION_RESTRICTED"
    // if the user is admin
    // make sure the board is not focused
    console.log("Clear Canvas Called!");

    const room = rooms[payload.roomId];
    const isAdmin = payload.userName === room.getAdmin();
    const targetUserWS = room.getWsByUserName(payload.userName);

    if(!isAdmin) {
        // action restricted 
        // const targetUserWS = room.getWsByUserName(payload.userName);
        console.log("Non-admin trying to clear canvas");

        targetUserWS.send(JSON.stringify({
            action: "ACTION_RESTRICTED"
        }))
    }
    else {
        console.log("Admin trying to clear canvas");
        // make sure the board is not focused
        // clear the canvas and broadcast updates to all
        const canClear = !room.getBoardLock().isFocused;

        if(canClear) {
            // send the pageIndex of the page that is cleared

            // if we don't provide the userName in this object
            // the event is broadcasted to everyone including the user clearing the canvas
            // this makes sure everything is consistent
            const data = {
                pageIndex: payload.pageIndex
            }

            console.log("Canvas was cleared");
            broadcastToRoom(payload.roomId, "CANVAS_CLEARED", data);
        }
        else {
            console.log("Board is busy!");
            // board is busy
            targetUserWS.send(JSON.stringify({
                action: "BOARD_IS_BUSY"
            }))
        }
    }

}

const existingBoardData = (payload) => {
    // find ws by user name
    // send entire pages state to that user
    //console.log("inside existingBoardData()");
    const room = rooms[payload.roomId];
    
    const targetUserWS = room.getWsByUserName(payload.userName);

    const data = {
        pages: payload.pages,
        pageIndex: payload.pageIndex
    }

    try {
        targetUserWS.send(JSON.stringify({
            action: "EXISTING_BOARD_DATA",
            payload: data
        }))
    }   
    catch(err) {
        console.log("Error sending existing board data!");
    }
}

const releaseFocus = (userName, roomId) => {

    // turns isFocused flag to false
    const room = rooms[roomId];

    room.releaseFocus(userName);

    // broadcast update lock event to everyone in the room
    // so that the status near userName of person in control changes
    const data = {
        boardLock: room.getBoardLock(),
    }

    broadcastToRoom(roomId, "LOCK_UPDATED", data);
}




wss.on("connection", (ws, req) => {

    console.log("NEW CLIENT CONNECTED");

    ws.on("message", (data) => {
        // message format might be invalid, we might have an error when we use
        // JSON.parse() 

        try {
            const message = JSON.parse(data);
            //console.log(message);

            switch(message.action) {
                case "CREATE_ROOM":
                    // console.log("Create Room Event");
                    handleCreateRoom(ws, message.payload);
                    break;
                case "JOIN_ROOM":
                    // console.log("Join Room Event");
                    handleJoinRoom(ws, message.payload);
                    break;
                case "DESTROY_ROOM":
                    // happens when admin leaves the room
                    destroyRoom(message.payload.userName, message.payload.roomId);
                    break;
                case "LEAVE_ROOM":
                    // happens when some user other than the admin leaves the room
                    leaveRoom(message.payload.userName, message.payload.roomId);
                    break;
                case "REMOVE_USER":
                    // when the admin removes some user
                    removeUser(message.payload.userName, message.payload.roomId);
                    break;
                case "DISABLE_USER":
                    // when admin tries to disable some user
                    disableUser(message.payload.userName, message.payload.roomId);
                    break;
                case "ENABLE_USER":
                    // when admin enables an already disabled user
                    enableUser(message.payload.userName, message.payload.roomId);
                    break;
                case "REQUEST_ENABLE":
                    // when a disabled user reqeusts admin to enable him
                    requestEnable(message.payload.userName, message.payload.roomId);
                    break;
                case "REJECT_ENABLE_REQUEST":
                    // if admin rejects the enable request ot the given userName
                    rejectEnableRequest(message.payload.userName, message.payload.roomId);
                    break;
                case "ACCEPT_ENABLE_REQUEST":
                    // if admin accepts enable rqeuest
                    acceptEnableRequest(message.payload.userName, message.payload.roomId);
                    break;
                case "REQUEST_LOCK":
                    // sent by the client whenever he wants to
                    // draw freehand, add text
                    // undo, redo, add new page
                    console.log("GOT REQUEST LOCK FROM CLIENT");
                    requestLock(ws, message.payload.userName, 
                        message.payload.mode, message.payload.roomId);

                    break;
                case "UPDATE_BOARD_ACTIVITY":
                    // this is sent by the client as points are drawn on board
                    // or if text is added, or if some path is erased
                    // this updates the lastInteractionTime of boardLock
                    // and also sends updated "page" state to all others in the room
                    updateBoardActivity(
                        message.payload.userName, message.payload.roomId, 
                        message.payload.page, message.payload.pageIndex
                    )
                    break;
                case "UPDATE_TEMP_TEXT_DATA":
                    // sent by the person adding text in collaboration mode
                    // broadcasted to all in the room, for temp display of the text being added
                    // if the user does not add and cancel that text, another event is sent to clear the states
                    updateTempTextData(message.payload);
                    break;
                case "UPDATE_PAGE_TYPE":
                    // sent by anyone in the room, to change page type, rule color, height
                    updatePageType(message.payload)
                    break;
                case "REMOVE_TEMP_TEXT_DATA":
                    // sent by user that was adding text, but decided to cancel it and remove it
                    removeTempTextData(message.payload);
                    break;
                case "ADD_NEW_PAGE":
                    // if any user in the room adds new page
                    addNewPage(message.payload);
                    break;
                case "INCREMENT_PAGE":
                    // any user requests to increment page
                    incrementPage(message.payload);
                    break;
                case "DECREMENT_PAGE":
                    // some user requests to decrement page
                    decrementPage(message.payload);
                    break;
                case "CLEAR_CANVAS":
                    // when some user requests to clear shared canvas
                    clearCanvas(message.payload);
                    break;
                case "RELEASE_FOCUS":
                    // sent by client when he is finished drawing a path
                    // or adding a text
                    // we turn the isFocused flag as false and allow other users
                    // to take control if 1 second passes
                    releaseFocus(message.payload.userName, message.payload.roomId);
                    break;
                case "EXISTING_BOARD_DATA":
                    // sent by the admin with userName, pages state page Index
                    // to be sent to the newly joined target user
                    existingBoardData(message.payload);
                    break;
                default: 
                    console.log("Invalid Action!");
            }
        }
        catch(err) {
            console.log("Invalid Message Format!");
            ws.send(JSON.stringify({error: "Invalid Message format"}));
        }

    })

    ws.on("close", () => {
        console.log("Connection closed by client");

        // Broadcast to all in the same room "USER_LEFT"
        // we only have the WebSocket object of user who left, we have to find roomId using that
        // also, if ADMIN leaves, destroy the room and broadcast to all that "ADMIN_LEFT"
        
        for(const roomId in rooms) {
            // search every room for user with websocket = 'ws'
            const room = rooms[roomId];

            const targetUser = room.getUsers().find((user) => user._ws === ws);


            if(targetUser) {
                console.log("Leaving user = ", targetUser._userName);
                // check if the user that left is admin or not
                // and accordingly, call the leaveRoom or destroyRoom function
                if(targetUser._isAdmin) {
                    // destroy the room
                    destroyRoom(targetUser._userName, roomId);
                }
                else {
                    // don't destroy the room
                    leaveRoom(targetUser._userName, roomId);
                }
                break;
            }
        }

    })

    ws.on("error", (err) => {
        console.log("Some Error!");
    })

})


const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
    console.log(`Server Listening on port: ${PORT}`);
})


