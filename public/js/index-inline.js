// Initializes the Vanilla LazyLoad library globally for all images with the '.lazy' class.
const lazyLoadInstance = new LazyLoad({
    elements_selector: ".lazy"
});

// Executes scripts once the DOM is fully loaded to ensure all elements are available.
document.addEventListener('DOMContentLoaded', () => {
    // Adds a 'sticky' class to the navbar when the page is scrolled more than 50 pixels,
    // and removes it when scrolled back to the top.
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('sticky');
            } else {
                navbar.classList.remove('sticky');
            }
        });
    }

    // Triggers an initial search the first time the user focuses on the search input field.
    let hasSearchedOnFocus = false;
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            if (!hasSearchedOnFocus && typeof handleSearch === 'function') {
                handleSearch(null, 1); // Assumes handleSearch is globally available
                hasSearchedOnFocus = true;
            }
        });
    }

    // Attaches a click event listener to the 'randomize' button to fetch new random animes.
    const randomizeBtn = document.getElementById('randomizeBtn');
    if (randomizeBtn && typeof fetchRandomAnimes === 'function') {
        randomizeBtn.addEventListener('click', fetchRandomAnimes); // Assumes fetchRandomAnimes is globally available
    }

    // Handles the theme toggle functionality, switching between light and dark themes
    // and saving the user's preference in local storage.
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light');
        });
    }

    // Checks local storage on page load and applies the dark theme if it was previously selected.
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-theme');
    }

    // Attaches a submit event listener to the main search form to handle search queries.
    const searchForm = document.getElementById('search-form');
    if (searchForm && typeof handleSearch === 'function') {
        searchForm.addEventListener('submit', (event) => {
            handleSearch(event);
        });
    }

    // Adds a confirmation prompt to the logout form before submitting.
    const logoutForm = document.querySelector('form[action="/auth/logout"]');
    if (logoutForm) {
        logoutForm.addEventListener('submit', (event) => {
            if (!confirm('Are you sure you want to log out?')) {
                event.preventDefault();
            }
        });
    }
});
