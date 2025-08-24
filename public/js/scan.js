// Scan page functionality
class ScanPage {
    constructor() {
        this.counterValueEl = document.getElementById('counterValue');
        this.resetBtn = document.getElementById('resetBtn');
        this.init();
    }
    
    init() {
        // Load and display current counter (no increment)
        this.loadAndDisplay();
        
        // Set up reset button click handler
        this.setupResetButton();
    }
    
    setupResetButton() {
        this.resetBtn.addEventListener('click', (e) => {
            // Redirect to reset page with browser popups
            window.location.href = '/reset';
        });
    }
    
    async loadAndDisplay() {
        try {
            this.counterValueEl.textContent = 'Loading...';
            
            // Just load the current counter (no increment)
            const response = await fetch('/api/counter');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.counterValueEl.textContent = data.count;
            
        } catch (error) {
            console.error('Error loading counter:', error);
            this.counterValueEl.textContent = 'Error';
        }
    }
}

// Initialize the scan page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScanPage();
});
