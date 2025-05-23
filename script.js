document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizContainer = document.getElementById('quiz-container');
    const problemText = document.getElementById('problem-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const feedbackText = document.getElementById('feedback-text');
    const chaosContainer = document.getElementById('chaos-container');

    // --- Game Configuration ---
    const STONE_IMAGE_SRC = 'stone.png'; // この画像ファイルが必要です
    const NANDEYA_TEXT_CONTENT = 'なんでや。';
    const INCORRECT_SOUND_SOURCES = [ // 指定された音声ファイル
        'maou_46_yoake_no_highway.mp3',
        'maou_bgm_cyber45.mp3',
        'maou_46_yoake_no_highway.mp3', // 交互になるように再度追加
        'maou_bgm_cyber45.mp3'
    ];
    const CORRECT_ANSWERS_TO_LEVEL_UP = 2;
    const MAX_ELEMENTS_ON_SCREEN = 190; // 若干調整
    const ELEMENT_SPAWN_INTERVAL_MS = 110; // 若干調整
    const STONE_LIFESPAN_MS = 1800;
    const NANDEYA_LIFESPAN_MS = 1600;
    const MAX_PRACTICAL_DIGITS = 10; // これ以上は入力・表示が困難なため実用的な上限

    // --- Game State ---
    let currentProblem = { num1: 0n, num2: 0n, answer: 0n };
    let penaltyActive = false;
    let elementSpawnIntervalId = null;
    const activeElements = [];
    let currentLevel = 1;
    let correctAnswersInRow = 0;

    // --- Initialization ---
    function initGame() {
        penaltyActive = false;
        currentLevel = 1;
        correctAnswersInRow = 0;

        quizContainer.classList.remove('hidden');
        problemText.style.animation = 'none'; // アニメーションリセット用
        document.getElementById('sub-title').style.animation = 'none'; // 同上
        document.getElementById('game-title').querySelectorAll('span').forEach(span => {
            span.style.animation = 'none';
        });

        // 強制リフローを挟んでアニメーションを再トリガー
        void quizContainer.offsetWidth;

        problemText.style.animation = '';
        document.getElementById('sub-title').style.animation = '';
         document.getElementById('game-title').querySelectorAll('span').forEach(span => {
            span.style.animation = '';
        });


        clearChaosArea();
        if (elementSpawnIntervalId) {
            clearInterval(elementSpawnIntervalId);
            elementSpawnIntervalId = null;
        }
        generateProblem();
    }

    function clearChaosArea() {
        chaosContainer.innerHTML = '';
        activeElements.length = 0;
    }

    // --- Problem Generation ---
    function generateProblem() {
        // アニメーションリセットと再トリガー
        problemText.style.animation = 'none';
        void problemText.offsetWidth;
        problemText.style.animation = '';
        problemText.style.opacity = '0'; // 開始状態に戻す

        let num1Digits = 1;
        let num2Digits = 1;

        for (let i = 2; i <= currentLevel; i++) {
            if (i % 2 === 0) num2Digits++;
            else num1Digits++;
        }
        num1Digits = Math.min(MAX_PRACTICAL_DIGITS, num1Digits);
        num2Digits = Math.min(MAX_PRACTICAL_DIGITS, num2Digits);

        currentProblem.num1 = getRandomBigIntByDigits(num1Digits);
        currentProblem.num2 = getRandomBigIntByDigits(num2Digits);

        if (num1Digits !== num2Digits && Math.random() < 0.5) {
           [currentProblem.num1, currentProblem.num2] = [currentProblem.num2, currentProblem.num1];
        }

        currentProblem.answer = currentProblem.num1 * currentProblem.num2;
        problemText.textContent = `${currentProblem.num1.toString()} × ${currentProblem.num2.toString()} = ?`;

        answerInput.value = '';
        feedbackText.textContent = ''; // フィードバックをクリア
        answerInput.focus();
        // レベル表示はHTMLから削除されたので、ここでの更新は不要
    }

    function getRandomBigIntByDigits(digits) {
        if (digits <= 0) return 0n;
        if (digits === 1) return BigInt(Math.floor(Math.random() * 9) + 1);

        let randomNumStr = (Math.floor(Math.random() * 9) + 1).toString();
        for (let i = 1; i < digits; i++) {
            randomNumStr += Math.floor(Math.random() * 10).toString();
        }
        return BigInt(randomNumStr);
    }

    // --- Answer Checking ---
    function checkAnswer() {
        if (penaltyActive) return;

        const userAnswerText = answerInput.value.trim();
        if (userAnswerText === '') {
            setFeedback('数値を入力せよ。', 'error');
            return;
        }

        let userAnswer;
        try {
            userAnswer = BigInt(userAnswerText);
        } catch (e) {
            setFeedback('それは数値ではないようだ。', 'error');
            return;
        }

        if (userAnswer === currentProblem.answer) {
            setFeedback('正解。次なる試練へ。', 'success');
            correctAnswersInRow++;

            if (correctAnswersInRow >= CORRECT_ANSWERS_TO_LEVEL_UP) {
                currentLevel++;
                correctAnswersInRow = 0;
                setFeedback(`適合完了。レベル ${currentLevel} に移行。`, 'success', true);
                setTimeout(generateProblem, 1400); // 少し長めに表示
            } else {
                setTimeout(generateProblem, 450);
            }
        } else {
            setFeedback(`不適合。解は ${currentProblem.answer.toString()} 。何故だ、何故間違える！`, 'error', true);
            correctAnswersInRow = 0;
            triggerPenalty();
        }
    }

    function setFeedback(message, type, isImportant = false) {
        feedbackText.textContent = message;
        feedbackText.style.color = `var(--${type}-color)`;
        feedbackText.style.fontWeight = isImportant ? '700' : '500';
        feedbackText.style.opacity = '0'; // 一旦消してアニメーション
        void feedbackText.offsetWidth; // リフロー
        feedbackText.style.transition = 'opacity 0.3s ease-in-out';
        feedbackText.style.opacity = '0.9';
    }

    // --- Penalty (Chaos) Logic ---
    function triggerPenalty() {
        if (penaltyActive) return;
        penaltyActive = true;
        quizContainer.classList.add('hidden');
        playAggressiveSoundScape(INCORRECT_SOUND_SOURCES.length * 2, 90); // 音の数を増やし、間隔を短く

        const initialStoneBurst = 40;
        const initialNandeyaBurst = 12;

        for (let i = 0; i < initialStoneBurst; i++) createStoneElement();
        for (let i = 0; i < initialNandeyaBurst; i++) createNandeyaElement();

        if (!elementSpawnIntervalId) {
            elementSpawnIntervalId = setInterval(() => {
                if (activeElements.length < MAX_ELEMENTS_ON_SCREEN) {
                    if (Math.random() < 0.8) createStoneElement(true); // 継続生成は少し違うアニメーションも
                    if (Math.random() < 0.25) createNandeyaElement(true);
                }
                manageActiveElements();
            }, ELEMENT_SPAWN_INTERVAL_MS);
        }
    }

    function playAggressiveSoundScape(numberOfSounds, interval) {
        for (let i = 0; i < numberOfSounds; i++) {
            setTimeout(() => {
                try {
                    const soundSrc = INCORRECT_SOUND_SOURCES[Math.floor(Math.random() * INCORRECT_SOUND_SOURCES.length)];
                    const audio = new Audio(soundSrc);
                    audio.volume = Math.random() * 0.25 + 0.45; // BGMなので音量を少し抑えつつランダムに
                    audio.play().catch(e => console.warn(`音声再生失敗 [${soundSrc}]:`, e.message));
                } catch (e) { console.error("音声再生処理エラー:", e); }
            }, i * interval);
        }
    }

    // --- Element Creation and Management ---
    function createStoneElement(isContinuous = false) {
        const stone = document.createElement('img');
        stone.src = STONE_IMAGE_SRC;
        stone.classList.add('stone');
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // アニメーションパラメータを調整し、より多彩な動きに
        const randomRotationStart = Math.random() * 720 - 360;
        const randomRotationEnd = Math.random() * (isContinuous ? 1080 : 1440) - (isContinuous ? 540 : 720);

        stone.style.setProperty('--start-x', `${Math.random() * vw * 0.5 - vw * 0.25}px`);
        stone.style.setProperty('--start-y', `${Math.random() * vh * 0.5 - vh * 0.25}px`);
        stone.style.setProperty('--start-rotate', `${randomRotationStart}deg`);
        stone.style.setProperty('--end-x', `${Math.random() * vw * 1.8 - vw * 0.4}px`); // より画面外へ
        stone.style.setProperty('--end-y', `${Math.random() * vh * 1.8 - vh * 0.4}px`);
        stone.style.setProperty('--end-scale', `${Math.random() * 1.5 + (isContinuous ? 0.4 : 0.7)}`);
        stone.style.setProperty('--end-rotate', `${randomRotationEnd}deg`);
        stone.style.setProperty('--end-opacity', `${Math.random() * 0.2 + 0.35}`);
        stone.style.left = `${vw/2 + (Math.random() - 0.5) * 50}px`; // 初期位置も少しばらつき
        stone.style.top = `${vh/2 + (Math.random() - 0.5) * 50}px`;

        chaosContainer.appendChild(stone);
        addElementToManager(stone, STONE_LIFESPAN_MS + Math.random() * 500); // 生存時間も少しランダムに
    }

    function createNandeyaElement(isContinuous = false) {
        const nandeya = document.createElement('div');
        nandeya.textContent = NANDEYA_TEXT_CONTENT;
        nandeya.classList.add('nandeya');
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseFontSize = 3.0; // rem
        const randomSizeFactor = Math.random() * 1.0 + (isContinuous ? 0.6 : 0.8);

        nandeya.style.fontSize = `${baseFontSize * randomSizeFactor}rem`;
        nandeya.style.setProperty('--n-start-x', `${Math.random() * vw * 0.4 - vw * 0.2}px`);
        nandeya.style.setProperty('--n-start-y', `${Math.random() * vh * 0.4 - vh * 0.2}px`);
        nandeya.style.setProperty('--n-start-rotate-y', `${Math.random() * 120 - 60}deg`);
        nandeya.style.setProperty('--n-end-x', `${Math.random() * vw * 0.7 - vw * 0.35}px`);
        nandeya.style.setProperty('--n-end-y', `${Math.random() * vh * 0.7 - vh * 0.35}px`);
        nandeya.style.setProperty('--n-end-scale', `${Math.random() * 0.5 + 0.7}`);
        nandeya.style.setProperty('--n-end-rotate-x', `${Math.random() * 50 - 25}deg`);
        nandeya.style.setProperty('--n-end-rotate-y', `${Math.random() * (isContinuous ? 90 : 180) - (isContinuous ? 45 : 90)}deg`);
        nandeya.style.setProperty('--n-end-opacity', `${Math.random() * 0.3 + 0.45}`);
        nandeya.style.zIndex = `${Math.floor(Math.random() * 15)}`;
        nandeya.style.left = `${vw/2 + (Math.random() - 0.5) * 80}px`;
        nandeya.style.top = `${vh/2 + (Math.random() - 0.5) * 80}px`;

        chaosContainer.appendChild(nandeya);
        addElementToManager(nandeya, NANDEYA_LIFESPAN_MS + Math.random() * 400);
    }

    function addElementToManager(element, lifespan) {
        activeElements.push(element);
        const timeoutId = setTimeout(() => {
            if (element.parentElement) {
                element.remove(); // remove() の方がわずかに効率的
            }
            const index = activeElements.indexOf(element);
            if (index > -1) {
                activeElements.splice(index, 1);
            }
        }, lifespan);
        // (オプション) 要素にタイムアウトIDを関連付けて、クリア時にキャンセルできるようにする
        // element.dataset.timeoutId = timeoutId;
    }

    function manageActiveElements() {
        // 古い要素の削除はlifespanによる自動削除に任せるため、この関数は積極的な上限超過管理に限定
        while (activeElements.length > MAX_ELEMENTS_ON_SCREEN) {
            const oldElement = activeElements.shift();
            if (oldElement && oldElement.parentElement) {
                // clearTimeout(oldElement.dataset.timeoutId); // ライフスパン前に削除する場合
                oldElement.remove();
            }
        }
    }

    // --- Event Listeners ---
    submitButton.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkAnswer();
        }
    });

    // --- Start Game ---
    initGame();
});
