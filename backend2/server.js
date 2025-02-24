const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// **⚡ 待機中のプレイヤーリストを管理する変数**
let waitingPlayers = [];

// **🚀 待機所のHTMLを提供**
app.use(express.static(path.join(__dirname, 'public')));

// **👥 ユーザーが接続**
io.on('connection', (socket) => {
    console.log(`🔗 ユーザー接続: ${socket.id}`);

    // **👤 待機所に参加**
    socket.on("joinWaitingRoom", (username) => {
        if (!waitingPlayers.includes(username)) {
            waitingPlayers.push(username);
        }
        console.log("📝 参加プレイヤー:", waitingPlayers);
        io.emit("updatePlayerList", waitingPlayers);
    });

    // **🚀 ゲーム開始**
    socket.on("startGame", () => {
        console.log("🎮 ゲーム開始!");
        io.emit("redirectToGame"); // 全員をゲームページへリダイレクト
    });

    // **🔌 切断時の処理**
    socket.on("disconnect", () => {
        console.log(`❌ ユーザー切断: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

// **🔍 ローカルIPアドレスを取得**
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        for (let iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
};

// **🎮 ゲーム画面を提供**
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// **🌍 外部アクセスを許可**
server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`🚀 Server is running on:`);
    console.log(`📌 Local:   http://localhost:${PORT}/waiting_room.html`);
    console.log(`📡 Network: http://${localIP}:${PORT}/waiting_room.html`);
});
