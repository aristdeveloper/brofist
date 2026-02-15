const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let tool = "platform";

let map = {
    spawn: { x: 200, y: 300 },
    finish: { x: 800, y: 300, w: 40, h: 60 },
    platforms: [],
    checkpoints: [],
    buttons: [],
    levers: [],
    poison: []
};

let startX, startY, isDrawing = false;

document.querySelectorAll("#toolbar button[data-tool]").forEach(btn => {
    btn.onclick = () => tool = btn.dataset.tool;
});

canvas.onmousedown = (e) => {
    const x = e.clientX;
    const y = e.clientY;

    if (tool === "spawn") map.spawn = { x, y };
    else if (tool === "finish") map.finish = { x, y, w: 40, h: 60 };
    else if (tool === "checkpoint") map.checkpoints.push({ x, y, w: 30, h: 40 });
    else if (tool === "button") map.buttons.push({ x, y, w: 40, h: 10, pressed: false });
    else if (tool === "lever") map.levers.push({ x, y, w: 10, h: 40, active: false });
    else if (tool === "platform" || tool === "poison") {
        isDrawing = true;
        startX = x;
        startY = y;
    }
};

canvas.onmouseup = (e) => {
    if (!isDrawing) return;

    const x = e.clientX;
    const y = e.clientY;

    const rect = {
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        w: Math.abs(x - startX),
        h: Math.abs(y - startY)
    };

    if (tool === "platform") map.platforms.push(rect);
    if (tool === "poison") map.poison.push(rect);

    isDrawing = false;
};

document.getElementById("saveBtn").onclick = () => {
    localStorage.setItem("customMap", JSON.stringify(map));
    alert("Map saved!");
};

document.getElementById("loadBtn").onclick = () => {
    const data = localStorage.getItem("customMap");
    if (data) map = JSON.parse(data);
};

function drawRect(obj, color) {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    map.platforms.forEach(p => drawRect(p, "black"));
    map.poison.forEach(p => drawRect(p, "red"));
    map.checkpoints.forEach(c => drawRect(c, "orange"));
    map.buttons.forEach(b => drawRect(b, "purple"));
    map.levers.forEach(l => drawRect(l, "brown"));

    drawRect(map.finish, "blue");

    ctx.fillStyle = "green";
    ctx.fillRect(map.spawn.x - 10, map.spawn.y - 20, 20, 40);

    requestAnimationFrame(draw);
}

draw();
