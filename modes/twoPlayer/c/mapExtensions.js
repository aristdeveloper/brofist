function rectCollision(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

function applyMapExtensions(player, map) {
    if (!map) return;

    // POISON
    if (map.poison) {
        map.poison.forEach(p => {
            if (rectCollision(player, p)) {
                respawnPlayer(player, map);
            }
        });
    }

    // CHECKPOINTS
    if (map.checkpoints) {
        map.checkpoints.forEach(c => {
            if (rectCollision(player, c)) {
                player.checkpoint = { x: c.x, y: c.y };
            }
        });
    }

    // FINISH
    if (map.finish && rectCollision(player, map.finish)) {
        alert("Level Complete!");
        respawnPlayer(player, map);
    }
}

function respawnPlayer(player, map) {
    if (player.checkpoint) {
        player.x = player.checkpoint.x;
        player.y = player.checkpoint.y;
    } else if (map.spawn) {
        player.x = map.spawn.x;
        player.y = map.spawn.y;
    }

    player.vx = 0;
    player.vy = 0;
}
