document.addEventListener("DOMContentLoaded", () => {
  const complaintId = new URLSearchParams(window.location.search).get("id");

  // Fetch details and timeline
  fetch(`${window.API_BASE_URL}/api/complaints/${complaintId}`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const c = data[0];
      document.getElementById("statusBadge").innerText = c.status;
    });

  fetch(`${window.API_BASE_URL}/api/complaint/timeline/${complaintId}`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  })
    .then((res) => res.json())
    .then((events) => {
      const container = document.getElementById("userTimeline");
      container.innerHTML = events
        .map(
          (e) => `
            <div class="timeline-item">
                <small style="color: #6c757d;">${new Date(e.timestamp).toLocaleDateString()}</small>
                <p>${e.description}</p>
            </div>
        `,
        )
        .join("");
    });
});
