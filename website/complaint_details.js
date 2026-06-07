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
      detailsContainer.innerHTML = `
            <h2>${complaint.title}</h2>
            <p><b>Description:</b> ${complaint.description}</p>
            <p><b>Latitude:</b> ${complaint.latitude}</p>
            <p><b>Longitude:</b> ${complaint.longitude}</p>
            <p><b>Anonymous:</b> ${complaint.anonymous ? "Yes" : "No"}</p>
            <p><b>Status:</b> ${complaint.status}</p>
        `;
    })
    .catch((err) => {
      console.error(err);
      detailsContainer.innerHTML = `<p>Error loading complaint: ${err.message}</p>`;
    });
});
