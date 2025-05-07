// Configuration file
const JAPVOC_CONFIG = {
    // Application settings
    version: '1.0.0',
    language: 'ja',
    theme: {
        primary: '#4a90e2',
        secondary: '#2ecc71',
        background: '#ffffff',
        text: '#333333'
    },

    // API endpoints
    endpoints: {
        base: 'https://api.japvoc.com',
        auth: '/auth',
        content: '/content',
        analytics: '/analytics'
    },

    // Feature flags
    features: {
        darkMode: true,
        notifications: true,
        offlineSupport: true,
        analytics: true
    },

    // Default settings
    defaults: {
        quiz: {
            timeLimit: 300, // 5 minutes
            maxAttempts: 3,
            showHints: true
        },
        kanji: {
            levels: ['beginner', 'intermediate', 'advanced'],
            practiceMode: true
        },
        srs: {
            intervals: [1, 3, 7, 14, 30], // days
            maxLevel: 5
        }
    }
};

export default JAPVOC_CONFIG;
