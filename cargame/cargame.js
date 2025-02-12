const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

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

// 軌跡を保存する配列
let trail = [];

const keys = {};

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

function update() {
    if (keys["ArrowUp"] || keys["w"]) car.speed += car.acceleration;
    if (keys["ArrowDown"] || keys["s"]) car.speed -= car.acceleration;
    if (keys["ArrowLeft"] || keys["a"]) car.angle -= 0.05;
    if (keys["ArrowRight"] || keys["d"]) car.angle += 0.05;

    car.speed *= (1 - car.friction);

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

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
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

carImage.onload = () => {
    gameLoop();
}
