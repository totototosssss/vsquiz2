document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizContainer = document.getElementById('quiz-container');
    const problemText = document.getElementById('problem-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const feedbackText = document.getElementById('feedback-text');
    const chaosContainer = document.getElementById('chaos-container');

    // --- Game Configuration ---
    const STONE_IMAGE_SRC = 'stone.png';
    // ↓↓↓ この長い文字列の定義が13行目あたりに来るはずです。特に注意してください！ ↓↓↓
    const LONG_NANDEYA_TEXT_CONTENT = '相当偏差値の高い高校（身の丈に合ってない）に通っています。高三なのですが未だにアルファベットが読めないことやadhdっぽいことに悩んで親に土下座してwais受けさせてもらいました。知覚推理144言語理解142ワーキングメモリ130処理速度84でした。　総合は覚えてないですが多分139とかだったはずです。ウィスクの年齢なのにウェイス受けさせられた。なんでや';
    let nandeyaPhrases = [];

    const INCORRECT_SOUND_SOURCES = [
        'maou_46_yoake_no_highway.mp3',
        'maou_bgm_cyber45.mp3',
        'maou_46_yoake_no_highway.mp3',
        'maou_bgm_cyber45.mp3'
    ];
    const CORRECT_ANSWERS_TO_LEVEL_UP = 2;
    const MAX_ELEMENTS_ON_SCREEN = 180;
    const ELEMENT_SPAWN_INTERVAL_MS = 110;
    const STONE_LIFESPAN_MS = 1800;
    const NANDEYA_LIFESPAN_MS = 2200;
    const MAX_PRACTICAL_DIGITS = 10;

    // --- Game State ---
    let currentProblem = { num1: 0n, num2: 0n, answer: 0n };
    let penaltyActive = false;
    let elementSpawnIntervalId = null;
    const activeElements = [];
    let currentLevel = 1;
    let correctAnswersInRow = 0;

    // --- Text Processing ---
    function prepareNandeyaPhrases() {
        const sentences = LONG_NANDEYA_TEXT_CONTENT.split('。');
        nandeyaPhrases = [];
        for (let i = 0; i < sentences.length; i++) {
            let sentence = sentences[i].trim();
            if (sentence.length === 0 && i === sentences.length - 1 && sentences.length > 1) {
                continue;
            }
            if (i < sentences.length - 1 || LONG_NANDEYA_TEXT_CONTENT.endsWith('。')) {
                if (sentence.length > 0 && !sentence.endsWith("なんでや")) sentence += '。';
                else if (sentence.length > 0 && sentence.endsWith("なんでや") && sentence !== "なんでや") sentence += '。';
            }

            if (sentence === "なんでや。" && nandeyaPhrases.length > 0 && nandeyaPhrases[nandeyaPhrases.length - 1].endsWith("なんでや。")) {
                // Avoid consecutive "なんでや。"
            } else if (sentence.length > 0) {
                nandeyaPhrases.push(sentence);
            }
        }
        if (nandeyaPhrases.length === 0) {
            nandeyaPhrases.push('なんでや。'); // Default fallback
        }
        console.log("分割された「なんでや」フレーズ:", nandeyaPhrases);
    }

    // --- Initialization ---
    function initGame() {
        penaltyActive = false;
        currentLevel = 1;
        correctAnswersInRow = 0;
        prepareNandeyaPhrases();

        quizContainer.classList.remove('hidden');
        problemText.style.animation = 'none';
        document.getElementById('sub-title').style.animation = 'none';
        document.getElementById('game-title').querySelectorAll('span').forEach(span => {
            span.style.animation = 'none';
        });

        void quizContainer.offsetWidth; // Reflow to reset animations

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
        problemText.style.animation = 'none';
        void problemText.offsetWidth;
        problemText.style.animation = '';
        problemText.style.opacity = '0';

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
        feedbackText.textContent = '';
        feedbackText.classList.remove('visible');
        answerInput.focus();
    }

    function getRandomBigIntByDigits(digits) {
        if (digits <= 0) return 0n;
        if (digits === 1) return BigInt(Math.floor(Math.random() * 9) + 1);

        let randomNumStr = (Math.floor(Math.random() * 9) + 1).toString(); // First digit is 1-9
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
                setTimeout(generateProblem, 1400);
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
        feedbackText.classList.add('visible');
    }

    // --- Penalty (Chaos) Logic ---
    function triggerPenalty() {
        if (penaltyActive) return;
        penaltyActive = true;
        quizContainer.classList.add('hidden');
        playAggressiveSoundScape(INCORRECT_SOUND_SOURCES.length * 2, 90); // Play more sounds, shorter interval

        const initialStoneBurst = 40;
        const initialNandeyaBurst = nandeyaPhrases.length > 0 ? Math.min(15, nandeyaPhrases.length * 2) : 10;

        for (let i = 0; i < initialStoneBurst; i++) createStoneElement();
        for (let i = 0; i < initialNandeyaBurst; i++) {
            const phrase = nandeyaPhrases[Math.floor(Math.random() * nandeyaPhrases.length)];
            createNandeyaElement(phrase);
        }

        if (!elementSpawnIntervalId) {
            elementSpawnIntervalId = setInterval(() => {
                if (activeElements.length < MAX_ELEMENTS_ON_SCREEN) {
                    if (Math.random() < 0.8) createStoneElement(true);
                    if (Math.random() < 0.25 && nandeyaPhrases.length > 0) {
                        const phrase = nandeyaPhrases[Math.floor(Math.random() * nandeyaPhrases.length)];
                        createNandeyaElement(phrase, true);
                    }
                }
                manageActiveElements();
            }, ELEMENT_SPAWN_INTERVAL_MS);
        }
    }

    function playAggressiveSoundScape(numberOfSoundsToPlay, interval) {
        console.log("Attempting to play aggressive sound scape...");
        for (let i = 0; i < numberOfSoundsToPlay; i++) {
            setTimeout(() => {
                const soundSrc = INCORRECT_SOUND_SOURCES[Math.floor(Math.random() * INCORRECT_SOUND_SOURCES.length)];
                console.log(`Playing sound: ${soundSrc} (attempt ${i + 1}/${numberOfSoundsToPlay})`);
                try {
                    const audio = new Audio(soundSrc);
                    audio.volume = Math.random() * 0.35 + 0.55; // Volume: 0.55 to 0.9

                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.then(_ => {
                            // console.log(`Successfully played: ${soundSrc}`); // Optional: reduce console noise
                        })
                        .catch(error => {
                            console.error(`Error playing sound ${soundSrc} (Promise):`, error.name, error.message);
                        });
                    }
                } catch (e) {
                    console.error(`Error creating or playing audio object for ${soundSrc} (Catch):`, e);
                }
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

        const randomRotationStart = Math.random() * 720 - 360;
        const randomRotationEnd = Math.random() * (isContinuous ? 1080 : 1440) - (isContinuous ? 540 : 720);

        stone.style.setProperty('--start-x', `${Math.random() * vw * 0.5 - vw * 0.25}px`);
        stone.style.setProperty('--start-y', `${Math.random() * vh * 0.5 - vh * 0.25}px`);
        stone.style.setProperty('--start-rotate', `${randomRotationStart}deg`);
        stone.style.setProperty('--end-x', `${Math.random() * vw * 1.8 - vw * 0.4}px`);
        stone.style.setProperty('--end-y', `${Math.random() * vh * 1.8 - vh * 0.4}px`);
        stone.style.setProperty('--end-scale', `${Math.random() * 1.5 + (isContinuous ? 0.4 : 0.7)}`);
        stone.style.setProperty('--end-rotate', `${randomRotationEnd}deg`);
        stone.style.setProperty('--end-opacity', `${Math.random() * 0.2 + 0.35}`);
        stone.style.left = `${vw/2 + (Math.random() - 0.5) * 50}px`;
        stone.style.top = `${vh/2 + (Math.random() - 0.5) * 50}px`;

        chaosContainer.appendChild(stone);
        addElementToManager(stone, STONE_LIFESPAN_MS + Math.random() * 500);
    }

    function createNandeyaElement(textToShow = "なんでや。", isContinuous = false) {
        const nandeya = document.createElement('div');
        nandeya.textContent = textToShow;
        nandeya.classList.add('nandeya');
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let fontSizeFactor = 1.0;
        if (textToShow.length > 20) fontSizeFactor = 0.9; // Adjust for longer phrases
        if (textToShow.length > 40) fontSizeFactor = 0.8;

        const baseFontSize = 2.8 * fontSizeFactor;
        const randomSizeFactor = Math.random() * 1.0 + (isContinuous ? 0.6 : 0.8);

        nandeya.style.fontSize = `${baseFontSize * randomSizeFactor}rem`;
        nandeya.style.setProperty('--n-start-x', `${Math.random() * vw * 0.4 - vw * 0.2}px`);
        nandeya.style.setProperty('--n-start-y', `${Math.random() * vh * 0.4 - vh * 0.2}px`);
        nandeya.style.setProperty('--n-start-rotate-y', `${Math.random() * 100 - 50}deg`);
        nandeya.style.setProperty('--n-end-x', `${Math.random() * vw * 0.7 - vw * 0.35}px`);
        nandeya.style.setProperty('--n-end-y', `${Math.random() * vh * 0.7 - vh * 0.35}px`);
        nandeya.style.setProperty('--n-end-scale', `${Math.random() * 0.5 + 0.7}`);
        nandeya.style.setProperty('--n-end-rotate-x', `${Math.random() * 40 - 20}deg`);
        nandeya.style.setProperty('--n-end-rotate-y', `${Math.random() * (isContinuous ? 70 : 150) - (isContinuous ? 35 : 75)}deg`);
        nandeya.style.setProperty('--n-end-opacity', `${Math.random() * 0.3 + 0.55}`);
        nandeya.style.zIndex = `${Math.floor(Math.random() * 15)}`;
        nandeya.style.left = `${vw/2 + (Math.random() - 0.5) * 80}px`;
        nandeya.style.top = `${vh/2 + (Math.random() - 0.5) * 80}px`;

        chaosContainer.appendChild(nandeya);
        addElementToManager(nandeya, NANDEYA_LIFESPAN_MS + Math.random() * 400);
    }

    function addElementToManager(element, lifespan) {
        activeElements.push(element);
        setTimeout(() => {
            if (element.parentElement) {
                element.remove();
            }
            const index = activeElements.indexOf(element);
            if (index > -1) {
                activeElements.splice(index, 1);
            }
        }, lifespan);
    }

    function manageActiveElements() {
        while (activeElements.length > MAX_ELEMENTS_ON_SCREEN) {
            const oldElement = activeElements.shift();
            if (oldElement && oldElement.parentElement) {
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
