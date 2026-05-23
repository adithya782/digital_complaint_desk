
// =====================
// INITIAL COUNTS
// =====================
let staff = 120;
let admin = 15;
let aiVerified = 340;
let audits = 28;

// =====================
// UPDATE DASHBOARD UI
// =====================
function updateDashboardCounts(){

  document.getElementById("staffCount").innerText = staff;
  document.getElementById("adminCount").innerText = admin;
  document.getElementById("verifyCount").innerText = aiVerified;
  document.getElementById("auditCount").innerText = audits;

  updateAnalysis();
}

// =====================
// ANALYSIS LIVE UPDATE
// =====================
function updateAnalysis(){

  let analysisStaff = document.getElementById("analysisStaff");
  let analysisUser = document.getElementById("analysisUser");

  if(analysisStaff){
    analysisStaff.innerText = staff;
  }

  if(analysisUser){
    analysisUser.innerText = admin * 35; // simulated users
  }
}

// =====================
// SIDEBAR TOGGLE
// =====================
function toggleSidebar(){
  document.getElementById("sidebar").classList.toggle("close");
}

// =====================
// PAGE NAVIGATION
// =====================
function showDashboard(){

  document.getElementById("dashboardPage").style.display = "block";
  document.getElementById("recordsPage").style.display = "none";
  document.getElementById("createAdminPage").style.display = "none";

  updateDashboardCounts();
}

// =====================
// CREATE STAFF
// =====================
function createStaff(){

  let name = prompt("Enter Staff Name");

  if(name){

    staff++;
    updateDashboardCounts();

    alert(name + " added as Staff");
  }
}

// =====================
// REMOVE STAFF
// =====================
function removeStaff(){

  let name = prompt("Enter Staff Name to Remove");

  if(name && staff > 0){

    staff--;
    updateDashboardCounts();

    alert(name + " removed");
  }
}

// =====================
// CREATE ADMIN PAGE OPEN
// =====================
function showCreateAdminPage(){

  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("recordsPage").style.display = "none";
  document.getElementById("createAdminPage").style.display = "block";
}

// =====================
// AI VERIFY
// =====================
function verifyAI(){

  aiVerified++;
  updateDashboardCounts();

  alert("AI Verified Successfully");
}

// =====================
// AUDIT RESOLUTION
// =====================
function auditResolution(){

  audits++;
  updateDashboardCounts();

  alert("Audit Completed");
}

// =====================
// ADD TABLE ROW (AI LOGS)
// =====================
function addNewRow(){

  let table = document.getElementById("tableBody");

  let id = "#10" + Math.floor(Math.random() * 900);

  let row = `
    <tr>
      <td>${id}</td>
      <td>New Classification</td>
      <td><span class="pending">Pending</span></td>
      <td>System Admin</td>
    </tr>
  `;

  table.innerHTML += row;
}

// =====================
// RECORD DATA
// =====================
const records = {
  staff: [],
  admin: [],
  ai: [],
  audit: []
};

// =====================
// SHOW RECORDS
// =====================
function showRecords(type){

  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("createAdminPage").style.display = "none";
  document.getElementById("recordsPage").style.display = "block";

  let title = document.getElementById("recordTitle");

  title.innerText = type.toUpperCase() + " RECORDS";

  let table = document.getElementById("recordsTable");

  table.innerHTML = "";

  records[type].forEach((item, i)=>{

    table.innerHTML += `
      <tr>
        <td>#${i+1}</td>
        <td>${item.name}</td>
        <td>Active</td>
        <td>System</td>
      </tr>
    `;
  });
}

// =====================
// ADMIN FORM SUBMIT
// =====================
document.getElementById("adminForm").addEventListener("submit", function(e){

  e.preventDefault();

  let name = document.getElementById("fullname").value;

  admin++;
  updateDashboardCounts();

  records.admin.push({name:name});

  alert("Admin Created Successfully");

  showDashboard();
});
