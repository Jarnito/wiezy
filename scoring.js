class ScoringSystem {
    constructor() {
        // Embed regular scores directly
        this.regularScores = {
            'Vragen en alleen gaan': {
                1: -30, 2: -24, 3: -18, 4: -12, 5: 6, 6: 9, 7: 12, 8: 15, 9: 18, 10: 21, 11: 24, 12: 27, 13: 30
            },
            'Vragen en meegaan': {
                1: -18, 2: -16, 3: -14, 4: -12, 5: -10, 6: -8, 7: -6, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6, 13: 7
            },
            'Abondance 9': {
                1: -15, 2: -15, 3: -15, 4: -15, 5: -15, 6: -15, 7: -15, 8: -15, 9: 15, 10: 15, 11: 15, 12: 15, 13: 15
            },
            'Abondance 10': {
                1: -18, 2: -18, 3: -18, 4: -18, 5: -18, 6: -18, 7: -18, 8: -18, 9: -18, 10: 18, 11: 18, 12: 18, 13: 18
            },
            'Abondance 11': {
                1: -24, 2: -24, 3: -24, 4: -24, 5: -24, 6: -24, 7: -24, 8: -24, 9: -24, 10: -24, 11: 24, 12: 24, 13: 24
            },
            'Abondance 12': {
                1: -27, 2: -27, 3: -27, 4: -27, 5: -27, 6: -27, 7: -27, 8: -27, 9: -27, 10: -27, 11: -27, 12: 27, 13: 27
            },
            'Troel (3 azen)': {
                1: -18, 2: -16, 3: -14, 4: -12, 5: -10, 6: -8, 7: -6, 8: 4, 9: 6, 10: 8, 11: 10, 12: 12, 13: 14
            },
            'Troela (4 azen)': {
                1: -20, 2: -18, 3: -16, 4: -14, 5: -12, 6: -10, 7: -8, 8: -6, 9: 4, 10: 6, 11: 8, 12: 10, 13: 12
            },
            'Solo': {
                1: -75, 2: -75, 3: -75, 4: -75, 5: -75, 6: -75, 7: -75, 8: -75, 9: -75, 10: -75, 11: -75, 12: -75, 13: 75
            },
            'Soloslim': {
                1: -90, 2: -90, 3: -90, 4: -90, 5: -90, 6: -90, 7: -90, 8: -90, 9: -90, 10: -90, 11: -90, 12: -90, 13: 90
            }
        };

        // Embed miserie scores directly
        this.miserieScores = {
            'Miserie': {
                1: { 0: [-21, 7, 7, 7], 1: [21, -7, -7, -7] },
                2: { 0: [-14, -14, 14, 14], 1: [28, -28, 0, 0], 2: [14, 14, -14, -14] },
                3: { 0: [-7, -7, -7, 21], 1: [35, -21, -21, 7], 2: [21, 21, -35, -7], 3: [7, 7, 7, -21] }
            },
            'Miserie op tafel': {
                1: { 0: [-42, 14, 14, 14], 1: [42, -14, -14, -14] },
                2: { 0: [-28, -28, 28, 28], 1: [56, -56, 0, 0], 2: [28, 28, -28, -28] },
                3: { 0: [-14, -14, -14, 42], 1: [70, -42, -42, 14], 2: [42, 42, -70, -14], 3: [14, 14, 14, -42] }
            }
        };
    }

    calculateRegularScore(gameType, slagen, numPlayers) {
        if (!this.regularScores || !this.regularScores[gameType]) {
            throw new Error('Invalid game type');
        }

        const score = this.regularScores[gameType][slagen];
        if (score === undefined) {
            throw new Error('Invalid number of slagen');
        }

        // For games where multiple players share the score (Troel, Troela, Vragen en meegaan)
        const isSharedScoreGame = ['Troel (3 azen)', 'Troela (4 azen)', 'Vragen en meegaan'].includes(gameType);
        
        if (isSharedScoreGame) {
            // For shared score games, each active player gets the full score
            // Each non-active player gets the opposite of the score
            return {
                activePlayer: score,
                otherPlayers: -score // Each non-active player gets the opposite of the score
            };
        } else {
            // For single player games (Solo, Soloslim, Abondance, Vragen alleen)
            // Active player gets full score, others split the negative
            return {
                activePlayer: score,
                otherPlayers: -score / (numPlayers - 1)
            };
        }
    }

    calculateMiserieScore(gameType, numPlayersGoing, playersWon) {
        if (!this.miserieScores || !this.miserieScores[gameType]) {
            throw new Error('Invalid game type');
        }

        const scores = this.miserieScores[gameType][numPlayersGoing];
        if (!scores) {
            throw new Error('Invalid number of players');
        }

        const scoreSet = scores[playersWon];
        if (!scoreSet) {
            throw new Error('Invalid number of winning players');
        }

        return scoreSet;
    }
}

// Export the scoring system
const scoringSystem = new ScoringSystem(); 