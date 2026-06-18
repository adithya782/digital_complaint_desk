document.addEventListener("DOMContentLoaded", () => {
  const complaintId = new URLSearchParams(window.location.search).get("id");

  // Initial load without a key
  fetchData(complaintId, "");
});

function fetchData(complaintId, key) {
  // Use a query parameter for the key if it exists
  let timelineUrl = `${window.API_BASE_URL}/api/complaint/timeline/${complaintId}`;
  if (key) timelineUrl += `?key=${encodeURIComponent(key)}`;

  // 1. Fetch Details & Timeline (Consolidated Logic)
  fetch(timelineUrl, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  })
    .then((res) => {
      // Handle the Forbidden state
      console.log("Response Status:", res.status);
      if (res.status === 403) {
        document.getElementById("keyEntrySection").style.display = "block";
        document.getElementById("timelineList").innerHTML =
          "<p>Please enter the tracking key to view this complaint.</p>";
        throw new Error("Key Required");
      }
      return res.json();
    })
    .then((data) => {
      // Hide key section if successful
      document.getElementById("keyEntrySection").style.display = "none";

      // Update Status (Assuming backend now returns title/status + timeline)
      document.getElementById("statusBadge").innerText = data.status || "N/A";

      // Update Timeline
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

// Function triggered by the button in track_complaint.html
function fetchWithKey() {
  const complaintId = new URLSearchParams(window.location.search).get("id");
  const key = document.getElementById("manualKeyInput").value;
  fetchData(complaintId, key);
}
