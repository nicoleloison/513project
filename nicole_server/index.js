const some = require('lodash/some');
const map = require('lodash/map');
const find = require('lodash/find');
const filter = require('lodash/filter');
const remove = require('lodash/remove');

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

app.get('/', function (req, res) { res.sendFile(__dirname + '/index.html'); });
http.listen(port, function () { console.log('listening on *:' + port); });

//let active;
let user = {};
let game = {};
let game_index =1;

let users = [
    {id: 'jeff@jeff.ca', name: 'Jeff', game: '0', active: true },
    { id: 'tom@tom', name: 'Tom', game:'0', active: true },
    { id: 'anna@anna.ca', name: 'Anna', game:'1', active: true },
    { id: 'zach@zach.ca', name: 'Zach', game:'1', active: true },
    { id: 'shona@shona.ca', name: 'Shona', game: '1', active: true },
];

let games = [
    {game_id:'0', players: filter(users, {game: '0'}) },
    {game_id: '1', players: filter(users, {game: '1'}) },
];

io.sockets.on('connection', function (socket) {

    socket.on('disconnect', function (email) {
        let playerDisconnected = find(users, { id: email })
        if (playerDisconnected) {
            playerDisconnected.active = false;
        }
        console.log('player disconnected ' + email);
        io.emit('update', users);
    });
    socket.on('newUser', function (id, name) {
        createUser(id, name);
        console.log('New User created');
        io.emit('update', users);
    });
    socket.on('leave', function (email) {
        deleteUser(email);
        io.emit('update', users);
    });
    socket.on('join', function (email, room) {
        joinRoom(email, room);
        io.sockets.in(room).emit('newPlayer', 'email' );
        socket.join(room);
    });
    socket.on('start', function (email) {
        let new_room =  createGame(email);
        io.sockets.in(new_room).emit('newRoom', 'room' );
        socket.join(new_room);
    });

    socket.on('ask', function (room, email, item, email2 ) {
        io.sockets.in(room).emit('ask', 'email item email2' );
    });

});

function createUser(email, nickname) {
    if (some(user, {id: email})) {
        console.log('Player ' + email + ' already added.');
        return;
    }
    users.push({ id: email, name: nickname, game: -1, active: false });
    return;
};

function deleteUser(email) {
    let toRemove = find(users, { id: email });
    if (!toRemove) {
        console.log('Could not find user :' + email);
        return;
    }
    let playersOfGame = find(games, {game_id: toRemove.game}).players;
    remove(playersOfGame, toRemove);
    remove(users, toRemove);
    return;
};

function createGame(email) {
    let player = find(users, { id: email });
    if (!player) {
        console.log('Player ' + email + ' does not exist.');
        return;
    }
    if (player.game != -1) {
        console.log('Player is already in game '+ player.game);
        return;
    }
    ++game_index;
    player.active = true;
    let g = parseInt(game_index);
    games.push({ game_id: g, players: find(users, { id: email }) });
    player.game =g;
    return g;
};

function joinRoom(email, room) {
    let player = find(users, { id: email });
    if (!player) {
        console.log('Player ' + email + ' does not exist.');
        return;
    }
    if (player.game != -1 || player.game == room ) {
        console.log('Player is already in game '+ player.game);
        return;
    }
    let gameRoom = find(games, { game_id: room });
    if (!gameRoom) {
        console.log('Room ' + room + ' does not exist.');
        return;
    }
    if (gameRoom.players.length > 3) {
        console.log('room full');
        return;
    }
    
    player.active = true;
    player.game = room;
    gameRoom.players.push(player);
    console.log('gameroom');
    console.log(gameRoom);
    gameRoom.players.push(player);
    return;
};

