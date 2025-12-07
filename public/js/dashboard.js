document.addEventListener("DOMContentLoaded", () => {
    // Temporarily disable watchlist buttons after a click to prevent multiple rapid submissions.
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
