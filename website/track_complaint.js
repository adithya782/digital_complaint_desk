// 1. Automatic initialization when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const complaintId = new URLSearchParams(window.location.search).get("id");
  if (!complaintId) {
    document.body.innerHTML =
      "<div class='card'><h2>Error</h2><p>No Complaint ID found.</p></div>";
  } else {
    fetchData(complaintId, "");
  }
});

// 2. The main fetching function
function fetchData(complaintId, key) {
  let timelineUrl = `${window.API_BASE_URL}/api/complaint/timeline/${complaintId}`;
  if (key) timelineUrl += `?key=${encodeURIComponent(key)}`;

  fetch(timelineUrl, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  })
    .then((res) => {
      // If forbidden, show the key input
      if (res.status === 403) {
        document
          .getElementById("keyEntrySection")
          .style.setProperty("display", "block", "important");
        document.getElementById("timelineList").innerHTML =
          "<p>Please enter the tracking key to view this complaint.</p>";
        document.getElementById("complaintTitle").innerText =
          "Private Complaint";
        document.getElementById("statusBadge").innerText = "Locked";
        throw new Error("Key Required");
      }
      return res.json();
    })
    .then((data) => {
      // Hide key section on success
      document.getElementById("keyEntrySection").style.display = "none";

      // Update UI
      document.getElementById("complaintTitle").innerText =
        data.title || "Complaint Details";
      document.getElementById("statusBadge").innerText = data.status || "N/A";

      const container = document.getElementById("timelineList");
      container.innerHTML = data.timeline
        .map(
          (e) => `
            <div class="timeline-item">
                <small style="color: #6c757d;">${e.date}</small>
                <p><b>${e.step}:</b> ${e.note}</p>
            </div>
        `,
        )
        .join("");
    })
    .catch((err) => {
      if (err.message !== "Key Required") {
        console.error("Fetch error:", err);
      }
    });
}

// 3. Triggered by the "Submit Key" button
function fetchWithKey() {
  const complaintId = new URLSearchParams(window.location.search).get("id");
  const key = document.getElementById("manualKeyInput").value;
  fetchData(complaintId, key);
}
