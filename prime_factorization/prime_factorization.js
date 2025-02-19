const lanes = document.querySelectorAll(".lane");
const factorButtons = document.querySelectorAll(".factor-btn");
const changeAllButton = document.getElementById("change-all-btn");

// 出現する数字のリスト
const numbers = [6, 10, 12, 14, 15, 18, 21, 30, 35, 36, 42, 49];

// 因数のリスト
const factors = [2, 3, 5, 7];

// ボタンに設定する因数の出現回数を管理
let factorCount = { 2: 0, 3: 0, 5: 0, 7: 0 };

let score = 0;       // スコア管理
let activeLane = null; // 現在選択中のレーン
let fallSpeed = 0.5; // 数字の落下速度
let spawnInterval = 2000; // 数字の生成間隔(ms)
let lastSpawnedLane = null; // 最後に数字を落としたレーン
let fallIntervals = new Map(); // 落下アニメーションを管理するマップ
let correctCount = 0; // 正解数
let wrongCount = 0; // 誤答数

/*
 * スコアを更新する関数
 * @param {number} points - 加算または減算するスコア
 */
function updateScore(points) {
    score += points;
    document.getElementById("score").innerText = score;
}

/*
 * 正解率を更新する関数
 */
function updateAccuracy() {
    let totalAttempts = correctCount + wrongCount;
    let accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
    document.getElementById("accuracy").innerText = accuracy.toFixed(2);
}

/*
 * ランダムなレーンに数字を生成する関数
 */
function spawnNumber() {
    // 同じレーンに連続して数字を生成しないようにする
    do {
        laneIndex = Math.floor(Math.random() * lanes.length);
    } while (laneIndex === lastSpawnedLane);
    const lane = lanes[laneIndex];

    const num = document.createElement("div");
    num.classList.add("number");
    num.innerText = numbers[Math.floor(Math.random() * numbers.length)];
    num.style.top = "0px";
    lane.appendChild(num);

    fallDown(num, laneIndex);

    lastSpawnedLane = laneIndex;
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
            fallIntervals.delete(num); // 落下アニメーションを削除
            checkAndClearAllNumbers(); // 全削除するかチェック
        }
    }, 5);

    // 落下アニメーションを管理する
    fallIntervals.set(num, fallInterval);
}

/*
 * 画面上のすべての数字を削除し、落下アニメーションも停止する関数
 */
function clearAllNumbers() {
    fallIntervals.forEach((interval, num) => {
        clearInterval(interval);
    });
    fallIntervals.clear(); // マップをクリア
    document.querySelectorAll(".number").forEach(num => num.remove());
}

/*
 * すべてのレーンが空かどうかをチェックし、必要なら全削除する関数
 */
function checkAndClearAllNumbers() {
    const allNumbers = document.querySelectorAll(".number");
    if (allNumbers.length !== 0) {
        clearAllNumbers();
    }
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

        correctCount++;
        updateAccuracy();

        if (num === 1) { // 1になったら削除しスコアを＋100
            updateScore(100); // スコア加算
            clearInterval(fallIntervals.get(numElem)); // 落下アニメーションを停止
            fallIntervals.delete(numElem);
            numElem.remove();
        } else {
            numElem.innerText = num; // 更新
        }
    } else {
        updateScore(-factor); // 間違った場合スコアを減らす

        wrongCount++;
        updateAccuracy();
    }
}

/*
 * ボタンに因数を設定する関数
 * @param {HTMLElement} button - 更新するボタン
 */
function updateButtonFactor(button) {
    // 画面上に現在表示されている因数をカウント
    const currentFactors = Array.from(factorButtons).map(btn => parseInt(btn.innerText));
    const factorCounts = {};

    // 各因数の出現回数をカウント
    currentFactors.forEach(f => {
        factorCounts[f] = (factorCounts[f] || 0) + 1;
    });

    // 選択可能な因数のリスト（現在の因数が2回未満のもの）
    const availableFactors = factors.filter(f => (factorCounts[f] || 0) < 2);

    // 選択可能な因数がない場合は変更しない
    if (availableFactors.length === 0) return;

    // ランダムに新しい因数を選択
    const selectedFactor = availableFactors[Math.floor(Math.random() * availableFactors.length)];

    // ボタンに設定
    button.innerText = selectedFactor;
}

/*
 * 特定のレーンの一番下の数字を取得する関数
 * @param {HTMLElement} lane - 対象のレーン
 * @return {number|null} 一番下の数字またはnull
 */
function getBottomNumberForLane(lane) {
    const numbersInLane = lane.querySelectorAll(".number");
    if (numbersInLane.length === 0) return null;

    // レーン内の一番下の数字を取得
    let bottomNumber = null;
    let maxTop = -1;
    numbersInLane.forEach(num => {
        const top = parseFloat(num.style.top);
        if (top > maxTop) {
            maxTop = top;
            bottomNumber = parseInt(num.innerText);
        }
    });
    return bottomNumber;
}

/*
 * すべての因数ボタンを更新する関数
 */
function updateAllButtonFactors() {
    let selectedFactors = [];

    while (selectedFactors.length < factorButtons.length) {
        let factor = factors[Math.floor(Math.random() * factors.length)];

        // 同じ因数が3つ以上にならないようにする
        if (selectedFactors.filter(f => f === factor).length < 2) {
            selectedFactors.push(factor);
        }
    }

    // すべてのボタンに適用
    factorButtons.forEach((button, index) => {
        button.innerText = selectedFactors[index];
    });
}

/*
 * 「変更」ボタンのクリックイベントを設定
 */
changeAllButton.onclick = updateAllButtonFactors;


/*
 * ボタンのクリックイベントを設定
 */
factorButtons.forEach(button => {
    button.onclick = () => {
        // 数字を選択した因数で割る
        const factor = parseInt(button.innerText);
        divideNumber(factor);

        // ボタンの因数を更新
        updateButtonFactor(button);
    };
});

/*
 * 初期化処理
 */
function initializeGame() {
    spawnNumber();
    setInterval(spawnNumber, spawnInterval);

    factorButtons.forEach(button => {
        // ゲーム開始時にボタンに初期値を設定
        updateButtonFactor(button);
    });
}

// 初期化処理の呼び出し
initializeGame();