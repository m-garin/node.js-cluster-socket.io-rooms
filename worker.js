/* isWorker */

//functions to manage rooms (join, disconnect and etc.)
var WorkerRoomsControl = require('./modules/cluster/worker/worker_rooms_control');
var WorkerRoomsControl = new WorkerRoomsControl();


var SocketIO = require('socket.io');
var redis = require('socket.io-redis');
global.io = new SocketIO(); //start redis socket-io
global.io.adapter(redis({host: 'localhost', port: 6379})); // where your redis server is located

//for each room will be run separate calculations loop
WorkerRoomsControl.SetCalculationsLoop = function (_room) {

    global.io.to(_room.id).emit('chat message', 'Test global msg from worker ' + process.pid + ' room ' + _room.id + ' total clients in room: ' + Object.keys(_room.clients).length);
};

//add listeners messages from master process
var WorkerClusterListeners = require('./modules/cluster/worker/worker_listeners');
new WorkerClusterListeners();