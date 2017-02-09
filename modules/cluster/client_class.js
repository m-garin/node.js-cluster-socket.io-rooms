class Client {

    constructor(_socketId, _workerId, _roomId) {
        this.socketId = _socketId;
        this.workerId = _workerId;
        this.roomId = _roomId;
    }
}

module.exports = Client;