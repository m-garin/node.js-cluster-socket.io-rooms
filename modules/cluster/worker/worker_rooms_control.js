/* the cluster module allows to easily create child processes and take advantage of multi-core systems */
var cluster = require('cluster');
var settings = require('../../../conf/settings'); //load global project settings

global.rooms = {}; //init global rooms object in this worker

var CalculationsLoop = function () {

}

class WorkerRoomsControl {

    constructor() {

    }

    set SetCalculationsLoop (_func) {
        CalculationsLoop = _func;
    }

    static SendToMaster(_command, _data) {
        process.send({act: _command, data: _data});
    }

    static Clock(_start) {
        if ( !_start ) return process.hrtime();
        var end = process.hrtime(_start);
        return Math.round((end[0]*1000) + (end[1]/1000000));
    }

    static RoomLoop (_roomId) {
        var startTime = WorkerRoomsControl.Clock();

        CalculationsLoop(global.rooms[_roomId]); //function from worker.js

        var durationTime = WorkerRoomsControl.Clock(startTime);
        //console.log("Calculations time: " + durationTime + "ms");

        if (!global.rooms[_roomId].TimeIsOver) {
            //start new loop
            var newTimeOut = settings.tickServerRate - durationTime;
            if (newTimeOut <= 0) { // if the function to work longer than tickServerRate
                this.RoomLoop(_roomId); //repeat immediately
            } else {
                setTimeout(() => { this.RoomLoop(_roomId); }, newTimeOut);
            }
        } else {
            //destroy room and disconnect all clients from master
            WorkerRoomsControl.DeleteRoom(_roomId);
        }
    }

    static DeleteRoom(_roomId) {
        console.log('WORKER ' + process.pid + ': destroy room ' + _roomId + ' by timer!');
        try {
            io.to(_roomId).emit('chat message', 'WORKER ' + process.pid + ': delete from room ' + _roomId); //TODO: remove. it is only necessary to inform
        } catch (e) {
            console.log('Error: ' + e);
        }

        delete global.rooms[_roomId];
        WorkerRoomsControl.SendToMaster('delRoom', _roomId); //send signal about room destroy
    }
}

module.exports = WorkerRoomsControl;