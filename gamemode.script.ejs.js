function init(mode) {
    console.log("Mode loaded:", mode);

    const overlay = document.querySelector(".loadingOverlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

function incentive() {
    // При нажатии PLAY открываем саму игру
    window.location.href = "/modes/twoPlayer/c/game.html";
}
