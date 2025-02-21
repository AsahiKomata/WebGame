// 待機画面Ver1
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

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
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
