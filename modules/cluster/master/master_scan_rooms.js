var settings = require('../../../conf/settings'); //load global project settings
var MasterClusterInit = require('./master_cluster_init'); //functions to manage clients in rooms

//scan created rooms. If the room is more than (settings.needNumClientsToStartCalcRoom) people - start. If room is started - add new players to the room on worker

class ScanRoomMaster {

    ScanRooms () {
        //iterate over all rooms
        for (var roomId in global.rooms) {
            var room = global.rooms[roomId]; //TODO: may need to lock global.rooms[roomId]
            if (room.status == 'waitingPlayers' && Object.keys(room.clients).length >= settings.needNumClientsToStartCalcRoom) { //TODO: Object.keys may be slow
                //Inside room is sufficient number of players to start
                room.status = 'started';
                MasterClusterInit.SendToWorker(room.workerId, 'startCalcRoom', {roomId: roomId, clients: room.clients}); //start room's calculation

                global.rooms[roomId].clients = {}; //remove these clients from global.rooms. They are already on worker

                console.log('MASTER: send to worker room ' + roomId + ' with clients ');

            } else if (room.status == 'started' && Object.keys(room.clients).length > 0) {
                MasterClusterInit.SendToWorker(room.workerId, 'joinUsers', {roomId: roomId, clients: room.clients});
                global.rooms[roomId].clients = {}; //remove these clients from global.rooms. They are already on worker
            }
        }

        setTimeout(()=> { this.ScanRooms(); }, settings.roomsScanRate); //run again
    }
}

var scanRoomMaster = new ScanRoomMaster(); //Singleton
module.exports = scanRoomMaster;

