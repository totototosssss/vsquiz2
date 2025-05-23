document.addEventListener('DOMContentLoaded', () => {
 const gameArea = document.getElementById('game-area');
 const stoneImageSrc = 'stone.png'; // Make sure 'stone.png' is in the same directory
 const nandeyaText = 'なんでや。';
 let stoneCount = 0;

 gameArea.addEventListener('click', (event) => {
  // Create a new stone
  const stone = document.createElement('img');
  stone.src = stoneImageSrc;
  stone.classList.add('stone');

  // Set random position and initial size
  const size = Math.random() * 30 + 20; // Random size between 20px and 50px
  stone.style.width = `${size}px`;
  stone.style.left = `${event.clientX - size / 2}px`;
  stone.style.top = `${event.clientY - size / 2}px`;
  stone.style.transform = `rotate(${Math.random() * 360}deg)`;

  gameArea.appendChild(stone);
  stoneCount++;

  // Create a "nandeya." text
  const nandeya = document.createElement('div');
  nandeya.textContent = nandeyaText;
  nandeya.classList.add('nandeya');

  // Set random position, size, and rotation for "nandeya."
  const nandeyaSize = Math.random() * 3 + 1; // Random size multiplier
  nandeya.style.fontSize = `${nandeyaSize}em`;
  nandeya.style.left = `${Math.random() * 100}vw`;
  nandeya.style.top = `${Math.random() * 100}vh`;
  nandeya.style.transform = `rotate(${Math.random() * 360 - 180}deg)`; // More random rotation
  nandeya.style.opacity = Math.random() * 0.4 + 0.3; // Random opacity

  gameArea.appendChild(nandeya);

  // Optional: Add sound effect (you'll need an audio file)
  const audio = new Audio();
  audio.src = 'stone_sound.wav'; // Replace with your sound file
  audio.volume = 0.5; // Adjust volume as needed
  audio.play();

  // Increase stone count rapidly (for the "ありえないくらい" effect)
  for (let i = 0; i < 5; i++) { // Adjust the multiplier for more rapid increase
   setTimeout(() => {
    const extraStone = document.createElement('img');
    extraStone.src = stoneImageSrc;
    extraStone.classList.add('stone');
    const extraSize = Math.random() * 40 + 15;
    extraStone.style.width = `${extraSize}px`;
    extraStone.style.left = `${event.clientX - extraSize / 2 + (Math.random() - 0.5) * 100}px`; // Spread out a bit
    extraStone.style.top = `${event.clientY - extraSize / 2 + (Math.random() - 0.5) * 100}px`;
    extraStone.style.transform = `rotate(${Math.random() * 360}deg)`;
    gameArea.appendChild(extraStone);
    stoneCount++;
   }, i * 50); // Small delay to see the multiplication
  }

  // Add more "nandeya." text on each click
  for (let i = 0; i < 3; i++) {
   const extraNandeya = document.createElement('div');
   extraNandeya.textContent = nandeyaText;
   extraNandeya.classList.add('nandeya');
   const extraNandeyaSize = Math.random() * 2 + 1.5;
   extraNandeya.style.fontSize = `${extraNandeyaSize}em`;
   extraNandeya.style.left = `${Math.random() * 100}vw`;
   extraNandeya.style.top = `${Math.random() * 100}vh`;
   extraNandeya.style.transform = `rotate(${Math.random() * 360 - 180}deg)`;
   extraNandeya.style.opacity = Math.random() * 0.4 + 0.3;
   gameArea.appendChild(extraNandeya);
  }

  console.log(`Stone count: ${stoneCount}`);
 });
});
