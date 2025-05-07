import UI from './modules/ui.js';
import Quiz from './modules/quiz.js';
import Flashcards from './modules/flashcards.js';
import Kanji from './modules/kanji.js';
import SRS from './modules/srs.js';
import Grammar from './modules/grammar.js';
import Listening from './modules/listening.js';
import { Utils, LazyLoader } from './modules/utils.js';
import Progress from './modules/progress.js';
import { wordBank } from './data/wordbank.js';

// Main application namespace
class JAPVOC {
    constructor() {
        this.config = {
            version: '1.0.0',
            features: {
                analytics: false,
                darkMode: true,
                notifications: true
            },
            theme: {
                primary: '#4a90e2',
                secondary: '#2ecc71',
                background: '#ffffff',
                text: '#333333'
            }
        };
        
        this.state = {
            initialized: false,
            currentSection: 'welcome-page',
            loading: false,
            user: null,
            isDarkMode: false,
            progress: {
                quiz: {},
                flashcards: {},
                kanji: {},
                srs: {},
                grammar: {},
                listening: {}
            }
        };

        // Initialize modules with app instance
        this.modules = {
            ui: new UI(this),
            quiz: new Quiz(this),
            flashcards: new Flashcards(this),
            kanji: new Kanji(this),
            srs: new SRS(this),
            grammar: new Grammar(this),
            listening: new Listening(this),
            progress: new Progress(this),
            lazyLoader: new LazyLoader(this)
        };
    }

    // Initialize app after DOM is loaded
    static init() {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            console.error('This application must be run in a browser environment');
            return;
        }

        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize app
            window.JAPVOC = new JAPVOC();
            window.JAPVOC.initialize();

            // Set up hash change listener
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.slice(1);
                if (hash) {
                    window.JAPVOC.showSection(hash);
                } else {
                    window.JAPVOC.showSection('welcome-page');
                }
            });

            // Handle initial hash
            if (window.location.hash) {
                window.JAPVOC.showSection(window.location.hash.slice(1));
            } else {
                window.JAPVOC.showSection('welcome-page');
            }
        });
    }

    initialize() {
        console.log('Initializing JAPVOC v' + this.config.version);
        
        // Initialize modules
        this.modules.ui.initialize();
        this.modules.quiz.initialize();
        this.modules.flashcards.initialize();
        this.modules.kanji.initialize();
        this.modules.srs.initialize();
        this.modules.grammar.initialize();
        this.modules.listening.initialize();
        this.modules.progress.initialize();
        this.modules.lazyLoader.initialize();

        // Set up event listeners
        this.setupEventListeners();

        // Load initial data
        this.loadInitialData();

        // Show initial section
        this.showSection(this.state.currentSection);

        // Update state
        this.state.initialized = true;
    }

    setupEventListeners() {
        // Navigation - use event delegation for better performance
        document.querySelector('.main-content').addEventListener('click', (e) => {
            const target = e.target;
            const section = target.closest('.section');
            
            // Handle navigation tabs
            if (target.matches('.nav-tab')) {
                e.preventDefault();
                const sectionId = target.dataset.section;
                this.showSection(sectionId);
                window.location.hash = `#${sectionId}`;
                return;
            }

            // Handle quick start buttons
            if (target.matches('.start-btn')) {
                e.preventDefault();
                const sectionId = target.dataset.section;
                this.showSection(sectionId);
                return;
            }

            // Handle section-specific buttons
            if (section && target.matches('.start-quiz, .start-flashcards, .start-kanji, .start-srs, .start-grammar, .start-listening')) {
                e.preventDefault();
                const sectionId = section.id;
                this.handleSectionButton(target, sectionId);
                return;
            }

            // Handle select changes
            if (section && target.matches('select')) {
                const sectionId = section.id;
                this.handleSelectChange(target, sectionId);
                return;
            }
        });

        // Initialize section-specific event listeners
        this.initializeSectionEventListeners();

        // Add global event listeners
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash) {
                this.showSection(hash);
            } else {
                this.showSection('welcome-page');
            }
        });

        // Handle initial hash if present
        if (window.location.hash) {
            const hash = window.location.hash.slice(1);
            if (hash) {
                this.showSection(hash);
            } else {
                this.showSection('welcome-page');
            }
        }
    }

    initializeSectionEventListeners() {
        // Set up event listeners for each section
        document.querySelectorAll('.section').forEach(section => {
            const sectionId = section.id;
            const module = this.modules[sectionId];
            if (module && module.setupEventListeners) {
                module.setupEventListeners();
            }
        });
    }

    showSection(section) {
        // Update state
        this.state.currentSection = section;

        // Get section container
        const sectionContainer = document.getElementById(section);
        if (!sectionContainer) {
            console.error(`Section container not found for section: ${section}`);
            return;
        }

        // Hide all sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show selected section
        sectionContainer.classList.add('active');

        // Get module for this section
        const module = this.modules[section];
        
        // Initialize and set up event listeners if module exists
        if (module) {
            module.initialize?.();
            module.setupEventListeners?.();
        }

        // Clean up and set up section-specific event listeners
        this.cleanupSection(section);
        this.setupSectionEventListeners(section);

        // Update URL hash
        window.location.hash = `#${section}`;

        // Update progress
        if (section === 'progress') {
            this.modules.progress.updateProgress();
        }
    }

    cleanupSection(section) {
        // Get section container
        const container = document.querySelector(`#${section} .${section}-container`);
        if (!container) return;

        // Remove event listeners
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            button.removeEventListener('click', this.handleButtonClick);
        });

        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.removeEventListener('change', this.handleSelectChange);
        });

        // Clear any timers
        if (this.state.timers && this.state.timers[section]) {
            clearTimeout(this.state.timers[section]);
            delete this.state.timers[section];
        }

        // Clear any intervals
        if (this.state.intervals && this.state.intervals[section]) {
            clearInterval(this.state.intervals[section]);
            delete this.state.intervals[section];
        }
    }

    setupSectionEventListeners(section) {
        // Get section container
        const container = document.querySelector(`#${section} .${section}-container`);
        if (!container) return;

        // Set up button click handlers
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handleButtonClick(e, section));
        });

        // Set up select change handlers
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => this.handleSelectChange(e, section));
        });
    }

    handleSectionButton(target, section) {
        const action = target.className;
        const module = this.modules[section];
        
        if (!module) return;

        switch(action) {
            case 'start-quiz':
                module.startQuiz(target.dataset.type);
                break;
            case 'start-flashcards':
                module.startPractice();
                break;
            case 'start-kanji':
                module.startPractice();
                break;
            case 'start-srs':
                module.startSession();
                break;
            case 'start-grammar':
                module.startLearning();
                break;
            case 'start-listening':
                module.startPractice();
                break;
        }
    }

    handleSelectChange(target, section) {
        const selectType = target.className;
        const value = target.value;

        const module = this.modules[section];
        if (!module) return;

        switch(selectType) {
            case 'category-select':
                module.setCategory(value);
                break;
            case 'difficulty-select':
                module.setDifficulty(value);
                break;
            case 'questions-select':
                module.setQuestionCount(value);
                break;
            case 'mode-select':
                module.setMode(value);
                break;
            case 'level-select':
                module.setLevel(value);
                break;
        }
    }
} // End of JAPVOC class

// Initialize the application
JAPVOC.init();
