# node.js-cluster-socket.io-rooms
<b>Made with</b>
Node.js 6.9.2, socket.io 1.7.2, socket.io-redis 3.1.0, Redis 3.2.1

<b>Useful</b>

This is a useful feature to send notifications to a group of users (in rooms), or to a given user connected on several devices for example and take advantage of multi-core systems.

<b>Features</b>

Master fork workers numCPUs-1 and listen events from client. When master accept new client connection - looking for an empty existing room or create new room (attach next room) in redis. If the room is more than (settings.needNumClientsToStartCalcRoom) people - start calculated on attached worker.
