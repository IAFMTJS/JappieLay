export class Utils {
    static state = {
        initialized: false
    };

    static initialize() {
        this.state.initialized = true;
        console.log('Utils module initialized');
    }

    static sanitizeHTML(html) {
        return html
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    static validateInput(input, type) {
        switch (type) {
            case 'text':
                return typeof input === 'string' && input.length > 0;
            case 'number':
                return !isNaN(input) && input !== '';
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(input);
            case 'url':
                const urlRegex = /^(https?:\/\/)?[\w.-]+(?:\/[\w.-]*)*\/?$\/$/;
                return urlRegex.test(input);
            default:
                return true;
        }
    }
}

export class LazyLoader {
    constructor() {
        this.state = {
            observer: null,
            threshold: 0.1,
            loadingImages: new Set()
        };
    }

    initialize() {
        this.setupObserver();
        this.loadInitialImages();
    }

    setupObserver() {
        this.state.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const img = entry.target;
                if (entry.isIntersecting && !img.dataset.loaded) {
                    this.loadImage(img);
                }
            });
        }, {
            rootMargin: '200px',
            threshold: this.state.threshold
        });
    }

    loadImage(element) {
        try {
            if (this.state.loadingImages.has(element)) {
                return;
            }

            const src = element.getAttribute('data-src');
            if (src) {
                this.state.loadingImages.add(element);
                
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    element.setAttribute('src', src);
                    element.setAttribute('data-loaded', 'true');
                    element.classList.add('loaded');
                    element.classList.remove('lazy-load');
                    element.style.opacity = '1';
                    this.state.loadingImages.delete(element);
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    element.style.opacity = '0.5';
                    element.setAttribute('alt', 'Failed to load image');
                    this.state.loadingImages.delete(element);
                };
            }
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }

    loadInitialImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            const isInViewport = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            
            if (isInViewport) {
                this.loadImage(img);
            }
        });
    }
}
