const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const socket = new WebSocket("ws://" + location.host);

let myId = null;
let players = {};

const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 100;

/* Физика */
const gravity = 0.38;      // ← падение чуть плавнее
const accel = 0.75;
const maxSpeed = 9.5;
const friction = 0.88;
const jumpPower = -11.5;

/* Камера */
const CAMERA_ZOOM = 1.15;

let keys = {};
let player = {
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    onGround: false,
    name: ""
};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "init") {
        myId = data.id;
        player.name = data.name;
    }

    if (data.type === "state") {
        for (let id in data.players) {
            if (id !== myId) {
                players[id] = data.players[id];
            }
        }
    }
};

function update() {
    if (keys["ArrowLeft"]) player.vx -= accel;
    if (keys["ArrowRight"]) player.vx += accel;

    player.vx *= friction;

    if (player.vx > maxSpeed) player.vx = maxSpeed;
    if (player.vx < -maxSpeed) player.vx = -maxSpeed;

    if (keys["ArrowUp"] && player.onGround) {
        player.vy = jumpPower;
        player.onGround = false;
    }

    player.vy += gravity;

    player.x += player.vx;
    player.y += player.vy;

    const ground = 1000;
    if (player.y + PLAYER_HEIGHT > ground) {
        player.y = ground - PLAYER_HEIGHT;
        player.vy = 0;
        player.onGround = true;
    }

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "move",
            player: {
                x: player.x,
                y: player.y,
                name: player.name
            }
        }));
    }
}

function getCamera() {
    return {
        x: player.x - (canvas.width / CAMERA_ZOOM) / 2 + PLAYER_WIDTH / 2,
        y: player.y - (canvas.height / CAMERA_ZOOM) / 2 + PLAYER_HEIGHT / 2
    };
}

function drawPlayer(p, cam) {
    ctx.fillStyle = "black";
    ctx.fillRect(
        p.x - cam.x,
        p.y - cam.y,
        PLAYER_WIDTH,
        PLAYER_HEIGHT
    );

    ctx.fillStyle = "yellow";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        p.name || "",
        p.x - cam.x + PLAYER_WIDTH / 2,
        p.y - cam.y + PLAYER_HEIGHT + 20
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

    const cam = getCamera();

    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(cam.x, cam.y, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    ctx.fillRect(
        -cam.x,
        1000 - cam.y,
        5000,
        200
    );

    drawPlayer(player, cam);

    for (let id in players) {
        drawPlayer(players[id], cam);
    }

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
