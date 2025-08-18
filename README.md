# QR Madness - QR Code Counter App

A web application that generates QR codes and tracks how many times they've been scanned. Perfect for events, marketing campaigns, or just having fun with QR codes!

## 🚀 Features

- **QR Code Generation**: Automatically generates QR codes pointing to your counter page
- **Real-time Counter**: Tracks and displays the number of times the QR code has been scanned
- **Mobile Optimized**: Responsive design that looks great on phones and tablets
- **Live Updates**: Counter updates in real-time with smooth animations
- **Persistent Data**: Counter persists between server restarts
- **Clean UI**: Modern, beautiful interface with smooth animations

## 📱 How It Works

1. Start the server and visit the QR code page
2. Show the QR code to people to scan with their phones
3. Each time someone scans and visits the page, the counter increments
4. View real-time statistics and metrics

## 🛠️ Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Clone or download this project**
   ```bash
   cd qr-madness
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - QR Code Page: http://localhost:3000/qr
   - Counter Page: http://localhost:3000
   - API Endpoints: http://localhost:3000/api/counter

## 📖 Usage

### Displaying the QR Code
Visit `http://localhost:3000/qr` to see the QR code. This page shows:
- A scannable QR code
- Current counter value
- Instructions for users

### Viewing the Counter
The main page at `http://localhost:3000` displays:
- Current scan count with animated updates
- Creation timestamp
- Last accessed time
- Refresh button for manual updates

### API Endpoints

- `GET /` - Main counter page (increments counter on visit)
- `GET /qr` - QR code display page
- `GET /api/counter` - Get current counter data (JSON)
- `POST /api/counter/increment` - Manually increment counter
- `GET /api/qr` - Generate QR code (JSON with data URL)

## 🏗️ Project Structure

```
qr-madness/
├── server/
│   ├── app.js              # Main Express server
│   └── data/
│       └── counter.json    # Persistent counter data
├── public/
│   ├── index.html         # Counter display page
│   ├── qr.html           # QR code page
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       ├── app.js        # Counter page logic
│       └── qr.js         # QR page logic
├── package.json
└── README.md
```

## 🎨 Customization

### Changing the Port
Set the `PORT` environment variable:
```bash
PORT=8080 npm start
```

### Styling
Edit `public/css/style.css` to customize the appearance.

### Adding Features
The modular structure makes it easy to add new features:
- Add new API endpoints in `server/app.js`
- Extend the frontend in `public/js/app.js` and `public/js/qr.js`
- Modify data structure in the counter JSON file

## 🚀 Deployment

For production deployment:

1. **Set environment variables**
   ```bash
   NODE_ENV=production
   PORT=80
   ```

2. **Use a process manager**
   ```bash
   npm install -g pm2
   pm2 start server/app.js --name nyc-qr-counter
   ```

3. **Configure reverse proxy** (nginx/Apache) for custom domains

## 🔧 Development

### Adding New Features
The app is structured for easy extension:

- **New API endpoints**: Add to `server/app.js`
- **Frontend features**: Extend the JavaScript classes in `public/js/`
- **Styling**: Modify `public/css/style.css`
- **Data structure**: Update the counter JSON schema

### Future Enhancements
- Location tracking with IP geolocation
- Multiple QR codes with different IDs
- Analytics dashboard
- Export functionality
- User authentication
- Custom QR code styling

## 📄 License

MIT License - feel free to use this project for any purpose!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

**Have fun with your QR code counter! 🎉** 