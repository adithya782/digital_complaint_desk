// config.js
const IS_PRODUCTION = false; // 🔄 Flip this to true when deploying!

const API_BASE_URL = IS_PRODUCTION 
    ? 'https://api.safecity.com'      // Your live backend domain (Supabase/Render/AWS)
    : 'http://127.0.0.1:5000';        // Your local Flask server

// Make it globally accessible across your scripts
window.API_BASE_URL = API_BASE_URL;