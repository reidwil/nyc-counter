// QR code page functionality
class QRApp {
    constructor() {
        this.qrCodeEl = document.getElementById('qrCode');
        this.currentCountEl = document.getElementById('currentCount');
        this.qrUrlEl = document.getElementById('qrUrl');
        this.refreshQrBtn = document.getElementById('refreshQrBtn');
        
        this.init();
    }
    
    init() {
        this.loadQRCode();
        this.loadCounterData();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.refreshQrBtn.addEventListener('click', () => {
            this.loadQRCode();
            this.loadCounterData();
        });
        
        // Auto-refresh counter every 5 seconds
        setInterval(() => {
            this.loadCounterData();
        }, 5000);
    }
    
    async loadQRCode() {
        try {
            this.setQRLoadingState();
            const response = await fetch('/api/qr');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayQRCode(data);
        } catch (error) {
            console.error('Error loading QR code:', error);
            this.showQRError('Failed to generate QR code');
        }
    }
    
    async loadCounterData() {
        try {
            const response = await fetch('/api/counter');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateCounterDisplay(data.count);
        } catch (error) {
            console.error('Error loading counter data:', error);
            this.currentCountEl.textContent = 'Error';
        }
    }
    
    setQRLoadingState() {
        this.qrCodeEl.innerHTML = '<div class="loading">Generating QR Code...</div>';
    }
    
    displayQRCode(data) {
        // Create image element for QR code
        const img = document.createElement('img');
        img.src = data.qrCode;
        img.alt = 'QR Code';
        
        // Clear loading state and add QR code
        this.qrCodeEl.innerHTML = '';
        this.qrCodeEl.appendChild(img);
        
        // Update URL display
        this.qrUrlEl.textContent = data.url;
    }
    
    updateCounterDisplay(count) {
        this.currentCountEl.textContent = count;
    }
    
    showQRError(message) {
        this.qrCodeEl.innerHTML = `
            <div style="color: #cc0000; text-align: center; padding: 20px;">
                <div>⚠️ ${message}</div>
                <button onclick="window.location.reload()" 
                        style="margin-top: 15px; padding: 10px 20px; background: #cc0000; color: white; border: none; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRApp();
}); 