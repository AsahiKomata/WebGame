const lanes = document.querySelectorAll(".lane");
const factorButtons = document.querySelectorAll(".factor-btn");
const changeAllButton = document.getElementById("change-all-btn");
const gameArea = document.getElementById("game-area");

const lane = document.querySelector('.lane');
const laneHeight = lane.offsetHeight;
const laneWidth = lane.offsetWidth;
const lastPositions = new Array(lanes.length).fill(0);

// スコアによって切り替える数字と因数のリストを3つ用意
const numbersList = [
    [6, 8, 10, 12, 15, 20, 24, 30], // レベル1のリスト
    [10, 12, 14, 15, 18, 20, 21, 24, 28, 30, 35, 36, 40, 42, 48, 56, 60], // レベル２のリスト
    [30, 35, 40, 42, 45, 48, 54, 56, 63, 70, 72, 80, 90, 105, 108, 120, 126, 135, 140, 144] // レベル３のリスト
];

const factorsList = [
    [2, 3, 4, 5], // レベル1の因数リスト
    [2, 3, 4, 5, 6, 7], // レベル２の因数リスト
    [2, 3, 5, 6, 7, 8, 9]  // レベル3の因数リスト
];

let currentNumbers = numbersList[0]; // 現在の数字リスト（初期）
let currentFactors = factorsList[0]; // 現在の因数リスト（初期）

let score = 0; // スコア管理
let activeLane = null; // 現在選択中のレーン
let normalFallSpeed = setFallSpeed(); // 通常の数字の落下速度
let fastFallSpeed = normalFallSpeed * 1.5; // 速い数字の落下速度
let spawnInterval = 1500; // 数字の生成間隔(ms)
let lastSpawnedLane = null; // 最後に数字を落としたレーン
let fallIntervals = new Map(); // 落下アニメーションを管理するマップ
let correctCount = 0; // 正解数
let wrongCount = 0; // 誤答数
let threshold1 = 750; // スコアのしきい値1
let threshold2 = 2500; // スコアのしきい値2
let currentLevel = 1; // 現在のレベル
let point = 100; // 1つの数字を消すと得られるポイントの最大値
let nIntervId; // intervalIDを保存する変数

/**
 * レベルを変更する関数
 * @param {number} level - 変更するレベル
 */
function changeLevel(level) {
    // 現在のレベルをリセット
    gameArea.classList.remove(`level${currentLevel}`);

    // 新しいレベルのクラスを追加
    currentLevel = level;
    gameArea.classList.add(`level${currentLevel}`);

    // レベル表示を更新
    document.getElementById("level").innerText = "レベル:" + currentLevel;

    // 画面上の数字を全削除
    clearAllNumbers();

    point = 100 * currentLevel;
}

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
    document.getElementById("score").innerText = "スコア:" + score;

    // スコアが閾値１を超えたらレベル２のリストに切り替え
    if (score > threshold1 && currentNumbers === numbersList[0]) {
        currentNumbers = numbersList[1];
        currentFactors = factorsList[1];
        updateAllButtonFactors(); // ボタンの因数を再設定
        changeLevel(2);
        clearInterval(nIntervId);
        nIntervId = null;
        spawnInterval += 1000;
        nIntervId = setInterval(spawnNumber, spawnInterval);
        spawnNumber();
    }

    // スコアが閾値２を超えたらレベル３のリストに切り替え
    if (score > threshold2 && currentNumbers === numbersList[1]) {
        currentNumbers = numbersList[2];
        currentFactors = factorsList[2];
        updateAllButtonFactors(); // ボタンの因数を再設定
        changeLevel(3);
        clearInterval(nIntervId);
        nIntervId = null;
        spawnInterval += 1000;
        nIntervId = setInterval(spawnNumber, spawnInterval);
        spawnNumber();
    }

    const username = new URLSearchParams(window.location.search).get('user');
    if (username) {
        sendScore(username, score);
    }
}

/**
 * 正解率を更新する関数
 */
function updateAccuracy() {
    let totalAttempts = correctCount + wrongCount;
    let accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
    document.getElementById("accuracy").innerText = accuracy.toFixed(2) + "%";
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
 * 特定のレーンの一番上の数字の位置を取得する関数
 * @param {HTMLElement} lane - 対象のレーン
 * @return {number|null} 一番上の数字のY座標またはnull
 */
function getTopNumberPositionForLane(lane) {
    const numbersInLane = lane.querySelectorAll(".number");
    if (numbersInLane.length === 0) return null;

    // レーン内の一番上の数字の位置を取得
    let minTop = Infinity;
    numbersInLane.forEach(num => {
        const top = parseFloat(num.style.top);
        if (top < minTop) {
            minTop = top;
        }
    });
    return minTop;
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
    let isFast = false;
    if (currentLevel >= 2) {
        const fastProbability = currentLevel === 2 ? 0.2 : 0.4; // レベル2 : レベル3
        if (Math.random() < fastProbability && getTopNumberPositionForLane(lane) > laneHeight / 2) {
            isFast = true;
            num.style.color = "red";
        }
    }
    num.classList.add("number");
    num.innerText = currentNumbers[Math.floor(Math.random() * currentNumbers.length)];

    // レベルに応じたデザイン適用
    setNumberAppearance(num, currentLevel, isFast);

    lane.appendChild(num);

    // 数字のサイズを設定
    setNumberSize(num);

    fallDown(num, laneIndex, isFast);

    lastSpawnedLane = laneIndex;
}

/**
 * スコアに応じて数字の見た目を変更
 * @param {HTMLElement} num - 数字の要素
 * @param {number} level - 現在のレベル
 * @param {boolean} isFast - 速い数字かどうか
 */
function setNumberAppearance(num, level, isFast) {
    if (level == 1) {
        num.style.background = "rgb(212, 36, 80)";
    } else if (level == 2 && !isFast) {
        num.style.backgroundImage = "url('images/bird.png')";
    } else if (level == 3 && !isFast) {
        num.style.backgroundImage = "url('images/kaseijin.png')";
    } else if (level == 3 && isFast) {
        num.style.backgroundImage = "url('images/ufo.png')";
    }
}

/**
 * 数字を落下させる関数
 * @param {HTMLElement} num - 落下する数字の要素
 * @param {number} laneIndex - 落下するレーンのインデックス
 * @param {boolean} isFast - 速い数字かどうか
 */
function fallDown(num, laneIndex, isFast = false) {
    let pos = 0;
    const fallSpeed = isFast ? fastFallSpeed : normalFallSpeed;
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
            let score = Math.max(50, Math.floor(point - (positionRatio * 150)));
            updateScore(score); // スコア加算
            clearInterval(fallIntervals.get(numElem)); // 落下アニメーションを停止
            fallIntervals.delete(numElem);
            numElem.remove();
        } else {
            numElem.innerText = num; // 更新
        }
    } else {
        updateScore(-50); // 間違った場合スコアを減らす

        wrongCount++;
        updateAccuracy();

        showResultEffect(numElem, "images/wrong.png");
        playSound(false);
    }
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
 * ボタンに因数を設定する関数
 * @param {HTMLElement} button - 更新するボタン
 */
function updateButtonFactor(button) {
    if (currentLevel === 1) {
        // レベル1の場合は因数は固定
        const factorIndex = Array.from(factorButtons).indexOf(button);
        button.innerText = currentFactors[factorIndex];
    } else {
        // 画面上に現在表示されている因数をカウント
        const currentFactorsOnButtons = Array.from(factorButtons).map(btn => parseInt(btn.innerText));
        const factorCounts = {};

        // 各因数の出現回数をカウント
        currentFactorsOnButtons.forEach(f => {
            factorCounts[f] = (factorCounts[f] || 0) + 1;
        });

        // 選択可能な因数のリスト（現在の因数が1回未満のもの）
        const availableFactors = currentFactors.filter(f => (factorCounts[f] || 0) < 1);

        // 選択可能な因数がない場合は変更しない
        if (availableFactors.length === 0) return;

        // ランダムに新しい因数を選択
        const selectedFactor = availableFactors[Math.floor(Math.random() * availableFactors.length)];

        // ボタンに設定
        button.innerText = selectedFactor;
    }
}

/**
 * すべての因数ボタンを更新する関数
 */
function updateAllButtonFactors() {
    if (currentLevel === 1) {
        // レベル1の場合は因数は固定
        factorButtons.forEach((button, index) => {
            button.innerText = currentFactors[index];
        });
    } else {
        let selectedFactors = [];

        while (selectedFactors.length < factorButtons.length) {
            let factor = currentFactors[Math.floor(Math.random() * currentFactors.length)];

            // 同じ因数が2つ以上にならないようにする
            if (selectedFactors.filter(f => f === factor).length < 1) {
                selectedFactors.push(factor);
            }
        }

        // すべてのボタンに適用
        factorButtons.forEach((button, index) => {
            button.innerText = selectedFactors[index];
        });
    }
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
    const deltaY = targetRect.top - buttonRect.top + normalFallSpeed * 12;

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
    changeLevel(1);
    setButtonSizes();
    spawnNumber();
    nIntervId = setInterval(spawnNumber, spawnInterval);

    factorButtons.forEach(button => {
        // ゲーム開始時にボタンに初期値を設定
        updateButtonFactor(button);
    });
}

// 初期化処理の呼び出し
initializeGame();