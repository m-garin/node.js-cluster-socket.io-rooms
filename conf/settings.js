var os = require('os');

class Settings {

    constructor() {
        //MASTER:
        //file path to worker file
        this.wayToWorker = 'worker.js'; //local
        //this.wayToWorker = "/var/www/cluster_test/worker.js"; //server

        //this.numCPUs = os.cpus().length - 1; // -1
        this.numCPUs = 2;

        this.roomClientLimit = 3; //максимальное количество клиентов на каждой комнате
        this.needNumClientsToStartCalcRoom = 2;
        this.roomsScanRate = 2000;

        //WORKER:
        this.tickServerRate = 10000; //как часто запускается основной цикл обсчета игры
        this.roomLifeTime = 30 * 1000;
    }
}

var settings = new Settings();
module.exports = settings;