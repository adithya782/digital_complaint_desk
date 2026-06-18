const access_token = localStorage.getItem("access_token");
if (!access_token) {
  alert("Please login first");
  window.location.replace("login.html");
}

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

function updateDashboardCounts() {
  document.getElementById("staffCount").innerText = staff;

  document.getElementById("adminCount").innerText = admin;

  document.getElementById("verifyCount").innerText = aiVerified;

  document.getElementById("auditCount").innerText = audits;
}

// ===========================
// SIDEBAR TOGGLE
// ===========================

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("close");
}

// ===========================
// SHOW DASHBOARD
// ===========================

function showDashboard() {
  document.getElementById("dashboardPage").style.display = "block";

  document.getElementById("recordsPage").style.display = "none";

  document.getElementById("createStaffPage").style.display = "none";

  document.getElementById("createOfficePage").style.display = "none";

  document.getElementById("createAdminPage").style.display = "none";
  document.getElementById("EditStaffPage").style.display = "none";

  document.getElementById("createDepartmentPage").style.display = "none";

  updateDashboardCounts();
  fetchAI(true);
}

// ===========================
// CREATE STAFF PAGE
// ===========================

function createStaff() {
  document.getElementById("dashboardPage").style.display = "none";

  document.getElementById("recordsPage").style.display = "none";

  document.getElementById("createAdminPage").style.display = "none";

  document.getElementById("createDepartmentPage").style.display = "none";

  document.getElementById("createOfficePage").style.display = "none";
  document.getElementById("EditStaffPage").style.display = "none";

  document.getElementById("createStaffPage").style.display = "block";

  if (staffOfficeMap) {
    staffOfficeMap.invalidateSize();
  }

  loadDeptDropdown();
  loadOfficesForDept();
}

function editStaff() {
  document.getElementById("dashboardPage").style.display = "none";

  document.getElementById("recordsPage").style.display = "none";

  document.getElementById("createAdminPage").style.display = "none";

  document.getElementById("createDepartmentPage").style.display = "none";

  document.getElementById("createOfficePage").style.display = "none";
  document.getElementById("EditStaffPage").style.display = "block";

  document.getElementById("createStaffPage").style.display = "none";

  editstaff();
}

// ===========================
// CREATE ADMIN PAGE
// ===========================

function showCreateAdminPage() {
  document.getElementById("dashboardPage").style.display = "none";

  document.getElementById("recordsPage").style.display = "none";

  document.getElementById("createStaffPage").style.display = "none";
  document.getElementById("createDepartmentPage").style.display = "none";
  document.getElementById("createOfficePage").style.display = "none";
  document.getElementById("EditStaffPage").style.display = "none";

  document.getElementById("createAdminPage").style.display = "block";
}

// ===========================
// REMOVE STAFF
// ===========================

function removeStaff() {
  let name = prompt("Enter Staff Name To Remove");

  if (name && staff > 0) {
    staff--;

    updateDashboardCounts();

    alert(name + " Removed Successfully");
  }
}

// ===========================
// VERIFY AI
// ===========================

function verifyAI() {
  aiVerified++;

  updateDashboardCounts();

  alert("AI Verified Successfully");
}

// ===========================
// AUDIT RESOLUTION
// ===========================

function auditResolution() {
  audits++;

  updateDashboardCounts();

  alert("Audit Completed");
}

// ===========================
// ADD TABLE ROW
// ===========================

function addNewRow() {
  let table = document.getElementById("tableBody");

  let row = `
    <tr>
      <td>#10${Math.floor(Math.random() * 100)}</td>
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

  audit: [],
};

// ===========================
// SHOW RECORDS
// ===========================

function showRecords(type) {
  document.getElementById("dashboardPage").style.display = "none";

  document.getElementById("createStaffPage").style.display = "none";

  document.getElementById("createAdminPage").style.display = "none";

  document.getElementById("recordsPage").style.display = "block";

  let title = document.getElementById("recordTitle");

  title.innerText = type.toUpperCase() + " RECORDS";

  let table = document.getElementById("recordsTable");

  table.innerHTML = "";

  records[type].forEach((item, index) => {
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

// document.getElementById("staffForm")
// .addEventListener("submit", function(e){

//   e.preventDefault();

//   let fullname =
//   document.getElementById("staffFullname").value;

//   let email =
//   document.getElementById("staffEmail").value;

//   let phone =
//   document.getElementById("staffPhone").value;

//   let password =
//   document.getElementById("staffPassword").value;

//   // UPDATE STAFF COUNT

//   staff++;

//   updateDashboardCounts();

//   // STORE RECORD

//   records.staff.push({
//     name: fullname
//   });

//   // SUCCESS ALERT

//   alert(

//     "Staff Created Successfully!\n\n" +

//     "Full Name : " + fullname + "\n" +

//     "Email : " + email + "\n" +

//     "Phone : " + phone + "\n" +

//     "Password : " + password
//   );

// RESET FORM

//   this.reset();

//   // BACK DASHBOARD

//   showDashboard();
// });

// ===========================
// CREATE DEPARTMENT
// ===========================

function createDepartment() {
  document.getElementById("dashboardPage").style.display = "none";

  document.getElementById("recordsPage").style.display = "none";

  document.getElementById("createAdminPage").style.display = "none";

  document.getElementById("createStaffPage").style.display = "none";

  document.getElementById("createOfficePage").style.display = "none";
  document.getElementById("EditStaffPage").style.display = "none";

  document.getElementById("createDepartmentPage").style.display = "block";

  listDepartments();
}

// ===========================
// CREATE OFFICE
// ===========================

function createOffice() {
  document.getElementById("dashboardPage").style.display = "none";

  document.getElementById("recordsPage").style.display = "none";

  document.getElementById("createStaffPage").style.display = "none";
  document.getElementById("createDepartmentPage").style.display = "none";
  document.getElementById("createAdminPage").style.display = "none";
  document.getElementById("EditStaffPage").style.display = "none";

  document.getElementById("createOfficePage").style.display = "block";

  if (map) {
    setTimeout(() => {
      map.invalidateSize();
      loadOfficeMap();
    }, 100);
  }

  loadDepartmentsForOffice();
}

// ===========================
// INITIAL LOAD
// ===========================

// updateDashboardCounts();

let confirm_upgrade = false;

function registerAdmin(event) {
  if (event) event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const fullname = document.getElementById("fullname").value.trim();
  if (!email || !password || !phone || !fullname) {
    alert("Please fill in all fields.");
    return;
  }
  fetch(`${window.API_BASE_URL}/api/auth/register_admin`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      email: email,
      password: password,
      phone: phone,
      fullname: fullname,
      confirm_upgrade: confirm_upgrade,
    }),
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      if (!data) return;
      if (data.error) {
        alert(data.error);
        const form = document.getElementById("adminForm");
        if (form) {
          form.reset();
        }
      }
      if (data.requires_confirmation) {
        const userApproved = confirm(data.message);
        if (userApproved) {
          confirm_upgrade = true;
          registerAdmin(null);
        } else {
          confirm_upgrade = false;
        }
        return;
      }
      if (data.success) {
        const form = document.getElementById("adminForm");
        if (form) {
          form.reset();
        }
      }
    })
    .catch((err) => {
      console.error("Dashboard error: ", err);
    });
}
function handleLogout() {
  if (!confirm("You sure wanna logout?")) return;
  localStorage.removeItem("access_token");
  window.location.replace("home.html");
}

function registerDepartment(event) {
  event.preventDefault();
  const name = document.getElementById("department_name").value.trim();

  if (!name) {
    alert("Please fill in the field.");
    return;
  }
  fetch(`${window.API_BASE_URL}/api/department/create`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      department_name: name,
    }),
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      if (!data) return;
      if (data.error) {
        alert(data.error);
      }
      if (data.message) {
        alert(data.message);
      }

      const form = document.getElementById("departmentForm");
      if (form) {
        form.reset();
      }
      listDepartments();
    })
    .catch((err) => console.error(err));
}

function listDepartments() {
  fetch(`${window.API_BASE_URL}/api/department/create`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      if (!data) return;
      if (data.error) console.log(data.error);

      if (data.departments) {
        let table = document.getElementById("departmenttableBody");
        table.innerHTML = "";

        data.departments.forEach((department) => {
          let row = `
                <tr>
                    <td>${department.department_id}</td>
                    <td>${department.department_name}</td>
                    <td>
                      <button onclick="deleteDepartment(${department.department_id})" 
                              style="color: white; background: #e53935; border: none; padding: 5px 10px; cursor: pointer;">
                          Delete
                      </button>
                  </td>
                </tr>
            `;
          table.insertAdjacentHTML("beforeend", row);
        });
      } else if (data.error) {
        // Only log errors here
        console.error("Server returned error:", data.error);
        alert(data.error);
      }
    });
}

function getOfficeLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      document.getElementById("office_lat").value =
        pos.coords.latitude.toFixed(6);
      document.getElementById("office_lon").value =
        pos.coords.longitude.toFixed(6);
    });
  } else {
    alert("Geolocation not supported.");
  }
}

document.getElementById("officeForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Get selected IDs
  const selectedDepts = Array.from(
    document.querySelectorAll('input[name="dept_ids"]:checked'),
  ).map((cb) => cb.value);

  const payload = {
    name: document.getElementById("office_name").value,
    latitude: document.getElementById("office_lat").value,
    longitude: document.getElementById("office_lon").value,
    department_ids: selectedDepts,
  };

  fetch(`${window.API_BASE_URL}/api/office/create`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        alert("Session expired or unauthorized. Please login again.");
        localStorage.removeItem("access_token");
        window.location.replace("login.html");
        throw new Error("Unauthorized"); // Stop execution
      }

      return res.json();
    })
    .then((data) => {
      alert(data.message || data.error);
    });
});
function loadDepartmentsForOffice() {
  fetch(`${window.API_BASE_URL}/api/department/create`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        alert("Session expired or unauthorized. Please login again.");
        localStorage.removeItem("access_token");
        window.location.replace("login.html");
        throw new Error("Unauthorized"); // Stop execution
      }

      return res.json();
    })
    .then((data) => {
      console.log("Full response from API:", data);
      const container = document.getElementById("department-checklist");
      container.innerHTML = "";
      data.departments.forEach((dept) => {
        container.innerHTML += `
                <label style="display:block;">
                    <input type="checkbox" name="dept_ids" value="${dept.department_id}"> 
                    ${dept.department_name}
                </label>`;
      });
    });
}

function deleteDepartment(id) {
  if (!confirm("Are you sure you want to delete this department?")) return;

  fetch(`${window.API_BASE_URL}/api/department/delete/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        alert("Session expired or unauthorized. Please login again.");
        localStorage.removeItem("access_token");
        window.location.replace("login.html");
        throw new Error("Unauthorized"); // Stop execution
      }

      return res.json();
    })
    .then((data) => {
      if (data.message) {
        alert(data.message);
        listDepartments(); // Refresh the table after deletion
      } else {
        alert(data.error || "Failed to delete.");
      }
    })
    .catch((err) => console.error("Error:", err));
}

// Initialize map
const map = L.map("officeMap").setView([16.7, 80.8], 10); // Center on your region

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

function loadOfficeMap() {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });
  fetch(`${window.API_BASE_URL}/api/office/create`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      // Change data.departments to data.offices
      data.offices.forEach((office) => {
        console.log("Processing Office:", office.office_name);
        const marker = L.marker([office.latitude, office.longitude]).addTo(map);

        const deptList = office.departments
          .map((d) => d.department_name)
          .join(", ");

        // Use office_id (lowercase 'i')
        const popupContent = `
          <b>ID: ${office.office_id}</b><br>
          <b>Name: ${office.office_name}</b><br>
          <b>Departments:</b> ${deptList} <br>
          <button type="button" onclick="deleteOffice(${office.office_id})">DELETE</button>
      `;

        marker.bindPopup(popupContent);
      });
    })
    .catch((err) => console.error("Error loading map:", err));
}

// Call this when the page loads or when showing the dashboard
// loadOfficeMap();
document.getElementById("staffForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const officeId = document.getElementById("selectedOfficeId").value;
  if (!officeId) {
    alert("Please click an office on the map first!");
    return;
  }

  const payload = {
    fullname: document.getElementById("staffFullname").value,
    email: document.getElementById("staffEmail").value,
    phone: document.getElementById("staffPhone").value,
    password: document.getElementById("staffPassword").value,
    department_id: parseInt(document.getElementById("staffDepartment").value),
    office_id: parseInt(officeId),
    confirm_upgrade: false,
  };

  registerStaff(payload);
});

function registerStaff(payload) {
  fetch(`${window.API_BASE_URL}/api/auth/register_staff`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      if (data.requires_confirmation) {
        // Handle the "Do you want to upgrade?" scenario
        if (confirm(data.message)) {
          payload.confirm_upgrade = true;
          registerStaff(payload); // Retry with confirmation
        }
      } else if (data.success) {
        alert(data.message);
        showDashboard();
      } else {
        alert(data.error || "Failed to create staff");
      }
    });
}

// 1. Load departments into the dropdown
function loadDeptDropdown() {
  fetch(`${window.API_BASE_URL}/api/department/create`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      const select = document.getElementById("staffDepartment");

      // --- ADD THIS LINE TO CLEAR THE SELECT BOX ---
      select.innerHTML = '<option value="">-- Choose Department --</option>';
      // ----------------------------------------------

      const deptArray = data.departments;

      deptArray.forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept.department_id;
        option.textContent = dept.department_name;
        select.appendChild(option);
      });
    })
    .catch((err) => console.error("Error loading departments:", err));
}

// 2. Fetch offices filtered by the selected department
function loadOfficesForDept() {
  const deptId = document.getElementById("staffDepartment").value;
  if (!deptId) return;

  fetch(`${window.API_BASE_URL}/api/offices?department_id=${deptId}`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      console.log("Full API Response:", data);
      // 1. Clear ONLY the staff map
      staffOfficeMap.eachLayer((layer) => {
        if (layer instanceof L.Marker) staffOfficeMap.removeLayer(layer);
      });

      // 2. Add markers to staffOfficeMap
      data.offices.forEach((office) => {
        const marker = L.marker([office.latitude, office.longitude]).addTo(
          staffOfficeMap,
        );

        marker.on("click", function () {
          // Save to your hidden field
          document.getElementById("selectedOfficeId").value = office.id;
          marker.bindPopup(`<b>Selected: ${office.name}</b>`).openPopup();
        });
      });

      if (data.offices.length > 0) {
        staffOfficeMap.setView(
          [data.offices[0].latitude, data.offices[0].longitude],
          12,
        );
      }
    });
}
const staffOfficeMap = L.map("office-map").setView([16.7, 80.8], 10);
const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
L.tileLayer(tileUrl, { attribution: "© OpenStreetMap" }).addTo(staffOfficeMap);

function fetchAI(onlyPending) {
  const buttons = document.querySelectorAll(".add-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));
  if (onlyPending) {
    buttons[1].classList.add("active"); // "Pending Only" button
  } else {
    buttons[0].classList.add("active"); // "View All" button
  }
  const url = `${window.API_BASE_URL}/api/admin/verify_complaint`;
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      const pending = data.pending;
      const complaints = data.all_complaints;
      const departments = data.departments;

      const display_list = onlyPending ? pending : complaints;

      display_list.forEach((item) => {
        const dept = departments.find(
          (d) => d.department_id == item.department_id,
        );
        const deptName = dept ? dept.department_name : "Unknown";

        // Inside your loop iterating over complaints:
        // Inside your complaints.forEach loop:
        const isProcessed = item.is_verified;

        // Inside your complaints.forEach loop:

        // 1. Get the AI suggestion (assuming the field is item.ai_department_id)
        const defaultDeptId = item.department_id || item.ai_department_id;

        tbody.innerHTML += `
<tr>
    <td>#${item.complaint_id}</td>
    <td>${item.title}</td>
    <td>${item.description}</td>
    <td>
        ${
          isProcessed
            ? `<span>${departments.find((d) => d.department_id === item.department_id)?.department_name || "Unknown Dept"}</span>`
            : `<select id="deptSelect-${item.complaint_id}">
                <option value="">Select Dept</option>
                ${departments
                  .map(
                    (d) => `
                    <option value="${d.department_id}" ${d.department_id === defaultDeptId ? "selected" : ""}>
                        ${d.department_name}
                    </option>
                `,
                  )
                  .join("")}
               </select>`
        }
    </td>
    <td>
        <span class="${isProcessed ? "verified" : "pending"}">
            ${isProcessed ? "Processed" : "Pending Verification"}
        </span>
    </td>
    <td>
        ${
          isProcessed
            ? "---"
            : `<button onclick="submitVerification(${item.complaint_id})">Confirm / Submit</button>`
        }
    </td>
</tr>`;
      });
    });
}

// default - show only the complaints - departments to be verified

async function submitVerification(complaintId) {
  const selectElement = document.getElementById(`deptSelect-${complaintId}`);
  const actualDeptId = selectElement.value;

  if (!actualDeptId) {
    alert("Please select a department!");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/verify_complaint",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
        body: JSON.stringify({
          complaint_id: complaintId,
          actual_dept_id: actualDeptId,
        }),
      },
    );

    const data = await response.json();

    // This log is CRITICAL to debug 422 errors
    console.log("Server Response:", data);

    if (response.ok) {
      alert("Verified: " + data.message);
      fetchAI(true);
    } else {
      // This alert will show the exact validation error from Flask-RESTful
      alert("API Error: " + JSON.stringify(data.message || data));
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

function editstaff() {
  const url = `${window.API_BASE_URL}/api/admin/delete_staff`;
  const tbody = document.getElementById("editstafftableBody");
  tbody.innerHTML = "";
  fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      const departments = data.departments;

      const display_list = data.staffs;

      display_list.forEach((item) => {
        const dept = departments.find(
          (d) => d.department_id == item.department_id,
        );
        const deptName = dept ? dept.department_name : "Unknown";

        // Inside your loop iterating over complaints:
        // Inside your complaints.forEach loop:

        // Change your current line to this:
        tbody.innerHTML += `
          <tr>
              <td>#${item.staff_id}</td>
              <td>${item.staff_name}</td>
              <td>
                  ${departments.find((d) => d.department_id === item.department_id)?.department_name || "Unknown Dept"}
                  
              </td>
              <td>
                  <button type="button" onclick="deleteStaff(${item.staff_id})">DELETE</button>
              </td>
          </tr>
      `;
      });
    });
}

function deleteStaff(staff_id) {
  const url = `${window.API_BASE_URL}/api/admin/delete_staff/${staff_id}`;
  const tbody = document.getElementById("editstafftableBody");
  tbody.innerHTML = "";
  fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      alert(data.error || data.message);
    });
}
function deleteOffice(office_id) {
  const url = `${window.API_BASE_URL}/api/office/delete/${office_id}`;
  const tbody = document.getElementById("editstafftableBody");
  tbody.innerHTML = "";
  fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => {
      // if(!res.ok) throw new Error('Failed to fetch');
      if (res.status == 401) {
        alert("Please login first");
        window.location.href = "login.html";
      }
      if (res.status == 403) {
        alert("Forbidden");
        window.location.href = "home.html";
      }
      return res.json();
    })
    .then((data) => {
      alert(data.error || data.message);
    });
}

// Ensure the dashboard is shown by default when the page finishes loading
window.addEventListener("DOMContentLoaded", (event) => {
  showDashboard();
});
