const some = require('lodash/some');
const map = require('lodash/map');
const find = require('lodash/find');
const filter = require('lodash/filter');
const remove = require('lodash/remove');
const forEach = require('lodash/forEach');
const findIndex = require('lodash/findIndex');

let app = require('express')();
let http = require('http').Server(app, { cookie: true });
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

app.get('/', function (req, res) { res.sendFile(__dirname + '/index.html'); });
http.listen(port, function () { console.log('listening on *:' + port); });

let game_index = 2;
let defaultRoom = 'lobby';

class laundryCards {
    constructor() {
        this.cards = [];
        this.cards['socks'] = 0;
        this.cards['underwear'] = 0;
        this.cards['mittens'] = 0;
        this.cards['shorts'] = 0;
        this.cards['shirt'] = 0;
        this.cards['pants'] = 0;
        this.cards['jacket'] = 0;
        this.cards['hat'] = 0;
        this.cards['sweater'] = 0;
        this.cards['scarf'] = 0;
        this.cards['towel'] = 0;
        this.cards['swimsuit'] = 0;
        this.cards['dress'] = 0;
    }
};

class deckOfCards {
    constructor() {
        this.cards = [];
        this.cards['socks'] = 4;
        this.cards['underwear'] = 4;
        this.cards['mittens'] = 4;
        this.cards['shorts'] = 4;
        this.cards['shirt'] = 4;
        this.cards['pants'] = 4;
        this.cards['jacket'] = 4;
        this.cards['hat'] = 4;
        this.cards['sweater'] = 4;
        this.cards['scarf'] = 4;
        this.cards['towel'] = 4;
        this.cards['swimsuit'] = 4;
        this.cards['dress'] = 4;
    }
};


class deckOfCards {
    constructor(room) {
        this.game = room;
        this.laundryCards = new laundryCards();
    }
    distributeCards(){
        let players = room.players;

    }
};

class hand {
    constructor(name) {
        this.player = name;
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
        this.avatar = -1;
    }
};

class game {
    constructor(id) {
        this.game_id = id;
        this.players = filter(users, { game: toString(id) });
        this.gameOn = false;
        this.hands = new Array(4);
    }
};

let users = [
    { id: 'jeff@jeff.ca', name: 'Jeff', game: 1, active: true, avatar: -1, },
    { id: 'shona@shona.ca', name: 'Shona', game: 1, active: true, avatar: -1, },
    { id: 'tom@tom.ca', name: 'Tom', game: 1, active: true, avatar: -1 },
    { id: 'maria@maria.ca', name: 'Maria', game: 2, active: true, avatar: -1 },
    { id: 'zach@zach.ca', name: 'Zach', game: 2, active: true, avatar: -1 },

];

let games = [
    { game_id: 1, players: filter(users, { game: 1 }), gameOn: false, hands: [] },
    { game_id: 2, players: filter(users, { game: 2 }), gameOn: false, hands: [] },
];


io.sockets.on('connection', function (socket) {

    //

    socket.on('room', function (room) {
        socket.join(room);
        console.log('user joined room : ' + room);
    });

    socket.on('disconnect', function (nickname) {
        let playerDisconnected = find(users, { name: nickname })
        if (playerDisconnected) {
            playerDisconnected.active = false;
            console.log('player disconnected ');
            io.sockets.in(playerDisconnected.game).emit('disconnect', name);
            socket.leave();
            io.broadcast('disconnect', playerDisconnected);
            var r = socket.r.slice();
        }
        else {
            console.log('Couldn not find user ' + nickname);
        }
    });

    socket.on('login', function (id, nickname) {
        let newComer = find(users, { name: nickname });
        if (!newComer) {
            createUser(id, nickname);
            io.emit('addUser', users);
        }
        else
            console.log('Returning player ' + nickname);
            io.emit('returning', nickname, newComer.game);
    });

    socket.on('setAvatar', function (nickname, avatar_id) {
        console.log(nickname + ' has avatar ' + avatar_id);
        setAvatar(nickname, avatar_id);
        io.emit('avatar', nickname);
    });

    socket.on('leave', function (nickname) {
        console.log(nickname + ' leaving game');
        let room = find(users, { name: nickname }).game;
        deactivateUser(nickname, room);
        io.sockets.in(room).emit('quit', nickname);
        socket.leave(room);
        io.emit('deleteRoom', room);
        socket.leave();
    });
    socket.on('unsubscribe', function (room) {
        try {
            socket.leave(room);
            socket.to(room).emit('user left', socket.id);
        } catch (e) {
            console.log('Error leaving room : ', e);
            socket.emit('error', 'couldnt perform requested action');
        }
    });

    socket.on('nextPlayer', function (nickname) {
        let u = find(users, { name: nickname });
        console.log(u);
        let room = u.game;
        if (!room) { console.log("can't fin a room for " + nickname) }
        let next = getNextPlayer(nickname, room);
        socket.in(room).broadcast.emit('yourTurn', next);
    });

    socket.on('join', function(nickname, game) {
        console.log(nickname + ' was in room: ' + defaultRoom + ', now in room:' + game);
        //socket.in(room).broadcast.emit('roomChange', r);
        socket.leave(defaultRoom);
        socket.room = game;
        socket.join(game);
        socket.emit('roomChange', game);
        joinRoom(nickname, game);
        socket.in(game).broadcast.emit('newPlayer', nickname);
    });

    socket.on('start', function (room) {
        let gameRoom = find(games, { game_id: room });
        initiateGame(room);
        io.sockets.in(room).emit('start', room);
        io.broadcast('start', room);
    });
    socket.on('pause', function (room) {
        let gameRoom = find(games, { game_id: room });
        pauseGame(room);
        io.sockets.in(room).emit('pause', room);
        io.broadcast('pause', room);
        console.log('Pausing game ' + room);
    });
    socket.on('askforLaundry', function (askingPlayerID, requestedCard, requestedPlayerID) {
        console.log(askingPlayerID + ' asking for ' + requestedCard + ' to ' + requestedPlayerID);
        let room = roomCheck(askingPlayerID, requestedPlayerID);
        if (!room) {
            console.log('Users in different rooms.');
            return;
        }
        let result = hasItem(requestedPlayerID, requestedCard);
        io.sockets.in(room).emit('answer', result, askingPlayerID, requestedCard, requestedPlayerID);
    });

});
function pauseGame(game) {
    let gameRoom = find(games, { game_id: room });
    if (!gameRoom) {
        console.log('Room ' + room + ' does not exist.');
        return;
    }
    gameRoom.gameOn = false;
    io.sockets.in(room).emit('pause', game);
    io.broadcast('pause', game);
}

function setAvatar(nickname, avatar_id) {
    let player = find(users, { name: nickname });
    if (!player) {
        console.log('Could not find user : ' + nickname);
        return;
    }
    player.avatar = avatar_id;
};

function createUser(email, name) {
    let newUser = new user(email, name);
    users.push(newUser);
    return;
};

function deactivateUser(nickname, room) {
    let toDeactivate = find(users, { name: nickname });
    if (!toDeactivate) {
        console.log('Could not find user ' + nickname + ' in game ' + room);
        return;
    }
    remove(room.players, toDeactivate);
    toDeactivate.active = false;
    room.gameOn = false;
    return;
};

function createGame(nickname) {
    let player = find(users, { name: nickname });
    if (!player) {
        console.log('Player ' + nickname + ' does not exist.');
        return;
    }
    if (player.game != -1) {
        console.log('Player is already in game ' + player.game);
        return;
    }
    ++game_index;
    player.active = true;
    player.game = game_index;
    let g = new game(game_index);
    g.players.push(player);
    games.push(g);
    return g;
};
function joinRoom(nickname, room) {
    let gameRoom = find(games, { game_id: room });
    if (!gameRoom) {
        console.log('Room ' + room + ' does not exist.');
        return;
    }
    let player = find(users, { name: nickname });
    if (!player) {
        console.log('Player ' + nickname + ' does not exist.');
        return;
    }
    if (player.game != -1 || player.game == room) {
        console.log('Player is already in game ' + player.game);
        return;
    }
    player.active = true;
    player.game = room;
    gameRoom.players.push(player);
    //TODO
    if (gameRoom.players.length == 4) {
        console.log('starting game !');
        initiateGame(gameRoom);
        return;
    }
    return;
};
function checkActive(player, room) {
    if (player.active) {
        io.sockets.in(room).emit('turn', player.name);
    }
    else
        pauseGame(room);
}
function getNextPlayer(nickname, g) {
    let players = g.players;
    let player = find(users, { name: nickname });
    let i = findIndex(players, nickname) + 1;
    if (player.active == false) {
        pauseGame(g);
    }
    else {
        ++i;
        console.log('It is ' + players[i].name + ' turn next.');
        return players[i].name
    }
    return nickname;
};
function roomCheck(nickname1, nickname2) {
    let room1 = find(users, { name: nickname1 }).game;
    let room2 = find(users, { name: nickname2 }).game;
    if (room1 === room2) {
        return true;
    }
    else return false;
};

function hasItem(nickname, item) {
    let player = find(users, { name: nickname });
    let game = find(games, { game_id: player.game });
    forEach(game.hands, function (value) {
        if (value.player == player.name && value.laundryCards.cards[item] != 0) {
            console.log(nickname + ' has some ' + item + ' !');
            return true;
        }
    });
    return false;
};
function createHand(nickname) {
    let playerHand = new hand(nickname);
    return playerHand;
};

function dummyHands(hand) {
    let c = hand.laundryCards;
    c.cards['shirt'] = 3;
    return;
};

function distributeDeck(game){
    let players = game.players;
    forEach(players, function (value) {
        let hand = new createHand(value.name);
        dummyHands(hand);
        game.hands.push(hand);
    });
    game.gameOn = true;
    getNextPlayer(players[0].name, game);

};

function initiateGame(game) {
    let players = game.players;
    forEach(players, function (value) {
        let hand = new createHand(value.name);
        distributeDeck(hand, game);
        game.hands.push(hand);
    });
    game.gameOn = true;
    getNextPlayer(players[0].name, game);

};

