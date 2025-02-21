const lanes = document.querySelectorAll(".lane");
const factorButtons = document.querySelectorAll(".factor-btn");
const changeAllButton = document.getElementById("change-all-btn");

const lane = document.querySelector('.lane');
const laneHeight = lane.offsetHeight;
const laneWidth = lane.offsetWidth;

// スコアによって切り替える数字と因数のリストを3つ用意
const numbersList = [
    [6, 8, 10, 12, 15, 18, 20, 24, 30], // 初期リスト
    [10, 12, 15, 18, 20, 24, 30, 35, 40], // 2回目のリスト（スコアが1000を超えた場合）
    [15, 18, 20, 24, 30, 35, 40, 50, 60] // 3回目のリスト（スコアが2000を超えた場合）
];

const factorsList = [
    [2, 3, 4, 5], // 初期因数リスト
    [3, 4, 5, 6], // 2回目の因数リスト（スコアが1000を超えた場合）
    [4, 5, 6, 7]  // 3回目の因数リスト
];

let currentNumbers = numbersList[0]; // 現在の数字リスト（初期）
let currentFactors = factorsList[0]; // 現在の因数リスト（初期）

let score = 0;       // スコア管理
let activeLane = null; // 現在選択中のレーン
let fallSpeed = setFallSpeed(); // 数字の落下速度
let spawnInterval = 2000; // 数字の生成間隔(ms)
let lastSpawnedLane = null; // 最後に数字を落としたレーン
let fallIntervals = new Map(); // 落下アニメーションを管理するマップ
let correctCount = 0; // 正解数
let wrongCount = 0; // 誤答数
let threshold1 = 200; // スコアのしきい値1
let threshold2 = 400; // スコアのしきい値2

/**
 * 落下速度を設定する関数
 * @return {number} 落下速度
 */
function setFallSpeed() {
    // 20秒でレーンの一番下に到達するための速度を計算
    const fallDuration = 20; // 落下時間（秒）
    const fallSpeed = laneHeight / fallDuration / 200;

    return fallSpeed;
}

/**
 * ゲーム開始時にボタンの大きさを設定する関数
 */
function setButtonSizes() {
    const newSize = laneWidth * 5 / 7;

    factorButtons.forEach(button => {
        button.style.width = `${newSize}px`;
        button.style.height = `${newSize}px`;
        button.style.fontSize = `${newSize * 0.6}px`;
    });

    changeAllButton.style.width = `${newSize}px`;
    changeAllButton.style.height = `${newSize}px`;
}

/**
 * スコアを更新する関数
 * @param {number} points - 加算または減算するスコア
 */
function updateScore(points) {
    score += points;
    document.getElementById("score").innerText = score;

    // スコアが閾値１を超えたら2回目のリストに切り替え
    if (score > threshold1 && currentNumbers === numbersList[0]) {
        currentNumbers = numbersList[1];
        currentFactors = factorsList[1];
        updateAllButtonFactors(); // ボタンの因数を再設定
    }

    // スコアが閾値２を超えたら3回目のリストに切り替え
    if (score > threshold2 && currentNumbers === numbersList[1]) {
        currentNumbers = numbersList[2];
        currentFactors = factorsList[2];
        updateAllButtonFactors(); // ボタンの因数を再設定
    }
}

/**
 * 正解率を更新する関数
 */
function updateAccuracy() {
    let totalAttempts = correctCount + wrongCount;
    let accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
    document.getElementById("accuracy").innerText = accuracy.toFixed(2);
}

/**
 * 落ちてくる数字の高さとフォントサイズを設定する関数
 * @param {HTMLElement} numElem - 数字の要素
 */
function setNumberSize(numElem) {
    // .number の幅を取得
    const numberWidth = numElem.offsetWidth;

    // 幅と同じ値を高さに設定
    numElem.style.height = numberWidth + "px";
    numElem.style.lineHeight = numberWidth + "px";

    // フォントサイズを設定
    const fontSize = Math.floor(numberWidth * 2 / 3);
    numElem.style.fontSize = fontSize + "px";
}

/**
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
    num.innerText = currentNumbers[Math.floor(Math.random() * currentNumbers.length)]; // 現在の数字リストから選択
    if (score < threshold1) {
        num.style.background = "rgb(212, 36, 80)";
    }
    if (score > threshold1 && score < threshold2) {
        num.style.background = "rgb(255, 215, 0)";
    }
    if (score > threshold2) {
        num.style.background = "rgb(0, 128, 0)";
    }
    lane.appendChild(num);

    // 数字のサイズを設定
    setNumberSize(num);

    fallDown(num, laneIndex);

    lastSpawnedLane = laneIndex;
}

/**
 * 数字を落下させる関数
 * @param {HTMLElement} num - 落下する数字の要素
 * @param {number} laneIndex - 落下するレーンのインデックス
 */
function fallDown(num, laneIndex) {
    let pos = 0;
    const fallInterval = setInterval(() => {
        if (pos < laneHeight - laneWidth * 0.75) {
            pos += fallSpeed;
            num.style.top = pos + "px";
        } else {
            clearInterval(fallInterval);
            fallIntervals.delete(num); // 落下アニメーションを削除
            // num.remove(); // 数字を削除
            checkAndClearAllNumbers(); // 全削除するかチェック
        }
    }, 5);

    // 落下アニメーションを管理する
    fallIntervals.set(num, fallInterval);
}

/**
 * 画面上のすべての数字を削除し、落下アニメーションも停止する関数
 */
function clearAllNumbers() {
    fallIntervals.forEach((interval, num) => {
        clearInterval(interval);
    });
    fallIntervals.clear(); // マップをクリア
    document.querySelectorAll(".number").forEach(num => num.remove());
}

/**
 * すべてのレーンが空かどうかをチェックし、必要なら全削除する関数
 */
function checkAndClearAllNumbers() {
    const allNumbers = document.querySelectorAll(".number");
    if (allNumbers.length !== 0) {
        clearAllNumbers();
    }
}

/**
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

/**
 * 数字を選択した因数で割る関数
 * @param {number} factor - 選択した因数
 * @param {number} laneIndex - 選択したレーンのインデックス
 */
function divideNumber(factor, laneIndex) {
    if (laneIndex === null) return; // レーンが選択されていなければ何もしない

    const lane = lanes[laneIndex];
    const numElem = lane.querySelector(".number");
    if (!numElem) return; // 数字が存在しない場合は処理しない

    let num = parseInt(numElem.innerText);
    let topPosition = parseFloat(numElem.style.top) || 0;
    let laneHeight = lane.clientHeight;

    if (num % factor === 0) { // 割り切れる場合
        num /= factor;

        correctCount++;
        updateAccuracy();

        showResultEffect(numElem, "images/correct.png");
        playSound(true);

        if (num === 1) { // 1になったら削除しスコアを加算
            let positionRatio = topPosition / laneHeight; // 数字の現在位置の割合
            let score = Math.max(50, Math.floor(200 - (positionRatio * 150)));
            updateScore(score); // スコア加算
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

        showResultEffect(numElem, "images/wrong.png");
        playSound(false);
    }
}

/**
 * ボタンに因数を設定する関数
 * @param {HTMLElement} button - 更新するボタン
 */
function updateButtonFactor(button) {
    // 画面上に現在表示されている因数をカウント
    const currentFactorsOnButtons = Array.from(factorButtons).map(btn => parseInt(btn.innerText));
    const factorCounts = {};

    // 各因数の出現回数をカウント
    currentFactorsOnButtons.forEach(f => {
        factorCounts[f] = (factorCounts[f] || 0) + 1;
    });

    // 選択可能な因数のリスト（現在の因数が2回未満のもの）
    const availableFactors = currentFactors.filter(f => (factorCounts[f] || 0) < 2);

    // 選択可能な因数がない場合は変更しない
    if (availableFactors.length === 0) return;

    // ランダムに新しい因数を選択
    const selectedFactor = availableFactors[Math.floor(Math.random() * availableFactors.length)];

    // ボタンに設定
    button.innerText = selectedFactor;
}

/**
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

/**
 * すべての因数ボタンを更新する関数
 */
function updateAllButtonFactors() {
    let selectedFactors = [];

    while (selectedFactors.length < factorButtons.length) {
        let factor = currentFactors[Math.floor(Math.random() * currentFactors.length)];

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

/**
 * 「変更」ボタンのクリックイベントを設定
 */
changeAllButton.onclick = updateAllButtonFactors;

/**
 * ボタンの元の位置を記録
 */
const buttonPositions = Array.from(factorButtons).map(btn => {
    const rect = btn.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
});

/**
 * 因数ボタンがレーンの一番下の数字に向かって移動するアニメーション
 * @param {HTMLElement} button - 押した因数ボタン
 * @param {number} factor - 選択した因数
 */
function animateFactorButton(button, factor) {
    if (activeLane === null) return; // レーン未選択なら何もしない

    const selectedLaneAtStart = activeLane;

    const lane = lanes[selectedLaneAtStart];
    const bottomNumber = getBottomNumberForLane(lane);
    if (bottomNumber === null) return; // レーンに数字がなければ終了

    const targetElem = lane.querySelector(".number");
    const targetRect = targetElem.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    // 移動距離を計算
    const deltaX = targetRect.left - buttonRect.left;
    const deltaY = targetRect.top - buttonRect.top + fallSpeed * 12;

    // ボタン移動アニメーション
    button.style.transition = "transform 0.5s ease-in-out, opacity 0.3s ease-in-out";
    button.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // 当たったら透明にする
    setTimeout(() => {
        button.style.opacity = "0"; // ボタンを透明化

        // 割り算を実行
        divideNumber(factor, selectedLaneAtStart);

        // 透明化したボタンを元の位置に戻す
        setTimeout(() => {
            button.style.transition = "none";
            button.style.transform = "translate(0, 0)"; // 元の位置に戻す
            button.style.opacity = "1"; // 再表示
            updateButtonFactor(button); // ボタンの因数を更新
        }, 300);
    }, 500);
}

/**
 * エフェクト画像のサイズを設定する関数
 * @param {HTMLElement} effectImg - エフェクト画像の要素
*/
function setEffectSize(effectImg) {
    // エフェクトのサイズをレーン幅の80%に設定
    const effectSize = laneWidth * 0.8;

    // エフェクト画像のサイズを設定
    effectImg.style.width = effectSize + "px";
    effectImg.style.height = effectSize + "px";
}

/**
 * 正解または不正解のエフェクトを表示する関数
 * @param {HTMLElement} numElem - 数字の要素
 * @param {string} imageName - 表示する画像のファイル名
 */
function showResultEffect(numElem, imageName) {
    const effectImg = document.createElement("img");
    effectImg.src = imageName;
    effectImg.classList.add("result-effect");

    document.body.appendChild(effectImg);

    // エフェクトのサイズを設定
    setEffectSize(effectImg);

    const computedStyle = window.getComputedStyle(effectImg);
    const imgSize = parseFloat(computedStyle.width);

    // 数字の要素の位置とサイズを取得
    const rect = numElem.getBoundingClientRect();
    const centerX = rect.left + window.scrollX + rect.width / 2;
    const centerY = rect.top + window.scrollY + rect.height / 2;

    // 画像の中央を数字の中央に合わせる
    effectImg.style.left = `${centerX - imgSize / 2}px`;
    effectImg.style.top = `${centerY - imgSize / 2}px`;

    // 少し上に浮かびながら消えるアニメーション
    setTimeout(() => {
        effectImg.style.opacity = "0";
        effectImg.style.transform = "translateY(-20px)";
    }, 100);

    // 一定時間後に削除
    setTimeout(() => {
        effectImg.remove();
    }, 1000);
}

/**
 * 正解音または不正解音を再生する関数
 * @param {boolean} isCorrect - 正解の場合はtrue、不正解の場合はfalse
 */
function playSound(isCorrect) {
    const sound = document.getElementById(isCorrect ? "correctAnswerSound" : "wrongAnswerSound");
    sound.currentTime = 0; // 再生位置をリセット（連続再生時に途中再生を防ぐ）
    sound.play();
}

/**
 * ボタンのクリックイベントを設定
 */
factorButtons.forEach((button, index) => {
    button.onclick = () => {
        const factor = parseInt(button.innerText);
        animateFactorButton(button, factor); // アニメーションを実行
    };
});

/*
 * 初期化処理
 */
function initializeGame() {
    setButtonSizes();
    spawnNumber();
    setInterval(spawnNumber, spawnInterval);

    factorButtons.forEach(button => {
        // ゲーム開始時にボタンに初期値を設定
        updateButtonFactor(button);
    });
}

// 初期化処理の呼び出し
initializeGame();