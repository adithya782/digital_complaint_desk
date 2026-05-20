const darkBtn = document.getElementById("darkModeToggle");

// LOAD saved theme when page opens
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  if (darkBtn) {
    darkBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
} else {
  if (darkBtn) {
    darkBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// TOGGLE BUTTON
if (darkBtn) {
  darkBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    // SAVE theme globally
    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
      darkBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      localStorage.setItem("theme", "light");
      darkBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

  });
}