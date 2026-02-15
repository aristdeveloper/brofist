const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --------------------
// DATABASE
// --------------------
const db = new sqlite3.Database("./accounts.db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// --------------------
// SESSION
// --------------------
const sessionParser = session({
    secret: "brofist_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
        sameSite: "lax"
    }
});

app.use(express.json());
app.use(sessionParser);
app.use(express.static(__dirname));

// --------------------
// HELPERS
// --------------------
function validUsername(name) {
    return /^[a-zA-Z0-9._-]{3,16}$/.test(name);
}

function guestName() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return "Guest_" +
        chars[Math.floor(Math.random() * chars.length)] +
        chars[Math.floor(Math.random() * chars.length)];
}

// --------------------
// API
// --------------------

// Register
app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;

    if (!validUsername(username)) {
        return res.json({ ok: false, error: "Invalid username" });
    }

    if (!password || password.length < 4) {
        return res.json({ ok: false, error: "Password too short" });
    }

    const hash = await bcrypt.hash(password, 10);

    db.run(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        [username, hash],
        function (err) {
            if (err) {
                return res.json({ ok: false, error: "Username already taken" });
            }

            req.session.user = {
                id: this.lastID,
                username
            };

            res.json({ ok: true, username });
        }
    );
});

// Login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, user) => {
            if (!user) {
                return res.json({ ok: false, error: "User not found" });
            }

            const match = await bcrypt.compare(password, user.password_hash);

            if (!match) {
                return res.json({ ok: false, error: "Wrong password" });
            }

            req.session.user = {
                id: user.id,
                username: user.username
            };

            res.json({ ok: true, username: user.username });
        }
    );
});

// Check session
app.get("/api/me", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, username: req.session.user.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ ok: true });
    });
});

// --------------------
// WEBSOCKET
// --------------------
let players = {};

wss.on("connection", (ws, req) => {
    sessionParser(req, {}, () => {

        let name;

        if (req.session && req.session.user) {
            name = req.session.user.username;
        } else {
            name = guestName();
        }

        const id = Math.random().toString(36).substr(2, 9);

        players[id] = {
            x: 200,
            y: 100,
            name
        };

        ws.send(JSON.stringify({ type: "init", id, name }));

        ws.on("message", (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.type === "move") {
                    players[id] = {
                        ...players[id],
                        x: data.player.x,
                        y: data.player.y
                    };
                }
            } catch (e) {}
        });

        ws.on("close", () => {
            delete players[id];
        });
    });
});

// Broadcast state
setInterval(() => {
    const state = JSON.stringify({ type: "state", players });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(state);
        }
    });
}, 50);

// --------------------
// START SERVER (Render compatible)
// --------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
