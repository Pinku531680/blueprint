export class PageState {

    currentStateIndex = 0;

    constructor(pageNumber, states) {
        this.pageNumber = pageNumber;
        this.states = states;
    }

    getState() {
        return this.states[this.currentStateIndex];
    }

    getStates() {
        return this.states;
    }

    clearStates() {

        // Clear states and set currentStateIndex to 0 as well

        this.states = [];
        this.currentStateIndex = 0;
    }

    getStatesLength() {
        return this.states.length;
    }

    getPageNumber() {
        return this.pageNumber;
    }

    addState(newState) {
        //console.log("NEW STATE ADDED---------");
        this.states.push(newState)
    }

    getCurrentStateIndex() {
        return this.currentStateIndex;
    }

    incrementCurrentStateIndex() {
        if(this.currentStateIndex < (this.states.length-1)) {
            this.currentStateIndex++
        } else {
            console.log("CANNOT INCREMENT STATE INDEX");
        }  
        
    }

    decrementCurrentStateIndex() {
        if(this.currentStateIndex > 0) {
            this.currentStateIndex--
        } else {
            console.log("CANNOT DECREMENT STATE INDEX");
        }
    }
}