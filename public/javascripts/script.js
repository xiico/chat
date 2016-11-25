var tileSize = 24;
var bf = document.getElementById('bf');
var tileInfo = document.getElementById('tileInfo');
var animalInfo = document.getElementById('animalInfo');
var divChat = document.getElementById('divChat');
var msg = document.getElementById('msg');
var tblTroops = document.getElementById('tblTroops');
var start = document.getElementById('start');
var endMatch = document.getElementById('endMatch');
var divName = document.getElementById('divName');
var pName = document.getElementById('pName');
var pOpponent = document.getElementById('pOpponent');
var divJoinCreateSession = document.getElementById('divJoinCreateSession');
var lstSessions = document.getElementById('lstSessions');
var txtSessionName = document.getElementById('txtSessionName');
var sessionName = document.getElementById('sessionName');
var connStatus = document.getElementById('connStatus');//mainStatus
var mainStatus = document.getElementById('mainStatus');//mainStatus
var sessionStatus = document.getElementById('sessionStatus');
var divBlockMove = document.getElementById('divBlockMove');
var matchInfo = document.getElementById('matchInfo');
var content = document.getElementById('content');
var txtName = document.getElementById('txtName');
var showSessionName = false;
var checkConnection = true;
var itsOver = false;
var nRows = 12;
var nColumns = 8;
updateTilesSizes();
var ctx = bf.getContext('2d');
var mousex = 0;
var mousey = 0;
var chosenType = "";
var chosenTile = null;
var choosing = true;
var name = "";
var pNumber = "";
var clientID = Math.ceil(Math.random() * 1000000000000);
var lastMoveId = 0;
var sessionID = null;
var opponentName = "";
var initialized = false;
var move = { tile: null, oldPos: { x: null, y: null }, newPos: { x: null, y: null } };
var send = "";
var tiles = null;
var tilesLoaded = false;
var turn = "";
var mousePos = { col: 0, row: 0 };
var sendTimer = 0;
var sendCommand = null;

/*0	The connection is not yet open.*/
/*1	The connection is open and ready to communicate.*/
/*2	The connection is in the process of closing.*/
/*3	The connection is closed or couldn't be opened.*/
var connStates = ["CONNECTING", "Connected"/*OPEN*/, "CLOSING", "Disconnected"/*CLOSED*/];

var troops = new Array(8);
var tnames = "RCDMWLTF";
var tvalues = "83322141";
var powers = "13427a00";
var descriptions = ["Can move several spaces.", "Meow?", "Man's best friend", "Can disarm traps", "Howling in the night.", "Long live the king!", "It's a trap!", "If you lose it, you will die"];

txtName.focus();
for (var i = 0; i < 8; i++) {
    troops[i] = { type: tnames[i], left: tvalues[i] };
}

if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function(str) {
        return this.indexOf(str) === 0;
    };
}

for (var i = 0; i < 2; i++) {
    var elm = document.getElementsByClassName('divNames')[i];
    elm.addEventListener('mouseenter', function() {
        self = this;
        if (self.offsetWidth < self.scrollWidth) {
            self.setAttribute('title', self.firstChild.textContent);
        }
    }, false);
}

bf.onmousemove = function(event) {
    /*if (!tiles)
        return;*/
    mousex = event.clientX - bf.offsetLeft;
    mousey = event.clientY - bf.offsetTop + document.getElementsByTagName('body')[0].scrollTop;
    mousePos.col = Math.abs(Math.ceil(mousex / tileSize) + (pNumber == "1" ? 0 : -(nColumns + 1)));
    mousePos.row = Math.abs(Math.ceil(mousey / tileSize) + (pNumber == "1" ? 0 : -(nRows + 1)));
    var col = mousePos.col;
    var row = mousePos.row;
    tileInfo.innerText = "[" + ((col + "").length - 1 ? "" : "0") + col + "][" + ((row + "").length - 1 ? "" : "0") + row + "]";

    if (tiles && col > 0 && row > 0)//if (chosenTile && chosenTile.selected) 
    {
        //tstInfo.textContent = tiles[col-1][row-1].col() + " - " + tiles[col-1][row-1].row()
        //tiles[col - 1][row - 1].centerColor = '#b0b0ff';
    }

    count = 30;
}
window.onbeforeunload = function() {
    return 'Are you sure you want to leave?';
};
var ws = null;
ConnectWS();

function updateTilesSizes() {
    tileSize = portrait() ? 32 : 24;
    bf.width = tileSize * nColumns;
    bf.height = tileSize * nRows;
    content.style.height = bf.height + "px";
    content.style.width = bf.width + "px";
    sessionName.style.width = bf.width + "px";
    sessionName.style.height = bf.height + "px";
    divBlockMove.style.width = bf.width + "px";
    divBlockMove.style.height = bf.height + "px";
}

function ConnectWS() {
    //ws = new WebSocket('ws://localhost:8082/');
    //ws = new WebSocket('ws://172.23.141.30:8081/');    
    //ws = new WebSocket('ws://FRANCISCO-PC:8082/');
    //ws = new WebSocket('ws://45.55.221.225:8081/');
    ws = new WebSocket('ws://172.23.134.35:8081/');
    ws.onmessage = function(event) {
        processServerResponse(event.data);
    };
    ws.onclose = function(event) {
        resetState();
    };
}

function resetState() {
    chosenType = "";
    chosenTile = null;
    choosing = true;
    pNumber = "";
    lastMoveId = 0;
    sessionID = null;
    opponentName = "";
    //initialized = false;
    move = { tile: null, oldPos: { x: null, y: null }, newPos: { x: null, y: null } };
    send = "";
    tiles = null;
    ctx.clearRect(0, 0, bf.width, bf.height);
    tilesLoaded = false;
    count = 0;
    turn = "";
    sessionStatus.textContent = "";
    itsOver = false;
    joinOrCreateSession();
}

function joinOrCreateSession(option) {
    //[ClientID],[pNumber],[msg],[move],[start board].
    if (!CheckConnection())
        return false;

    var cmd = new command();
    switch (option) {
        case "J":
            cmd.type = "jss";
            cmd.msg = lstSessions.options[lstSessions.selectedIndex].value;
            cmd.pNumber = pNumber;
            cmd.Send();
            break;
        case "C":
            showSessionName = true;
            txtSessionName.focus();
            /************ teste *************/
            //processServerResponse("*sct*01*");
            /************ teste *************/
            break;
        default:
            for (var i = lstSessions.options.length - 1; i >= 0; i--)
                lstSessions.remove(i);
            cmd.type = "lst";
            cmd.Send();
            break;
    }
}

function Tile() {
    self = this;
    self.borderColor = '#202020';
    self.frameColor = '#909090';
    self.centerColor = '#b0b0b0';
    self.x = 0;
    self.y = 0;
    self.col = function() { self = this; return Math.abs(Math.ceil(self.x / tileSize) + (pNumber == "1" ? 1 : -(nColumns))); };
    self.row = function() { self = this; return Math.abs(Math.ceil(self.y / tileSize) + (pNumber == "1" ? 1 : -(nRows))); };
    self.animal = null;
    self.selected = false;
    self.highlighted = false;
    self.puddle = false;
    self.Draw = function() {
        self = this;
        //drawborder
        ctx.fillStyle = self.borderColor;
        if (!self.puddle) {
            ctx.fillRect(self.x, self.y, tileSize, tileSize);
            ctx.fillStyle = self.frameColor;
            ctx.fillRect(self.x + 1, self.y + 1, tileSize - 2, tileSize - 2);
            ctx.fillStyle = self.centerColor;
            if (self.animal && self.animal.hidden && self.animal.pNumber == pNumber)
                ctx.fillStyle = "#606060";
            ctx.fillRect(self.x + 4, self.y + 4, tileSize - 8, tileSize - 8);
        }

        if (self.animal)
            self.animal.Draw();
    }
}
function Animal(type, obj) {
    //Types:R,C,D,M,W,L,T,F
    self = this;
    self.type = type;
    self.parent = obj;
    self.hidden = true;
    self.pNumber = "";
    self.x = self.parent.x + 7;//(type == 'W' ? -2 : 0) + (type == 'T' ? 2 : 0) + (type == 'F' ? 1 : 0) + (type == 'L' ? 1 : 0) + (type == 'M' ? -1 : 0)
    self.y = self.parent.y + 22;
    self.power = function() {
        self = this; powers
        switch (self.type) {
            case 'R'://rat - 8
                return parseInt(powers[0], 16);//1;
            case 'C'://cat - 3
                return parseInt(powers[1], 16);//3;
            case 'D'://dog - 3
                return parseInt(powers[2], 16);//4;
            case 'M'://monkey - 2
                return parseInt(powers[3], 16);//2;
            case 'W'://wolf - 2
                return parseInt(powers[4], 16);//7;
            case 'L'://lion - 1
                return parseInt(powers[5], 16);//10;
            case 'T'://trap - 4
                return parseInt(powers[6], 16);//0;
            case 'F'://food - 1
            default:
                return parseInt(powers[7], 16);//0;;
        }
    }
    self.Draw = function() {
        self = this;

        for (var i = 0; i < 8; i++) {
            if (self.type == tnames[i] && self.pNumber == pNumber)
                troops[i].left--;
        }

        if (!self.parent.puddle)
            ctx.fillStyle = self.parent.selected || self.parent.highlighted ? "#ffffff" : (self.pNumber == pNumber) ? "#1010ff" : "#ff1010";
        else
            ctx.fillStyle = "#ffffff";
        var fs = 20;
        ctx.font = fs + "px Consolas";
        var offSet = 0;//(type == 'W' ? -2 : 0) + (type == 'T' ? 2 : 0) + (type == 'F' ? 1 : 0) + (type == 'L' ? 1 : 0) + (type == 'M' ? -1 : 0);
        var visible = self.hidden && (self.pNumber != pNumber);
        ctx.fillText((visible ? "#" : self.type), (self.parent.x + ((tileSize / 2) - 6)) + (visible ? offSet : 0), (self.parent.y + ((tileSize / 2) + 7)));
    }
}
function CreateTiles() {
    tiles = new Array(nRows);
    for (var i = 0; i < nColumns; i++) {
        tiles[i] = new Array(nRows);
    }
}
function portrait() {
    return (window.orientation && Math.abs(window.orientation) != 90) ||
        document.getElementsByTagName('body')[0].offsetWidth < 525;
}

//var si = window.setInterval('main()', 33);

var count = 0;
function main() {
    mainStatus.textContent = "cmd";
    var cmd = new command();

    if (clientID && name != "" && !initialized) {
        cmd.type = "fst";
        cmd.pName = name;
        cmd.Send();
        initialized = true;
    }

    if (portrait()) {
        tileSize = 32;
    }
    else {
        tileSize = 24;
    }

    mainStatus.textContent = "connStatus";
    connStatus.textContent = connStates[ws.readyState];
    if (ws.readyState == 1)
        connStatus.className = "connStatusG";
    else if (ws.readyState == 3)
        connStatus.className = "connStatusR";
    else
        connStatus.className = "connStatus";

    var startColumn = 0;
    var startRow = 0;
    if (name != "" && sessionID && !tiles)
        CreateTiles();
    var p1 = pNumber == "1";
    if (!p1) {
        startColumn = nColumns;
        startRow = nRows;
    }


    mainStatus.textContent = "count >= 20";
    if (count >= 20) {

        if (tiles) {

            if (sendTimer > 0) {
                var animal = tiles[sendCommand.move.newPos.x][parseInt(sendCommand.move.newPos.y, 16)].animal;
                animal.hidden = !animal.hidden;
            }

            for (var i = 0; i < 8; i++) {
                troops[i] = { type: tnames[i], left: tvalues[i] };
            }
            updateTilesSizes();
            loadTiles(p1, startColumn, startRow);
            //update tvalues
            if (choosing)
                for (var i = 0; i < 8; i++) {
                    tblTroops.rows[0].cells[i].textContent = troops[i].left;
                    if (troops[i].type == chosenType && troops[i].left == 0) {
                        chosenType = "";
                        if (i < 7 && troops[i + 1].left > 0)
                            chosenType = troops[i + 1].type;
                    }
                }
        } else
            updateTilesSizes();
        count = 0;
    }
    mainStatus.textContent = "if (tiles)";
    if (tiles)
        bf.style.backgroundColor = "#000000"
    else
        bf.style.backgroundColor = "#ffffff"

    //show chosen type
    //msg.textContent = chosenType;
    mainStatus.textContent = "tblTroops.rows[1]";
    for (var i = 0; i < tblTroops.rows[1].cells.length; i++) {
        var obj = tblTroops.rows[1].cells[i].children[0];
        if (obj.value == chosenType) {
            obj.attributes["data-selected"].value = true;
            obj.className = "typeSelector typeSelectorSelected";
        } else {
            obj.attributes["data-selected"].value = false;
            obj.className = "typeSelector";
        }
    }

    var canStart = 0;
    for (var i = 0; i < 8; i++) {
        canStart += parseInt(troops[i].left);
    }

    mainStatus.textContent = "start.disabled";
    start.disabled = canStart != 0;
    start.style.display = (choosing && name != "" && sessionID ? "block" : "none");
    tblTroops.style.display = (choosing ? "block" : "none");
    divName.style.display = (name == "" ? "block" : "none");
    pName.textContent = (name != "" ? name : "?");
    pOpponent.textContent = (opponentName != "" ? opponentName : "?");
    showChosenInfo();
    divJoinCreateSession.style.display = (name != "" && !tiles ? "block" : "none");
    sessionName.style.display = (showSessionName ? "block" : "none");
    btnJoinSession.disabled = !(lstSessions.selectedIndex != -1 && lstSessions.options[lstSessions.selectedIndex].value != "0");

    divBlockMove.style.display = ((turn == "" || turn[1] == pNumber) ? "none" : "block");
    bf.style.display = (tiles ? "block" : "none");

    mainStatus.textContent = "sessionName";
    if (sessionName.style.display == "block")
        txtSessionName.focus();

    if (turn == "wfo")
        sessionStatus.textContent = "waiting for the opponent...";
    else if (turn[2] == "l")
        sessionStatus.textContent = opponentName + " left.";

    endMatch.style.display = itsOver ? "block" : "none";
    if (itsOver) {
        divBlockMove.style.display = "block";
    }
    //sessionStatus.textContent = document.getElementsByTagName('body')[0].offsetWidth + ' - ' + document.getElementsByTagName('body')[0].offsetHeight;

    if (sendTimer > 0) {
        sendTimer--;
        divBlockMove.style.display = "block";
    }
    if (sendTimer == 0 && sendCommand) {
        tiles[sendCommand.move.newPos.x][parseInt(sendCommand.move.newPos.y, 16)].animal.hidden = false;
        sendCommand.Send();
        sendCommand = null;
    }

    count++;
    mainStatus.textContent = count;
    window.requestAnimationFrame(main);
}
window.requestAnimationFrame(main);

function loadTiles(p1, startColumn, startRow) {
    for (var y = (p1 ? startRow : startRow - 1); (p1 ? y < nRows : y >= 0); (p1 ? y++ : y--)) {
        for (var x = (p1 ? startColumn : startColumn - 1); (p1 ? x < nColumns : x >= 0); (p1 ? x++ : x--)) {
            if (!tiles[x][y]) {
                if ((y == ((nRows / 2) - 1) || y == ((nRows / 2))) && (x == 1 || x == 2 || x == 5 || x == 6)) {
                    tiles[x][y] = new Tile();
                    tiles[x][y].puddle = true;
                    tiles[x][y].animal = new Animal("T", tiles[x][y]);
                    tiles[x][y].animal.pNumber = "3";
                    continue;
                }
                tiles[x][y] = new Tile();
            }
            tiles[x][y].x = Math.abs(x + (p1 ? 0 : -(nColumns - 1))) * tileSize;
            tiles[x][y].y = Math.abs(y + (p1 ? 0 : -(nRows - 1))) * tileSize;

            if ((y == ((nRows / 2) - 1) || y == ((nRows / 2))) && (x == 1 || x == 2 || x == 5 || x == 6)) {
                tiles[x][y].Draw();
                continue;
            }
            if (!testMobile()) {
                if ((x == (mousePos.col - 1) && y == (mousePos.row - 1) && tilesLoaded)
                    && (tiles[x][y].animal == null || (tiles[x][y].animal.pNumber != pNumber))
                    && (canMove(x, y) && (turn == "" || turn[1] == pNumber))) {
                    tiles[x][y].centerColor = '#2020ff';
                    tiles[x][y].highlighted = true;

                }
                else {
                    tiles[x][y].centerColor = '#b0b0b0';
                    tiles[x][y].highlighted = false;
                }
            }
            else {
                if ((tilesLoaded && chosenTile && chosenTile.selected)
                    && (tiles[x][y].animal == null || (tiles[x][y].animal.pNumber != pNumber))
                    && (canMove(x, y) && (turn == "" || turn[1] == pNumber))) {
                    tiles[x][y].centerColor = '#2020ff';
                    tiles[x][y].highlighted = true;
                }
                else {
                    tiles[x][y].centerColor = '#b0b0b0';
                    tiles[x][y].highlighted = false;
                }
            }

            tiles[x][y].Draw();

            if (!tiles[x][y].animal)
                tiles[x][y].selected = false;
        }
    }
    tilesLoaded = true;
}
function testMobile() {
    var devices = 'android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini';
    for (var i = 0; i < devices.split('|').length; i++) {
        if (navigator.userAgent.toLowerCase().indexOf(devices.split('|')[i]) > 0)
            return true;
    }
    return false;
}
function canMove(x, y) {
    if (!chosenTile || !chosenTile.selected)
        return false;
    if (choosing)
        return true;
    var chosenX = chosenTile.col() - 1;
    var chosenY = chosenTile.row() - 1;
    if (!chosenTile.animal)
        return false;
    chosenType = chosenTile.animal.type;
    if (chosenType == "R") {
        if (x != chosenX && y != chosenY)
            return false;

        var asc = false;

        if (x == chosenX) {
            asc = y > chosenY;
            for (var i = chosenY + (asc ? +1 : -1); (asc ? i <= y : i >= y); (asc ? i++ : i--)) {
                if (!tiles[x][i].animal) {
                    if (y == i)
                        return true
                    else
                        continue;
                }
                if (tiles[x][i].animal) {
                    if (tiles[x][i].animal.pNumber != pNumber && i == y)
                        return true;
                    else
                        return false;
                }
                if (i == chosenY)
                    return true;
            }
        }
        if (y == chosenY) {
            asc = x > chosenX;
            for (var i = chosenX + (asc ? +1 : -1); (asc ? i <= x : i >= x); (asc ? i++ : i--)) {
                if (!tiles[i][y].animal) {
                    if (x == i)
                        return true
                    else
                        continue;
                }
                if (tiles[i][y].animal) {
                    if (tiles[i][y].animal.pNumber != pNumber && i == x)
                        return true;
                    else
                        return false;
                }
                if (i == chosenX)
                    return true;
            }
        }
        return false;
    }
    else {
        if (chosenType == "T" || chosenType == "F")
            return false;
        return (tiles[(x + 1 == nColumns ? x : x + 1)][y].selected || tiles[(x - 1 < 0 ? x : x - 1)][y].selected ||
            tiles[x][(y + 1 == nRows ? y : y + 1)].selected || tiles[x][(y - 1 < 0 ? y : y - 1)].selected);
    }
}

function showTileInfo(e) {
    var p1 = pNumber == "1";
    var col = Math.abs(Math.ceil(mousex / tileSize) + (p1 ? 0 : -(nColumns + 1)));
    var row = Math.abs(Math.ceil(mousey / tileSize) + (p1 ? 0 : -(nRows + 1)));
    var cmd = new command();
    if (choosing) {
        if (tiles && tiles[col - 1][row - 1] && tiles[col - 1][row - 1].animal) chosenType = tiles[col - 1][row - 1].animal.type;
        if (chosenTile && chosenTile != tiles[col - 1][row - 1]) chosenTile.selected = false;
        chosenTile = tiles[col - 1][row - 1];
        if ((p1 ? row > (nRows - 3) : row < 4) && chosenType != "") {
            var cat = chosenAnimalType();
            if (!chosenTile.animal) {
                chosenTile.animal = new Animal(chosenType, chosenTile);
                if (cat.left == 0) {
                    chosenType = "";
                }
                cmd = new command();
                move.tile = chosenTile;
                move.newPos.x = (col - 1).toString()
                move.newPos.y = (row - 1).toString(16);
                cmd.move = move;
                cmd.type = "mov";
                cmd.Send();
                chosenTile.animal = null;
            } else {
                chosenType = chosenTile.animal.type;
                cmd = new command();
                move.tile = chosenTile;
                move.newPos.x = (col - 1).toString()
                move.newPos.y = (row - 1).toString(16);
                cmd.move = move;
                cmd.type = "mov";
                cmd.Send();
            }
        }
    } else {
        if (tiles[col - 1][row - 1].puddle) {
            chosenTile.selected = false;
            return;
        }
        if (tiles[col - 1][row - 1].animal) {
            if (tiles[col - 1][row - 1].animal.pNumber == pNumber) {
                tiles[col - 1][row - 1].selected = !tiles[col - 1][row - 1].selected;
                if (tiles[col - 1][row - 1].selected)
                    chosenType = tiles[col - 1][row - 1].animal.type;
                else
                    chosenType = "";

                if (chosenTile != tiles[col - 1][row - 1])
                    chosenTile.selected = false;
            } else {
                if (canMove(col - 1, row - 1)) {
                    cmd = new command();
                    if (tiles[col - 1][row - 1].animal.power() >= chosenTile.animal.power()) {
                        move.tile = (tiles[col - 1][row - 1].animal.power() > chosenTile.animal.power()) && tiles[col - 1][row - 1].animal.type != "T" ? tiles[col - 1][row - 1] : new Tile();
                    } else {
                        move.tile = tiles[col - 1][row - 1].animal.type != "T" || (chosenTile.animal.type == "M" && tiles[col - 1][row - 1].animal.type == "T") ? chosenTile : new Tile();
                    }

                    if (move.tile.animal)
                        move.tile.animal.hidden = false;

                    tiles[col - 1][row - 1].animal.hidden = false

                    move.oldPos.x = (chosenTile.col() - 1).toString()
                    move.oldPos.y = parseInt(chosenTile.row() - 1).toString(16);
                    move.newPos.x = (col - 1).toString()
                    move.newPos.y = (row - 1).toString(16);
                    cmd.move = move;
                    cmd.type = "mov";

                    /***********/
                    //cmd.Send();
                    sendTimer = 90;
                    sendCommand = cmd;
                    /***********/
                }
                chosenTile.selected = false;
            }
        }
        else {
            if (canMove(col - 1, row - 1)) {
                cmd = new command();
                move.tile = chosenTile;
                move.oldPos.x = (chosenTile.col() - 1).toString()
                move.oldPos.y = parseInt(chosenTile.row() - 1).toString(16);
                move.newPos.x = (col - 1).toString()
                move.newPos.y = (row - 1).toString(16);
                cmd.move = move;
                cmd.type = "mov";
                cmd.Send();
            } else {
                chosenTile.selected = false;
                chosenType = "";
            }
        }
        chosenTile = tiles[col - 1][row - 1];
    }
    count = 30;
}

function SendData() {

}

function chosenAnimalType() {
    for (var i = 0; i < 8; i++) {
        {
            if (chosenType == troops[i].type) {
                return troops[i];
            }
        }
    }
}
function sendChat(e, obj) {
    if (e.keyCode != 13 || obj.value.trim().length == 0)
        return;
    var cmd = new command();
    cmd.type = "cht";
    cmd.msg = obj.value;
    cmd.pName = name;
    cmd.Send();
    obj.value = "";
}
function updateChat(e, obj) {

    divChat.innerHTML += '<span class="chatName" >' + obj.pName + "</span><span>: " + obj.msg + '</span><br>';
    divChat.scrollTop = divChat.scrollHeight;
}
function chooseName(e, obj) {
    if (e.keyCode != 13 || obj.value.trim().length == 0)
        return;

    checkConnection = true;

    if (!CheckConnection())
        return false;

    name = obj.value;
    joinOrCreateSession();
}

function CheckConnection() {
    if (!checkConnection)
        return false;
    if (ws.readyState != 1) {
        sessionStatus.textContent = 'No connection';
        ConnectWS();
        checkConnection = false;
        return false;
    }
    return true;
}
function sessionNameChosen(e, obj) {

    if (e.keyCode != 13 || obj.value.trim().length == 0) {
        if (e.keyCode == 27) {
            showSessionName = false;
            txtSessionName.value = "";
        }
        return;
    }

    var cmd = new command();
    cmd.type = "cse";
    cmd.msg = txtSessionName.value
    txtSessionName.value = "";
    cmd.Send();
}
function pickClick(obj) {
    if (!choosing)
        return false;

    if (troops[obj.parentNode.cellIndex].left > 0 && chosenType != obj.value) {
        chosenType = obj.value;
    }
    else
        chosenType = "";
}
function showChosenInfo() {
    if (chosenType != "") {
        var tag = '<span class="animalInfo">';
        var info = tag + "Power: " + animalPower() + "</span><br>";
        info += tag + "Info: " + animalDescription() + "</span><br>";
        animalInfo.innerHTML = info;
    }
    else {
        animalInfo.innerHTML = '<span class="animalInfo">Animal info</span><br />';
    }
}
function animalPower() {
    for (var i = 0; i < 8; i++)
        if (chosenType == tnames[i])
            return parseInt(powers[i], 16);
    return "";
}

function animalDescription() {
    for (var i = 0; i < 8; i++)
        if (chosenType == tnames[i])
            return descriptions[i];
    return "";
}
function ConvertTileToChar(tile) {
    //"01234567"
    //"00000XXX" = animal Type
    //"0000X000" = p number
    //"000X0000" = hidden
    //"00X00000" = contains animal
    var toServer = "00100000";
    if (tile) {
        var atype = "000";
        var tnames = "RCDMWLTF";
        if (tile.animal) {
            for (var i = 0; i < 8; i++) {
                if (tile.animal.type == tnames[i])
                    atype = pad(i.toString(2), 3);
            }
            toServer = atype;
            if (tile.animal.pNumber == "")
                toServer = (parseInt(pNumber) - 1) + toServer;
            else
                toServer = (parseInt(tile.animal.pNumber) - 1) + toServer;
            toServer = (tile.animal.hidden ? "1" : "0") + toServer;
            toServer = "1" + toServer;
        }
        else
            toServer = "000" + atype;

        toServer = "01" + toServer;
    }
    return String.fromCharCode(parseInt(toServer, 2));
}
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function startMatch() {
    //[clientID],[pNumber],[msg],[move],[startboard]
    choosing = false;
    var cmd = new command();
    cmd.type = "suc";//setup complete
    turn = "wfo";
    cmd.Send();
}
function convertChosenToChars() {
    var result = "";
    var startColumn = 0;
    var startRow = 0;
    var p1 = pNumber == "1";
    for (var y = (p1 ? startRow : startRow - 1); (p1 ? y < nRows : y >= 0); (p1 ? y++ : y--)) {
        for (var x = (p1 ? startColumn : startColumn - 1); (p1 ? x < nColumns : x >= 0); (p1 ? x++ : x--)) {
            if (tiles[x][y].animal) {
                result += ConvertTileToChar(tiles[x][y]);
            }
        }
    }
    return result;
}
function processServerResponse(data) {
    //[system message],[type],[message],[board]
    var rsp = new Response(data);
    if (rsp.systemMessage != "")
        showMessage({ value: rsp.systemMessage });

    if (rsp.type != "") {
        switch (rsp.type) {
            case "cht":
                updateChat(null, rsp);
                break
            case "lst":
                updateSessionList(rsp);
                break;
            case "sct"://session created
                sessionID = rsp.sessionID;
                showSessionName = false;
                pNumber = "1";
                //joinOrCreateSession();
                break;
            case "sjn"://session joined
                sessionID = rsp.sessionID;
                opponentName = rsp.opponentName;
                showSessionName = false;
                pNumber = "2";
                break;
            case "och"://opponent chosen
                opponentName = rsp.opponentName;
                break;
            case "ubd"://opponent chosen
                loadBoard(rsp.board);
                break;
            case "nse"://session terminated
                /*alert('session terminated');*/
                tiles = null;
                break;
            case "sch"://status changed
                turn = rsp.status;
                if (turn[2] == "t")
                    sessionStatus.textContent = turn[1] == pNumber ? "your turn" : opponentName + "'s turn";
                else if (turn[2] == "w") {
                    sessionStatus.textContent = turn[1] == pNumber ? "you won" : opponentName + " won";
                    itsOver = true;
                } else if (turn[2] == "l") {
                    itsOver = true;
                }

                if (rsp.move && rsp.move.oldPos.x && !itsOver)
                    matchInfo.textContent = "Last move: " + (parseInt(rsp.move.oldPos.x) + 1) + ":" + (parseInt(rsp.move.oldPos.y,16) + 1) + " to "
                                                          + (parseInt(rsp.move.newPos.x) + 1) + ":" + (parseInt(rsp.move.newPos.y,16) + 1);
                else
                    matchInfo.textContent = "";
                    
                break;
            default:
        }
    }
    count = 30;
}
function updateSessionList(rsp) {
    for (var index = 0; index < rsp.sessions.length; index++) {
        var ss = rsp.sessions[index];
        var opt = document.createElement("option");
        opt.text = ss.name;
        opt.value = ss.id;
        lstSessions.add(opt);
    }
}
function loadBoard(boardData) {
    if (boardData != "" && tiles)
        for (var y = 0; y < nRows; y++) {
            for (var x = 0; x < nColumns; x++) {
                if ((y == ((nRows / 2) - 1) || y == ((nRows / 2))) && (x == 1 || x == 2 || x == 5 || x == 6))
                    continue;
                tiles[x][y].animal = processTileInfo(boardData[(nColumns * y) + x], tiles[x][y]);
            }
        }
}
function showMessage(data) {
    sessionStatus.textContent = data.value;
}
function processTileInfo(char, parent) {
    if (!char)
        return;

    var at = "RCDMWLTF";
    var charb = pad(char.charCodeAt(0).toString(2), 8);
    if (charb[2] == "0")
        return null;
    //01234567
    //00X00000  contains tile
    //000X0000  hidden
    //0000X000  p number
    //00000XXX  type
    var index = parseInt(charb.substring(5), 2);
    var animal = new Animal(at[index], parent);
    animal.hidden = charb[3] == 1;
    animal.pNumber = charb[4] == 0 ? "1" : "2";

    return animal;
}
function command() {
    self = this;
    self.clientID = clientID;
    self.pNumber = pNumber;
    self.pName = "";
    self.type = "";
    self.msg = "";
    self.move = move;
    self.board = "";
    self.createString = function() {
        self = this;
        // var mv = "";
        // if (self.move && self.move.tile) {
        //     mv = ConvertTileToChar(self.move.tile) + ";";
        //     mv += self.move.newPosition + ";";
        //     mv += self.move.oldPosition;
        // }
        // return self.clientID + "*" + self.pNumber + "*" + self.pName + "*" + self.type + "*" + self.msg + "*" + mv + "*" + self.board;
        self.move.tile = ConvertTileToChar(self.move.tile);
        return JSON.stringify(self);
    }

    self.Send = function() {
        self = this;
        ws.send(self.createString());
    }
}

function Response(data) {
    // rsp = data.split("*");
    // //[system message],[type],[message],[board]
    // self = this;
    // self.systemMessage = rsp[0];
    // self.type = rsp[1];
    // self.message = rsp[2];
    // self.board = rsp[3];
    var rsp = JSON.parse(data);
    var keys = Object.keys(rsp);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        this[key] = rsp[key]
    }
}