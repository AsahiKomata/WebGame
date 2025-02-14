const lanes = document.querySelectorAll(".lane");
const numbers = [6, 10, 12, 14, 15, 18, 21, 30, 35, 36, 42, 49];
let score = 0;
let activeLane = null;

function updateScore(points) {
    score += points;
    document.getElementById("score").innerText = score;
}

function spawnNumber(laneIndex) {
    const lane = lanes[laneIndex];
    const num = document.createElement("div");
    num.classList.add("number");
    num.innerText = numbers[Math.floor(Math.random() * numbers.length)];
    num.style.top = "0px";
    lane.appendChild(num);
    fallDown(num, laneIndex);
}

function fallDown(num, laneIndex) {
    let pos = 0;
    const fallInterval = setInterval(() => {
        if (pos < 450) {
            pos += 0.5;
            num.style.top = pos + "px";
        } else {
            clearInterval(fallInterval);
            num.remove(); // レーン下部に到達した数字を削除
            spawnNumber(laneIndex); // 到達したレーンのみ新しい数字を追加
        }
    }, 10);
}

function selectLane(index) {
    activeLane = index;
}

function divideNumber(factor) {
    if (activeLane === null) return;
    const lane = lanes[activeLane];
    const numElem = lane.querySelector(".number");
    if (!numElem) return;
    let num = parseInt(numElem.innerText);
    if (num % factor === 0) {
        num /= factor;
        updateScore(factor);
        if (num === 1) {
            numElem.remove();
            spawnNumber(activeLane);
        } else {
            numElem.innerText = num;
        }
    } else {
        updateScore(-factor);
    }
    activeLane = null;
}

// 初期の数字を各レーンに配置
lanes.forEach((lane, index) => spawnNumber(index));
