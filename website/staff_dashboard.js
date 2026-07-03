// ==========================================
// 1. DATA MODELS & LOCAL CONFIGURATION
// ==========================================
const localcomplaints = {
  officer_name: "Officer Ramesh Kumar",
  workload_summary: {
    total_active_issues: 8,
    daily_capacity_limit: 5,
  },
  slots: {
    todays_focus_slot: [
      {
        complaint_id: 101,
        title: "🚨 Main Water Line Burst",
        description:
          "Massive water leakage near the main junction. Road flooding completely.",
        status: "In Progress",
        priority: "High",
        deadline: "2026-05-23T18:00:00Z",
        days_remaining: 0.1,
        calculated_score: 40.0,
      },
      {
        complaint_id: 102,
        title: "⚡ Streetlight Cable Sparking",
        description:
          "Live wires exposed near the public park entrance. Hazardous condition.",
        status: "Pending",
        priority: "High",
        deadline: "2026-05-24T12:00:00Z",
        days_remaining: 0.9,
        calculated_score: 4.4,
      },
      {
        complaint_id: 103,
        title: "🕳️ Dangerous Deep Pothole",
        description:
          "Large pothole in the middle of the third lane causing severe traffic slowdowns.",
        status: "Pending",
        priority: "Medium",
        deadline: "2026-05-25T14:30:00Z",
        days_remaining: 2.0,
        calculated_score: 1.0,
      },
    ],
    tomorrows_slot: [
      {
        complaint_id: 104,
        title: "🗑️ Public Dustbin Overflowing",
        description:
          "Garbage collection missed for three consecutive cycles near block C market.",
        status: "Pending",
        priority: "Low",
        deadline: "2026-05-27T09:00:00Z",
        days_remaining: 3.8,
        calculated_score: 0.26,
      },
    ],
    future_backlog_slot: [],
  },
};

const access_token = localStorage.getItem("access_token");

// ==========================================
// 2. LIFECYCLE INITIALIZATION (DOM CONTENT LOADED)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM processing complete. Mapping interface fields...");

  const complaintsContainer = document.getElementById("TodayIssues");
  const nameElement = document.getElementById("dashboardUsername");
  const pendingContainer = document.getElementById("PendingQueue");

  if (pendingContainer) {
    pendingContainer.innerHTML = ""; // Clear placeholder

    // 🚀 Pull from tomorrows_slot or future arrays instead of duplicating today's focus!
    const backlogList = localcomplaints.slots.tomorrows_slot;

    backlogList.forEach((complaint) => {
      const backlogHtml = `
        <li style="background: #fff; padding: 10px; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #fb923c; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
          <strong style="font-size: 13px; color: #03113f;">${complaint.title}</strong>
          <p style="font-size: 12px; color: #6b7280; margin: 3px 0 0 0;">Priority: ${complaint.priority}</p>
        </li>
      `;
      pendingContainer.insertAdjacentHTML("beforeend", backlogHtml);
    });
  }
  // Paint fallback local user metrics to display immediately
  if (nameElement) {
    nameElement.innerText = localcomplaints.officer_name;
  }

  // Paint local mockup records to protect against empty displays
  if (complaintsContainer) {
    complaintsContainer.innerHTML = "";

    const activeList = localcomplaints.slots.todays_focus_slot;

    activeList.forEach((complaint) => {
      let statusClass = "pending";
      const finalstatus = complaint.status.toLowerCase();
      if (finalstatus.includes("progress")) {
        statusClass = "progress";
      }
      if (finalstatus.includes("resolved")) {
        statusClass = "resolved";
      }

      const comphtml = `
        <li>
          <div>
            <strong>${complaint.title}</strong>
          </div>
          <p>${complaint.description}</p>
          <p>Priority: <strong>${complaint.priority}</strong></p>
          <span class="${statusClass}">${complaint.status}</span>
        </li>
      `;
      complaintsContainer.insertAdjacentHTML("beforeend", comphtml);
    });
  }

  // Initialize background network updates and UI event setups
  triggerLiveDashboardFetch();
  initializeUIControls();
});

// ==========================================
// 3. ASYNC REMOTE API ACCESS ENGINE
// ==========================================
function triggerLiveDashboardFetch() {
  fetch(`${window.API_BASE_URL}/api/staff/dashboard`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + access_token,
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
      console.log(data);
      if (data && data.slots && data.slots.todays_focus_slot) {
        const complaintsContainer = document.getElementById("TodayIssues");
        const nameElement = document.getElementById("dashboardUsername");
        const staff_id = document.getElementById("staff_id");
        const department = document.getElementById("department");
        const total_count = document.getElementById("total_count");
        const pending_count = document.getElementById("pending_count");
        const resolved_count = document.getElementById("resolved_count");
        const incoming_count = document.getElementById("incoming_count");

        if (staff_id && data.staff_id) staff_id.innerText = data.staff_id;
        if (department && data.department)
          department.innerText = data.department;
        if (nameElement && data.fullname) nameElement.innerText = data.fullname;

        if (data.workload_summary) {
          incoming_count.innerText = data.workload_summary.total_active_issues;
          pending_count.innerText = data.workload_summary.pending_complaints;
          total_count.innerText = data.workload_summary.total_complaints;
          resolved_count.innerText = data.workload_summary.resolved_complaints;
        }

        if (complaintsContainer) {
          complaintsContainer.innerHTML = "";

          data.slots.todays_focus_slot.forEach((complaint) => {
            let statusClass = "pending";
            const finalstatus = complaint.status.toLowerCase();
            if (finalstatus.includes("progress")) {
              statusClass = "progress";
            }
            if (finalstatus.includes("resolved")) {
              statusClass = "resolved";
            }

            const comphtml = `
            <li class="complaint-item" data-id="${complaint.complaint_id}" style="cursor: pointer;">
              <div>
                <strong>${complaint.title}</strong>
              </div>
              <p>${complaint.description}</p>
              <p>Priority: <strong>${complaint.priority}</strong></p>
              <span class="${statusClass}">${complaint.status}</span>
            </li>
          `;
            complaintsContainer.insertAdjacentHTML("beforeend", comphtml);
          });
        }
      }
    })
    .catch((err) => console.error("Live fetch background sync error: ", err));
}
const complaintsContainer = document.getElementById("TodayIssues");

complaintsContainer.addEventListener("click", (event) => {
  const clickedItem = event.target.closest(".complaint-item");

  if (clickedItem) {
    const complaintId = clickedItem.getAttribute("data-id");

    window.location.href = `complaint_details.html?id=${complaintId}`;
  }
});
// ==========================================
// 4. INTERACTION MANAGER (UI CONTROLS)
// ==========================================
function initializeUIControls() {
  // 🔒 THE ONLY SIDEBAR EVENT LISTENER ALLOWED IN THE ENTIRE FILE
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const mainContent = document.querySelector(".main-content");

  if (menuBtn && sidebar && mainContent) {
    menuBtn.addEventListener("click", () => {
      // 🚀 BOTH actions fire at the exact same millisecond on a single click!
      sidebar.classList.toggle("close");

      if (sidebar.classList.contains("close")) {
        mainContent.style.marginLeft = "85px";
      } else {
        mainContent.style.marginLeft = "250px";
      }
    });
  }

  // Statistical summary selectors
  const statButtons = document.querySelectorAll(".stat-card");
  statButtons.forEach((button) => {
    button.addEventListener("click", () => {
      statButtons.forEach((btn) => btn.classList.remove("active-card"));
      button.classList.add("active-card");

      const title = button.querySelector("h4").innerText;
      if (title === "Today's Issues") alert("Opening Today's Issues");
      else if (title === "Pending Issues") alert("Opening Pending Issues");
      else if (title === "Resolved Today") alert("Opening Resolved Issues");
      else if (title === "Total Reports") alert("Opening Total Reports");
    });
  });

  // Structural Navigation elements
  const sideButtons = document.querySelectorAll(".side-btn");
  sideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sideButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const btnText = button.querySelector(".text").innerText;
      if (btnText === "Dashboard") alert("Dashboard Opened");
      else if (btnText === "History") alert("History Opened");
      else if (btnText === "Transactions") alert("Transactions Opened");
      else if (btnText === "Profile") alert("Profile Opened");
      else if (btnText === "Logout") {
        let checkLogout = confirm("Are you sure want to logout?");
        if (checkLogout) logout();
      }
    });
  });

  // Communication buttons delegation
  const msgBtn = document.querySelector(".msg-btn");
  const reportBtn = document.querySelector(".report-btn");

  if (msgBtn) {
    msgBtn.addEventListener("click", () => {
      alert("Message feature opened");
    });
  }

  if (reportBtn) {
    reportBtn.addEventListener("click", () => {
      let reportId = "RPT" + Math.floor(Math.random() * 1000);
      alert("Report Generated: " + reportId);

      const p = document.createElement("p");
      p.textContent = "New Report: " + reportId;
      document.body.appendChild(p);
    });
  }

  // Inspector expansion panel trigger
  const profileBox = document.getElementById("profileBox");
  if (profileBox) {
    profileBox.addEventListener("click", () => {
      profileBox.classList.toggle("expanded");
      const details = profileBox.querySelector(".profile-details");
      if (details) details.classList.toggle("hidden");
    });
  }
}

// Global scope exit declaration
function logout() {
  localStorage.removeItem("access_token");
  window.location.replace("home.html");
}

// document.addEventListener("DOMContentLoaded", () => {
//   const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

//   const issuesList = document.getElementById("TodayIssues");

//   complaints.forEach((complaint, index) => {
//     const li = document.createElement("li");

//     li.innerHTML = `
//     <div class="complaint-title">
//         <strong>${complaint.title}</strong>
//         <p>Topic: ${complaint.topic || "General"}</p>
//        <small>Anonymous: ${complaint.anonymous}</small>
//     </div>

//     <div class="complaint-body" style="display:none;">
//         <p><b>Topic:</b> ${complaint.title}</p>
//         <p><b>Description:</b> ${complaint.description}</p>
//         <p><b>Latitude:</b> ${complaint.latitude}</p>
//         <p><b>Longitude:</b> ${complaint.longitude}</p>
//         <p><b>Anonymous:</b> ${complaint.anonymous}</p>
//         <p><b>Status:</b> ${complaint.status}</p>
//     </div>
// `;

//     li.style.cursor = "pointer";

//     li.addEventListener("click", () => {
//       localStorage.setItem("selectedComplaint", JSON.stringify(complaint));

//       window.location.href = "complaint_details.html";
//     });

//     issuesList.appendChild(li);
//   });
// });
document.getElementById("complaintDetails").innerHTML =
  "END THE COMPLAINT DETAILS FILE";
