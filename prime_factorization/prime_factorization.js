const lanes = document.querySelectorAll(".lane");

// 出現する数字のリスト
const numbers = [6, 10, 12, 14, 15, 18, 21, 30, 35, 36, 42, 49];

let score = 0;       // スコア管理
let activeLane = null; // 現在選択中のレーン
let fallSpeed = 0.5; // 数字の落下速度

/*
 * スコアを更新する関数
 * @param {number} points - 加算または減算するスコア
 */
function updateScore(points) {
    score += points;
    document.getElementById("score").innerText = score;
}

/*
 * 指定したレーンにランダムな数字を生成
 * @param {number} laneIndex - 数字を生成するレーンのインデックス
 */
function spawnNumber(laneIndex) {
    const lane = lanes[laneIndex];
    const num = document.createElement("div");
    num.classList.add("number");
    num.innerText = numbers[Math.floor(Math.random() * numbers.length)];
    num.style.top = "0px";
    lane.appendChild(num);
    fallDown(num, laneIndex);
}

/*
 * 数字を落下させる関数
 * @param {HTMLElement} num - 落下する数字の要素
 * @param {number} laneIndex - 落下するレーンのインデックス
 */
function fallDown(num, laneIndex) {
    let pos = 0;
    const fallInterval = setInterval(() => {
        if (pos < 450) {
            pos += fallSpeed;
            num.style.top = pos + "px";
        } else {
            clearInterval(fallInterval);
            num.remove(); // 下に到達した数字を削除
            spawnNumber(laneIndex); // 新しい数字を生成
        }
    }, 10);
}

/*
 * レーンを選択する関数
 * @param {number} index - 選択するレーンのインデックス
 */
function selectLane(index) {
    activeLane = index;

    // すべてのレーンのハイライトを解除
    lanes.forEach(lane => lane.classList.remove("selected"));

    // 選択したレーンにハイライトを適用
    lanes[index].classList.add("selected");
}

/*
 * 数字を選択した因数で割る関数
 * @param {number} factor - 選択した因数
 */
function divideNumber(factor) {
    if (activeLane === null) return; // レーンが選択されていなければ何もしない

    const lane = lanes[activeLane];
    const numElem = lane.querySelector(".number");
    if (!numElem) return; // 数字が存在しない場合は処理しない

    let num = parseInt(numElem.innerText);
    if (num % factor === 0) { // 割り切れる場合
        num /= factor;
        updateScore(factor); // スコア加算

        if (num === 1) { // 1になったら削除して新しい数字を生成
            numElem.remove();
            spawnNumber(activeLane);
        } else {
            numElem.innerText = num; // 更新
        }
    } else {
        updateScore(-factor); // 間違った場合スコアを減らす
    }
}

// 各レーンに最初の数字を配置
lanes.forEach((lane, index) => spawnNumber(index));
