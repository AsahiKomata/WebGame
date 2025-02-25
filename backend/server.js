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
let adminSocketId = null; // 管理者の socket.id を保存

// **🚀 待機所のHTMLを提供**
app.use(express.static(path.join(__dirname, 'public')));

// **👥 ユーザーが接続**
io.on('connection', (socket) => {
    console.log(`🔗 ユーザー接続: ${socket.id}`);

    // **👤 待機所に参加**
    socket.on("joinWaitingRoom", (username) => {
        if (!waitingPlayers.some(p => p.username === username)) {
            waitingPlayers.push({ username, socketId: socket.id });
        }
    
        // 最初のプレイヤーを管理者に設定
        if (adminSocketId === null) {
            adminSocketId = socket.id;
            io.to(socket.id).emit("setAsAdmin");
            console.log(`👑 ${username} が管理者になりました！`);
        }
    
        io.emit("updatePlayerList", waitingPlayers.map(p => p.username));
    });

    // **🚀 ゲーム開始（管理者のみ）**
    socket.on("startGame", () => {
        if (socket.id === adminSocketId) {
            console.log("🎮 ゲーム開始!");
            io.emit("redirectToGame");
        } else {
            console.log("⚠ 管理者以外はゲームを開始できません！");
        }
    });

    // **🔌 切断時の処理**
    socket.on("disconnect", () => {
        console.log(`❌ ユーザー切断: ${socket.id}`);
    
        // 切断したユーザーを waitingPlayers から削除
        waitingPlayers = waitingPlayers.filter(player => player.socketId !== socket.id);
        io.emit("updatePlayerList", waitingPlayers.map(p => p.username));
    
        // 管理者が切断した場合、新しい管理者を選ぶ
        if (socket.id === adminSocketId) {
            adminSocketId = null;
            if (waitingPlayers.length > 0) {
                const newAdmin = waitingPlayers[0].socketId; // 次のプレイヤーを管理者に
                adminSocketId = newAdmin.socketId;
                io.to(adminSocketId).emit("setAsAdmin");
                console.log(`👑 新しい管理者が設定されました: ${newAdmin.username}`);
            }
        }
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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'waiting_room.html'));
});

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
