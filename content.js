function showScreenshot(dataUrl) {
  const screenshotBox = document.createElement("div");
  screenshotBox.style.position = "fixed";
  screenshotBox.style.top = "0";
  screenshotBox.style.left = "0";
  screenshotBox.style.width = "100%";
  screenshotBox.style.height = "100%";
  screenshotBox.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  screenshotBox.style.zIndex = "999999";
  screenshotBox.innerHTML =
    '<img src="' +
    dataUrl +
    '" style="display:block;margin:auto;max-width:80%;max-height:80%;">';
  document.body.appendChild(screenshotBox);

  // Close screenshot box when clicked
  screenshotBox.addEventListener("click", function () {
    document.body.removeChild(screenshotBox);
  });
}
