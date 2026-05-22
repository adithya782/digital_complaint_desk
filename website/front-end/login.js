// --- GOOGLE IDENTITY INITIALIZATION LAYER ---
window.onload = function () {
    // 1. Initialize with your custom Google project identity
    google.accounts.id.initialize({
        client_id: "367509399123-519vrqo9a4813imrbfu8npacn7qordjs.apps.googleusercontent.com", // ⚠️ Paste your real Client ID string here!
        callback: handleGoogleCredentialResponse
    });

    // 2. Render the official button layout with custom branding text options
    google.accounts.id.renderButton(
        document.getElementById("googleButtonDiv"),
        { 
            theme: "outline", 
            size: "large", 
            // width: "100%",        // Matches your form input box dimensions perfectly
            text: "signin_with",  // 🎯 Forces button to say "Sign up with Google" along with the official logo icon
            shape: "rectangular"  // Keeps it professional and crisp matching your CSS style
        }
    );
};

// 3. Callback execution once a user successfully signs in
function handleGoogleCredentialResponse(response) {
    const googleToken = response.credential;

    fetch('http://127.0.0.1:5000/api/auth/google', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id_token: googleToken
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            
            if (data.registration_incomplete) {
                alert("Google Sign-In successful! Please complete your profile next.");
                window.location.href = "complete-profile.html"; 
            } else {
                alert("Login completely successful!");
                window.location.href = "dashboard.html"; 
            }
        } else {
            alert("Authentication failed: " + (data.error || "Unknown Error"));
        }
    })
    .catch(err => {
        console.error("Networking loop failure:", err);
        alert("Could not reach the Flask server backend matrix.");
    });
}

function login() {
    // alert('Login button working');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password){
        alert('Please fill the details to proceed');
        return;
    }
    else{
    fetch('http://127.0.0.1:5000/api/auth/login',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'email': email,
            'password': password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success){
            if (data.role == 'admin'){
            alert('AUTHENTICATION DONE, It is an admin user');
            }
            if (data.role == 'staff'){
            alert('AUTHENTICATION DONE, It is a staff user');
            }
            if (data.role == 'user'){
            alert('AUTHENTICATION DONE, It is a common user');
            }
        }
        else{
            alert(data.error || data.message)
        }
    
    })}
}