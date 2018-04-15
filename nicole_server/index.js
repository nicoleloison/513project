const some = require('lodash/some');
const map = require('lodash/map');
const find = require('lodash/find');
const filter = require('lodash/filter');
const remove = require('lodash/remove');
const forEach = require('lodash/forEach');
const findIndex = require('lodash/findIndex');
const first = require('lodash/first');
const sample = require('lodash/sample');

let app = require('express')();
let http = require('http').Server(app, { cookie: true });
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

app.get('/', function (req, res) { res.sendFile(__dirname + '/index.html'); });
http.listen(port, function () { console.log('listening on *:' + port); });

let game_index = 2;
let defaultRoom = 'lobby';

let clothes = ['socks', 'underwear', 'mittens', 'shorts', 'shirt', 'pants',
    'jacket', 'hat', 'sweater', 'scarf', 'towel', 'swimsuit', 'dress'];

let cardTypes = clothes;

class laundryCards {
    constructor() {
        this.cards = [];
        let temp = this.cards;

        forEach(clothes, function(value){
            temp[value] = 0;
        });
        this.cards = temp;
    }

    static fullDeck() {
        this.cards = [];
        let temp = this.cards;

        forEach(clothes, function(value){
            temp[value] = 4;
        });

        return temp;
    }
};

let fullCards = laundryCards.fullDeck();

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
    console.log('User connected');

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
        // io.emit('returning', nickname, newComer.game);
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

    socket.on('donePlaying', function (nickname) {
        let player = find(users, { name: nickname });
        let gameRoom = find(games, { game_id: player.game });
        let next = getNextPlayer(nickname, gameRoom);
        console.log('Player was ' + nickname + ' now it is ' + next);
        socket.in(gameRoom.game_id).broadcast.emit('yourTurn', next);
        socket.emit('yourTurn', next);
    });

    socket.on('join', function (nickname, game) {
        console.log(nickname + ' was in room: ' + defaultRoom + ', now in room:' + game);
        //socket.in(room).broadcast.emit('roomChange', r);
        socket.leave(defaultRoom);
        socket.room = game;
        socket.join(game);
        socket.emit('roomChange', game);
        let ready = joinRoom(nickname, game);
        console.log(ready);
        socket.in(game).broadcast.emit('newPlayer', nickname);

        if (ready == true) {
            console.log('Room is ready');
            socket.emit('roomReady', game);
        }
    });

    socket.on('start', function (room) {
        let gameRoom = find(games, { game_id: room });
        initiateGame(room);

        io.sockets.in(room).emit('start', room);
        io.broadcast('start', room);
    });

    socket.on('readyToPlay', function (roomId) {
        console.log("Game " + roomId + " starting.");
        let gameRoom = find(games, { game_id: roomId });
        initiateGame(gameRoom);
        let firstPlayer = first(gameRoom.players);
        socket.emit('yourTurn', firstPlayer.name);
        //  io.sockets.in(game).emit('yourTurn', firstPlayer.name);
        //getNextPlayer(firstPlayer.name, game);
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
        let gameRoom = roomCheck(askingPlayerID, requestedPlayerID);
        if (!gameRoom) {
            console.log('Users in different rooms.');
            return;
        }
        let result = hasItem(requestedPlayerID, requestedCard);
        socket.emit('answer', result, askingPlayerID, requestedCard, requestedPlayerID);
        io.sockets.in(gameRoom).emit('answer', result, askingPlayerID, requestedCard, requestedPlayerID);
        if (hasPair(askingPlayerID, requestedCard)) {
            socket.emit('yourTurn', askingPlayerID);
        }
        else {
            GoFish(askingPlayerID);
            let next = getNextPlayer(askingPlayerID, gameRoom);
            socket.emit('yourTurn', next);
        }
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
    console.log('New user ' + name);
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
        return false;
    }
    let player = find(users, { name: nickname });
    if (!player) {
        console.log('Player ' + nickname + ' does not exist.');
        return false;
    }
    if (player.game != -1 || player.game == room) {
        console.log('Player is already in game ' + player.game);
        return false;
    }
    player.active = true;
    player.game = room;
    gameRoom.players.push(player);

    if (gameRoom.players.length == 4) {
        return true;
    }
    return false;
};

function getNextPlayer(nickname, gameRoom) {

    let i = findIndex(gameRoom.players, { name: nickname });
    //TODOD + PLAY.
    if (gameRoom.players[i].active == false) {
        pauseGame(gameRoom);
    }
    else
        ++i;
    if (i == gameRoom.players.length) {
        console.log("Max i : " + i + " players.length: " + gameRoom.players.length);
        i = 0;
    }

    console.log("It is " + gameRoom.players[i].name + "'s turn now.");
    return gameRoom.players[i].name;
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
        else{
            console.log('Go fish !');
            return false;
        }
    });
    return false;
};


function GoFish(nickname) {
    let pickedCard = randomCard();
    console.log(nickname+' picked a '+ pickedCard);
    console.log('\nAFTER PICKING IN DECK\n');
    forEach(clothes, function(value){
        let valueCard = fullCards[value];
        console.log('\t' + value + ' amount :\t\t' + valueCard);
    });
    return pickedCard;

};

function hasPair(nickname, item) {
    let player = find(users, { name: nickname });
    let game = find(games, { game_id: player.game });
    forEach(game.hands, function (value) {
        if (value.player == player.name && value.laundryCards.cards[item] == 2) {
            console.log(nickname + ' has a pair of ' + item + ' !');
            ++value.score;
            io.sockets.in(game.game_id).emit('pair', nickname, item);
        }
    });
    return false;
};

function createHand(nickname) {
    let playerHand = new hand(nickname);
    return playerHand;
};

function randomCard() {
    let randomType = sample(cardTypes);
    let amount = fullCards[randomType];

    if (amount < 0) {
        return false;
    }
    else if (amount == 0) {
        console.log('No more ' + randomType);
        return false;
    }
    else if (amount > 0) {
        --fullCards[randomType];
        return randomType
    }
};

function distributeDeck(hand, game) {
    let card = randomCard();

    while (!card) {
        card = randomCard();
    }

    ++hand.laundryCards[card];
    console.log('Delt a ' + card + " to " + hand.player);
};

function initiateGame(game) {
    let players = game.players;
    let newDeck = new laundryCards();
    //let cardTypes = clothes;
   // let fullCards = laundryCards.fullDeck();

    console.log('\nOG DECK\n');
    forEach(cardTypes, function (value) {
        let valueCard = fullCards[value];
        console.log('\t' + value + ', :\t' + valueCard);
    });

    forEach(players, function (value) {
        let hand = new createHand(value.name);
        game.hands.push(hand);
    });

    for (let i = 0; i < 5; i++) {
        console.log("Round " + i + ":\n");
        forEach(game.hands, function (value) {
            distributeDeck(value, game)
        });
    }

    io.sockets.in(game).emit('handDelt', game);


    console.log('\nREMAINING IN DECK\n');
    forEach(cardTypes, function (value) {
        let valueCard = fullCards[value];
        console.log('\t' + value + ' amount :\t\t' + valueCard);
    });
    game.gameOn = true;
};

