const darkBtn = document.getElementById("darkModeToggle");

darkBtn.addEventListener("click", () => {

  document.body.classList.toggle("dark-mode");

  // Change icon
  if(document.body.classList.contains("dark-mode")){
    darkBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
  else{
    darkBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }

});
