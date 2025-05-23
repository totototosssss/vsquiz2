document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const quizContainer = document.getElementById('quiz-container');
    const problemText = document.getElementById('problem-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const feedbackText = document.getElementById('feedback-text');

    const stoneImageSrc = 'stone.png';
    const nandeyaTextContent = 'なんでや。';
    const incorrectSoundSrc = 'incorrect_sound.mp3'; // 大音量で流すサウンドファイル

    let currentProblem = { num1: 0, num2: 0, answer: 0 };
    let penaltyActive = false;
    let spawnInterval = null;
    // let stoneCount = 0; // 厳密なカウントはもはや困難

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
        if (penaltyActive) return;

        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) {
            feedbackText.textContent = '数値を入力してください！';
            feedbackText.style.color = '#ff9999';
            return;
        }

        if (userAnswer === currentProblem.answer) {
            feedbackText.textContent = '正解！お見事！';
            feedbackText.style.color = '#99ff99';
            setTimeout(() => {
                generateProblem();
            }, 1500);
        } else {
            feedbackText.textContent = `不正解！答えは ${currentProblem.answer} でした。なんでや！なんでや！なんでや！！！`;
            feedbackText.style.color = '#ff6666';
            triggerPenalty();
        }
    }

    function triggerPenalty() {
        if (penaltyActive) return;
        penaltyActive = true;
        quizContainer.classList.add('hidden');
        // gameArea.style.pointerEvents = 'auto'; // もはや意味はないかもしれない

        // 大音量サウンド再生
        try {
            const audio = new Audio(incorrectSoundSrc);
            audio.volume = 1.0; // 大音量！
            audio.play().catch(error => {
                console.warn("音声の自動再生に失敗しました。ユーザー操作が必要な場合があります。", error);
                // 一部のブラウザではユーザーインタラクションなしの音声再生がブロックされるため
            });
        } catch (e) {
            console.error("音声ファイルの読み込みまたは再生でエラー:", e);
        }


        // 初期バースト量を大幅に増加
        for (let i = 0; i < 200; i++) { // ★★★「信じられないくらい」の数 (例: 200) ★★★
            createStone(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
            if (i % 1 === 0) createNandeya(); // 「なんでや。」もほぼ同数出す勢い
        }

        if (!spawnInterval) {
            spawnInterval = setInterval(() => {
                if (!penaltyActive) {
                    clearInterval(spawnInterval);
                    spawnInterval = null;
                    return;
                }
                // 一度のインターバルで生成する数を増加
                for (let j = 0; j < 15; j++) { // ★★★「信じられないくらい」の数 (例: 15個の石/回) ★★★
                    createStone(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
                }
                for (let k = 0; k < 10; k++) { // ★★★「信じられないくらい」の数 (例: 10個の「なんでや。」/回) ★★★
                     createNandeya();
                }

                removeOldElementsIfNeeded();

            }, 20); // ★★★ 生成間隔を極限まで短縮 (例: 20ms) ★★★
        }
    }

    function createStone(x, y) {
        const stone = document.createElement('img');
        stone.src = stoneImageSrc;
        stone.classList.add('stone');
        stone.style.setProperty('--random-angle', Math.random() * 360);
        stone.style.setProperty('--random-tx', (Math.random() - 0.5) * 200); // ずれもさらに大きく
        stone.style.setProperty('--random-ty', (Math.random() - 0.5) * 200);
        const size = Math.random() * 70 + 20; // サイズのばらつきもかなり増やす
        stone.style.width = `${size}px`;
        stone.style.left = `${x - size / 2}px`;
        stone.style.top = `${y - size / 2}px`;
        gameArea.appendChild(stone);
    }

    function createNandeya() {
        const nandeya = document.createElement('div');
        nandeya.textContent = nandeyaTextContent;
        nandeya.classList.add('nandeya');
        nandeya.style.setProperty('--random-nandeya-angle', Math.random() * 70 - 35); // 回転もかなり激しく
        const size = Math.random() * 5 + 2; // 「なんでや。」のサイズも大きく
        nandeya.style.fontSize = `${size}em`;
        nandeya.style.left = `${Math.random() * 100}vw`;
        nandeya.style.top = `${Math.random() * 100}vh`;
        gameArea.appendChild(nandeya);
    }

    function removeOldElementsIfNeeded() {
        const maxElements = 3000; // ★★★ 画面上の最大要素数を大幅に増加 (例: 3000) ★★★
                                   // これ以上増やす、またはコメントアウトするとクラッシュの危険性が高まります
        while (gameArea.children.length > maxElements) {
            if (gameArea.firstChild) {
                 gameArea.removeChild(gameArea.firstChild);
            } else {
                break;
            }
        }
    }

    submitButton.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });

    function initGame() {
        penaltyActive = false;
        quizContainer.classList.remove('hidden');
        gameArea.innerHTML = ''; // ゲームエリアをクリア
        if (spawnInterval) {
            clearInterval(spawnInterval);
            spawnInterval = null;
        }
        generateProblem();
    }

    initGame(); // ゲーム開始
});
