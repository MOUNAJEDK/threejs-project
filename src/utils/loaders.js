let assetsLoaded = 0;

export function updateLoadingProgress() {
  assetsLoaded++;
  if (assetsLoaded >= 19) {
    hideLoadingScreen();
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}