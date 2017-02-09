var settings = require('../../../conf/settings'); //load global project settings
var cluster = require('cluster'); //multi-core server manager
var workers = []; //workers local storage

class MasterClusterInit {

    constructor() {

        cluster.setupMaster({
            exec : settings.wayToWorker //file path to worker file
        });

        //start separate processes
        for (var i = 0; i < settings.numCPUs; i++) {

            workers[i] = cluster.fork();
            console.log('MASTER: ' + i + '/' + settings.numCPUs + ' worker is started');

            //each worker listens for messages
            workers[i].on('message', function(_result) {

                //came acts from worker
                switch(_result.act) {
                    case 'delRoom': //remove room and forced disconnect all clients in this room
                        var roomId = _result.data;
                        io.sockets.adapter.clients([roomId], (err, clients) => { //TODO: You can also use "global.rooms" object
                            delete global.rooms[roomId];
                            for (var i = 0; i < clients.length; i++) {
                                var socketId = clients[i];
                                global.io.sockets.connected[socketId].disconnect();
                            }
                            console.log("MASTER: delete room " + roomId + " with all clients");
                        });

                        break;
                    case 'connectedUsers': //add new socket.io listeners to each client on master if the client connected to the worker (workers[i])
                        var clients = _result.data;
                        for (var socketId in clients) {
                            global.io.sockets.connected[socketId].settingsOnMaster.CallbackIfRoomWasStarted();
                        }

                        break;
                }
            });
        }
    }

    //send data to the worker
    static SendToWorker(_workerId, _command, _data) {
        workers[_workerId].send({act: _command, data: _data});
    }
}

module.exports = MasterClusterInit;