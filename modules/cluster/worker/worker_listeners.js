var WorkerRoomsControl = require('./worker_rooms_control');
var RoomClass = require('./worker_room_class');

class WorkerClusterListeners {

    constructor () {

        process.on('message', (_result) => {

            switch (_result.act) {
                case 'startCalcRoom': //launching room calculations function
                    var newRoomId = _result.data.roomId;
                    var newClients = _result.data.clients; //entered players

                    if (global.rooms[newRoomId] == null) { //this room hasn't been created
                        global.rooms[newRoomId] = new RoomClass(newRoomId, newClients);

                        WorkerRoomsControl.RoomLoop(newRoomId);
                        WorkerRoomsControl.SendToMaster('connectedUsers', newClients);
                        console.log('WORKER ' + process.pid + ': create new room ' + newRoomId + ' and start calculations');
                    }

                    break;

                case 'joinUsers': //get clients who have come after start room's calculate
                    var newRoomId = _result.data.roomId;
                    var newClients = _result.data.clients;

                    if (global.rooms[newRoomId] != null) { //this room has already been created
                        //add clients
                        for (var newClientId in newClients) {
                            global.rooms[newRoomId].clients[newClientId] = newClients[newClientId];
                        }
                        WorkerRoomsControl.SendToMaster('connectedUsers', newClients);
                        console.log('WORKER ' + process.pid + ': join users in room ' + newRoomId);
                    }

                    break;

                case 'leaveUser': //if client disconnected from master process
                    var client = _result.data;
                    //remove client from the calculating cycle
                    try {
                        delete global.rooms[client.roomId].clients[client.socketId];
                    } catch (e) {
                        console.log('WORKER ' + process.pid + ' error: cannot delete user ' + client.socketId + ' (' + e + ')');
                    }

                    break;

                case 'sendMsg': //triggered 'sendMsg' event on master process
                    var client = _result.data[0];
                    var cameMsg = _result.data[1];
                    global.io.to(client.roomId).emit('chat message', 'room: ' + client.roomId + ', id: ' + client.socketId + '; ' + cameMsg);
                    console.log('WORKER ' + process.pid + ': user ' + client.socketId + ' in room send msg ' + cameMsg);

                    break;
            }
        });
    }
}

module.exports = WorkerClusterListeners;