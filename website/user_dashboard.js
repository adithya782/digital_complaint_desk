// SIDEBAR

const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

// TOGGLE

menuBtn.addEventListener("click", function(){

  sidebar.classList.toggle("close");

});
// SELECT ALL PAGE BUTTONS

const buttons = document.querySelectorAll(".page-btn");

// CHECK BUTTONS

buttons.forEach((btn) => {

  btn.addEventListener("click", () => {

    alert(btn.innerText + " button clicked");

    console.log("Real button working:", btn);

  });

});
// CALL BUTTON

document.querySelector(".call-btn")
.addEventListener("click", () => {

  alert("Calling Emergency Contact");

});

// MESSAGE BUTTON

document.querySelector(".msg-btn")
.addEventListener("click", () => {

  alert("Opening Emergency Message");

});