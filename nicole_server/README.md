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
        On connection the user is joining the lobby room 
    
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
    input : 'join' and id(email)
    output : 'newPlayer' in the specific room and the new user list
        socket.on('join', function (email, room) {...
        io.sockets.in(room).emit('newPlayer', 'email' );
        socket.join(room);});
    
    User creates a new game (= a new room):
    input : 'create' and id(email) of creator
    output : 'newRoom' in the specific room and the new user list
        socket.on('create', function (email) {...
        io.emit('newRoom', newRoom);
        
    User starts a new game:
    input : socket.on('start', function (room) {
    io.emit('start', room);
    socket.join(room);
    });
    
    input : 'setAvatar' and id(email) and names
    output : 'update' and list of users
        socket.on('setAvatar', function (email, avatar_id) {...
        io.emit('update', users);});
    
    User asks an item to another user:
    input : 'askforLaundry' and id(email) and names
    output : 'message' in the room booleans success or not
        socket.on('ask', function (room, email, item, email2 ) {
        io.sockets.in(room).emit('ask', 'email item email2' );//HERE I'M NOT SURE AT ALL});


    Set and format of classes user game and laundryCard:
    
    class laundryCards {
    constructor() {
    this.cards = [];
    this.cards['socks']=0;
    this.cards['underwear']=0;
    this.cards['mittens']=0;
    this.cards['shorts']=0;
    this.cards['shirt']=0;
    this.cards['pants']=0;
    this.cards['jacket']=0;
    this.cards['hat']=0;
    this.cards['sweater']=0;
    this.cards['scarf']=0;
    this.cards['towel']=0;
    this.cards['swimsuit']=0;
    this.cards['dress']=0;
    }
    }; 
    
    class hand {
    constructor(id) {
    this.player = id;
    this.laundryCards = new laundryCards();
    this.score = 0;
    }
    };
    
    class user {
    constructor(email, name) {
    this.id = email;
    this.name = name;
    this.game = -1;
    this.active = false;
    this.avatar= -1;
    }
    
    }
    class game {
    constructor(id) {
    this.game_id = id;
    this.players =filter(users, { game: toString(id) });
    this.hands = new Array(4);
    }
    }
    
    
    Dummy users and games let users = [
    { id: 'jeff@jeff.ca', name: 'Jeff', game: 1, active: true, avatar: -1, },
    { id: 'shona@shona.ca', name: 'Shona', game: 1, active: true, avatar: -1, },
    { id: 'tom@tom.ca', name: 'Tom', game: 1, active: true, avatar: -1 },
    { id: 'anna@anna.ca', name: 'Anna', game: 2, active: true, avatar: -1 },
    { id: 'zach@zach.ca', name: 'Zach', game: 2, active: true, avatar: -1 },
    
    ];
    
    let games = [
    { game_id: 1, players: filter(users, { game: 1 }), hands: [] },
    { game_id: 2, players: filter(users, { game: 2 }), hands: [] },
    ];
    
    dummy value : shirt = 3 for all users in game 1.


