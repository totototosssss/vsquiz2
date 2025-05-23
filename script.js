document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const quizContainer = document.getElementById('quiz-container');
    const problemText = document.getElementById('problem-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const feedbackText = document.getElementById('feedback-text');

    const stoneImageSrc = 'stone.png';
    const nandeyaTextContent = 'なんでや。';
    const incorrectSoundSrc = 'maou_46_yoake_no_highway.mp3'; // このサウンドファイルを用意してください

    let currentProblem = { num1: 0, num2: 0, answer: 0 };
    let penaltyActive = false; // 不正解後は true になり、戻れなくなるフラグ
    let spawnInterval = null;

    function generateProblem() {
        currentProblem.num1 = Math.floor(Math.random() * 90) + 10;
        currentProblem.num2 = Math.floor(Math.random() * 90) + 10;
        currentProblem.answer = currentProblem.num1 * currentProblem.num2;
        problemText.textContent = `${currentProblem.num1} × ${currentProblem.num2} = ?`;
        answerInput.value = '';
        feedbackText.textContent = ''; // フィードバックをクリア
        answerInput.focus();
    }

    function checkAnswer() {
        if (penaltyActive) return; // 間違えた後は何も受け付けない

        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) {
            feedbackText.textContent = '数値を入力してください！';
            feedbackText.style.color = '#ff8080'; // 少し優しい赤
            return;
        }

        if (userAnswer === currentProblem.answer) {
            feedbackText.textContent = '正解！'; // メッセージはシンプルに
            feedbackText.style.color = '#80ff80'; // 少し優しい緑
            // 正解したらすぐに次の問題 (遅延なし)
            generateProblem();
        } else {
            feedbackText.textContent = `不正解！答えは ${currentProblem.answer} でした。残念でしたね…。`;
            feedbackText.style.color = '#ff6666'; // しっかり赤く
            triggerPenalty();
        }
    }

    function triggerPenalty() {
        if (penaltyActive) return; // 念のため二重呼び出し防止
        penaltyActive = true; // これでクイズ操作は完全に不能に

        // クイズUIを非表示にし、二度と操作できないようにする
        quizContainer.classList.add('hidden');
        // submitButton.disabled = true; // ボタンも無効化
        // answerInput.disabled = true;  // 入力欄も無効化

        // 音声を激しく！ (短い間隔で複数回再生)
        // 注意: ブラウザや設定によっては、短時間に大量の音声を再生しようとするとブロックされるか、
        //       音が途切れたり、予期せぬ動作をする可能性があります。
        let soundCount = 0;
        const maxSounds = 5; // 同時に鳴らす音の目安 (激しさとパフォーマンスのバランス)
        const soundInterval = 80; // 音を鳴らす間隔 (ms)

        function playAggressiveSound() {
            try {
                const audio = new Audio(incorrectSoundSrc);
                audio.volume = 1.0; // 最大音量
                // ピッチを少しランダムに変えて重ねるとよりカオスに (ブラウザサポートに注意)
                // audio.preservesPitch = false; // Firefoxではデフォルトtrue
                // audio.playbackRate = 1 + (Math.random() - 0.5) * 0.4; // 0.8 ~ 1.2倍速

                audio.play().catch(error => {
                    console.warn("音声の自動再生に失敗しました:", error);
                });
                soundCount++;
                if (soundCount < maxSounds) {
                    setTimeout(playAggressiveSound, soundInterval);
                }
            } catch (e) {
                console.error("音声ファイルの読み込みまたは再生でエラー:", e);
            }
        }
        playAggressiveSound(); // 最初の音を再生開始

        // 石と「なんでや。」の発生開始
        // 初期バースト (石は多め、「なんでや。」は識別できる程度に)
        for (let i = 0; i < 100; i++) { // 石の初期バースト
            createStone(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
        }
        for (let i = 0; i < 10; i++) { // 「なんでや。」の初期バースト (減らした)
            createNandeya();
        }

        if (!spawnInterval) {
            spawnInterval = setInterval(() => {
                // penaltyActiveがtrueの間だけ実行される (実質無限ループ)
                for (let j = 0; j < 8; j++) { // 石の継続生成 (少し減らして様子見)
                    createStone(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
                }
                // 「なんでや。」の継続生成 (さらに減らし、出現率も調整)
                if (Math.random() < 0.2) { // 20%の確率で「なんでや。」を追加
                     createNandeya();
                }
                removeOldElementsIfNeeded();
            }, 40); // 生成間隔 (少し長くして様子見)
        }
    }

    function createStone(x, y) {
        const stone = document.createElement('img');
        stone.src = stoneImageSrc;
        stone.classList.add('stone');
        stone.style.setProperty('--random-angle', Math.random() * 360);
        stone.style.setProperty('--random-tx', (Math.random() - 0.5) * 180);
        stone.style.setProperty('--random-ty', (Math.random() - 0.5) * 180);
        const size = Math.random() * 50 + 25;
        stone.style.width = `${size}px`;
        stone.style.left = `${x - size / 2}px`;
        stone.style.top = `${y - size / 2}px`;
        gameArea.appendChild(stone);
    }

    function createNandeya() {
        const nandeya = document.createElement('div');
        nandeya.textContent = nandeyaTextContent;
        nandeya.classList.add('nandeya');
        nandeya.style.setProperty('--random-nandeya-angle', Math.random() * 50 - 25);
        const sizeFactor = Math.random() * 0.5 + 0.8; // サイズのばらつきを少し抑える
        nandeya.style.fontSize = `${2.8 * sizeFactor}em`; // CSSの基本サイズに係数をかける
        nandeya.style.left = `${Math.random() * 100}vw`;
        nandeya.style.top = `${Math.random() * 100}vh`;
        nandeya.style.zIndex = Math.floor(Math.random() * 10); // 重なりの順番を少しランダムに
        gameArea.appendChild(nandeya);
    }

    function removeOldElementsIfNeeded() {
        const maxElements = 1000; // 最大要素数を調整 (以前より減らして識別しやすく)
        while (gameArea.children.length > maxElements) {
            if (gameArea.firstChild) {
                 gameArea.removeChild(gameArea.firstChild);
            } else {
                break;
            }
        }
    }

    // イベントリスナー
    submitButton.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });

    // 初期化
    function initGame() {
        penaltyActive = false; // ゲーム開始時はペナルティ解除
        quizContainer.classList.remove('hidden');
        submitButton.disabled = false;
        answerInput.disabled = false;
        gameArea.innerHTML = ''; // ゲームエリアをクリア
        if (spawnInterval) { // もし既存のインターバルがあればクリア
            clearInterval(spawnInterval);
            spawnInterval = null;
        }
        generateProblem();
    }

    initGame(); // ゲーム開始
});
