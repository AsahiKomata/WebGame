// 全体のキャンバスの設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// ミニマップ用のキャンバスの設定
const miniMapCanvas = document.createElement("canvas");
const miniMapCtx = miniMapCanvas.getContext("2d");
miniMapCanvas.width = 200;
miniMapCanvas.height = 150;

// 車の画像の設定
const carImage = new Image();
carImage.src = "imgs/redcar.png";

// 車のパラメータ
let car = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 209,
    height: 241,
    speed: 0,
    angle: 0,
    acceleration: 0.1,
    friction: 0.02
};

// 視点用のカメラ
let camera = {
    x: 0,
    y: 0
};

// 制限範囲を設定
const maxX = canvas.width * 4; // 最大x座標
const maxY = canvas.height * 4; // 最大y座標
const minX = 0; // 最小x座標
const minY = 0; // 最小y座標

// 軌跡を保存する配列
let trail = [];

const keys = {};

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

function update() {
    if (keys["ArrowUp"] || keys["w"]) car.speed += car.acceleration;
    if (keys["ArrowDown"] || keys["s"]) car.speed -= car.acceleration;
    if (keys["ArrowLeft"] || keys["a"]) car.angle -= 0.1;
    if (keys["ArrowRight"] || keys["d"]) car.angle += 0.1;

    car.speed *= (1 - car.friction);

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    // 車が移動可能な範囲を制限
    car.x = Math.max(minX, Math.min(maxX, car.x));
    car.y = Math.max(minY, Math.min(maxY, car.y));

    camera.x = car.x - canvas.width / 2;
    camera.y = car.y - canvas.height / 2;

    trail.push({ x: car.x, y: car.y });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 車の軌跡を描画
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
    ctx.lineWidth = 50;
    for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        if (i === 0) {
            ctx.moveTo(point.x - camera.x, point.y - camera.y);
        } else {
            ctx.lineTo(point.x - camera.x, point.y - camera.y);
        }
    }
    ctx.stroke();

    // 車を描画
    ctx.save();
    ctx.translate(car.x - camera.x, car.y - camera.y);
    ctx.rotate(car.angle);
    ctx.drawImage(carImage, -car.width / 2, -car.height / 2, car.width, car.height);
    ctx.restore();

    // ミニマップを描画
    drawMiniMap();
}

function drawMiniMap() {
    // ミニマップの背景
    miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    miniMapCtx.fillStyle = "rgba(255, 255, 255, 1)";
    miniMapCtx.fillRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);

    // ズームアウトの縮尺
    const scale = 1 / 16;

    // 制限範囲をミニマップに描画
    miniMapCtx.fillStyle = "rgba(255, 255, 255, 1)";
    miniMapCtx.fillRect(minX * scale, minY * scale, (maxX - minX) * scale, (maxY - minY) * scale);

    // ミニマップに軌跡を描画
    miniMapCtx.beginPath();
    miniMapCtx.strokeStyle = "rgba(0, 255, 0, 0.5)";
    miniMapCtx.lineWidth = 2;

    for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const miniX = point.x * scale;
        const miniY = point.y * scale;

        if (i === 0) {
            miniMapCtx.moveTo(miniX, miniY);
        } else {
            miniMapCtx.lineTo(miniX, miniY);
        }
    }
    miniMapCtx.stroke();

    const miniCarX = car.x * scale;
    const miniCarY = car.y * scale;

    // ミニマップの車の位置にマークを追加
    miniMapCtx.fillStyle = "red";
    miniMapCtx.beginPath();
    miniMapCtx.arc(miniCarX, miniCarY, 5, 0, Math.PI * 2, false);
    miniMapCtx.fill();

    // ミニマップの縁取り（枠線）を描画
    miniMapCtx.strokeStyle = "black";
    miniMapCtx.lineWidth = 3;
    miniMapCtx.strokeRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);


    // ミニマップをメインキャンバスに描画
    ctx.drawImage(miniMapCanvas, canvas.width - miniMapCanvas.width - 10, 10);
}


function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

carImage.onload = () => {
    gameLoop();
}
