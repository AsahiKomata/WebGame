const socket = io();

// サーバーから「ゲーム終了」イベントを受信したらランキング画面へ遷移
socket.on("gameOver", () => {
    console.log("⏳ ゲーム終了！ランキング画面へ移動");
    window.location.href = "/ranking.html"; // ランキング画面へリダイレクト
});

// スコアをサーバーに送信する関数
function sendScore(username, score) {
    socket.emit("updateScore", username, score);
}