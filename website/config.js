// config.js
const IS_PRODUCTION = true; // 🔄 Flip this to true when deploying!

const API_BASE_URL = IS_PRODUCTION 
    ? 'https://appear-eastbound-usable.ngrok-free.dev/'      // Your live backend domain (Supabase/Render/AWS)
    : 'http://127.0.0.1:5000';        // Your local Flask server

// Make it globally accessible across your scripts
window.API_BASE_URL = API_BASE_URL;