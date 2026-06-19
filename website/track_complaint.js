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
      // 1. Check status first!
      if (res.status === 403) {
        return res.json().then((data) => {
          if (data.requires_key) {
            // ONLY show the key box if the server says it's required
            document.getElementById("keyEntrySection").style.display = "block";
            document.getElementById("timelineList").innerHTML =
              "<p>Enter tracking key.</p>";
          } else {
            // Otherwise, tell the user they don't have access
            alert("You do not have permission to view this.");
          }
          throw new Error("Access Denied");
        });
      }
      return res.json(); // Only parse if 200 OK
    })
    .then((data) => {
      document.getElementById("keyEntrySection").style.display = "none";

      document.getElementById("complaintTitle").innerText =
        data.title || "Complaint";
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
        console.error("Critical Error:", err);
      }
    });
}

// 3. Triggered by the "Submit Key" button
function fetchWithKey() {
  const complaintId = new URLSearchParams(window.location.search).get("id");
  const key = document.getElementById("manualKeyInput").value;
  fetchData(complaintId, key);
}
