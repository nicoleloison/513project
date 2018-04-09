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

let game_index = 0;
let lobby = 'lobby';

let hands = []
let hand =
    {
        player: '',
        laundryCards: [
            laundryCards['socks'] = { amount: 0 },
            laundryCards['underwear'] = { amount: 0 },
            laundryCards['mittens'] = { amount: 0 },
            laundryCards['shorts'] = { amount: 0 },
            laundryCards['shirt'] = { amount: 0 },
            laundryCards['pants'] = { amount: 0 },
            laundryCards['jacket'] = { amount: 0 },
            laundryCards['hat'] = { amount: 0 },
            laundryCards['sweater'] = { amount: 0 },
            laundryCards['scarf'] = { amount: 0 },
            laundryCards['towel'] = { amount: 0 },
            laundryCards['swimsuit'] = { amount: 0 },
            laundryCards['dress'] = { amount: 0 },
        ],
        score: 0,
    };


let handShona = {
    player: 'shona@shona.ca',
    laundryCards: [
        laundryCards['socks'] = { amount: 2 },
        laundryCards['underwear'] = { amount: 4 },
        laundryCards['mittens'] = { amount: 5 },
        laundryCards['shorts'] = { amount: 1 },
        laundryCards['shirt'] = { amount: 0 },
        laundryCards['pants'] = { amount: 0 },
        laundryCards['jacket'] = { amount: 0 },
        laundryCards['hat'] = { amount: 0 },
        laundryCards['sweater'] = { amount: 0 },
        laundryCards['scarf'] = { amount: 0 },
        laundryCards['towel'] = { amount: 0 },
        laundryCards['swimsuit'] = { amount: 0 },
        laundryCards['dress'] = { amount: 0 },
    ],
    score: 3,
};

let handTom = {
    player: 'tom@tom.ca',
    laundryCards: [
        laundryCards['socks'] = { amount: 0 },
        laundryCards['underwear'] = { amount: 0 },
        laundryCards['mittens'] = { amount: 0 },
        laundryCards['shorts'] = { amount: 0 },
        laundryCards['shirt'] = { amount: 0 },
        laundryCards['pants'] = { amount: 0 },
        laundryCards['jacket'] = { amount: 0 },
        laundryCards['hat'] = { amount: 0 },
        laundryCards['sweater'] = { amount: 0 },
        laundryCards['scarf'] = { amount: 5 },
        laundryCards['towel'] = { amount: 6 },
        laundryCards['swimsuit'] = { amount: 9 },
        laundryCards['dress'] = { amount: 0 },
    ],
    score: 6,
};

let users = [
    { id: 'jeff@jeff.ca', name: 'Jeff', game: '1', active: true, avatar: -1, },
    { id: 'shona@shona.ca', name: 'Shona', game: '1', active: true, avatar: -1, },
    { id: 'tom@tom.ca', name: 'Tom', game: '1', active: true, avatar: -1 },
    { id: 'anna@anna.ca', name: 'Anna', game: '2', active: true, avatar: -1 },
    { id: 'zach@zach.ca', name: 'Zach', game: '2', active: true, avatar: -1 },

];

let games = [
    { game_id: '1', players: filter(users, { game: '1' }), hands:{} },
    { game_id: '2', players: filter(users, { game: '2' }), hand: {} },
];


io.sockets.on('connection', function (socket) {

    socket.on('room', function (room) {
        socket.join(room);
        console.log('user joined on room : ' + room);
    });

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
        console.log(name + ' created.');
        io.emit('update', users);
    });
    socket.on('setAvatar', function (email, avatar_id) {
        console.log(email + ' has avatar ' + avatar_id);
        setAvatar(email, avatar_id);
        io.emit('update', users);
    });
    socket.on('leave', function (email) {
        console.log(email + ' leaving game');
        deleteUser(email);
        io.emit('update', users);
        socket.leave()
    });
    socket.on('join', function (email, room) {
        console.log(email + 'joined room' + room);
        joinRoom(email, room);
        io.sockets.in(room).emit('newPlayer', 'email');
        socket.join(room);
    });
    socket.on('start', function (email) {
        let new_room = createGame(email);
        io.emit('update', games);
        console.log(email + 'started game room' + new_room);
        io.sockets.in(new_room).emit('newRoom', 'room');
        socket.join(new_room);
    });

    socket.on('askforLaundry', function (askingPlayerID, requestedCard, requestedPlayerID) {
        let room = roomCheck(askingPlayerID, requestedPlayerID);
        let hasItem = true;
        io.sockets.in(room).emit('message', hasItem);
    });

});

function setAvatar(email, avatar_id) {
    let player = find(user, { id: email });
    if (!player) {
        console.log('Could not find user : ' + email);
        return;
    }
    player.avatar = avatar_id;
};

function createUser(email, nickname) {
    if (some(users, { id: email })) {
        console.log('Player ' + email + ' already added.');
        return;
    }
    users.push({ id: email, name: nickname, game: -1, active: false, avatar: -1 });
    return;
};

function deleteUser(email) {
    let toRemove = find(users, { id: email });
    if (!toRemove) {
        console.log('Could not find user :' + email);
        return;
    }
    let playersOfGame = find(games, { game_id: toRemove.game }).players;
    remove(playersOfGame, toRemove);
    remove(users, toRemove);
    io.
        return;
};

function createGame(email) {
    let player = find(users, { id: email });
    if (!player) {
        console.log('Player ' + email + ' does not exist.');
        return;
    }
    if (player.game != -1) {
        console.log('Player is already in game ' + player.game);
        return;
    }
    ++game_index;
    player.active = true;
    let g = parseInt(game_index);
    games.push({ game_id: g, players: find(users, { id: email }) });
    player.game = g;
    return g;
};

function joinRoom(email, room) {
    if (!player) {
        console.log('Player ' + email + ' does not exist.');
        return;
    }
    if (player.game != -1 || player.game == room) {
        console.log('Player is already in game ' + player.game);
        return;
    }
    let gameRoom = find(games, { game_id: room });
    if (!gameRoom) {
        console.log('Room ' + room + ' does not exist.');
        return;
    }
    player.active = true;
    player.game = room;
    gameRoom.players.push(player);
    console.log('gameroom');
    console.log(gameRoom);
    gameRoom.players.push(player);
    
    if (gameRoom.players.length = 4) {
        hideRoom();
        initiateGame(gameRoom);
        return;
    }
    return;
};

function roomCheck(email1, email2) {
    let room1 = find(users, { id: email1 }).game;
    let room2 = find(users, { id: email2 }).game;
    console.log(room1 + ' ' + room2);
    if (room1 === room2) {
        return room1;
    }
    else return -1;
};

function hasItem(email, item) {
    let player = find(users, { id: email });
    let game = find(games, { game_id: player.game });
    //let playerHand = find(game.hand, { hand.player = email });
};
function createHand( email ){
    let playerHand = new hand();
    playerHand.player = email;
    return playerHand;
};

function initiateGame(game) {
    game.players.forEach(element => {
       createHand(element.id);
       console.log(createHand(element.id));
    });
};


