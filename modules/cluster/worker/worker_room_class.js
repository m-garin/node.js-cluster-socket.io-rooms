var settings = require('../../../conf/settings');

//room class for workers
class WorkerRoomClass {

    constructor(_id, _client) {
        this.id = _id;
        this.clients = _client;
        this.stopTime = new Date().getTime() + settings.roomLifeTime;
    }

    // if room's live is over - true
    get TimeIsOver () {
        var over = false;
        if (new Date().getTime() > this.stopTime) {
            over = true;
        }
        return over;
    }
}

module.exports = WorkerRoomClass;