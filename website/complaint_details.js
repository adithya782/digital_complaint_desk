document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get("id");
  const detailsContainer = document.getElementById("complaintDetails");

  if (!complaintId) {
    detailsContainer.innerHTML = "<p>Error: No complaint selected.</p>";
    return;
  }

  // 1. Fetch main complaint details
  fetch(`${window.API_BASE_URL}/api/complaints/${complaintId}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const complaint = data[0];

      // Define Evidence Display
      const evidenceHtml = complaint.evidence_url
        ? `<img src="${complaint.evidence_url}" alt="Evidence" style="max-width: 100%; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border-light);">`
        : `<span class="value" style="color: var(--text-muted);">No evidence provided.</span>`;

      // Render using the Cyber Theme structural classes
      detailsContainer.innerHTML = `
            <h3><i class="fa-solid fa-folder-open"></i> Core Registry Data</h3>
            <div class="data-row"><span class="label">Case Title</span> <span class="value">${complaint.title}</span></div>
            <div class="data-row"><span class="label">Status</span> <span class="value" style="color: var(--primary-accent);">${complaint.status}</span></div>
            <div class="data-row"><span class="label">Anonymous</span> <span class="value">${complaint.anonymous ? "Yes" : "No"}</span></div>
            <div class="data-row"><span class="label">Coordinates</span> <span class="value">${complaint.latitude}, ${complaint.longitude}</span></div>
            
            <div style="margin-top: 20px;">
                <div class="label" style="margin-bottom: 8px;">Description:</div>
                <div style="background: rgba(15, 23, 42, 0.4); padding: 14px; border-radius: 8px; border: 1px solid var(--border-light); font-size: 14px; line-height: 1.5;">
                    ${complaint.description}
                </div>
            </div>

            <div style="margin-top: 20px;">
                <div class="label">Evidence:</div>
                ${evidenceHtml}
            </div>
        `;
    })
    .catch((err) => {
      console.error(err);
      detailsContainer.innerHTML = `<p>Error loading complaint.</p>`;
    });

  // 2. Fetch timeline
  fetch(`${window.API_BASE_URL}/api/complaint/timeline/${complaintId}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const timelineList = document.getElementById("timelineList");
      timelineList.innerHTML = data.timeline
        .map(
          (step) => `
            <li class="timeline-item">
                <strong style="color: var(--text-main);">${step.step}</strong><br>
                <small style="color: var(--text-muted);">${step.date}</small>
                <p style="margin-top: 5px; font-size: 13px;">${step.note}</p>
            </li>
        `,
        )
        .join("");
    })
    .catch((err) => console.error("Timeline error:", err));
});

function updateComplaint(newStatus, isFinal) {
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get("id");
  const description = document.getElementById("actionDescription").value;

  if (!description) {
    alert("Please provide operational directives.");
    return;
  }

  fetch(`${window.API_BASE_URL}/api/complaints/${complaintId}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: newStatus,
      description: description,
      is_final: isFinal,
    }),
  })
    .then(() => {
      alert("Directive logged.");
      isFinal
        ? (window.location.href = "staff_dashboard.html")
        : location.reload();
    })
    .catch((err) => console.error(err));
}
