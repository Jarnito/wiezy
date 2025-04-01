class Game {
    constructor() {
        this.players = [];
        this.currentGame = null;
        this.currentRound = {
            gameType: null,
            players: [],
            roundNumber: 0
        };
        this.selectedPlayers = [];
        this.roundNumber = 0;
    }

    startGame(playerNames) {
        // First check for empty names and trim
        const trimmedNames = playerNames.map(name => name.trim()).filter(name => name !== '');
        
        if (trimmedNames.length !== 4) {
            throw new Error('Vul alle spelersnamen in');
        }

        // Check for duplicate names
        const uniqueNames = new Set(trimmedNames);
        if (uniqueNames.size !== trimmedNames.length) {
            // Find which names are duplicates
            const nameCounts = trimmedNames.reduce((acc, name) => {
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {});
            
            const duplicateNames = Object.entries(nameCounts)
                .filter(([, count]) => count > 1)
                .map(([name]) => name);
            
            // Add visual feedback for duplicate names
            const inputs = document.querySelectorAll('.player-inputs input');
            const errorMessages = document.querySelectorAll('.input-error');
            
            // Reset all error states
            inputs.forEach(input => input.classList.remove('duplicate'));
            errorMessages.forEach(error => error.style.display = 'none');
            
            // Show errors for duplicate names
            inputs.forEach(input => {
                if (duplicateNames.includes(input.value.trim())) {
                    input.classList.add('duplicate');
                    input.nextElementSibling.style.display = 'block';
                }
            });
            
            return false; // Indicate that the game cannot start
        }

        // Remove duplicate styling if all names are unique
        const inputs = document.querySelectorAll('.player-inputs input');
        const errorMessages = document.querySelectorAll('.input-error');
        inputs.forEach(input => input.classList.remove('duplicate'));
        errorMessages.forEach(error => error.style.display = 'none');

        this.players = trimmedNames.map(name => ({
            name: name,
            score: 0
        }));
        this.roundNumber = 0;

        return true; // Indicate that the game can start
    }

    selectGame(gameType) {
        this.currentGame = gameType;
        return this.getGameConfig(gameType);
    }

    getGameConfig(gameType) {
        const configs = {
            'troel': {
                title: 'Selecteer Speler met 3 Azen',
                maxPlayers: 2,
                minPlayers: 2,
                description: 'De speler met de vierde aas wordt automatisch partner',
                scoringType: 'regular',
                scoringKey: 'Troel (3 azen)'
            },
            'troela': {
                title: 'Selecteer Speler met 4 Azen',
                maxPlayers: 2,
                minPlayers: 2,
                description: 'De speler met hartenkoning (of hartendame indien nodig) wordt automatisch partner',
                scoringType: 'regular',
                scoringKey: 'Troela (4 azen)'
            },
            'vragen': {
                title: 'Selecteer Vrager en Partner',
                maxPlayers: 2,
                minPlayers: 2,
                description: 'De vrager moet minstens 5 slagen halen, de partner minstens 3',
                scoringType: 'regular',
                scoringKey: 'Vragen en meegaan'
            },
            'vragen-alleen': {
                title: 'Selecteer Vrager',
                maxPlayers: 1,
                minPlayers: 1,
                description: 'De vrager moet minstens 5 slagen halen (6 bij kleurenwiezen)',
                scoringType: 'regular',
                scoringKey: 'Vragen en alleen gaan'
            },
            'abondance-9': {
                title: 'Wie speelt Abondance (9)?',
                maxPlayers: 1,
                minPlayers: 1,
                description: 'Speler moet minstens 9 slagen halen',
                scoringType: 'regular',
                scoringKey: 'Abondance 9'
            },
            'abondance-10': {
                title: 'Wie speelt Abondance (10)?',
                maxPlayers: 1,
                minPlayers: 1,
                description: 'Speler moet minstens 10 slagen halen',
                scoringType: 'regular',
                scoringKey: 'Abondance 10'
            },
            'abondance-11': {
                title: 'Wie speelt Abondance (11)?',
                maxPlayers: 1,
                minPlayers: 1,
                description: 'Speler moet minstens 11 slagen halen',
                scoringType: 'regular',
                scoringKey: 'Abondance 11'
            },
            'abondance-12': {
                title: 'Wie speelt Abondance (12)?',
                maxPlayers: 1,
                minPlayers: 1,
                description: 'Speler moet minstens 12 slagen halen',
                scoringType: 'regular',
                scoringKey: 'Abondance 12'
            },
            'miserie': {
                title: 'Wie speelt Miserie?',
                maxPlayers: 3,
                minPlayers: 1,
                description: 'Speler mag geen enkele slag halen',
                scoringType: 'miserie',
                scoringKey: 'Miserie'
            },
            'miserie-op-tafel': {
                title: 'Wie speelt Miserie op tafel?',
                maxPlayers: 3,
                minPlayers: 1,
                description: 'Speler legt kaarten open na eerste ronde',
                scoringType: 'miserie',
                scoringKey: 'Miserie op tafel'
            },
            'solo': {
                title: 'Wie speelt Solo?',
                maxPlayers: 1,
                minPlayers: 1,
                description: 'Speler moet alle slagen halen met zelfgekozen troef',
                scoringType: 'regular',
                scoringKey: 'Solo'
            },
            'solo-slim': {
                title: 'Wie speelt Solo slim?',
                maxPlayers: 1,
                minPlayers: 1,
                description: 'Speler moet alle slagen halen met gedraaide troef',
                scoringType: 'regular',
                scoringKey: 'Soloslim'
            }
        };

        return configs[gameType];
    }

    startRound() {
        if (!this.currentGame) {
            throw new Error('Er is iets misgegaan. Vernieuw de pagina en probeer opnieuw.');
        }

        const config = this.getGameConfig(this.currentGame);
        if (this.selectedPlayers.length < config.minPlayers) {
            throw new Error(`Selecteer minimaal ${config.minPlayers} ${config.minPlayers === 1 ? 'speler' : 'spelers'}`);
        }
        if (this.selectedPlayers.length > config.maxPlayers) {
            throw new Error(`Selecteer maximaal ${config.maxPlayers} ${config.maxPlayers === 1 ? 'speler' : 'spelers'}`);
        }

        this.roundNumber++;
        this.currentRound = {
            gameType: this.currentGame,
            players: this.selectedPlayers.map(index => ({
                ...this.players[index],
                roundScore: 0  // Initialize round score for each player
            })),
            roundNumber: this.roundNumber
        };

        return this.currentRound;
    }

    resetGame() {
        this.players = [];
        this.currentGame = null;
        this.currentRound = {
            gameType: null,
            players: [],
            roundNumber: 0
        };
        this.selectedPlayers = [];
        this.roundNumber = 0;
    }
} 