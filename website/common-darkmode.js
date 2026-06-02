document.addEventListener("DOMContentLoaded", () => {

    const darkBtn = document.getElementById("darkModeToggle");

    // Apply saved theme
    const theme = localStorage.getItem("theme");

    if (theme === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    // Set icon on load
    if (darkBtn) {
        darkBtn.innerHTML = document.body.classList.contains("dark")
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
    }

    // Toggle theme
    if (darkBtn) {
        darkBtn.addEventListener("click", () => {

            document.body.classList.toggle("dark");

            const isDark = document.body.classList.contains("dark");

            localStorage.setItem("theme", isDark ? "dark" : "light");

            darkBtn.innerHTML = isDark
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
        });
    }

});