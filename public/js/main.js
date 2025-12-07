document.addEventListener('DOMContentLoaded', async () => {
    // Get currentUser from global variable set in Handlebars template
    const currentUser = window.currentUser;

    if (window.location.pathname.includes('/anime/')) {
        await fetchAnimeDetails(currentUser);
        // Attach event listener for comment form submission
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (event) => submitComment(event, currentUser));
        }
    } else if (window.location.pathname.includes('/dashboard')) {
        if (currentUser) {
            populateDashboardSpotlight();
        }
        fetchNewAnimes();
        fetchUpcomingAnimes();
        fetchRecommendedAnimes();
        fetchMostwatchlistAnimes();
        fetchRandomAnimes();
    } else {
        // Homepage
        if (document.getElementById('spotlight-section')) {
            populateAnimeSpotlight();
            rotateSpotlight();
        }
        if (document.querySelector('.new-carousel-inner')) {
            fetchNewAnimes();
        }
        if (document.querySelector('.upcoming-carousel-inner')) {
            fetchUpcomingAnimes();
        }
        if (document.querySelector('.swiper-wrapper')) {
            fetchRecommendedAnimes();
        }
        if (document.querySelector('#mostWatchlistCarouselInner')) {
            fetchMostwatchlistAnimes();
        }
        if (document.getElementById('random-animes')) {
            fetchRandomAnimes();
        }
    }
    console.log("DOM Fully Loaded");

    // Delegated event listener for all "Add to Watchlist" buttons
    document.addEventListener('click', function(event) {
        // Find the closest parent button with the target class
        const watchlistBtn = event.target.closest('.add-watchlist-button-hover');

        if (watchlistBtn) {
            event.preventDefault(); // Prevent default anchor behavior
            const animeId = watchlistBtn.dataset.animeId;
            if (animeId && typeof addToWatchlist === 'function') {
                addToWatchlist(animeId);
            }
        }
    });
});
