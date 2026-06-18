document.addEventListener("DOMContentLoaded", () => {
  // 1. Fetch all complaints by this user to populate the list
  // In track_portal.js
  fetch(`${window.API_BASE_URL}/api/user/dashboard`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  })
    .then((res) => res.json())
    .then((data) => {
      // data.complaints now contains the complaint_id you need!
      const list = document.getElementById("userComplaintsList");
      list.innerHTML = data.complaints
        .map(
          (c) => `
        <div class="complaint-item" onclick="window.location.href='track_complaint.html?id=${c.complaint_id}'">
            <strong>${c.title}</strong><br>
            <small>Status: ${c.status}</small>
        </div>
    `,
        )
        .join("");
    });
});

// Manual track
function trackById() {
  const id = document.getElementById("complaintIdInput").value;
  if (id) window.location.href = `track_complaint.html?id=${id}`;
}

// Auto-fill and track
function fillAndTrack(id) {
  window.location.href = `track_complaint.html?id=${id}`;
}
