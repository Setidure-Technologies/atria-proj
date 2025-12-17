# Admin Panel Access

## Security Setup

The admin panel is now completely separate from the main assessment application with restricted access.

### Admin Panel URL
- **Main App**: `http://localhost:5177/`
- **Admin Panel**: `http://localhost:5177/admin.html`

### Admin Credentials
- **Password**: `admin123`

> ⚠️ **Security Notice**: Change the password in `/src/components/AdminLogin.tsx` before deploying to production.

### Admin Panel Features
- 🔐 Password-protected login
- 📊 View all test responses in a table format
- 💾 Export all data as JSON file
- 🗑️ Clear all stored data (with confirmation)
- 🚪 Secure logout functionality

### Access Control
- Admin panel is completely separate from the main assessment
- Session-based authentication (clears on browser close)
- No direct links from the main application
- Password required for every access

### Data Management
- All data stored locally in browser's IndexedDB
- Export functionality for data backup
- Secure data clearing with confirmation prompts

### Development Notes
- In production, implement proper authentication with hashed passwords
- Consider adding user management and role-based access
- Add audit logging for admin actions
- Implement session timeouts for additional security

## Usage Instructions

1. **Access Admin Panel**: Navigate to `/admin.html`
2. **Login**: Enter the admin password
3. **View Data**: Browse all test responses in the dashboard
4. **Export Data**: Click "Export Data" to download JSON file
5. **Manage Data**: Use "Clear All Data" to reset the database
6. **Logout**: Click "Logout" to end the admin session
