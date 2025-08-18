// Counter page functionality
class CounterApp {
    constructor() {
        this.counterValueEl = document.getElementById('counterValue');
        this.createdDateEl = document.getElementById('createdDate');
        this.lastAccessedEl = document.getElementById('lastAccessed');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        this.init();
    }
    
    init() {
        this.loadCounterData();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.refreshBtn.addEventListener('click', () => {
            this.loadCounterData();
        });
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            this.loadCounterData();
        }, 10000);
    }
    
    async loadCounterData() {
        try {
            this.counterValueEl.textContent = 'Loading...';
            const response = await fetch('/api/counter');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateDisplay(data);
        } catch (error) {
            console.error('Error loading counter data:', error);
            this.showError('Failed to load counter data');
        }
    }
    
    updateDisplay(data) {
        this.counterValueEl.textContent = data.count;
        this.createdDateEl.textContent = this.formatDate(data.created);
        this.lastAccessedEl.textContent = this.formatRelativeTime(data.lastAccessed);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }
    
    showError(message) {
        this.counterValueEl.textContent = 'Error';
        alert(message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CounterApp();
}); 