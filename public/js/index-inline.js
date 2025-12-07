// Initialize LazyLoad globally
const lazyLoadInstance = new LazyLoad({
    elements_selector: ".lazy"
});

document.addEventListener('DOMContentLoaded', () => {
    // Sticky Navbar
    // Adds a 'sticky' class to the navbar when the user scrolls down.
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

    // Search on focus
    // Triggers a search the first time the search input is focused.
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

    // Randomize button event listener
    // Attaches a click event to the randomize button.
    const randomizeBtn = document.getElementById('randomizeBtn');
    if (randomizeBtn && typeof fetchRandomAnimes === 'function') {
        randomizeBtn.addEventListener('click', fetchRandomAnimes); // Assumes fetchRandomAnimes is globally available
    }

    // Theme toggle functionality
    // Toggles the 'dark-theme' class and saves the preference to local storage.
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light');
        });
    }

    // Load saved theme from local storage
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-theme');
    }

    // Search form submission
    const searchForm = document.getElementById('search-form');
    if (searchForm && typeof handleSearch === 'function') {
        searchForm.addEventListener('submit', (event) => {
            handleSearch(event);
        });
    }

    // Logout form submission
    const logoutForm = document.querySelector('form[action="/auth/logout"]');
    if (logoutForm) {
        logoutForm.addEventListener('submit', (event) => {
            if (!confirm('Are you sure you want to log out?')) {
                event.preventDefault();
            }
        });
    }
});
