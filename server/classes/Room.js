const ROOM_LIMIT = 5;

// the personInControl prop is initially null
// as some user starts interacting with the board
// he becomes the personInControl and no one can interact simultaneously with the board
// the things/actions that disable other users from interacting for the moment are
// Drawing paths, or adding text
// erasing paths

// other things like, just selecting sizes, font colors, types still enable others
// to take over control and start drawing or adding text


// the personInControl loses control internally, if
// he does not draw a path or add a text for 1 second
// upon which, any other use can take over controle

class Room {

    constructor(roomId, adminName, users = []) {
        this.roomId = roomId;
        this.users = users;
        this.admin = adminName;

        // the admin will have the control initially 
        // and the lastInteractionTime will be the creation time of the Room object

        this.boardLock = {
            userName: adminName,
            mode: null, // "pen" or "text"
            lastInteractionTime: Date.now(),  // only when user was using pen tool
            isFocused: false   // when using keeps the cursor down, or is adding text
                                // this field prevents interruption in these cases
        }
    }

    canAquireLock(userName) {
        // if no one has the lock, give it
        // also, we might have useName != null but the lock might be free
        // in that case, we check the mode and give the lock

        if(this.boardLock.userName === null || this.boardLock.mode === null) {
            console.log("LOCK AQUIRED, NO USER HAD THE LOCK");
            return true;
        }

        // if previous user was using pen tool, we make sure that it has been at least
        // 1 second since his last interaction
        if(this.boardLock.mode === "pen") {

            // the the same user which currently has the lock, requests it again
            // we don't need to wait for THRESHOLD or isFocused = false, we can just give it
            if(this.boardLock.userName === userName) {
                //console.log("LOCK ACQUIRED BY THE SAME USER");
                return true;
            }

            // if the user is focused, which means that he has kept the cursor down
            // and not leaving it (whether moving or not)
            // we cannot give control to anyone else in that case
            if(this.boardLock.isFocused) {
                console.log("isFocused, so LOCK NOT ACQUIRED");
                return false;
            }

            //otherwise, we wait for at least 1 second since the lastInteractionTime
            // to give lock to other user
            const THRESHOLD = 1000;

            const idleTime = Date.now() - this.boardLock.lastInteractionTime;

            // NOTE - change to 1 second after testing
            if(idleTime >= THRESHOLD) {
                console.log("LOCK AQUIRED AS USER WAS IDLE");
            }
            else {
                console.log("LOCK NOT AQUIRED, USER WAS NOT IDLE FOR >= 1 SEC");
            }

            return (idleTime >= THRESHOLD) ? true : false;
        }

        // if previous user in control was adding text, we have to make sure that 
        // the text has been successfully added before giving contorl to anyone else
        if(this.boardLock.mode === "text") {
            // if the user incontrol adds text successfully, it will send the event
            // to change the isFocused to false
            // and if that happens, any other user can aquire the lock
            if(this.boardLock.isFocused === false) {
                console.log("LOCK AQUIRED AS USER HAS ADDED TEXT");
                return true;
            }
            else {
                console.log("LOCK NOT AQUIRED AS USER IS ADDING TEXT");
                return false;
            }
        }

        // if previous user in controlwas using eraser tool, we just check whether isFocusd is false
        // or not, because after erasing is over, release focus event is sent from that user
        if(this.boardLock.mode === "eraser") {
            // the the same user which currently has the lock, requests it again
            // we don't need to wait for THRESHOLD or isFocused = false, we can just give it
            if(this.boardLock.userName === userName) {
                //console.log("LOCK ACQUIRED BY THE SAME USER");
                return true;
            }

            // if the user has put the mouse up and is no longer erasing
            // we wait for 1 seconds at least after the lastInteractionTime if isFocused is false
            // if isFocused is true, we know that the user has not yet finished erasing
            if(this.boardLock.isFocused) {
                console.log("isFocused, LOCK NOT ACQUIRED");
                return false;
            }

            // else ,we wait for 1 seconds minimum after the lastInteractionTime
            // which is updated everytime the user erases some path or finishes erasing
            const THRESHOLD = 1000;

            const idleTime = Date.now() - this.boardLock.lastInteractionTime;

            if(idleTime >= 1000) {
                console.log("LOCK ACQUIRED, AS USER FINISHED ERASING");
            }
            else {
                console.log("LOCK NOT ACQUIRED, AS USER IS ERASING");
            }

            return (idleTime >= THRESHOLD) ? true : false;
        }

        return false;
    }

    requestLock(userName, mode) {

        if(this.canAquireLock(userName)) {
            this.boardLock.userName = userName;
            this.boardLock.mode = mode;
            this.boardLock.lastInteractionTime = Date.now();
            this.boardLock.isFocused = true;

            return true;
        }

        // if lock cannot be aquired
        return false;
    }

    releaseFocus(userName) {
        // called when the user is finished drawing a path or adding text
        // enables others to take control if time threshold passes since lastInteracationTime
        
        if(this.boardLock.userName === userName) {
            this.boardLock.isFocused = false;

            // update the lastInteractionTime as well
            this.boardLock.lastInteractionTime = Date.now();

            console.log("FOCUS RELEASED BY ", userName);
        }
    }

    updateBoardActivity(userName) {
        // this method runs very frequency as the user keeps on drawing and 
        // sending update request everytime some change is made
        // this is very crucial because this decides what the last interaction time of the user
        // will be and whether some other user can aquire control or not
        if(this.boardLock.userName === userName) {

            // const x = (Date.now() - this.boardLock.lastInteractionTime)/1000;

            // console.log("UPDATED interactionTime by ", x, "s");

            this.boardLock.lastInteractionTime = Date.now();
            return true;
        }
        // if the user is adding text, this method does not run frequently because
        // we don't focus on the lastInteractionTime in case of text but rather isAddingText boolean flag  

        return false;
    }

    releaseLock(userName) {
        // the user manually releases lock only when adding text 
        // in case of pen tool, anyone can aquire the lock if it has been more than 1
        // seconds since the last interaction

        if(this.boardLock.userName === userName) {
            this.boardLock.userName = this.admin;
            this.boardLock.mode = null;
            this.boardLock.lastInteractionTime = Date.now();
            this.boardLock.isFocused = false;

            return true;
        }
        
        return false;
    }

    addUser(userObj) {
        if(!(userObj instanceof Object)) {
            return {success: false, message: "USER_NOT_AN_OBJECT"};
        }

        if(this.users.length >= ROOM_LIMIT) {
            return {success: false, message: "ROOM_IS_FULL"};
        }

        if(this.users.find((user) => user._userName === userObj._userName)) {
            return {success: false, message: "DUPLICATE_USERNAME"};
        }

        // if we reach here, there are no issues
        this.users.push(userObj);

        // console.log("USER ADDED");
        // console.log(userObj);

        return {success: true, message: "USER_ADDED"};
    }

    removeUser(userName) {
        // we will remove users by userName

        if(!this.users.find((user) => user._userName === userName)) {
            return {success: false, message: "USER_NOT_FOUND"};
        }

        const userIndex = this.users.findIndex((user) => user._userName === userName);

        // remove this particular object from users array
        this.users.splice(userIndex, 1);

        // this removed user might have the lock
        // we give the lock to the admin after the user is removed
        
        if(this.boardLock.userName === userName) {
            // we set it to the admin 
            // This just sets the username, we are not giving the control to anyone
            // we are just preventing the value from being null

            // this.boardLock.userName = this.admin;
            // this.boardLock.mode = null;
            // this.boardLock.lastInteractionTime = null;
            // this.boardLock.isFocused = false;

            this.releaseLock(userName);   // does the same thing

            // any one can take control from here
        }

        // the removed user cannot be the admin, because no one can remove the admin

        return {success: true, message: "USER_REMOVED"};
    }

    disableUser(userName) {

        const targetUserObj = this.users.find((user) => user._userName === userName);

        // user will be disabled from making any changes on the whiteboard
        if(!targetUserObj) {
            return {success: false, message: "USER_NOT_FOUND"};
        }

        // the user to be disabled might have the boardlock, if that is the case
        // we cannot disable it while isFocused is true
        if(this.boardLock.userName === userName) {

            if(this.boardLock.isFocused) {
                return {success: false, message: "USER_HAS_BOARD_LOCK"};
            }

            // else we can release the lock and continue
            this.releaseLock(userName);
        }

        // if user is found, change the isDisabled status and broadcast updated users array to
        // everyone in room
        targetUserObj._isDisabled = true;

        return {success: true, message: "USER_DISABLED", ws: targetUserObj._ws};
    }

    enableUser(userName) {

        const targetUserObj = this.users.find((user) => user._userName === userName);

        if(!targetUserObj) {
            return {success: false, message: "USER_NOT_FOUND"};
        }

        // else if user is there, change the isDisabled boolean flag
        targetUserObj._isDisabled = false;

        return {success: true, message: "USER_ENABLED", ws: targetUserObj._ws};
    }

    getUsers() {
        return this.users;
    }

    getRoomId() {
        return this.roomId;
    }

    hasSingleUser() {
        if(this.users.length > 1) {
            return false;
        }

        return true;
    }

    getAdmin() {

        // make sure room is not empty
        if(this.users.length === 0) {
            return null;
        }

        const admin = this.users.find((user) => user._isAdmin === true);

        return admin._userName;
    }

    getAdminWS() {
        // make sure room is not empty
        if(this.users.length === 0) {
            return null;
        }

        const admin = this.users.find((user) => user._isAdmin === true);

        return admin._ws;
    }

    getWsByUserName(userName) {

        // room must not be empty
        if(this.users.length === 0) {
            return null;
        }

        const targetUserObj = this.users.find((user) => user.userName === userName);

        if(targetUserObj) {
            return targetUserObj._ws;
        }

        return null;
    }

    getBoardLock() {
        return this.boardLock;
    }

}


module.exports = Room;
