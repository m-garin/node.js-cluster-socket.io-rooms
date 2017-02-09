/* isMaster */

//create workers and add listeners
var MasterClusterInit = require('./modules/cluster/master/master_cluster_init');
new MasterClusterInit();

//static functions to manage clients in rooms (join, disconnect and etc.)
var MasterRoomsControl = require('./modules/cluster/master/master_rooms_control');

//scan created rooms. If the room is more than (settings.needNumClientsToStartCalcRoom) people - start. If room is started - add new players to the room on worker
var scanRoom = require('./modules/cluster/master/master_scan_rooms');
//start scan cycle
scanRoom.ScanRooms();

global.io = require('socket.io')(30042); //socket.io(<port>) will create a http server

/* with the socket.io-redis adapter you can run multiple socket.io instances
   in different processes or servers that can all broadcast and emit events to and from each other */
var redis = require('socket.io-redis');
global.io.adapter(redis({ host: 'localhost', port: 6379 }));

//add socket.io listeners
global.io.on('connection', function (socket) {
    console.log('MASTER: connected client ' + socket.id);
    //socket.setNoDelay(true);
    socket.leaveAll(); //leave starting room

    socket.settingsOnMaster = {}; //our new class in master-socket

    //function is triggered as soon as a room at worker start
    socket.settingsOnMaster.CallbackIfRoomWasStarted = function () {
        //add new listeners as receive messages from client
        socket.on('chat message', function (_data) {
            MasterRoomsControl.ClientSendToWorker(client, 'sendMsg', _data);
        });
    }

    var client = MasterRoomsControl.SubscribeToRoom(socket.id); //client class after join or create new room

    socket.on('disconnect', () => {
        //disconnect event from socket.io
        MasterRoomsControl.DisconnectClientFromRoom (client);
    });

    socket.on('error', (e) => {
        //error event from socket.io
        MasterRoomsControl.DisconnectClientFromRoom (client);
        console.log('MASTER ERROR: ' + e);
    });
});

setInterval(function() {
    global.io.sockets.adapter.allRooms(function (err, rooms) {
        //for testing
        console.log('REDIS rooms:');
        console.log(rooms); //an array containing all rooms (accross every node)
    })
} , 10000);