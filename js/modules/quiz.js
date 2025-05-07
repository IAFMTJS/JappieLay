import BaseModule from './base-module.js';

export class Quiz extends BaseModule {
    constructor(app) {
        super(app);
        this.state = {
            initialized: false,
            currentQuestion: null,
            questions: [],
            score: 0,
            totalQuestions: 0,
            timeLeft: 60,
            timer: null,
            category: 'numbers',
            difficulty: 'easy',
            isRunning: false,
            hasStarted: false,
            isPaused: false,
            currentQuestionIndex: 0,
            userAnswers: [],
            streak: 0,
            maxStreak: 0,
            errors: [],
            showErrors: false,
            isTyping: false,
            hintUsed: false
        };

        // Initialize difficulty levels
        this.difficultyLevels = {
            easy: { display: 'Easy', multiplier: 1 },
            medium: { display: 'Medium', multiplier: 1.5 },
            hard: { display: 'Hard', multiplier: 2 }
        };

        // Initialize categories
        this.categories = {
            numbers: { display: 'Numbers' },
            animals: { display: 'Animals' },
            food: { display: 'Food' },
            colors: { display: 'Colors' },
            phrases: { display: 'Phrases' }
        };
    }

    initialize() {
        super.initialize();
        this.setupUI();
        this.loadQuestions();
    }

    loadQuestions() {
        const wordBank = this.app.modules.wordBank;
        if (!wordBank) {
            console.error('Word bank not initialized');
            return;
        }

        this.state.questions = wordBank.data[this.state.category] || [];
        this.state.totalQuestions = this.state.questions.length;
        this.shuffleQuestions();
    }

    shuffleQuestions() {
        if (!this.state.questions) return;
        
        this.state.questions = this.state.questions
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }

    setupUI() {
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) {
            console.error('Quiz container not found');
            return;
        }

        quizContainer.innerHTML = this.generateQuizControls();
        this.setupEventListeners();
    }

    generateQuizControls() {
        return `
            <div class="quiz-controls">
                <div class="category-select">
                    <label for="category">Category:</label>
                    <select id="category" class="category-select">
                        ${Object.entries(this.categories).map(([key, value]) => 
                            `<option value="${key}" ${key === this.state.category ? 'selected' : ''}>${value.display}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="difficulty-select">
                    <label for="difficulty">Difficulty:</label>
                    <select id="difficulty" class="difficulty-select">
                        ${Object.entries(this.difficultyLevels).map(([key, value]) => 
                            `<option value="${key}" ${key === this.state.difficulty ? 'selected' : ''}>${value.display}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="question-count-select">
                    <label for="question-count">Questions:</label>
                    <select id="question-count" class="question-count-select">
                        <option value="5" ${this.state.questionCount === 5 ? 'selected' : ''}>5 Questions</option>
                        <option value="10" ${this.state.questionCount === 10 ? 'selected' : ''}>10 Questions</option>
                        <option value="15" ${this.state.questionCount === 15 ? 'selected' : ''}>15 Questions</option>
                    </select>
                </div>

                <button class="start-quiz" data-type="typing">
                    <span class="icon">📝</span>
                    Typing
                </button>
                <button class="start-quiz" data-type="multiple-choice">
                    <span class="icon">📊</span>
                    Multiple Choice
                </button>
                <button class="start-quiz" data-type="matching">
                    <span class="icon">🔄</span>
                    Matching
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const quizContainer = document.querySelector('.quiz-container');
        if (!quizContainer) return;

        // Category selection
        const categorySelect = document.querySelector('.category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.state.category = e.target.value;
                this.updateUI();
            });
        }

        // Difficulty selection
        const difficultySelect = document.querySelector('.difficulty-select');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.state.difficulty = e.target.value;
                this.updateUI();
            });
        }

        // Start quiz buttons
        document.querySelectorAll('.start-quiz').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.startQuiz(type);
            });
        });
    }

    startQuiz(type) {
        if (this.state.isRunning) {
            return;
        }

        this.state.hasStarted = true;
        this.state.isRunning = true;
        this.state.currentQuestionIndex = 0;
        this.state.score = 0;
        this.state.timeLeft = 60;
        this.state.userAnswers = [];
        this.state.type = type;

        // Start timer
        this.startTimer();

        // Show first question
        this.showQuestion(type);
    }

    showQuestion(type) {
        const question = this.state.questions[this.state.currentQuestionIndex];
        if (!question) {
            this.endQuiz();
            return;
        }

        this.state.currentQuestion = question;
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) {
            console.error('Quiz container not found');
            return;
        }

        if (type === 'multiple-choice') {
            quizContainer.innerHTML = this.generateMultipleChoiceQuestion();
        } else if (type === 'typing') {
            quizContainer.innerHTML = this.generateTypingQuestion();
        }

        this.setupAnswerEventListeners(type);
    }

    generateMultipleChoiceQuestion() {
        const question = this.state.currentQuestion;
        const options = this.generateMultipleChoiceOptions(question);

        return `
            <div class="question-container">
                <div class="question-header">
                    <h2>Question ${this.state.currentQuestionIndex + 1}/${this.state.totalQuestions}</h2>
                    <div class="timer">Time: ${this.state.timeLeft}s</div>
                </div>
                <div class="question-content">
                    <div class="question-prompt">
                        ${this.getQuestionPrompt()}
                    </div>
                    <div class="options-container">
                        ${options}
                    </div>
                </div>
            </div>
        `;
    }

    generateTypingQuestion() {
        const question = this.state.currentQuestion;

        return `
            <div class="question-container">
                <div class="question-header">
                    <h2>Question ${this.state.currentQuestionIndex + 1}/${this.state.totalQuestions}</h2>
                    <div class="timer">Time: ${this.state.timeLeft}s</div>
                </div>
                <div class="question-content">
                    <div class="question-prompt">
                        ${this.getQuestionPrompt()}
                    </div>
                    <input type="text" class="answer-input" placeholder="Type your answer here...">
                    <button class="submit-answer">Submit</button>
                    <div class="streak">Current Streak: ${this.state.streak}</div>
                </div>
            </div>
        `;
    }

    getQuestionPrompt() {
        const question = this.state.currentQuestion;
        const difficulty = this.difficultyLevels[this.state.difficulty];

        if (difficulty.multiplier === 1) {
            return `
                <div class="kanji">${question.word}</div>
                <div class="reading">${question.reading}</div>
            `;
        } else if (difficulty.multiplier === 1.5) {
            return `
                <div class="kanji">${question.word}</div>
            `;
        } else {
            return `
                <div class="meaning">${question.meaning}</div>
            `;
        }
    }

    generateMultipleChoiceOptions(question) {
        const options = [question];
        while (options.length < 4) {
            const randomWord = this.state.questions[Math.floor(Math.random() * this.state.questions.length)];
            if (!options.includes(randomWord)) {
                options.push(randomWord);
            }
        }

        return options
            .map(word => `
                <button class="answer-option" data-answer="${word.reading}">
                    ${word.reading}
                </button>
            `)
            .join('');
    }

    setupAnswerEventListeners(type) {
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;

        if (type === 'multiple-choice') {
            const options = quizContainer.querySelectorAll('.answer-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    this.checkAnswer(option.dataset.answer);
                });
            });
        } else if (type === 'typing') {
            const answerInput = quizContainer.querySelector('.answer-input');
            const submitButton = quizContainer.querySelector('.submit-answer');

            submitButton.addEventListener('click', () => {
                this.checkAnswer(answerInput.value);
            });

            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer(answerInput.value);
                }
            });
        }
    }

    checkAnswer(userAnswer) {
        const question = this.state.currentQuestion;
        const correctAnswer = question.reading.toLowerCase();
        const isCorrect = userAnswer.toLowerCase() === correctAnswer;

        // Update streak
        if (isCorrect) {
            this.state.streak++;
            this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);
        } else {
            this.state.streak = 0;
            this.state.errors.push({
                question: question,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer
            });
        }

        // Update score
        const difficultyMultiplier = this.difficultyLevels[this.state.difficulty].multiplier;
        this.state.score += isCorrect ? 1 * difficultyMultiplier : 0;

        // Move to next question
        this.state.currentQuestionIndex++;
        if (this.state.currentQuestionIndex < this.state.questions.length) {
            this.showQuestion(this.state.type);
        } else {
            this.endQuiz();
        }
    }

    startTimer() {
        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            this.updateTimerDisplay();

            if (this.state.timeLeft <= 0) {
                this.endQuiz();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerDisplay = document.querySelector('.timer');
        if (timerDisplay) {
            timerDisplay.textContent = `Time: ${this.state.timeLeft}s`;
        }
    }

    endQuiz() {
        clearInterval(this.state.timer);
        this.state.isRunning = false;
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;

        quizContainer.innerHTML = this.generateQuizResults();
                    this.setupUI();
                });
            }
        }

        quizContainer.innerHTML = this.generateQuizControls();
        this.setupEventListeners();
    }

    generateQuizControls() {
        return `
            <div class="quiz-controls">
                <div class="category-select">
                    <label for="category">Category:</label>
                    <select id="category" class="category-select">
                        ${Object.entries(this.categories).map(([key, value]) => 
                            `<option value="${key}" ${key === this.state.category ? 'selected' : ''}>${value.display}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="difficulty-select">
                    <label for="difficulty">Difficulty:</label>
                    <select id="difficulty" class="difficulty-select">
                        ${Object.entries(this.difficultyLevels).map(([key, value]) => 
                            `<option value="${key}" ${key === this.state.difficulty ? 'selected' : ''}>${value.display}</option>`
                        ).join('')}
                    </select>
                </div>

                <button class="start-quiz" data-type="multiple-choice">
                    <span class="icon">🎯</span>
                    Multiple Choice
                </button>
                <button class="start-quiz" data-type="typing">
                    <span class="icon">📝</span>
                    Typing Practice
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Category selection
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.state.category = e.target.value;
                this.loadQuestions();
            });
        }

        // Difficulty selection
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.state.difficulty = e.target.value;
            });
        }

        // Start quiz buttons
        document.querySelectorAll('.start-quiz').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.startQuiz(type);
            });
        });
    }

    startQuiz(type) {
        if (this.state.isRunning) {
            return;
        }

        this.state.hasStarted = true;
        this.state.isRunning = true;
        this.state.currentQuestionIndex = 0;
        this.state.score = 0;
        this.state.timeLeft = 60;
        this.state.userAnswers = [];
        this.state.type = type;

        // Start timer
        this.startTimer();

        // Show first question
        this.showQuestion(type);
    }

    showQuestion(type) {
        const question = this.state.questions[this.state.currentQuestionIndex];
        if (!question) {
            this.endQuiz();
            return;
        }

        this.state.currentQuestion = question;
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) {
            console.error('Quiz container not found');
            return;
        }

        if (type === 'multiple-choice') {
            quizContainer.innerHTML = this.generateMultipleChoiceQuestion();
        } else if (type === 'typing') {
            quizContainer.innerHTML = this.generateTypingQuestion();
        }

        this.setupAnswerEventListeners(type);
    }

    generateMultipleChoiceQuestion() {
        const question = this.state.currentQuestion;
        const options = this.generateMultipleChoiceOptions(question);

        return `
            <div class="question-container">
                <div class="question-header">
                    <h2>Question ${this.state.currentQuestionIndex + 1}/${this.state.totalQuestions}</h2>
                    <div class="timer">Time: ${this.state.timeLeft}s</div>
                </div>
                <div class="question-content">
                    <div class="question-prompt">
                        ${this.getQuestionPrompt()}
                    </div>
                    <div class="options-container">
                        ${options}
                    </div>
                </div>
            </div>
        `;
    }

    generateTypingQuestion() {
        const question = this.state.currentQuestion;

        return `
            <div class="question-container">
                <div class="question-header">
                    <h2>Question ${this.state.currentQuestionIndex + 1}/${this.state.totalQuestions}</h2>
                    <div class="timer">Time: ${this.state.timeLeft}s</div>
                </div>
                <div class="question-content">
                    <div class="question-prompt">
                        ${this.getQuestionPrompt()}
                    </div>
                    <div class="typing-input">
                        <input type="text" id="answer-input" placeholder="Type your answer...">
                        <button class="submit-answer">Submit</button>
                    </div>
                </div>
            </div>
        `;
    }

    getQuestionPrompt() {
        const question = this.state.currentQuestion;
        const difficulty = this.difficultyLevels[this.state.difficulty];

        if (difficulty.multiplier === 1) {
            return `
                <div class="kanji">${question.word}</div>
                <div class="reading">${question.reading}</div>
            `;
        } else if (difficulty.multiplier === 1.5) {
            return `
                <div class="kanji">${question.word}</div>
            `;
        } else {
            return `
                <div class="meaning">${question.meaning}</div>
            `;
        }
    }

    generateMultipleChoiceOptions(question) {
        const options = [question];
        while (options.length < 4) {
            const randomWord = this.state.questions[Math.floor(Math.random() * this.state.questions.length)];
            if (!options.includes(randomWord)) {
                options.push(randomWord);
            }
        }

        return options
            .map(word => `
                <button class="answer-option" data-answer="${word.reading}">
                    ${word.reading}
                </button>
            `)
            .join('');
    }

    setupAnswerEventListeners(type) {
        if (type === 'multiple-choice') {
            document.querySelectorAll('.answer-option').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.checkAnswer(e.target.dataset.answer);
                });
            });
        } else if (type === 'typing') {
            const input = document.getElementById('answer-input');
            const submitButton = document.querySelector('.submit-answer');

            if (input && submitButton) {
                submitButton.addEventListener('click', () => {
                    this.checkAnswer(input.value);
                });

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.checkAnswer(input.value);
                    }
                });
            }
        }
    }

    checkAnswer(userAnswer) {
        const correctAnswer = this.state.currentQuestion.reading.toLowerCase();
        const isCorrect = userAnswer.toLowerCase() === correctAnswer;

        if (isCorrect) {
            this.state.score++;
            this.state.streak++;
            this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);
        } else {
            this.state.streak = 0;
            this.state.errors.push({
                question: this.state.currentQuestion,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer
            });
        }

        this.state.userAnswers.push({
            question: this.state.currentQuestion,
            userAnswer: userAnswer,
            isCorrect: isCorrect
        });

        this.state.currentQuestionIndex++;

        if (this.state.currentQuestionIndex < this.state.totalQuestions) {
            this.showQuestion(this.state.type);
        } else {
            this.endQuiz();
        }
    }

    startTimer() {
        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                clearInterval(this.state.timer);
                this.endQuiz();
            }
        }, 1000);
    }

    endQuiz() {
        clearInterval(this.state.timer);
        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) {
            const percentage = (this.state.score / this.state.totalQuestions * 100).toFixed(1);
            const timeTaken = 60 - this.state.timeLeft;
            quizContainer.innerHTML = `
                <div class="quiz-results">
                    <h2>Quiz Complete!</h2>
                    <div class="results-stats">
                        <p>Score: ${this.state.score}/${this.state.totalQuestions} (${percentage}%)</p>
                        <p>Category: ${this.categories[this.state.category].display}</p>
                        <p>Difficulty: ${this.difficultyLevels[this.state.difficulty].display}</p>
                        <p>Time: ${timeTaken}s</p>
                        <p>Max Streak: ${this.state.maxStreak}</p>
                    </div>
                    <div class="review-section">
                        <h3>Review Incorrect Answers</h3>
                        <div class="errors-list">
                            ${this.state.errors.map(error => `
                                <div class="error-item">
                                    <div class="question">${error.question.word}</div>
                                    <div class="user-answer">Your Answer: ${error.userAnswer}</div>
                                    <div class="correct-answer">Correct: ${error.correctAnswer}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button class="retry-quiz">Retry Quiz</button>
                </div>
            `;

            const retryButton = quizContainer.querySelector('.retry-quiz');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    this.state.isRunning = false;
                    this.setupUI();
                });
            }
        }
    }
}

    startQuiz(type) {
        if (this.state.isRunning) {
            return;
        }

        this.state.hasStarted = true;
        this.state.isRunning = true;
        this.state.currentQuestionIndex = 0;
        this.state.score = 0;
        this.state.timeLeft = 60;
        this.state.userAnswers = [];
        this.state.type = type;

        // Start timer
        this.startTimer();

        // Show first question
        this.showQuestion(type);
    }

    showQuestion(type) {
        const question = this.state.questions[this.state.currentQuestionIndex];
        if (!question) {
            this.endQuiz();
            return;
        }

        this.state.currentQuestion = question;
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) {
            console.error('Quiz container not found');
            return;
        }

        if (type === 'multiple-choice') {
            quizContainer.innerHTML = this.generateMultipleChoiceQuestion();
        } else if (type === 'typing') {
            quizContainer.innerHTML = this.generateTypingQuestion();
        }

        this.setupAnswerEventListeners(type);
    }

    generateMultipleChoiceQuestion() {
        const question = this.state.currentQuestion;
        const options = this.generateMultipleChoiceOptions(question);

        return `
            <div class="question-container">
                <div class="question-header">
                    <h2>Question ${this.state.currentQuestionIndex + 1}/${this.state.totalQuestions}</h2>
                    <div class="timer">Time: ${this.state.timeLeft}s</div>
                </div>
                <div class="question-content">
                    <div class="question-prompt">
                        ${this.getQuestionPrompt()}
                    </div>
                    <div class="options-container">
                        ${options}
                    </div>
                </div>
            </div>
        `;
    }

    generateTypingQuestion() {
        const question = this.state.currentQuestion;

        return `
            <div class="question-container">
                <div class="question-header">
                    <h2>Question ${this.state.currentQuestionIndex + 1}/${this.state.totalQuestions}</h2>
                    <div class="timer">Time: ${this.state.timeLeft}s</div>
                </div>
                <div class="question-content">
                    <div class="question-prompt">
                        ${this.getQuestionPrompt()}
                    </div>
                    <div class="typing-input">
                        <input type="text" id="answer-input" placeholder="Type your answer...">
                        <button class="submit-answer">Submit</button>
                    </div>
                </div>
            </div>
        `;
    }

    getQuestionPrompt() {
        const question = this.state.currentQuestion;
        const difficulty = this.difficultyLevels[this.state.difficulty];

        if (difficulty.multiplier === 1) {
            return `
                <div class="kanji">${question.word}</div>
                <div class="reading">${question.reading}</div>
            `;
        } else if (difficulty.multiplier === 1.5) {
            return `
                <div class="kanji">${question.word}</div>
            `;
        } else {
            return `
                <div class="meaning">${question.meaning}</div>
            `;
        }
    }

    generateMultipleChoiceOptions(question) {
        const options = [question];
        while (options.length < 4) {
            const randomWord = this.state.questions[Math.floor(Math.random() * this.state.questions.length)];
            if (!options.includes(randomWord)) {
                options.push(randomWord);
            }
        }

        return options
            .map(word => `
                <button class="answer-option" data-answer="${word.reading}">
                    ${word.reading}
                </button>
            `)
            .join('');
    }

    setupAnswerEventListeners(type) {
        if (type === 'multiple-choice') {
            document.querySelectorAll('.answer-option').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.checkAnswer(e.target.dataset.answer);
                });
            });
        } else if (type === 'typing') {
            const input = document.getElementById('answer-input');
            const submitButton = document.querySelector('.submit-answer');

            if (input && submitButton) {
                submitButton.addEventListener('click', () => {
                    this.checkAnswer(input.value);
                });

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.checkAnswer(input.value);
            </div>
            <div id="quiz-timer">Time left: 0s</div>
        </div>
        <div id="question-container"></div>
        <div id="answer-container"></div>
        <div id="feedback-container"></div>
        <div id="score-container">
            <p>Score: <span id="current-score">0</span>/<span id="total-score">0</span></p>
            <p>Streak: <span id="current-streak">0</span>/<span id="max-streak">0</span></p>
        </div>
        <button id="hint-btn" class="hint-btn">Hint</button>
        <button id="show-errors" class="show-errors-btn">Show Errors</button>
    </div>
`;

// Set up event listeners for the quiz settings
this.setupEventListeners();

// Initialize UI with default values
this.updateUI();
}

showQuestion() {
const questionContainer = document.getElementById('question-container');
const answerContainer = document.getElementById('answer-container');
const feedbackContainer = document.getElementById('feedback-container');

if (!questionContainer || !answerContainer || !feedbackContainer) return;
    shuffleQuestions(questions, count) {
        let shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    startQuiz(quizType = 'multiple-choice') {
        this.state.score = 0;
        this.state.currentQuestion = 0;
        this.state.timeLeft = 60; // 1 minute
        this.state.streak = 0;
        this.state.errors = [];
        this.state.hintUsed = false;
        this.state.quizType = quizType;
        
        // Set up UI based on quiz type
        const quizContainer = document.querySelector('.quiz-container');
        if (!quizContainer) return;

        quizContainer.innerHTML = `
            <div class="quiz-settings">
                <div class="category-selector">
                    <h3>Select Category</h3>
                    ${this.categories.map(cat => `
                        <button class="category-btn ${cat === 'all' ? 'active' : ''}" data-category="${cat}">${cat}</button>
                    `).join('')}
                </div>
                <div class="difficulty-selector">
                    <h3>Select Difficulty</h3>
                    ${Object.entries(this.difficultyLevels).map(([level, data]) => `
                        <button class="difficulty-btn ${level === 'normal' ? 'active' : ''}" data-difficulty="${level}">
                            ${data.display} - ${data.description}
                        </button>
                    `).join('')}
                </div>
                <div class="question-count-selector">
                    <h3>Number of Questions</h3>
                    <button class="question-count-btn active" data-count="5">5 Questions</button>
                    <button class="question-count-btn" data-count="10">10 Questions</button>
                    <button class="question-count-btn" data-count="15">15 Questions</button>
                </div>
                <button id="start-quiz-btn" class="start-btn">Start Quiz</button>
            </div>
            <div class="quiz-content">
                <div class="quiz-header">
                    <h2>Quiz</h2>
                    <div class="progress">
                        <div id="progress-bar"></div>
                        <span id="progress-text">0/0</span>
                    </div>
                    <div id="quiz-timer">Time left: 0s</div>
                </div>
                <div id="question-container"></div>
                <div id="answer-container"></div>
                <div id="feedback-container"></div>
                <div id="score-container">
                    <p>Score: <span id="current-score">0</span>/<span id="total-score">0</span></p>
                    <p>Streak: <span id="current-streak">0</span>/<span id="max-streak">0</span></p>
                </div>
                <button id="hint-btn" class="hint-btn">Hint</button>
                <button id="show-errors" class="show-errors-btn">Show Errors</button>
            </div>
        `;

        // Set up event listeners for the quiz settings
        this.setupEventListeners();

        // Initialize UI with default values
        this.updateUI();
    }

    showQuestion() {
        const questionContainer = document.getElementById('question-container');
        const answerContainer = document.getElementById('answer-container');
        const feedbackContainer = document.getElementById('feedback-container');
        
        if (!questionContainer || !answerContainer || !feedbackContainer) return;

        const currentQuestion = this.state.questions[this.state.currentQuestion];
        if (!currentQuestion) return;

        // Clear previous feedback
        feedbackContainer.innerHTML = '';

        // Show question based on difficulty
        let questionDisplay = '';
        switch (this.state.difficulty) {
            case 'easy':
                questionDisplay = `
                    <div class="question-display">
                        <p>Hiragana: ${currentQuestion.question.hiragana}</p>
                        <p>Katakana: ${currentQuestion.question.katakana}</p>
                        <p>Romaji: ${currentQuestion.question.romaji}</p>
                    </div>
                `;
                break;
            case 'normal':
                questionDisplay = `
                    <div class="question-display">
                        <p>Hiragana: ${currentQuestion.question.hiragana}</p>
                    </div>
                `;
                break;
            case 'hard':
                questionDisplay = `
                    <div class="question-display">
                        <p>Enter your answer:</p>
                        <input type="text" id="typing-answer" class="typing-answer">
                    </div>
                `;
                this.state.isTyping = true;
                break;
        }

        questionContainer.innerHTML = `
            <h3>Question ${this.state.currentQuestion + 1}</h3>
            ${questionDisplay}
        `;

        if (!this.state.isTyping) {
            // Show multiple choice options
            answerContainer.innerHTML = currentQuestion.options.map((option, index) => `
                <button class="answer-btn" data-answer="${index}">${option}</button>
            `).join('');
        }

        this.updateProgressBar();
    }

    checkAnswer(answer) {
        const currentQuestion = this.state.questions[this.state.currentQuestion];
        if (!currentQuestion) return;

        let isCorrect = false;
        let userAnswer = '';

        if (this.state.isTyping) {
            userAnswer = document.getElementById('typing-answer').value.trim().toLowerCase();
            isCorrect = this.checkTypingAnswer(userAnswer, currentQuestion);
        } else {
            userAnswer = currentQuestion.options[parseInt(answer)];
            isCorrect = userAnswer === currentQuestion.answer;
        }

        // Update feedback
        const feedbackContainer = document.getElementById('feedback-container');
        if (feedbackContainer) {
            const feedback = document.createElement('div');
            feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
            feedback.innerHTML = `
                <p>${isCorrect ? 'Correct!' : 'Incorrect'}</p>
                <p>Answer: ${currentQuestion.answer}</p>
            `;
            feedbackContainer.appendChild(feedback);
        }

        if (isCorrect) {
            this.state.score++;
            this.state.streak++;
            if (this.state.streak > this.state.maxStreak) {
                this.state.maxStreak = this.state.streak;
            }
            this.showMotivation('positive');
        } else {
            this.state.streak = 0;
            this.state.errors.push({
                question: currentQuestion,
                userAnswer: userAnswer
            });
            this.showMotivation('negative');
        }

        this.updateUI();
        this.nextQuestion();
    }

    checkTypingAnswer(userAnswer, question) {
        // Check if answer matches kana or romaji (case-insensitive)
        const kana = question.question.hiragana.toLowerCase();
        const romaji = question.question.romaji.toLowerCase();
        return userAnswer === kana || userAnswer === romaji;
    }

    showMotivation(type) {
        const messages = {
            positive: [
                'Great job!',
                'You got it!',
                'Perfect!',
                'Keep it up!'
            ],
            negative: [
                'Try again!',
                'Almost there!',
                'Keep practicing!',
                'You can do it!'
            ]
        };
        const message = messages[type][Math.floor(Math.random() * messages[type].length)];
        Utils.showNotification(message);
    }

    nextQuestion() {
        this.state.currentQuestion++;
        if (this.state.currentQuestion < this.state.questions.length) {
            this.showQuestion();
        } else {
            this.endQuiz();
        }
    }

    showHint() {
        if (!this.state.hintUsed) {
            const currentQuestion = this.state.questions[this.state.currentQuestion];
            if (currentQuestion) {
                const hint = this.getHint(currentQuestion);
                Utils.showNotification(hint);
                this.state.hintUsed = true;
            }
        }
    }

    getHint(question) {
        // Generate a hint based on the question type
        if (this.state.difficulty === 'hard') {
            return `First letter: ${question.answer[0]}`;
        }
        return `Category: ${question.category}`;
    }

    showErrors() {
        const errors = this.state.errors;
        if (errors.length === 0) return;

        const errorModal = document.createElement('div');
        errorModal.className = 'error-modal';
        errorModal.innerHTML = `
            <h3>Review Your Errors</h3>
            <div class="errors-list">
                ${errors.map(error => `
                    <div class="error-item">
                        <p>Question: ${error.question.word}</p>
                        <p>Your Answer: ${error.userAnswer}</p>
                        <p>Correct Answer: ${error.correctAnswer}</p>
                    </div>
                `).join('')}
            </div>
            <button class="close-btn">Close</button>
        `;

        document.body.appendChild(errorModal);
        errorModal.querySelector('.close-btn').addEventListener('click', () => {
            errorModal.remove();
            this.state.showErrors = false;
        });
    updateProgressBar() {
        const progress = this.state.currentQuestion / this.state.totalQuestions * 100;
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${this.state.currentQuestion}/${this.state.totalQuestions}`;
        }
    }

    updateUI() {
        document.getElementById('current-score').textContent = this.state.score;
        document.getElementById('total-score').textContent = this.state.totalQuestions;
        document.getElementById('current-streak').textContent = this.state.streak;
        document.getElementById('max-streak').textContent = this.state.maxStreak;
    }

    startTimer() {
        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                clearInterval(this.state.timer);
                this.endQuiz();
            }
        }, 1000);
    }

    endQuiz() {
        clearInterval(this.state.timer);
        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) {
            const percentage = (this.state.score / this.state.totalQuestions * 100).toFixed(1);
            const timeTaken = 60 - this.state.timeLeft;
            quizContainer.innerHTML = `
                <h2>Quiz Complete!</h2>
                <div class="results">
                    <p>Score: ${this.state.score}/${this.state.totalQuestions} (${percentage}%)</p>
                    <p>Category: ${this.state.category}</p>
                    <p>Difficulty: ${this.difficultyLevels[this.state.difficulty].display}</p>
                    <p>Time taken: ${timeTaken}s</p>
                    <p>Max Streak: ${this.state.maxStreak}</p>
                </div>
                <button onclick="location.reload()">Play Again</button>
                <button id="show-errors" class="show-errors-btn">Review Errors</button>
            `;
        }
    }
}

export default Quiz;
