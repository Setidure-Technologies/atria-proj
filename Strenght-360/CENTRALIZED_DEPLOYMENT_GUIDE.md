# Psychometric Test - Centralized Data Collection

## 🎯 Problem Solved

The application now uses a **centralized server** to collect all test responses automatically. When students take the test from anywhere on the internet, their responses are sent to a central server and appear in the admin panel instantly.

## 🏗️ Architecture

### Backend Server (Port 5100)
- **Express.js API** for data collection
- **JSON file storage** for simplicity and reliability
- **CORS enabled** for cross-origin requests
- **Automatic data persistence** with backup

### Frontend Application (Port 5100)
- **React/TypeScript** psychometric test interface
- **API integration** for automatic data submission
- **Fallback localStorage** when server is offline
- **Admin panel** with real-time data view

## 🚀 Quick Start

### Development Mode
```bash
# Start both frontend and backend
./start-dev.sh

# Or start manually:
# Backend: cd backend && npm start
# Frontend: npm run dev
```

### URLs
- **Test Application**: ${VITE_API_URL}/
- **Admin Panel**: ${VITE_API_URL}/admin.html
- **API Health Check**: ${VITE_API_URL}/api/health

## 📋 Features

### ✅ Centralized Data Collection
- All responses automatically saved to server
- Real-time data synchronization
- No manual importing/exporting needed
- Works from any browser/device worldwide

### ✅ Admin Panel Features
- **Server Status Indicator**: Green (connected) / Red (offline)
- **Real-time Updates**: Click "Refresh" for latest data
- **Excel Export**: Detailed reports with individual responses
- **Data Management**: Clear all data functionality

### ✅ Reliability Features
- **Offline Fallback**: Saves to localStorage when server unavailable
- **Auto-Sync**: Syncs fallback data when connection restored
- **Error Handling**: Graceful degradation with user feedback
- **Data Validation**: Server-side validation of submissions

## 🌐 Production Deployment

### Backend Deployment Options

#### Option 1: Heroku (Recommended)
```bash
# Create Heroku app
heroku create your-psychometric-api

# Deploy backend
cd backend
git init
git add .
git commit -m "Initial backend"
heroku git:remote -a your-psychometric-api
git push heroku main
```

#### Option 2: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway up
```

#### Option 3: DigitalOcean App Platform
1. Connect your GitHub repository
2. Set root directory to `/backend`
3. Configure build and run commands
4. Deploy

### Frontend Deployment

#### Update API URL
```bash
# Update .env file
REACT_APP_API_URL=https://your-api-domain.com/api
```

#### Deploy to Netlify/Vercel
```bash
# Build for production
npm run build

# Deploy to Netlify
npx netlify-cli deploy --prod --dir=dist

# Or deploy to Vercel
npx vercel --prod
```

## 📊 API Endpoints

### Test Submission
```
POST /api/responses
Content-Type: application/json

{
  "student_name": "John Doe",
  "student_email": "john@example.com",
  "responses": { ... },
  "executing_score": 25,
  "influencing_score": 30,
  "relationship_building_score": 28,
  "strategic_thinking_score": 32,
  "primary_talent_domain": "Strategic Thinking"
}
```

### Get All Responses (Admin)
```
GET /api/responses
Response: { "success": true, "responses": [...], "total": 123 }
```

### Health Check
```
GET /api/health
Response: { "status": "OK", "message": "Psychometric Test API is running" }
```

### Clear All Data
```
DELETE /api/responses
Response: { "success": true, "message": "All responses cleared" }
```

## 🔒 Security Considerations

### For Production
1. **Add Authentication**: Protect admin endpoints
2. **Rate Limiting**: Prevent abuse
3. **HTTPS Only**: Secure data transmission
4. **Input Validation**: Sanitize all inputs
5. **Database**: Consider PostgreSQL for large scale

### Basic Auth Example
```javascript
// Add to server.js
const basicAuth = require('express-basic-auth');

app.use('/api/admin/*', basicAuth({
  users: { 'admin': 'your-secure-password' },
  challenge: true
}));
```

## 📁 File Structure
```
psychometric-test/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json       # Backend dependencies
│   └── data/
│       └── responses.json # Data storage
├── src/
│   ├── lib/
│   │   └── apiDatabase.ts # API client
│   └── components/
│       └── AdminPanel.tsx # Updated admin panel
├── .env                   # Environment configuration
└── start-dev.sh          # Development startup script
```

## 🎯 Usage Workflow

### For Students
1. Visit the test URL from any device/browser
2. Complete the psychometric assessment
3. Responses automatically sent to server
4. Instant confirmation of submission

### For Administrators
1. Access admin panel from any browser
2. View all responses in real-time
3. Export detailed Excel reports
4. Monitor server status
5. Manage data (clear if needed)

## 🔧 Troubleshooting

### Server Not Starting
```bash
# Check if port 5100 is in use
lsof -i :5100

# Kill process if needed
kill -9 $(lsof -t -i:5100)
```

### Frontend Can't Connect to API
1. Check if backend is running
2. Verify API URL in .env file
3. Check browser console for CORS errors
4. Test API health endpoint directly

### Data Not Appearing
1. Check server status indicator in admin panel
2. Verify responses in backend/data/responses.json
3. Click "Refresh" button in admin panel
4. Check browser network tab for API calls

## 🚀 Benefits

### ✅ For Organizations
- **Centralized Management**: One admin panel for all responses
- **Global Reach**: Students can take test from anywhere
- **Real-time Analytics**: Instant data collection and reporting
- **Scalable**: Handles multiple concurrent users
- **Reliable**: Offline fallback ensures no data loss

### ✅ For Administrators
- **Simple Deployment**: Easy to host and maintain
- **No Complex Setup**: Works out of the box
- **Data Portability**: Export to Excel for analysis
- **Status Monitoring**: Visual server connection status
- **Easy Backup**: Simple JSON file storage

This solution provides a robust, centralized data collection system that eliminates the browser-specific storage limitations while maintaining simplicity and reliability.
