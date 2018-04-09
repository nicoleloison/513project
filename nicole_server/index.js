const some = require('lodash/some');
const map = require('lodash/map');
const find = require('lodash/find');
const filter = require('lodash/filter');
const remove = require('lodash/remove');
const forEach = require('lodash/forEach')

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

app.get('/', function (req, res) { res.sendFile(__dirname + '/index.html'); });
http.listen(port, function () { console.log('listening on *:' + port); });

let game_index = 2;
let lobby = 'lobby';
/*
class laundryCards {
    constructor() {
        this.socks = 0;
        this.underwear = 0;
        this.mittens = 0;
        this.shorts = 0;
        this.shirt = 0;
        this.pants = 0;
        this.jacket = 0;
        this.hat = 0;
        this.sweater = 0;
        this.scarf = 0
        this.towel = 0,
            this.swimsuit = 0;
        this.dress = 0;
    }
    get shirt() {
        return this._shirt;
    }

    set shirt(value) {
        this._shirt = value;
    }
};
*/
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

let users = [
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
        console.log(email + ' joined room ' + room);
        let roomId = parseInt(room);
        joinRoom(email, room);
        io.sockets.in(room).emit('newPlayer', 'email');
        socket.join(room);
    });
    socket.on('create', function (email) {
        let newRoom = createGame(email);
        io.emit('newRoom', 'room');
       // io.sockets.in(newRoom).emit('newRoom', 'room');
        socket.join(newRoom);
    });

    socket.on('askforLaundry', function (askingPlayerID, requestedCard, requestedPlayerID) {
        console.log(askingPlayerID+ ' asking for '+requestedCard+ ' to '+requestedPlayerID);
        let room = roomCheck(askingPlayerID, requestedPlayerID);
        if (!room){
            console.log('Users in different rooms.');
            return ;
        }
        hasItem(requestedPlayerID, requestedCard);
        io.sockets.in(room).emit('message', true);
    });

});

function setAvatar(email, avatar_id) {
    let player = find(users, { id: email });
    if (!player) {
        console.log('Could not find user : ' + email);
        return;
    }
    player.avatar = avatar_id;
};

function createUser(email, name) {
    if (some(users, { id: email })) {
        console.log('Player ' + email + ' already added.');
        return;
    }
    let u = new user(email, name);
    users.push(u);
   // users.push({ id: email, name: nickname, game: -1, active: false, avatar: -1 });
    return;
};

function deleteUser(email) {
    let toRemove = find(users, { id: email });
    if (!toRemove) {
        console.log('Could not find user :' + email);
        return;
    }
    let hisGame = find(games, { game_id: toRemove.game });
    remove(hisGame.players, toRemove);
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

function joinRoom(email, room) {
    let player = find(users, { id: email });
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
    gameRoom.players.push(player);

    if (gameRoom.players.length = 4) {
        console.log('starting game !');
        //hideRoom();
        initiateGame(gameRoom);
        return;
    }
    return;
};

function roomCheck(email1, email2) {
    let room1 = find(users, { id: email1 }).game;
    let room2 = find(users, { id: email2 }).game;
    if (room1 === room2) {
        return true;
    }
    else return false;
};

function hasItem(email, item) {
    let player = find(users, { id: email });
    let game = find(games, { game_id: player.game });
    forEach(game.hands, function (value) {
        if (value.player == player.id){
            if(value.laundryCards.cards[item]!=0){
                console.log(email+ ' has some '+item+' !');
                return true;
            }
           return false;
        }
    });
    return false;
};
function createHand(email) {
    let playerHand = new hand(email);
    return playerHand;
};

function dummyHands(hand) {
    let c = hand.laundryCards;
    c.cards['shirt']=3;
    return;
};

function initiateGame(game) {
    let players = game.players;
    forEach(players, function (value) {
        let hand = new createHand(value.id);
        dummyHands(hand);
        game.hands.push(hand);
    });

}
