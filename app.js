// Initialize game
const game = new Game();

// Game state
let players = [];
let currentGame = null;
let currentRound = {
    gameType: null,
    players: [],
    scores: {}
};

// Track when players were selected
let playerSelectionTimes = {};

function startGame() {
    try {
        const inputs = document.querySelectorAll('input');
        const playerNames = Array.from(inputs).map(input => input.value);
        const canStart = game.startGame(playerNames);

        if (canStart) {
            // Hide setup and subtitle, show scoreboard
            document.getElementById('setupForm').style.display = 'none';
            document.getElementById('subtitle').style.display = 'none';
            document.getElementById('scoreBoard').style.display = 'block';
            
            updateScoreDisplay();
        }
    } catch (error) {
        alert(error.message);
    }
}

function updateScoreDisplay() {
    const scores = document.getElementById('scores');
    scores.innerHTML = '';
    
    // Create rows of two players each
    for (let i = 0; i < game.players.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'score-row';
        
        // Add first player in pair
        const player1Div = document.createElement('div');
        player1Div.className = 'player-score';
        player1Div.innerHTML = `
            <h3>${game.players[i].name}</h3>
            <p>Score: ${game.players[i].score}</p>
        `;
        row.appendChild(player1Div);
        
        // Add second player if exists
        if (i + 1 < game.players.length) {
            const player2Div = document.createElement('div');
            player2Div.className = 'player-score';
            player2Div.innerHTML = `
                <h3>${game.players[i + 1].name}</h3>
                <p>Score: ${game.players[i + 1].score}</p>
            `;
            row.appendChild(player2Div);
        }
        
        scores.appendChild(row);
    }
}

function selectGame(gameType) {
    const selectedOption = document.querySelector(`.game-option[onclick="selectGame('${gameType}')"]`);
    const previousSelected = document.querySelector('.game-option.selected');
    const playerChoices = document.querySelector('.player-choices-container');
    
    // If clicking the same game, toggle the dropdown
    if (previousSelected === selectedOption) {
        selectedOption.classList.remove('selected');
        playerChoices.classList.remove('visible');
        game.currentGame = null;
        return;
    }
    
    // Remove previous selection and hide previous dropdown
    if (previousSelected) {
        previousSelected.classList.remove('selected');
        const prevContainer = previousSelected.closest('.game-option-container');
        if (prevContainer && prevContainer.contains(playerChoices)) {
            playerChoices.classList.remove('visible');
        }
    }
    
    // Add new selection
    selectedOption.classList.add('selected');
    
    // Get game config
    const config = game.getGameConfig(gameType);
    if (!config) return;
    
    // Update player choices content
    const playerChoicesContent = document.getElementById('playerChoices');
    const playerNames = game.players.map(player => player.name);
    
    playerChoicesContent.innerHTML = `
        <h3>Selecteer ${config.maxPlayers === 1 ? 'Speler' : 'Spelers'}</h3>
        <div class="player-selection">
            ${playerNames.map((player, index) => `
                <div class="player-choice">
                    <input type="checkbox" id="player_${index}" onchange="selectPlayer(${index})">
                    <label for="player_${index}">${player}</label>
                </div>
            `).join('')}
        </div>
    `;
    
    // Move player choices container after the selected game option
    const targetContainer = selectedOption.closest('.game-option-container');
    targetContainer.appendChild(playerChoices);
    
    // Show player choices
    playerChoices.classList.add('visible');
    
    // Update game state
    game.currentGame = gameType;
    game.selectedPlayers = [];
    
    // Reset checkboxes and hide error message
    document.querySelectorAll('#playerChoices input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('errorMessage').style.display = 'none';
}

function selectPlayer(playerIndex) {
    const config = game.getGameConfig(game.currentGame);
    if (!config) return;
    
    const checkbox = document.getElementById(`player_${playerIndex}`);
    
    if (checkbox.checked) {
        // If this would exceed max players, uncheck the oldest selection
        if (game.selectedPlayers.length >= config.maxPlayers) {
            const oldestIndex = game.selectedPlayers[0];
            document.getElementById(`player_${oldestIndex}`).checked = false;
            game.selectedPlayers.shift(); // Remove the oldest selection
        }
        game.selectedPlayers.push(playerIndex);
    } else {
        // If unchecking, remove from selected players
        game.selectedPlayers = game.selectedPlayers.filter(p => p !== playerIndex);
    }
}

function startRound() {
    try {
        // Get selected game type from the UI since it's always selected when this button is visible
        const selectedGameOption = document.querySelector('.game-option.selected');
        if (!selectedGameOption) {
            showError('Er is iets misgegaan. Vernieuw de pagina en probeer opnieuw.');
            return;
        }

        // Get game config to check required players
        const config = game.getGameConfig(game.currentGame);
        if (!config) {
            showError('Er is iets misgegaan. Vernieuw de pagina en probeer opnieuw.');
            return;
        }

        // Check if enough players are selected
        if (game.selectedPlayers.length < config.minPlayers) {
            showError(`Selecteer minimaal ${config.minPlayers} ${config.minPlayers === 1 ? 'speler' : 'spelers'}`);
            return;
        }

        const round = game.startRound();
        // Hide game selection and show scoring UI
        document.getElementById('gameTypeSelection').style.display = 'none';
        document.getElementById('gameOptionsSelection').style.display = 'none';
        document.getElementById('scoringUI').style.display = 'block';
        document.getElementById('endGameButtonContainer').style.display = 'none';
        
        // Update round counter and game info
        const roundCounter = document.getElementById('roundCounter');
        roundCounter.textContent = `Ronde ${round.roundNumber}`;
        roundCounter.style.display = 'block';
        
        document.getElementById('activeGameType').textContent = selectedGameOption.textContent;
        document.getElementById('activeGameInfo').style.display = 'flex';
        
        // Update active players
        const activePlayersDiv = document.getElementById('activePlayers');
        activePlayersDiv.innerHTML = round.players
            .map(player => `<div class="active-player">${player.name}</div>`)
            .join('');
        
        if (config.scoringType === 'miserie') {
            showMiserieScoring(round);
        } else {
            showRegularScoring(round);
        }
    } catch (error) {
        showError(error.message);
    }
}

function showMiserieScoring(round) {
    const miserieScoring = document.getElementById('miserieScoring');
    const regularScoring = document.getElementById('regularScoring');
    const miseriePlayerResults = document.getElementById('miseriePlayerResults');
    
    miserieScoring.style.display = 'block';
    regularScoring.style.display = 'none';
    miseriePlayerResults.innerHTML = '';

    // Create success/fail toggles for each player
    round.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'miserie-player';
        playerDiv.innerHTML = `
            <label>${player.name}</label>
            <div class="miserie-options">
                <input type="radio" name="player_${player.name}" value="success" id="success_${player.name}" required>
                <label for="success_${player.name}">Geslaagd</label>
                <input type="radio" name="player_${player.name}" value="fail" id="fail_${player.name}" required>
                <label for="fail_${player.name}">Gefaald</label>
            </div>
        `;
        miseriePlayerResults.appendChild(playerDiv);
    });
    
    // Add validation to ensure all players have a selection
    const submitButton = document.querySelector('#miserieScoring button');
    if (submitButton) {
        submitButton.onclick = function() {
            const allPlayersSelected = round.players.every(player => 
                document.querySelector(`input[name="player_${player.name}"]:checked`)
            );
            
            if (!allPlayersSelected) {
                showError('Selecteer voor elke speler of ze geslaagd of gefaald zijn');
                return;
            }
            submitMiserieScore();
        };
    }
}

function showRegularScoring(round) {
    const miserieScoring = document.getElementById('miserieScoring');
    const regularScoring = document.getElementById('regularScoring');
    
    miserieScoring.style.display = 'none';
    regularScoring.style.display = 'block';
    
    // Reset slagen input
    const slagenInput = document.getElementById('slagenInput');
    slagenInput.value = '';
    
    // Make sure the submit button is enabled and visible
    const submitButton = document.querySelector('#regularScoring button');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.style.display = 'block';
    }
}

function submitRegularScore() {
    const slagen = parseInt(document.getElementById('slagenInput').value);
    if (isNaN(slagen) || slagen < 0 || slagen > 13) {
        showError('Voer een geldig aantal slagen in (0-13)');
        return;
    }

    const round = game.currentRound;
    const config = game.getGameConfig(round.gameType);
    
    try {
        // Calculate scores based on game type and number of slagen
        const scores = scoringSystem.calculateRegularScore(
            config.scoringKey,
            slagen,
            game.players.length  // Total number of players for score distribution
        );
        
        // Get indices of active players
        const activePlayerIndices = game.selectedPlayers;
        
        // Calculate and store round scores for each player
        const roundScores = new Array(game.players.length).fill(0);
        
        // Assign scores based on whether each player was active or not
        game.players.forEach((player, index) => {
            if (activePlayerIndices.includes(index)) {
                roundScores[index] = scores.activePlayer;
            } else {
                roundScores[index] = scores.otherPlayers;
            }
        });
        
        // Add round scores to total scores
        game.players.forEach((player, index) => {
            player.score += roundScores[index];
        });
            
        showRoundResults(roundScores);
    } catch (error) {
        showError(error.message);
    }
}

function submitMiserieScore() {
    const round = game.currentRound;
    const config = game.getGameConfig(round.gameType);
    
    try {
        // Get success/fail status for each participating player
        const playerStatus = new Map();
        round.players.forEach(player => {
            const succeeded = document.querySelector(`#miseriePlayerResults input[value="success"][id="success_${player.name}"]:checked`) !== null;
            playerStatus.set(player.name, succeeded);
        });
        
        // Count successful players
        const successfulPlayers = Array.from(playerStatus.values()).filter(status => status).length;
        
        // Get scores for this miserie situation
        const scores = scoringSystem.calculateMiserieScore(
            config.scoringKey,
            round.players.length,  // Number of players attempting miserie
            successfulPlayers      // Number of players who succeeded
        );
        
        // Initialize roundScores array for all players
        const roundScores = new Array(game.players.length).fill(0);
        
        // Special handling for different number of players
        if (round.players.length === 1) {
            // Single player case - straightforward assignment
            const player = round.players[0];
            const playerIndex = game.players.findIndex(p => p.name === player.name);
            roundScores[playerIndex] = playerStatus.get(player.name) ? scores[0] : scores[0];
            
            // Assign remaining scores to non-participating players
            let scoreIndex = 1;
            game.players.forEach((p, index) => {
                if (index !== playerIndex) {
                    roundScores[index] = scores[scoreIndex++];
                }
            });
        } else if (round.players.length === 2) {
            // Two player case
            if (successfulPlayers === 0 || successfulPlayers === 2) {
                // Both failed or both succeeded - order doesn't matter
                round.players.forEach((player, idx) => {
                    const playerIndex = game.players.findIndex(p => p.name === player.name);
                    roundScores[playerIndex] = scores[idx];
                });
            } else {
                // One succeeded, one failed
                // Find the successful player first
                const successfulPlayer = round.players.find(player => playerStatus.get(player.name));
                const failedPlayer = round.players.find(player => !playerStatus.get(player.name));
                
                // Assign scores in correct order (successful player gets positive score)
                const successfulIndex = game.players.findIndex(p => p.name === successfulPlayer.name);
                const failedIndex = game.players.findIndex(p => p.name === failedPlayer.name);
                roundScores[successfulIndex] = scores[0]; // Positive score
                roundScores[failedIndex] = scores[1];     // Negative score
            }
            
            // Assign remaining scores to non-participating players
            let scoreIndex = 2;
            game.players.forEach((player, index) => {
                if (!round.players.some(p => game.players.findIndex(gp => gp.name === p.name) === index)) {
                    roundScores[index] = scores[scoreIndex++];
                }
            });
        } else if (round.players.length === 3) {
            // Three player case - needs special handling for each success combination
            const sortedPlayers = [...round.players].sort((a, b) => {
                const aSucceeded = playerStatus.get(a.name);
                const bSucceeded = playerStatus.get(b.name);
                return bSucceeded - aSucceeded; // Successful players first
            });
            
            // Assign scores based on success count
            sortedPlayers.forEach((player, idx) => {
                const playerIndex = game.players.findIndex(p => p.name === player.name);
                roundScores[playerIndex] = scores[idx];
            });
            
            // Assign the last score to the non-participating player
            const nonParticipatingIndex = game.players.findIndex(p => 
                !round.players.some(rp => rp.name === p.name)
            );
            if (nonParticipatingIndex !== -1) {
                roundScores[nonParticipatingIndex] = scores[3];
            }
        }
        
        // Update total scores
        game.players.forEach((player, index) => {
            player.score += roundScores[index];
        });
            
        showRoundResults(roundScores);
    } catch (error) {
        showError(error.message);
    }
}

function showGameSelection() {
    document.getElementById('gameOptionsSelection').style.display = 'block';
    document.getElementById('gameTypeSelection').style.display = 'none';
    document.getElementById('scoringUI').style.display = 'none';
    
    // Show the end game button if at least one round has been played
    const endGameButtonContainer = document.getElementById('endGameButtonContainer');
    if (game.roundNumber > 1) {
        endGameButtonContainer.style.display = 'block';
    } else {
        endGameButtonContainer.style.display = 'none';
    }
}

function showRoundResults(roundScores) {
    // Hide scoring UI and show round results
    document.getElementById('scoringUI').style.display = 'none';
    document.getElementById('roundResults').style.display = 'block';
    document.getElementById('gameTypeSelection').style.display = 'none'; // Hide game type selection
    
    // Update round counter
    document.getElementById('roundCounter').textContent = `Ronde ${game.roundNumber}`;
    
    // Generate round results HTML
    const resultsDiv = document.getElementById('scoreResults');
    let html = `
        <div class="round-scores">
    `;
    
    // Map the scores to players
    game.players.forEach((player, index) => {
        const score = roundScores[index];
        const scoreClass = score >= 0 ? 'positive' : 'negative';
        html += `
            <div class="score-result ${scoreClass}">
                ${player.name}: ${score} punten
            </div>
        `;
    });
    
    // Add buttons vertically like in scoring UI
    html += `
        </div>
        <button class="btn primary" onclick="nextRound()">Volgende Ronde</button>
        <button class="btn secondary" onclick="endGame()">Spel Beëindigen</button>
    `;
    
    resultsDiv.innerHTML = html;
    
    // Hide the end game section since we have the button in the round results
    const endGameSection = document.getElementById('endGameSection');
    endGameSection.style.display = 'none';

    // Update the score display immediately
    updateScoreDisplay();
}

function endGame() {
    // Hide all game elements
    document.getElementById('roundResults').style.display = 'none';
    document.getElementById('gameTypeSelection').style.display = 'none';
    document.getElementById('gameOptionsSelection').style.display = 'none';
    document.getElementById('scoringUI').style.display = 'none';
    document.getElementById('roundCounter').style.display = 'none';
    document.getElementById('activeGameInfo').style.display = 'none';
    document.getElementById('scores').style.display = 'none';
    document.getElementById('endGameButtonContainer').style.display = 'none';
    document.querySelector('.rules-section').style.display = 'none';
    
    // Show final results
    const resultsDiv = document.getElementById('scoreResults');
    
    // Remove the Ronde Resultaat title
    document.querySelector('#roundResults h3').style.display = 'none';
    
    // Sort players by score in descending order
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    
    // Group players by their scores
    const scoreGroups = [];
    let currentGroup = [];
    let currentScore = sortedPlayers[0].score;
    
    sortedPlayers.forEach(player => {
        if (player.score === currentScore) {
            currentGroup.push(player);
        } else {
            if (currentGroup.length > 0) {
                scoreGroups.push([...currentGroup]);
            }
            currentGroup = [player];
            currentScore = player.score;
        }
    });
    if (currentGroup.length > 0) {
        scoreGroups.push([...currentGroup]);
    }
    
    // Generate HTML with proper medals and positions
    let html = `
        <div class="game-end-container">
            <h3>🏆 EINDSTAND 🏆</h3>
            <div class="final-scores">
    `;
    
    // Track the actual position (1 for first group, 2 for second group, etc.)
    let position = 1;
    
    scoreGroups.forEach((group, groupIndex) => {
        // Determine medal based on position
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
        
        // Add each player in the group with the same position and medal
        group.forEach(player => {
            html += `
                <div class="score-result position-${position}">
                    ${medal} ${player.name}: ${player.score} punten
                </div>
            `;
        });
        
        // Increment position by 1 (not by group size)
        position++;
    });
    
    // Add winner announcement
    const winners = scoreGroups[0];
    html += `
            </div>
            <div class="winner-announcement">
                ${winners.length > 1 
                    ? `🎉 Gelijkspel tussen ${winners.map(w => w.name).join(' en ')}! 🎉`
                    : `🎉 ${winners[0].name} wint het spel! 🎉`}
            </div>
            <button class="btn primary" onclick="location.reload()">Nieuw Spel</button>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    document.getElementById('roundResults').style.display = 'block';
}

function nextRound() {
    // Reset game selection UI
    game.selectedPlayers = [];
    game.currentGame = null;
    
    // Hide results and active game info
    document.getElementById('roundResults').style.display = 'none';
    document.getElementById('activeGameInfo').style.display = 'none';
    
    // Show the correct game selection section
    document.getElementById('gameTypeSelection').style.display = 'none';
    document.getElementById('gameOptionsSelection').style.display = 'block';
    
    // Update round counter display
    const roundCounter = document.getElementById('roundCounter');
    roundCounter.textContent = `Ronde ${game.roundNumber + 1}`;
    roundCounter.style.display = 'block';
    
    // Show end game button since we're starting a new round after the first one
    const endGameButtonContainer = document.getElementById('endGameButtonContainer');
    endGameButtonContainer.style.display = 'block';
    
    // Clear any previous game selections
    const selectedGame = document.querySelector('.game-option.selected');
    if (selectedGame) {
        selectedGame.classList.remove('selected');
    }
    
    // Clear player choices
    const playerChoices = document.querySelector('.player-choices-container');
    if (playerChoices) {
        playerChoices.classList.remove('visible');
        // Uncheck all player checkboxes
        const checkboxes = document.querySelectorAll('#playerChoices input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // Hide error message if any
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    
    // Update score display
    updateScoreDisplay();
}

function cancelScoring() {
    // Hide scoring UI, active game info, round counter
    document.getElementById('scoringUI').style.display = 'none';
    document.getElementById('activeGameInfo').style.display = 'none';
    document.getElementById('roundCounter').style.display = 'none';
    
    // Show the correct game selection section
    document.getElementById('gameTypeSelection').style.display = 'none';
    document.getElementById('gameOptionsSelection').style.display = 'block';
    
    // Show/hide end game button based on round number
    const endGameButtonContainer = document.getElementById('endGameButtonContainer');
    endGameButtonContainer.style.display = game.roundNumber > 1 ? 'block' : 'none';
    
    // Reset game selection
    game.selectedPlayers = [];
    game.currentGame = null;
    
    // Clear any previous game selections
    const selectedGame = document.querySelector('.game-option.selected');
    if (selectedGame) {
        selectedGame.classList.remove('selected');
    }
    
    // Clear player choices
    const playerChoices = document.querySelector('.player-choices-container');
    if (playerChoices) {
        playerChoices.classList.remove('visible');
        // Uncheck all player checkboxes
        const checkboxes = document.querySelectorAll('#playerChoices input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Hide error after 3 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }, 3000);
}

function resetGame() {
    game.resetGame();
    updateScoreDisplay();
}

function toggleRules() {
    const header = document.querySelector('.rules-header');
    const content = document.querySelector('.rules-content');
    header.classList.toggle('open');
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
}

function showFinalResults() {
    const finalResults = document.getElementById('finalResults');
    const finalScores = document.getElementById('finalScores');
    const finalMessage = document.getElementById('finalMessage');
    
    // Sort players by score in descending order
    const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
    
    // Group players by score to handle ties
    const scoreGroups = [];
    let currentScore = sortedPlayers[0].totalScore;
    let currentGroup = [];
    
    sortedPlayers.forEach(player => {
        if (player.totalScore === currentScore) {
            currentGroup.push(player);
        } else {
            scoreGroups.push(currentGroup);
            currentScore = player.totalScore;
            currentGroup = [player];
        }
    });
    scoreGroups.push(currentGroup);
    
    // Generate HTML for final scores with proper place and medal
    let place = 1;
    let html = '';
    
    scoreGroups.forEach(group => {
        const medal = getMedal(place);
        group.forEach(player => {
            html += `
                <div class="player-score">
                    <h3>${player.name}</h3>
                    <p>${medal} ${place}</p>
                    <p>${player.totalScore} punten</p>
                </div>
            `;
        });
        place += group.length;
    });
    
    finalScores.innerHTML = html;
    
    // Show final message
    if (scoreGroups.length === 1) {
        finalMessage.textContent = "Gelijkspel!";
    } else {
        const firstGroup = scoreGroups[0];
        if (firstGroup.length === 1) {
            finalMessage.textContent = `${firstGroup[0].name} heeft gewonnen!`;
        } else {
            const names = firstGroup.map(p => p.name).join(' en ');
            finalMessage.textContent = `${names} hebben gewonnen!`;
        }
    }
    
    finalResults.style.display = 'block';
} 