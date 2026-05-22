// SIDEBAR
const sidebar = document.getElementById("sidebar");

// MENU BUTTON
const menuBtn = document.getElementById("menuBtn");

// CLICK EVENT
menuBtn.addEventListener("click", () => {

  // TOGGLE SIDEBAR
  sidebar.classList.toggle("close");

});
// SELECT ALL STAT BUTTONS
const statButtons = document.querySelectorAll(".stat-card");

// LOOP BUTTONS
statButtons.forEach((button) => {

  // CLICK EVENT
  button.addEventListener("click", () => {

    // REMOVE ACTIVE FROM ALL
    statButtons.forEach((btn) => {
      btn.classList.remove("active-card");
    });

    // ADD ACTIVE TO CLICKED BUTTON
    button.classList.add("active-card");

    // GET BUTTON TITLE
    const title = button.querySelector("h4").innerText;

    // CHECK WHICH BUTTON CLICKED
    if(title === "Today's Issues"){
      alert("Opening Today's Issues");
    }

    else if(title === "Pending Issues"){
      alert("Opening Pending Issues");
    }

    else if(title === "Resolved Today"){
      alert("Opening Resolved Issues");
    }

    else if(title === "Total Reports"){
      alert("Opening Total Reports");
    }

  });

});
// SELECT ALL SIDEBAR BUTTONS
const sideButtons = document.querySelectorAll(".side-btn");

// LOOP ALL BUTTONS
sideButtons.forEach((button) => {

  // CLICK EVENT
  button.addEventListener("click", () => {

    // REMOVE ACTIVE CLASS FROM ALL
    sideButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    // ADD ACTIVE CLASS TO CLICKED BUTTON
    button.classList.add("active");

    // GET BUTTON NAME
    const btnText = button.querySelector(".text").innerText;

    // CHECK BUTTON
    if(btnText === "Dashboard"){
      alert("Dashboard Opened");
    }

    else if(btnText === "History"){
      alert("History Opened");
    }

    else if(btnText === "Transactions"){
      alert("Transactions Opened");
    }

    else if(btnText === "Profile"){
      alert("Profile Opened");
    }

    else if(btnText === "Logout"){

      let checkLogout = confirm("Are you sure want to logout?");

      if(checkLogout){
        alert("Logged Out Successfully");
      }

    }

  });

});
// select buttons
const msgBtn = document.querySelector(".msg-btn");
const reportBtn = document.querySelector(".report-btn");

// Send Message button
msgBtn.addEventListener("click", () => {
    console.log("Send Message clicked");
    alert("Message feature opened");
});

// Generate Report button
reportBtn.addEventListener("click", () => {
    console.log("Generate Report clicked");

    let reportId = "RPT" + Math.floor(Math.random() * 1000);

    alert("Report Generated: " + reportId);

    // optional: add to page
    const p = document.createElement("p");
    p.textContent = "New Report: " + reportId;
    document.body.appendChild(p);
});
const profileBox = document.getElementById("profileBox");

profileBox.addEventListener("click", () => {
    profileBox.classList.toggle("expanded");

    const details = profileBox.querySelector(".profile-details");
    details.classList.toggle("hidden");
});