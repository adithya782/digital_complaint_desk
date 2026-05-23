// ===========================
// INITIAL COUNTS
// ===========================

let staff = 120;
let admin = 15;
let aiVerified = 340;
let audits = 28;

// ===========================
// UPDATE DASHBOARD COUNTS
// ===========================

function updateDashboardCounts(){

  document.getElementById("staffCount").innerText = staff;

  document.getElementById("adminCount").innerText = admin;

  document.getElementById("verifyCount").innerText = aiVerified;

  document.getElementById("auditCount").innerText = audits;
}

// ===========================
// SIDEBAR TOGGLE
// ===========================

function toggleSidebar(){

  document.getElementById("sidebar")
  .classList.toggle("close");
}

// ===========================
// SHOW DASHBOARD
// ===========================

function showDashboard(){

  document.getElementById("dashboardPage")
  .style.display = "block";

  document.getElementById("recordsPage")
  .style.display = "none";

  document.getElementById("createStaffPage")
  .style.display = "none";

  document.getElementById("createAdminPage")
  .style.display = "none";

  updateDashboardCounts();
}

// ===========================
// CREATE STAFF PAGE
// ===========================

function createStaff(){

  document.getElementById("dashboardPage")
  .style.display = "none";

  document.getElementById("recordsPage")
  .style.display = "none";

  document.getElementById("createAdminPage")
  .style.display = "none";

  document.getElementById("createStaffPage")
  .style.display = "block";
}

// ===========================
// CREATE ADMIN PAGE
// ===========================

function showCreateAdminPage(){

  document.getElementById("dashboardPage")
  .style.display = "none";

  document.getElementById("recordsPage")
  .style.display = "none";

  document.getElementById("createStaffPage")
  .style.display = "none";

  document.getElementById("createAdminPage")
  .style.display = "block";
}

// ===========================
// REMOVE STAFF
// ===========================

function removeStaff(){

  let name =
  prompt("Enter Staff Name To Remove");

  if(name && staff > 0){

    staff--;

    updateDashboardCounts();

    alert(name + " Removed Successfully");
  }
}

// ===========================
// VERIFY AI
// ===========================

function verifyAI(){

  aiVerified++;

  updateDashboardCounts();

  alert("AI Verified Successfully");
}

// ===========================
// AUDIT RESOLUTION
// ===========================

function auditResolution(){

  audits++;

  updateDashboardCounts();

  alert("Audit Completed");
}

// ===========================
// ADD TABLE ROW
// ===========================

function addNewRow(){

  let table =
  document.getElementById("tableBody");

  let row = `
    <tr>
      <td>#10${Math.floor(Math.random()*100)}</td>
      <td>New AI Classification</td>
      <td>
        <span class="pending">
          Pending
        </span>
      </td>
      <td>System Admin</td>
    </tr>
  `;

  table.innerHTML += row;
}

// ===========================
// RECORD STORAGE
// ===========================

const records = {

  staff: [],

  admin: [],

  ai: [],

  audit: []
};

// ===========================
// SHOW RECORDS
// ===========================

function showRecords(type){

  document.getElementById("dashboardPage")
  .style.display = "none";

  document.getElementById("createStaffPage")
  .style.display = "none";

  document.getElementById("createAdminPage")
  .style.display = "none";

  document.getElementById("recordsPage")
  .style.display = "block";

  let title =
  document.getElementById("recordTitle");

  title.innerText =
  type.toUpperCase() + " RECORDS";

  let table =
  document.getElementById("recordsTable");

  table.innerHTML = "";

  records[type].forEach((item, index)=>{

    table.innerHTML += `
      <tr>
        <td>#${index + 1}</td>
        <td>${item.name}</td>
        <td>Active</td>
        <td>System</td>
      </tr>
    `;
  });
}

// ===========================
// STAFF FORM SUBMIT
// ===========================

document.getElementById("staffForm")
.addEventListener("submit", function(e){

  e.preventDefault();

  let fullname =
  document.getElementById("staffFullname").value;

  let email =
  document.getElementById("staffEmail").value;

  let phone =
  document.getElementById("staffPhone").value;

  let password =
  document.getElementById("staffPassword").value;

  // UPDATE STAFF COUNT

  staff++;

  updateDashboardCounts();

  // STORE RECORD

  records.staff.push({
    name: fullname
  });

  // SUCCESS ALERT

  alert(

    "Staff Created Successfully!\n\n" +

    "Full Name : " + fullname + "\n" +

    "Email : " + email + "\n" +

    "Phone : " + phone + "\n" +

    "Password : " + password
  );

  // RESET FORM

  this.reset();

  // BACK DASHBOARD

  showDashboard();
});

// ===========================
// ADMIN FORM SUBMIT
// ===========================

document.getElementById("adminForm")
.addEventListener("submit", function(e){

  e.preventDefault();

  let fullname =
  document.getElementById("fullname").value;

  let email =
  document.getElementById("email").value;

  let phone =
  document.getElementById("phone").value;

  let password =
  document.getElementById("password").value;

  // UPDATE ADMIN COUNT

  admin++;

  updateDashboardCounts();

  // STORE RECORD

  records.admin.push({
    name: fullname
  });

  // SUCCESS ALERT

  alert(

    "Admin Created Successfully!\n\n" +

    "Full Name : " + fullname + "\n" +

    "Email : " + email + "\n" +

    "Phone : " + phone + "\n" +

    "Password : " + password
  );

  // RESET FORM

  this.reset();

  // BACK DASHBOARD

  showDashboard();
});

// ===========================
// CREATE DEPARTMENT
// ===========================

function createDepartment(){

  alert("Department Created");
}

// ===========================
// CREATE OFFICE
// ===========================

function createOffice(){

  alert("Office Created");
}

// ===========================
// INITIAL LOAD
// ===========================

updateDashboardCounts();