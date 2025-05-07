export class BaseModule {
    constructor(app) {
        this.app = app;
        this.state = {
            initialized: false
        };
    }

    initialize() {
        // First mark as initialized
        this.state.initialized = true;
        
        // Then set up UI
        this.setupUI();
        
        // Finally set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Implement module-specific event listeners
    }

    setupUI() {
        // Implement module-specific UI setup
    }

    loadContent() {
        // Implement content loading
    }

    handleError(error) {
        console.error('Error in module:', error);
        // Add error handling logic
    }
}
