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
            text: "signup_with",  // 🎯 Forces button to say "Sign up with Google" along with the official logo icon
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
document.addEventListener('DOMContentLoaded', function(){
const manualRegBtn = document.querySelector('.register-btn');
if (manualRegBtn) {
        manualRegBtn.addEventListener('click', function(e) {
            e.preventDefault();
    // alert('Register button working');
    const name = document.getElementById('fullname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !phone || !email || !password || !confirmPassword) {
        alert("Please fill in all details.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const signupData = {
        fullname: name,
        phone: phone,
        email: email,
        password: password
    };
    fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Server response:", data);
        
        if (data.success) {
            alert(data.success);
        }
        else if (data.error){
            alert(data.error);
        }
        else{
            alert('Unknown error occured')
        }
    }).catch(err => {
        console.log('Network issue: ', err );
        alert('Could not connect to the server, please try again later');
    })
})
} else {
        console.error("Could not find the .register-btn element in the HTML DOM!");
    }
});