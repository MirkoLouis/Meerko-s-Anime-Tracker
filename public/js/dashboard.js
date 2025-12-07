// Executes scripts once the DOM is fully loaded to ensure all elements are available.
document.addEventListener("DOMContentLoaded", () => {
    // Selects watchlist-related buttons and adds a click event listener to prevent rapid, duplicate submissions.
    // When a button is clicked, it's disabled for 500ms.
    const buttonSelectors = [
        "#myListBtn",
        "#myCompletedAnimesBtn"
    ];

    buttonSelectors.forEach(selector => {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.addEventListener("click", () => {
                // Disable the button to prevent rapid clicks
                btn.disabled = true;
                // Re-enable the button after a short delay
                setTimeout(() => {
                    btn.disabled = false;
                }, 500); // 500ms delay
            });
        }
    });
});
