export class UI {
    constructor(app) {
        this.app = app;
        this.state = {
            initialized: false,
            currentSection: null,
            loading: false,
            theme: 'light'
        };
    }

    initialize() {
        this.state.initialized = true;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.cacheElements();
            this.setupUI();
            this.setupNavigation();
            this.updateLayout();
            this.updateTheme();
            this.setupEventListeners();
        }, 100); // Small delay to ensure DOM is ready
    }

    get wordBank() {
        return this.app.modules.wordBank;
    }

    updateSections() {
        if (!this.app.modules.wordBank) return;

        // Update quiz section
        const quizContainer = document.querySelector('.quiz-container');
        if (quizContainer) {
            quizContainer.innerHTML = this.generateQuizControls();
        }

        // Update flashcards section
        const flashcardsContainer = document.querySelector('.flashcards-container');
        if (flashcardsContainer) {
            flashcardsContainer.innerHTML = this.generateFlashcardsControls();
        }

        // Update kanji section
        const kanjiContainer = document.querySelector('.kanji-container');
        if (kanjiContainer) {
            kanjiContainer.innerHTML = this.generateKanjiControls();
        }
    }

    generateQuizControls() {
        return `
            <h2>Quiz</h2>
            <div class="quiz-controls">
                <button class="start-quiz" data-type="multiple-choice">
                    <span class="icon">🎯</span>
                    Multiple Choice
                </button>
                <button class="start-quiz" data-type="fill-in">
                    <span class="icon">📝</span>
                    Fill in the Blanks
                </button>
                <button class="start-quiz" data-type="matching">
                    <span class="icon">🔄</span>
                    Matching
                </button>
            </div>
            <div class="quiz-settings">
                <div class="category-selector">
                    <label>Category:</label>
                    <select class="category-select">
                        <option value="all">All Categories</option>
                        <option value="numbers">Numbers</option>
                        <option value="animals">Animals</option>
                        <option value="food">Food</option>
                        <option value="colors">Colors</option>
                        <option value="phrases">Phrases</option>
                    </select>
                </div>
                <div class="difficulty-selector">
                    <label>Difficulty:</label>
                    <select class="difficulty-select">
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
                <div class="questions-selector">
                    <label>Questions:</label>
                    <select class="questions-select">
                        <option value="5">5 Questions</option>
                        <option value="10">10 Questions</option>
                        <option value="15">15 Questions</option>
                    </select>
                </div>
            </div>
        `;
    };

    generateFlashcardsControls() {
        return `
            <h2>Flashcards</h2>
            <div class="flashcards-controls">
                <button class="start-flashcards">
                    <span class="icon">🎴</span>
                    Start Practice
                </button>
            </div>
            <div class="flashcards-settings">
                <div class="category-selector">
                    <label>Category:</label>
                    <select class="category-select">
                        <option value="all">All Categories</option>
                        <option value="numbers">Numbers</option>
                        <option value="animals">Animals</option>
                        <option value="food">Food</option>
                        <option value="colors">Colors</option>
                        <option value="phrases">Phrases</option>
                    </select>
                </div>
                <div class="mode-selector">
                    <label>Mode:</label>
                    <select class="mode-select">
                        <option value="kanji">Kanji → Reading</option>
                        <option value="reading">Reading → Kanji</option>
                        <option value="meaning">Kanji → Meaning</option>
                    </select>
                </div>
            </div>
        `;
    };

    generateKanjiControls() {
        return `
            <h2>Kanji</h2>
            <div class="kanji-controls">
                <button class="start-kanji">
                    <span class="icon">漢</span>
                    Start Practice
                </button>
            </div>
            <div class="kanji-settings">
                <div class="level-selector">
                    <label>Level:</label>
                    <select class="level-select">
                        <option value="all">All Levels</option>
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                    </select>
                </div>
                <div class="mode-selector">
                    <label>Mode:</label>
                    <select class="mode-select">
                        <option value="writing">Writing Practice</option>
                        <option value="reading">Reading Practice</option>
                        <option value="meaning">Meaning Practice</option>
                    </select>
                </div>
            </div>
        `;
    };

    cacheElements() {
        this.elements = {
            nav: document.querySelector('.nav'),
            tabs: document.querySelectorAll('.nav-tab'),
            sections: document.querySelectorAll('.section'),
            themeToggle: document.querySelector('#theme-toggle'),
            loadingOverlay: document.querySelector('#loadingOverlay'),
            notification: document.querySelector('#notification'),
            progressBar: document.querySelector('.progress-bar')
        };
    };

    setupEventListeners() {
        // Navigation buttons
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const section = tab.dataset.section;
                this.showSection(section);
            });
        });

        // Welcome page feature buttons
        document.querySelectorAll('.feature-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const section = button.dataset.section;
                this.showSection(section);
            });
        });

        // Quiz start buttons
        document.querySelectorAll('.start-quiz').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = button.dataset.type;
                this.app.modules.quiz.startQuiz(type);
            });
        });

        // Flashcards start button
        document.querySelector('.start-flashcards')?.addEventListener('click', () => {
            this.app.modules.flashcards.startPractice();
        });

        // Kanji start button
        document.querySelector('.start-kanji')?.addEventListener('click', () => {
            this.app.modules.kanji.startPractice();
        });

        // Theme toggle
        document.querySelector('.theme-checkbox')?.addEventListener('change', () => {
            this.toggleTheme();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            } else if (e.key === 'Escape') {
                this.closeActiveElements();
            } else if (e.key === 'F1') {
                this.showHelp();
            }
        });

        // Modal close buttons
        document.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.closest('.modal').id;
                this.closeModal(modalId);
            });
        });

        // Screen reader announcements
        document.addEventListener('focus', (e) => {
            this.announce(e.target, 'polite');
        }, true);
    }

    setupUI() {
        // Initialize UI components
        this.updateLayout();
        this.updateTheme();
    }

    setupNavigation() {
        // Initialize navigation
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const section = tab.dataset.section;
                this.showSection(section);
            });
        });
    }

    handleTabClick(tab) {
        const sectionId = tab.dataset.section;
        this.showSection(sectionId);
    }

    showSection(sectionId) {
        // Update active tab
        this.elements.tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.section === sectionId) {
                tab.classList.add('active');
            }
        });

        // Update active section
        this.elements.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });

        // Update current section state
        this.state.currentSection = sectionId;
    }

    updateLayout() {
        // Update layout based on screen size
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            this.elements.nav.style.display = 'none';
        } else {
            this.elements.nav.style.display = 'block';
        }
    }

    updateTheme() {
        const theme = this.state.theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        this.updateTheme();
    }

    showLoading(loading = true) {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = loading ? 'block' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        if (this.elements.notification) {
            this.elements.notification.textContent = message;
            this.elements.notification.className = `notification ${type}`;
            this.elements.notification.style.display = 'block';
            setTimeout(() => {
                this.elements.notification.style.display = 'none';
            }, 3000);
        }
    }

    announce(element, politeness = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', politeness);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.clip = 'rect(0 0 0 0)';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.style.whiteSpace = 'nowrap';
        announcement.style.border = '0';
        announcement.style.padding = '0';
        announcement.style.margin = '-1px';
        announcement.textContent = element.getAttribute('aria-label') || element.textContent;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 0);
    }

    handleTabNavigation(e) {
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = Array.from(document.querySelectorAll(focusableElements));
        const index = focusable.indexOf(document.activeElement);
        const nextIndex = e.shiftKey ? index - 1 : index + 1;
        if (nextIndex >= 0 && nextIndex < focusable.length) {
            focusable[nextIndex].focus();
        }
    }

    closeActiveElements() {
        // Close any open modals or dropdowns
        document.querySelectorAll('.modal').forEach(modal => {
            modal.setAttribute('aria-hidden', 'true');
        });
    }

    showHelp() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.setAttribute('aria-hidden', 'false');
            helpModal.style.display = 'block';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.style.display = 'none';
        }
    }

    updateLayout() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update responsive classes
        document.body.classList.toggle('mobile', width < 768);
        document.body.classList.toggle('tablet', width >= 768 && width < 1024);
        document.body.classList.toggle('desktop', width >= 1024);
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.state.theme = savedTheme;
        }
        document.documentElement.setAttribute('data-theme', this.state.theme);
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        localStorage.setItem('theme', this.state.theme);
        const root = document.documentElement;
        if (this.state.theme === 'dark') {
            root.classList.add('dark-mode');
        } else {
            root.classList.remove('dark-mode');
        }
    }

    showLoading() {
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        this.elements.notification.textContent = message;
        this.elements.notification.classList.add(`notification-${type}`);
        this.elements.notification.classList.add('active');

        setTimeout(() => {
            this.elements.notification.classList.remove('active');
        }, 3000);
    }

    updateProgress(progress) {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${progress}%`;
        }
    }
};

