document.addEventListener("DOMContentLoaded", () => {
  // 1. Get ID from URL (e.g., complaint_details.html?id=101)
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get("id");
  const detailsContainer = document.getElementById("complaintDetails");

  if (!complaintId) {
    detailsContainer.innerHTML = "<p>Error: No complaint selected.</p>";
    return;
  }

  // 2. Fetch the details from your API
  // Ensure API_BASE_URL is defined globally or replace with your actual domain
  const url = `${window.API_BASE_URL}/api/complaints/${complaintId}`;
  console.log("Attempting to fetch from:", url);
  fetch(`${window.API_BASE_URL}/api/complaints/${complaintId}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch complaint details");
      return response.json();
    })
    .then((data) => {
      const complaint = data[0];
      // 3. Render the fetched data
      let evidenceHtml = "";
      if (complaint.evidence_url) {
        evidenceHtml = `
            <p><b>Evidence:</b></p>
            <img src="${complaint.evidence_url}" alt="Evidence" style="max-width: 100%; border-radius: 8px; margin-bottom: 10px;">
        `;
      } else {
        evidenceHtml = `<p><b>Evidence:</b> No evidence provided.</p>`;
      }

      // Build the HTML structure
      detailsContainer.innerHTML = `
    <h2 style="margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
        ${complaint.title}
    </h2>
    
    <div class="info-grid">
        <div class="data-row"><span class="label">Status:</span> <span class="value badge">${complaint.status}</span></div>
        <div class="data-row"><span class="label">Anonymous:</span> <span class="value">${complaint.anonymous ? "Yes" : "No"}</span></div>
        <div class="data-row"><span class="label">Location:</span> <span class="value">${complaint.latitude}, ${complaint.longitude}</span></div>
    </div>

    <div style="margin-top: 20px;">
        <p class="label" style="margin-bottom: 5px;">Description:</p>
        <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #6d52ff;">
            ${complaint.description}
        </p>
    </div>

    <div style="margin-top: 20px;">
        ${evidenceHtml}
    </div>
`;
    })
    .catch((err) => {
      console.error(err);
      detailsContainer.innerHTML = `<p>Error loading complaint: ${err.message}</p>`;
    });
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

      // Clear loading or existing
      timelineList.innerHTML = "";

      // Loop through the timeline array provided by Flask
      data.timeline.forEach((step) => {
        const li = document.createElement("li");
        li.className = "timeline-item"; // Apply the new styling class
        li.innerHTML = `
    <strong>${step.step}</strong> <br>
    <small style="color: #666;">${step.date}</small><br>
    <p style="margin: 5px 0 0 0;">${step.note}</p>
  `;
        timelineList.appendChild(li);
      });
    })
    .catch((err) => console.error("Timeline error:", err));
});
function updateComplaint(newStatus, isFinal) {
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get("id");
  const description = document.getElementById("actionDescription").value;

  if (!description) {
    alert("Please provide details for this action.");
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
      is_final: isFinal, // Backend will use this to toggle Resolution creation
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert("Action recorded successfully!");
      // If it's final, redirect to dashboard; otherwise, stay to add more updates
      if (isFinal) {
        window.location.href = "staff_dashboard.html";
      } else {
        location.reload();
      }
    })
    .catch((err) => console.error(err));
}
