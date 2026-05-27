// SIDEBAR

const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

// TOGGLE

menuBtn.addEventListener("click", function(){

  sidebar.classList.toggle("close");

});
// SELECT ALL PAGE BUTTONS

const buttons = document.querySelectorAll(".page-btn");

// CHECK BUTTONS

buttons.forEach((btn) => {

  btn.addEventListener("click", () => {

    alert(btn.innerText + " button clicked");

    console.log("Real button working:", btn);

  });

});
// CALL BUTTON

document.querySelector(".call-btn")
.addEventListener("click", () => {

  alert("Calling Emergency Contact, phone: " + phone);

});

// MESSAGE BUTTON

document.querySelector(".msg-btn")
.addEventListener("click", () => {

  alert("Opening Emergency Message");

});

localcomplaints = {
  "user_id": 42,
  "fullname": "Sriram Kumar",
  "phone": "+91 98765 43210",
  "complaints": [
    {
      "title": "Street Light Not Working",
      "description": "The street light near the main intersection has been flickering and completely turned off since last night.",
      "category": "Electrical",
      "status": "In Progress",
      "created_at": "2026-05-20T21:30:00",
      "updated_at": "2026-05-21T09:15:22"
    },
    {
      "title": "Garbage Overflow",
      "description": "The public dustbin outside the community park is overflowing. Stray animals are scattering the waste on the road.",
      "category": "Sanitation",
      "status": "Resolved",
      "created_at": "2026-05-18T08:00:12",
      "updated_at": "2026-05-19T14:45:00"
    },
    {
      "title": "Water Leakage",
      "description": "A main water pipeline broke near the sector 3 commercial block. Significant amounts of water are flooding the street.",
      "category": "Water Supply",
      "status": "pending",
      "created_at": "2026-05-22T16:20:05",
      "updated_at": "2026-05-22T16:20:05"
    },
    {
      "title": "Pothole on Main Road",
      "description": "A deep pothole has opened up right after the flyover down-ramp. It is extremely dangerous for two-wheelers at night.",
      "category": "Road Infrastructure",
      "status": "pending",
      "created_at": "2026-05-22T11:10:00",
      "updated_at": "2026-05-22T11:10:00"
    }
  ]
}
let phone = ''
fetch(`${window.API_BASE_URL}/api/user/dashboard`,{
  method:'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})
.then(res => {
  // if(!res.ok) throw new Error('Failed to fetch');
  if (res.status == 401){
    alert('Please login first');
    window.location.href = 'login.html'
  }
  if (res.status == 403){
    alert('Forbidden');
    window.location.href = 'home.html'
    localStorage.removeItem('acccess_token');
  }
  return res.json(); 
})
.then(data => {
  const name = document.getElementById('dashboardUsername');
  if (name && data.fullname){
    name.innerText = data.fullname;
  
    const complaintsContainer = document.getElementById('complaintsList');
    if(complaintsContainer){
      phone = data.phone;
      complaintsContainer.innerHTML = '';
      const hasBackendComplaints = data.complaints && data.complaints.length > 0;
      const activeList = hasBackendComplaints ? data.complaints : localcomplaints.complaints;
      // complaint = data.complaints || localcomplaints
      activeList.forEach(complaint => {
        let statusClass = 'pending';
        const finalstatus = complaint.status.toLowerCase();
        if(finalstatus.includes('progress')) {statusClass = 'progress'}
        if(finalstatus.includes('resolved')) {statusClass = 'resolved'}
        const comphtml = `
        <li>
          <div>
            <strong>${complaint.title}</strong>
          </div>
          <span class= "${statusClass}"> ${complaint.status} </span>
        </li>
        `
        complaintsContainer.insertAdjacentHTML('beforeend', comphtml);
      })
    }

  }
})
.catch(err)
{
  console.error('Dashboard error: ', err);
}

function logout() {
  if(!confirm('You sure wanna logout?')) return;
  localStorage.removeItem('access_token');
  window.location.replace('home.html');
}