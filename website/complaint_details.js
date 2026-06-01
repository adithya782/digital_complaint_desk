const complaint =
    JSON.parse(
        localStorage.getItem("selectedComplaint")
    );

const details =
    document.getElementById("complaintDetails");

details.innerHTML = `
    <h2>${complaint.title}</h2>

    <p><b>Description:</b>
    ${complaint.description}</p>

    <p><b>Latitude:</b>
    ${complaint.latitude}</p>

    <p><b>Longitude:</b>
    ${complaint.longitude}</p>

    <p><b>Anonymous:</b>
    ${complaint.anonymous}</p>

    <p><b>Status:</b>
    ${complaint.status}</p>
`;