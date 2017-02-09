var settings = require('../../../conf/settings');
var Client = require('../client_class');

var MasterClusterInit = require('./master_cluster_init');

global.rooms = {}; //init global rooms object in master process

var roomsSetting = {
    lastRoomId: -1,
    lastWorkerId: -1
};

class MasterRoomsControl {

    static SubscribeToRoom (_socketId) { //return client_class
        //iterate over all rooms
        var roomId;
        //looking for an empty room
        for (roomId in global.rooms) {
            if (global.io.sockets.adapter.rooms[roomId].length < settings.roomClientLimit) {
                return this.JoinRoom(_socketId, global.rooms[roomId].socketId, roomId, (_client) => {
                    //recorded player with room to Redis
                    global.rooms[roomId].clients[_socketId] = _client;
                });
            }
        }

        //if empty room does not exist, create a new and connect
        roomId = ++roomsSetting.lastRoomId;
        if(++roomsSetting.lastWorkerId >= settings.numCPUs) {
            roomsSetting.lastWorkerId = 0; //if the worker is left outside, then zero out
        }

        return this.JoinRoom(_socketId, roomsSetting.lastWorkerId, roomId,  (_client) => {
            //create new empty room on master global.rooms with status 'waitingPlayers'
            global.rooms[roomId] = {status: 'waitingPlayers', workerId: roomsSetting.lastWorkerId, clients: {}};
            global.rooms[roomId].clients[_client.socketId] = _client; //add client
            console.log('MASTER: create new room ' + roomsSetting.lastRoomId + ' on worker ' + roomsSetting.lastWorkerId);
        });
    }

    static JoinRoom (_socketId, _workerId, _roomId, _callback) {

        var client = new Client(_socketId, _workerId, _roomId);
        global.io.sockets.connected[_socketId].adapter.remoteJoin(_socketId, _roomId, function (err) {
            if (err) {
                console.log("Error MASTER: remote join client " + _socketId);
            } else {
                console.log('MASTER: client ' + _socketId + ' join in ' + _roomId);
                _callback(client);
            }
        });

        return client;
    }

    static DisconnectClientFromRoom (_client) {

        if (global.rooms[_client.roomId] != null) { //if the player has left on their own (room not close with him)
            if (global.rooms[_client.roomId].status == 'started') {
                MasterClusterInit.SendToWorker(global.rooms[_client.roomId].workerId, 'leaveUser', _client);
            }
            this.DeleteClientFromRoomOnMaster(_client);

        }
        console.log("MASTER: client " + _client.socketId + " was disconnected from room " + _client.roomId);
    }

    static ClientSendToWorker (_client, _act, _data) {
        MasterClusterInit.SendToWorker(global.rooms[_client.roomId].workerId, _act, [_client, _data]);
    }

    static DeleteClientFromRoomOnMaster (_client) {

        if (global.rooms[_client.roomId] != null) {
            delete global.rooms[_client.roomId].clients[_client.socketId];
        } else {
            console.log("MASTER ERROR: client " + _client.socketId + " cannot be delete from room " + _client.roomId);
        }
    }
}

module.exports = MasterRoomsControl;