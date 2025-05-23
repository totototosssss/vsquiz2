document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const quizContainer = document.getElementById('quiz-container');
    const problemText = document.getElementById('problem-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const feedbackText = document.getElementById('feedback-text');

    const stoneImageSrc = 'stone.png'; // stone.pngを同じフォルダに配置してください
    const nandeyaTextContent = 'なんでや。';
    const incorrectSoundSrc = 'incorrect_sound.mp3'; // 大音量で流すサウンドファイルを配置

    let currentProblem = { num1: 0, num2: 0, answer: 0 };
    let penaltyActive = false;
    let spawnInterval = null;
    let stoneCount = 0;

    // --- クイズ関連の関数 ---
    function generateProblem() {
        currentProblem.num1 = Math.floor(Math.random() * 90) + 10; // 10-99
        currentProblem.num2 = Math.floor(Math.random() * 90) + 10; // 10-99
        currentProblem.answer = currentProblem.num1 * currentProblem.num2;
        problemText.textContent = `${currentProblem.num1} × ${currentProblem.num2} = ?`;
        answerInput.value = '';
        feedbackText.textContent = '';
        answerInput.focus();
    }

    function checkAnswer() {
        if (penaltyActive) return; // ペナルティ中は操作不可

        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) {
            feedbackText.textContent = '数値を入力してください！';
            feedbackText.style.color = '#ff9999';
            return;
        }

        if (userAnswer === currentProblem.answer) {
            feedbackText.textContent = '正解！次の問題！';
            feedbackText.style.color = '#99ff99';
            setTimeout(() => {
                generateProblem();
            }, 1500);
        } else {
            feedbackText.textContent = `不正解！答えは ${currentProblem.answer} でした。なんでや！`;
            feedbackText.style.color = '#ff6666';
            triggerPenalty();
        }
    }

    // --- ペナルティ関連の関数 ---
    function triggerPenalty() {
        if (penaltyActive) return;
        penaltyActive = true;
        quizContainer.classList.add('hidden'); // クイズUIを隠す
        gameArea.style.pointerEvents = 'auto'; // ゲームエリアの操作を一時的に許可（あまり意味はないかも）

        // 大音量サウンド再生
        const audio = new Audio(incorrectSoundSrc);
        audio.volume = 1.0; // 大音量！
        audio.play().catch(error => console.error("音声の再生に失敗しました:", error));

        // 石と「なんでや。」の大量発生開始
        // 初回クリックの代わりに、ここで最初のバーストを発生させる
        for (let i = 0; i < 20; i++) { // 初期バースト量
            createStone(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
            if (i % 2 === 0) createNandeya();
        }

        // 定期的な自動生成を開始（以前のクリック後の挙動と同様）
        if (!spawnInterval) {
            spawnInterval = setInterval(() => {
                if (!penaltyActive) { // ペナルティが終わったら停止（今回はリセットするまで続く想定）
                    clearInterval(spawnInterval);
                    spawnInterval = null;
                    return;
                }
                createStone(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
                if (Math.random() < 0.4) {
                    createNandeya();
                }
                // 画面が埋まりすぎたら古い要素を削除するなどの制御もここに追加可能
                removeOldElementsIfNeeded();

            }, 80); // 生成間隔を短くして激しく
        }
        // 一定時間後にリセットボタンなどを表示するのも良いかもしれません
        // 今回は手動リロードでリセットする想定
    }

    function createStone(x, y) {
        const stone = document.createElement('img');
        stone.src = stoneImageSrc;
        stone.classList.add('stone');

        // CSSカスタムプロパティでランダム値を渡す
        stone.style.setProperty('--random-angle', Math.random() * 360);
        stone.style.setProperty('--random-tx', (Math.random() - 0.5) * 100); // X方向のランダムなずれ
        stone.style.setProperty('--random-ty', (Math.random() - 0.5) * 100); // Y方向のランダムなずれ


        const size = Math.random() * 50 + 25; // サイズもランダムに
        stone.style.width = `${size}px`;
        stone.style.left = `${x - size / 2}px`;
        stone.style.top = `${y - size / 2}px`;
        // stone.style.transform = `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.8})`; // アニメーションに統合

        gameArea.appendChild(stone);
        stoneCount++;
    }

    function createNandeya() {
        const nandeya = document.createElement('div');
        nandeya.textContent = nandeyaTextContent;
        nandeya.classList.add('nandeya');

        nandeya.style.setProperty('--random-nandeya-angle', Math.random() * 40 - 20); // CSSで使う用

        const size = Math.random() * 3 + 2; // 少し大きめに
        nandeya.style.fontSize = `${size}em`;
        nandeya.style.left = `${Math.random() * 100}vw`;
        nandeya.style.top = `${Math.random() * 100}vh`;
        // nandeya.style.transform = `rotate(${Math.random() * 40 - 20}deg)`; // アニメーションに統合
        // nandeya.style.opacity = Math.random() * 0.4 + 0.6; // アニメーションで制御

        gameArea.appendChild(nandeya);
    }

    function removeOldElementsIfNeeded() {
        const maxElements = 300; // 画面上の最大要素数（調整してください）
        while (gameArea.children.length > maxElements) {
            gameArea.removeChild(gameArea.firstChild);
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
        gameArea.innerHTML = ''; // ゲームエリアをクリア
        stoneCount = 0;
        if (spawnInterval) {
            clearInterval(spawnInterval);
            spawnInterval = null;
        }
        generateProblem();
    }

    initGame(); // ゲーム開始
});
