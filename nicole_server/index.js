const some = require('lodash/some');
const map = require('lodash/map');
const find = require('lodash/find');
const filter = require('lodash/filter');
const remove = require('lodash/remove');

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});
let active;
let user={};
let users = [
    { id: 'jeff@jeff.ca',   name: 'Jeff',   game: 0,    active: true },
    { id: 'tom@tom',    name: 'Tom',    game: 0,    active: true },
    { id: 'anna@anna.ca',   name: 'Anna',   game: 1,    active: true },
    { id: 'bob@bob.ca', name: 'Bob',    game: 1,    active: true },
    { id: 'shona@shona.ca', name: 'Shona',  game: 1,    active: true },
];

let game={};
let games = [
    { game_id: 0, players: filter(users, [game, 0] ) },
    { game_id: 1, players: filter(users, [game, 1] ) },
];

io.on('connection', function (socket) {
    console.log('A client is connected!');
   
    socket.on('newUser', function(id, name){
        console.log('new user: ' + id + ' name: '+ name);
        createUser(id, name); 
        io.emit('update', users);
    });
    
    socket.on('room', function(room) {
        // once a client has connected,
        //expect ping saying what room user is joining
        socket.join(room);
    });

    socket.on('join', function (email) {
        console.log('joined clicked: ' + email);
        let playerJoining= some(users, { id: email })
        if (playerJoining == true) {
            playerJoining.active = false;
        }
        console.log(playerJoining);
        var availableGames = remove(games, [active, 'false']);
        console.log('Available Games: ' + availableGames);
        io.emit('join', availableGames);
    });   

    socket.on('start', function (id) {
        io.emit('start', (id));
    });

    socket.on('disconnect', function disconnected(email) {
        let playerDisconnected = some(users, { id: email })
        if (playerDisconnected == true) {
            playerDisconnected.active = false;
        }
        io.emit('update', users);
    });

    socket.on('leave', function disconnected(email) {
        let playerLeaving = some(users, { id: email })
        if (playerLeaving == true) {
            users = remove(users, [playerLeaving.id, playerLeaving.email]);
        }
        io.emit('update', playerLeaving.name + ' has left the game.');
    });


    socket.on('message', function (msg) {
        console.log('Face clicked');
        io.emit('message');
    });

});

function createUser(email, nickname){
    if (some(users, { id: email })){
        console.log('Player already added. ');
    }
    users.push({id: email, name: nickname, game: -1, active: false});
    console.log('Users:');
    console.log(users);
};