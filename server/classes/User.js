class User {

    constructor(userName, ws, isAdmin = false, isDisabled = false) {
        this._userName = userName;
        this._ws = ws;
        this._isAdmin = isAdmin;
        this._isDisabled = isDisabled;
    }

    get userName() {
        return this._userName;
    }   

    get ws() {
        return this._ws;
    }

    get isAdmin() {
        return this._isAdmin;
    }

    get isDisabled() {
        return this._isDisabled;
    }

    set ws(connection) {
        this._ws = connection;
    }

    set isAdmin(adminStatus) {
        this._isAdmin = adminStatus;
    }

    set isDisabled(disabledStatus) {
        this._isDisabled = disabledStatus;
    }
}

module.exports = User;
