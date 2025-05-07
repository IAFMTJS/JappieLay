import { JAPVOC } from '../app.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM is ready, initializing application');
    const japvoc = new JAPVOC();
    japvoc.initialize();
});
