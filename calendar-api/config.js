const config = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/oauth2callback',
    calendarId: process.env.CALENDAR_ID || 'primary'
};

module.exports = config; 