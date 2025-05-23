document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('main-container');
    const quizContainer = document.getElementById('quiz-container');
    const gameTitle = document.getElementById('game-title'); // アニメーション用
    const subTitle = document.getElementById('sub-title');   // アニメーション用
    const problemText = document.getElementById('problem-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const feedbackText = document.getElementById('feedback-text');
    const chaosContainer = document.getElementById('chaos-container');

    const stoneImageSrc = 'stone.png';
    const nandeyaTextContent = 'なんでや。';
    // 複数の激しいサウンドを用意し、ランダムに再生する (ユーザーに用意してもらう)
    const incorrectSoundSources = [
        'maou_46_yoake_no_highway.mp3', // 重低音の爆発音
        'maou_46_yoake_no_highway.mp3',// グリッチノイズ
        'maou_46_yoake_no_highway.mp3',// 甲高い叫び声風 (なんでやボイスでも可)
        'maou_46_yoake_no_highway.mp3' // 金属的な衝撃音
    ];
    // ↑これらのファイルを用意するか、既存のincorrect_sound.mp3を複数回使うなどで調整

    let currentProblem = { num1: 0, num2: 0, answer: 0 };
    let penaltyActive = false;
    let elementSpawnInterval = null;
    const activeElements = []; // 画面上の要素を管理する配列
    const MAX_ELEMENTS_ON_SCREEN = 200; // 同時表示数の上限 (視認性とパフォーマンスのため)

    // --- 初期化とUIアニメーション ---
    function initUIAnimations() {
        // タイトル文字アニメーションはCSSで定義済み
        // サブタイトルと問題文の出現はCSSアニメーションで制御
        problemText.style.opacity = '0'; // JSでリセット用
        subTitle.style.opacity = '0'; // JSでリセット用
        // 実行タイミングはCSSアニメーションの遅延に依存
    }

    // --- クイズロジック ---
    function generateProblem() {
        currentProblem.num1 = Math.floor(Math.random() * 90) + 10;
        currentProblem.num2 = Math.floor(Math.random() * 90) + 10;
        currentProblem.answer = currentProblem.num1 * currentProblem.num2;

        // 問題文のアニメーションリセットと再開
        problemText.style.animation = 'none';
        void problemText.offsetWidth; // 強制リフロー
        problemText.style.animation = '';
        problemText.style.opacity = '0'; // アニメーション開始前の状態
        problemText.textContent = `${currentProblem.num1} × ${currentProblem.num2} = ?`;

        answerInput.value = '';
        feedbackText.textContent = '';
        answerInput.focus();
    }

    function checkAnswer() {
        if (penaltyActive) return;

        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) {
            feedbackText.textContent = '有効な数値を入力せよ。';
            feedbackText.style.color = 'var(--error-color)';
            return;
        }

        if (userAnswer === currentProblem.answer) {
            feedbackText.textContent = '正解。次へ。';
            feedbackText.style.color = 'var(--success-color)';
            // アニメーションを挟むならここに。今回は即時。
            setTimeout(generateProblem, 300); // わずかなウェイトでフィードバックを見せる
        } else {
            feedbackText.textContent = `否。解は ${currentProblem.answer} 。…何故だ。`;
            feedbackText.style.color = 'var(--error-color)';
            triggerPenalty();
        }
    }

    // --- ペナルティ（カオス）演出 ---
    function triggerPenalty() {
        if (penaltyActive) return;
        penaltyActive = true;

        quizContainer.classList.add('hidden');

        // 激しいサウンドスケープを生成
        playAggressiveSoundScape(5, 70); // 5つの音を70ms間隔で再生開始

        // 初期バースト
        for (let i = 0; i < 30; i++) { // 石は多めに、インパクト重視
            createStoneElement();
        }
        for (let i = 0; i < 8; i++) { // 「なんでや。」は視認性重視で少なめ
            createNandeyaElement();
        }

        // 継続的な要素生成
        if (!elementSpawnInterval) {
            elementSpawnInterval = setInterval(() => {
                if (activeElements.length < MAX_ELEMENTS_ON_SCREEN) {
                    if (Math.random() < 0.7) createStoneElement(); // 石の出現率高め
                    if (Math.random() < 0.15) createNandeyaElement(); // 「なんでや。」は控えめに
                }
                manageActiveElements(); // 古い要素を削除
            }, 100); // 生成間隔
        }
    }

    function playAggressiveSoundScape(numberOfSounds, interval) {
        for (let i = 0; i < numberOfSounds; i++) {
            setTimeout(() => {
                try {
                    // 用意したサウンドソースからランダムに選択
                    const randomSoundSrc = incorrectSoundSources[Math.floor(Math.random() * incorrectSoundSources.length)];
                    const audio = new Audio(randomSoundSrc || incorrectSoundSources[0]); // フォールバック
                    audio.volume = Math.random() * 0.4 + 0.6; // 0.6 〜 1.0 のランダムな音量
                    
                    // パンニング (左右の定位) もランダムに
                    const panner = new AudioContext().createStereoPanner();
                    const source = new AudioContext().createMediaElementSource(audio);
                    source.connect(panner);
                    panner.connect(new AudioContext().destination);
                    panner.pan.value = Math.random() * 1.8 - 0.9; // -0.9 〜 0.9 (ほぼ左右いっぱい)


                    audio.play().catch(e => console.warn("Sound playback failed:", e));
                } catch (e) { console.error("AudioContext/Panner error:", e); /* Safariなど一部ブラウザでエラーになる可能性 */ }
            }, i * interval);
        }
    }


    function createStoneElement() {
        const stone = document.createElement('img');
        stone.src = stoneImageSrc;
        stone.classList.add('stone');

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // CSS変数でアニメーションパラメータを渡す
        stone.style.setProperty('--start-x', `${Math.random() * vw - vw / 2}px`); // 画面中央付近から広がる
        stone.style.setProperty('--start-y', `${Math.random() * vh - vh / 2}px`);
        stone.style.setProperty('--end-x', `${Math.random() * vw * 1.4 - vw * 0.2}px`); // 画面外にも飛んでいく
        stone.style.setProperty('--end-y', `${Math.random() * vh * 1.4 - vh * 0.2}px`);
        stone.style.setProperty('--end-scale', `${Math.random() * 1.5 + 0.5}`); // サイズ変化
        stone.style.setProperty('--end-rotate', `${Math.random() * 1080 - 540}deg`); // 回転数
        stone.style.setProperty('--end-opacity', `${Math.random() * 0.4 + 0.3}`); // 最終的な透明度

        // 初期位置は画面中央付近に設定 (CSSアニメーションの translate は相対的なので)
        stone.style.left = `${vw/2}px`;
        stone.style.top = `${vh/2}px`;


        chaosContainer.appendChild(stone);
        addElementToManager(stone, 1500); // 1.5秒後に消える
    }

    function createNandeyaElement() {
        const nandeya = document.createElement('div');
        nandeya.textContent = nandeyaTextContent;
        nandeya.classList.add('nandeya');

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseFontSize = 3; // rem
        const randomSizeFactor = Math.random() * 1.5 + 0.8; // 0.8x ~ 2.3x

        nandeya.style.fontSize = `${baseFontSize * randomSizeFactor}rem`;

        // アニメーションパラメータ
        nandeya.style.setProperty('--n-start-x', `${Math.random() * vw - vw/2}px`);
        nandeya.style.setProperty('--n-start-y', `${Math.random() * vh - vh/2}px`);
        nandeya.style.setProperty('--n-end-x', `${Math.random() * vw - vw/2}px`); // 最終位置は中央付近に留まる感じ
        nandeya.style.setProperty('--n-end-y', `${Math.random() * vh - vh/2}px`);
        nandeya.style.setProperty('--n-end-scale', `${Math.random() * 0.5 + 0.8}`);
        nandeya.style.setProperty('--n-end-rotate', `${Math.random() * 60 - 30}deg`);
        nandeya.style.setProperty('--n-end-opacity', `${Math.random() * 0.5 + 0.4}`);
        nandeya.style.zIndex = `${Math.floor(Math.random() * 5)}`; // 重なり順

        // 初期位置
        nandeya.style.left = `${vw/2}px`;
        nandeya.style.top = `${vh/2}px`;

        chaosContainer.appendChild(nandeya);
        addElementToManager(nandeya, 1200); // 1.2秒後に消える (石より少し早い)
    }

    function addElementToManager(element, lifespan) {
        activeElements.push(element);
        setTimeout(() => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
            const index = activeElements.indexOf(element);
            if (index > -1) {
                activeElements.splice(index, 1);
            }
        }, lifespan);
    }

    function manageActiveElements() {
        // MAX_ELEMENTS_ON_SCREEN を超えている場合、古いものから削除
        // (addElementToManager の lifespan で自動削除されるので、この関数は積極的な削除用)
        while (activeElements.length > MAX_ELEMENTS_ON_SCREEN) {
            const oldElement = activeElements.shift(); // 配列の先頭（一番古い）
            if (oldElement && oldElement.parentElement) {
                oldElement.parentElement.removeChild(oldElement);
            }
        }
    }

    // --- イベントリスナー ---
    submitButton.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });

    // --- 初期化 ---
    function initGame() {
        penaltyActive = false;
        quizContainer.classList.remove('hidden');
        // UIアニメーションの初期化
        initUIAnimations();

        chaosContainer.innerHTML = ''; // カオスエリアをクリア
        activeElements.length = 0; // 管理配列もクリア
        if (elementSpawnInterval) {
            clearInterval(elementSpawnInterval);
            elementSpawnInterval = null;
        }
        generateProblem();
    }

    initGame();
});
