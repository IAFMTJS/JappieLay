class Progress {
    constructor() {
        this.state = {
            initialized: false,
            userProgress: {
                words: {},
                quizzes: {},
                lastUpdated: new Date().toISOString()
            },
            currentView: 'overview',
            stats: {
                totalWordsLearned: 0,
                totalQuizzesCompleted: 0,
                totalCorrectAnswers: 0,
                totalWrongAnswers: 0
            }
        };
    }

    initialize() {
        this.state.initialized = true;
        
        // Return HTML content for the progress section
        return `
            <div class="progress-container">
                <h2>Progress</h2>
                <div class="progress-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Words</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Words Mastered</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Current Streak</span>
                        <span class="stat-value">0 days</span>
                    </div>
                </div>
                <div class="progress-charts">
                    <canvas id="progressChart"></canvas>
                </div>
                <div class="progress-details">
                    <div class="section-progress">
                        <h3>Section Progress</h3>
                        <div class="section-stats">
                            <div class="stat">
                                <span class="label">Quiz</span>
                                <span class="value">0%</span>
                            </div>
                            <div class="stat">
                                <span class="label">Flashcards</span>
                                <span class="value">0%</span>
                            </div>
                            <div class="stat">
                                <span class="label">Kanji</span>
                                <span class="value">0%</span>
                            </div>
                            <div class="stat">
                                <span class="label">SRS</span>
                                <span class="value">0%</span>
                            </div>
                            <div class="stat">
                                <span class="label">Grammar</span>
                                <span class="value">0%</span>
                            </div>
                            <div class="stat">
                                <span class="label">Listening</span>
                                <span class="value">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('japVocProgress');
        if (savedProgress) {
            this.state.userProgress = JSON.parse(savedProgress);
        } else {
            this.state.userProgress = {
                words: {},
                quizzes: {}
            };
        }
    }

    saveProgress() {
        localStorage.setItem('japVocProgress', JSON.stringify(this.state.userProgress));
    }

    setupEventListeners() {
        // Add event listeners for progress actions
    }

    resetProgress() {
        this.state.userProgress = {
            words: {},
            quizzes: {}
        };
        this.saveProgress();
    }

    updateWordProgress(wordId, correct) {
        if (!this.state.userProgress.words[wordId]) {
            this.state.userProgress.words[wordId] = {
                correct: 0,
                wrong: 0,
                lastAttempt: new Date().toISOString()
            };
        }
        
        if (correct) {
            this.state.userProgress.words[wordId].correct++;
        } else {
            this.state.userProgress.words[wordId].wrong++;
        }
        
        this.state.userProgress.words[wordId].lastAttempt = new Date().toISOString();
        this.saveProgress();
    }

    updateQuizProgress(quizId, score) {
        this.state.userProgress.quizzes[quizId] = {
            score: score,
            completedAt: new Date().toISOString()
        };
        this.saveProgress();
    }

    getStats() {
        return {
            totalWordsLearned: Object.keys(this.state.userProgress.words).length,
            totalQuizzesCompleted: Object.keys(this.state.userProgress.quizzes).length,
            totalCorrectAnswers: Object.values(this.state.userProgress.words)
                .reduce((sum, progress) => sum + progress.correct, 0),
            totalWrongAnswers: Object.values(this.state.userProgress.words)
                .reduce((sum, progress) => sum + progress.wrong, 0)
        };
    }

    updateStats() {
        const stats = this.getStats();
        this.state.stats = stats;
        return stats;
    }

    renderProgress() {
        const stats = this.getStats();
        const progressContainer = document.getElementById('progress-container');
        if (!progressContainer) return;

        progressContainer.innerHTML = `
            <div class="progress-overview">
                <div class="stat-item">
                    <h3>Words Learned</h3>
                    <p>${stats.totalWordsLearned}</p>
                </div>
                <div class="stat-item">
                    <h3>Quizzes Completed</h3>
                    <p>${stats.totalQuizzesCompleted}</p>
                </div>
                <div class="stat-item">
                    <h3>Correct Answers</h3>
                    <p>${stats.totalCorrectAnswers}</p>
                </div>
                <div class="stat-item">
                    <h3>Wrong Answers</h3>
                    <p>${stats.totalWrongAnswers}</p>
                </div>
            </div>
        `;
    }
}

export default Progress;
