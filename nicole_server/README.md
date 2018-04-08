    Files in nicole_server:
        index.js (server code)
        index.html (dummy testing client)
        mdl (for nice looking dummy client for some reason)
        package.json 
        README.md
    
    Necessary tools to be installed: 
    Install the following with npm: 

        npm install node
        npm install express
        npm install socket.io
        npm install lodash
    
    Settings and Limitations:
    Works only on localhost on port 3000 right now. 
    Run the index.js file with node:
       
       node index.js
    
    Socket interactions:
        io.sockets.on('connection', function (socket) {...}
    
    Unvoluntary disconnection of users:
    input : 'disconnect' and email of disconnected user:
    output : 'update' and the list of users
        socket.on('disconnect', function (email) {...
        io.emit('update', users);});
    
    New User:
    input : 'newUser' and id(email) and names
    output : 'update' and the list of users
        socket.on('newUser', function (id, name) {...
        io.emit('update', users);});
    
    Voluntary disconnection of user: 
    input : 'leave' and id(email) and names
    output : 'update' and the list of users
        socket.on('leave', function (email) {...
        io.emit('update', users);});
    
    User joining a game room :
    input : 'join' and id(email) and names
    output : 'newPlayer' in the specific room and the new user list
        socket.on('join', function (email, room) {...
        io.sockets.in(room).emit('newPlayer', 'email' );
        socket.join(room);});
    
    User starts a new game:
    input : 'start' and id(email) and names
    output : 'newRoom' and the room id
        socket.on('start', function (email) {...
        io.sockets.in(new_room).emit('newRoom', 'room' );
        socket.join(new_room);});
        
    User starts a new game:
    input : 'setAvatar' and id(email) and names
    output : 'update' and list of users
        socket.on('setAvatar', function (email, avatar_id) {...
        io.emit('update', users);});
    
    User asks an item to another user:
    input : 'ask' and id(email) and names
    output : 'ask' and the room id
        socket.on('ask', function (room, email, item, email2 ) {
        io.sockets.in(room).emit('ask', 'email item email2' );//HERE I'M NOT SURE AT ALL});


    Set and format of dummy users:
    et users = [
    {id: 'jeff@jeff.ca', name: 'Jeff', game: '0', active: true ,avatar : -1},
    { id: 'tom@tom', name: 'Tom', game:'0', active: true , avatar : -1},
    { id: 'anna@anna.ca', name: 'Anna', game:'1', active: true , avatar : -1},
    { id: 'zach@zach.ca', name: 'Zach', game:'1', active: true , avatar : -1},
    { id: 'shona@shona.ca', name: 'Shona', game: '1', active: true , avatar : -1},
    ];
    
    let games = [
    {game_id:'0', players: filter(users, {game: '0'}) },
    {game_id: '1', players: filter(users, {game: '1'}) },
    ];



