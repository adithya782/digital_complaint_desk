// FILE COMPLAINT PAGE OPEN

document.getElementById("fileComplaintBtn")
.addEventListener("click", function(){

  window.location.href = "file_complaint.html";

});
// LOCATION ACCESS

function getLocation() {

  if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

      function (position) {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        document.getElementById("location").value =
          latitude + ", " + longitude;

      },

      function (error) {

        alert("Location access denied!");

      }

    );

  } else {

    alert("Geolocation is not supported");

  }

}