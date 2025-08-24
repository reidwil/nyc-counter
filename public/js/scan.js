// Scan page functionality
class ScanPage {
    constructor() {
        this.counterValueEl = document.getElementById('counterValue');
        this.totalHitsEl = document.getElementById('totalHits');
        this.lastAccessedEl = document.getElementById('lastAccessed');
        
        this.init();
    }
    
    init() {
        // Increment counter on page load and display results
        this.incrementAndDisplay();
    }
    
    async incrementAndDisplay() {
        try {
            this.counterValueEl.textContent = 'Incrementing...';
            
            // First increment the counter
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
            this.updateDisplay(data);
            
            // Add celebration effect
            this.addCelebrationEffect();
            
        } catch (error) {
            console.error('Error incrementing counter:', error);
            this.showError('Failed to increment counter');
        }
    }
    
    updateDisplay(data) {
        this.counterValueEl.textContent = data.count;
        this.totalHitsEl.textContent = data.totalHits;
        this.lastAccessedEl.textContent = this.formatRelativeTime(data.lastAccessed);
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
    
    addCelebrationEffect() {
        // Add confetti or celebration animation
        this.createConfetti();
        
        // Optional: play a success sound (if you want to add audio later)
        // this.playSuccessSound();
    }
    
    createConfetti() {
        // Simple confetti effect using CSS and JS
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '9999';
        
        document.body.appendChild(confettiContainer);
        
        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfettiPiece(confettiContainer);
            }, i * 50);
        }
        
        // Remove confetti after animation
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 4000);
    }
    
    createConfettiPiece(container) {
        const confetti = document.createElement('div');
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
        
        // Add CSS animation keyframes if not already added
        if (!document.querySelector('#confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confetti-fall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(confetti);
        
        // Remove individual confetti pieces after animation
        setTimeout(() => {
            if (container.contains(confetti)) {
                container.removeChild(confetti);
            }
        }, 4000);
    }
    
    showError(message) {
        this.counterValueEl.textContent = 'Error';
        this.counterValueEl.style.color = '#ff6b6b';
        console.error(message);
    }
}

// Initialize the scan page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScanPage();
});
