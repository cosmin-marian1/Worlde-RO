let words = [];
let targetWord = '';
let guessesArray = [];
let currentGuess = [];
let rowIndex = 0;
let isAnimating = false;
let gameEnded = false;


let cuvinteGhiciteCount = localStorage.getItem('cuvinteGhiciteCount') ? parseInt(localStorage.getItem('cuvinteGhiciteCount')) : 0;
document.getElementById('cuvinteGhicite').textContent = `Guessed Words: ${cuvinteGhiciteCount}`;



fetch('words.txt')
  .then(response => response.text())
  .then(text => {
    words = text
      .split('\n')
      .map(word => word.trim().toUpperCase())
      .map(word => removeDiacritics(word.trim()))
      .filter(word => word.length === 5);

    loadProgress();  
    if (!targetWord) { 
      setRandomTargetWord(); 
    }
  })
  .catch(error => console.error('Eroare la încărcarea cuvintelor:', error));

  function setRandomTargetWord() {
    targetWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
  }

  function saveProgress() {
    const gameData = {
        targetWord: targetWord,
        attempts: rowIndex,
        guesses: guessesArray,
        currentGuess: currentGuess,
        gameEnded: gameEnded
    };
    localStorage.setItem('wordleGameProgress', JSON.stringify(gameData));
}
function loadProgress() {
    const savedData = localStorage.getItem('wordleGameProgress');
    if (savedData) {
        const gameData = JSON.parse(savedData);
        
        targetWord = gameData.targetWord;
        rowIndex = gameData.attempts;
        guessesArray = gameData.guesses || [];
        currentGuess = gameData.currentGuess || [];
        gameEnded = gameData.gameEnded || false;
        
        
        guessesArray.forEach((guessedWord, index) => {
            const row = document.querySelectorAll('.row')[index];
            const tiles = row.querySelectorAll('.tile');
            
            guessedWord.split('').forEach((letter, letterIndex) => {
                tiles[letterIndex].textContent = letter; 
                
                const tileStatus = 
                    targetWord[letterIndex] === letter ? 'correct' :
                    targetWord.includes(letter) ? 'present' : 
                    'absent';
                tiles[letterIndex].classList.add(tileStatus);
                updateKeyboard(letter, tileStatus); 
            });
        });

        if (gameEnded) {
            if (guessesArray[guessesArray.length - 1] === targetWord) {
                showEndGamePopup(`Ai ghicit cuvantul: <br><strong>${targetWord}</strong>`);
            } else {
                showEndGamePopup(`Ai pierdut!<br>Cuvantul era:<br><strong>${targetWord}</strong>`);
            }
        }
    }
}

function clearProgress() {
    localStorage.removeItem('wordleGameProgress');
}

function updateKeyboard(letter, status) {
    const key = document.querySelector(`.key[data-key="${letter}"]`);
    if (key) {
        key.classList.remove('correct', 'present', 'absent'); 
        key.classList.add(status); 
    }
}

document.addEventListener('keydown', (event) => {
    if (isAnimating) return;

    if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
        if (currentGuess.length < 5) {
            currentGuess.push(event.key.toUpperCase());
            updateGrid();
        }
    } else if (event.key === 'Enter') {
        if (currentGuess.length === 5) {
            const guessedWord = currentGuess.join('').toUpperCase();

            if (!words.includes(guessedWord)) {
                showNotification('This word is not in the list!');
            } else {
                isAnimating = true;

                guessesArray.push(guessedWord);
                saveProgress();

                
                handleGuessAnimation(guessedWord);
            }
        }
    } else if (event.key === 'Backspace') {
        if (!isAnimating) {
            currentGuess.pop();
            updateGrid();
        }
    }
});

function addLetter(letter) {
  currentGuess += letter;
  updateGrid();
}

function deleteLetter() {
  currentGuess = currentGuess.slice(0, -1);
  updateGrid();
}

function updateGrid() {
    const row = document.querySelectorAll('.row')[rowIndex];
    const tiles = row.querySelectorAll('.tile'); 
    
    tiles.forEach((tile, index) => {
        tile.textContent = currentGuess[index] || '';
    });

    
    const currentTile = tiles[currentGuess.length - 1]; 
    if (currentTile) {
        animateTile(currentTile); 
    }
  }

function submitGuess() {
  if (currentGuess.length === 5) {
    checkGuess();
    currentGuess = '';
    rowIndex++;
  }
}

function handleGuessAnimation(guessedWord) {
    for (let i = 0; i < 5; i++) {
        const tile = document.querySelector(`.row:nth-child(${rowIndex + 1}) .tile:nth-child(${i + 1})`);
        setTimeout(() => {
            tile.classList.add('flip');
        }, i * 200);
    }

    setTimeout(() => {
        checkGuess(guessedWord);
        isAnimating = false;
    }, 1000);
}


function checkGuess(guessedWord) {
    const letterCounts = {};
    for (const letter of targetWord) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    guessedWord.split('').forEach((letter, i) => {
        const tile = document.querySelector(`.row:nth-child(${rowIndex + 1}) .tile:nth-child(${i + 1})`);
        if (letter === targetWord[i]) {
            tile.classList.add('correct');
            updateKeyboard(letter, 'correct');
        } else if (targetWord.includes(letter)) {
            tile.classList.add('present');
            updateKeyboard(letter, 'present');
        } else {
            tile.classList.add('absent');
            updateKeyboard(letter, 'absent');
        }
    });

    if (guessedWord === targetWord) {
        gameEnded = true;
        saveProgress();
        incrementCuvinteGhicite();
        showEndGamePopup(`Ai ghicit cuvantul: <br><strong>${targetWord}</strong>`);
    } else if (rowIndex === 5) {
        gameEnded = true;
        saveProgress();
        showEndGamePopup(`Ai pierdut!<br>Cuvantul era:<br><strong>${targetWord}</strong>`);
    } else {
        rowIndex++;
        currentGuess = [];
        updateGrid();
        saveProgress();
    }
}

  
  function animateTile(tile) {
    tile.classList.add('enlarged'); 
    setTimeout(() => {
        tile.classList.remove('enlarged'); 
    }, 300); 
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block'; 

    setTimeout(() => {
        notification.style.display = 'none'; 
    }, 3000);
}
function removeDiacritics(word) {
    const diacriticsMap = {
        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't', 
        'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
        'ş': 's', 'ţ': 't'  
    };
    return word.replace(/[ăâîșțşţĂÂÎȘȚŞŢ]/g, match => diacriticsMap[match] || match);
}

function showEndGamePopup(message) {
    const popup = document.getElementById('endGamePopup');
    const messageElement = document.getElementById('endGameMessage');

    messageElement.innerHTML = message; 
    popup.classList.add('show-popup'); 
}

function restartGame() {
    
    rowIndex = 0;
    guessesArray = [];
    currentGuess = [];
    isAnimating = false;
    gameEnded = false;
    clearProgress(); 

    
    document.querySelectorAll('.tile').forEach(tile => {
        tile.textContent = '';
        tile.classList.remove('flip', 'correct', 'present', 'absent');
    });
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });

    setRandomTargetWord();
    updateGrid();
    const popup = document.getElementById('endGamePopup');
    popup.classList.remove('show-popup');
}

function incrementCuvinteGhicite() {
    cuvinteGhiciteCount++;
    document.getElementById('cuvinteGhicite').textContent = `Cuvinte Ghicite: ${cuvinteGhiciteCount}`;
    localStorage.setItem('cuvinteGhiciteCount', cuvinteGhiciteCount);
}

const instructionsModal = document.getElementById('instructionsModal');
const gearButton = document.querySelector('.icon'); 
const closeButton = document.querySelector('.close-button');


gearButton.addEventListener('click', () => {
    instructionsModal.classList.add('show');
});


closeButton.addEventListener('click', () => {
    instructionsModal.classList.remove('show');
});


window.addEventListener('click', (event) => {
    if (event.target === instructionsModal) {
        instructionsModal.classList.remove('show');
    }
});