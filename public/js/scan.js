// Scan page functionality
class ScanPage {
    constructor() {
        this.counterValueEl = document.getElementById('counterValue');
        this.warningPopup = document.getElementById('warningPopup');
        this.resetBtn = document.getElementById('resetBtn');
        this.init();
    }
    
    init() {
        // Increment counter on page load and display results
        this.incrementAndDisplay();
        
        // Set up reset button click handler
        this.setupResetButton();
    }
    
    setupResetButton() {
        this.resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.startWarningAnimation();
        });
    }
    
    startWarningAnimation() {
        // Show and hide the popup multiple times
        let showCount = 0;
        const maxShows = 3; // Show popup 3 times
        
        const showHidePopup = () => {
            if (showCount < maxShows) {
                // Show popup
                this.warningPopup.classList.add('show');
                
                // Hide popup after 1.5 seconds
                setTimeout(() => {
                    this.warningPopup.classList.remove('show');
                    showCount++;
                    
                    // Wait 0.5 seconds before showing again
                    setTimeout(() => {
                        showHidePopup();
                    }, 500);
                }, 1500);
            } else {
                // After all popups are done, navigate to reset page
                setTimeout(() => {
                    window.location.href = '/reset';
                }, 500);
            }
        };
        
        // Start the animation sequence
        showHidePopup();
    }
    
    async incrementAndDisplay() {
        try {
            this.counterValueEl.textContent = 'Loading...';
            
            // Increment the counter
            const incrementResponse = await fetch('/api/counter/increment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!incrementResponse.ok) {
                throw new Error(`HTTP error! status: ${incrementResponse.status}`);
            }
            
            const data = await incrementResponse.json();
            this.counterValueEl.textContent = data.count;
            
        } catch (error) {
            console.error('Error incrementing counter:', error);
            this.counterValueEl.textContent = 'Error';
        }
    }
}

// Initialize the scan page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScanPage();
});
