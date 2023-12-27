function createCaptureArea() {
  captureArea = document.createElement("div");
  captureArea.setAttribute("id", "capture-area");
  captureArea.style.border = "2px dashed #000";
  captureArea.style.position = "absolute";
  captureArea.style.display = "none";
  captureArea.style.zIndex = "10000";
  captureArea.style.cursor = "grab";

  resizer = document.createElement("div");
  resizer.style.width = "10px";
  resizer.style.height = "10px";
  resizer.style.background = "blue";
  resizer.style.position = "absolute";
  resizer.style.right = "0";
  resizer.style.bottom = "0";
  resizer.style.cursor = "nwse-resize";
  captureArea.appendChild(resizer);

  okButton = document.createElement("button");
  okButton.innerText = "OK";
  okButton.style.position = "absolute";
  okButton.style.zIndex = "10001"; // Make sure it's above the capture area
  // Position the button - adjust as needed
  okButton.style.bottom = "-30px";
  okButton.style.right = "-30px";
  okButton.addEventListener("click", handleOkButtonClick);
  captureArea.appendChild(okButton);

  closeButton = document.createElement("button");
  closeButton.innerText = "X";
  closeButton.style.position = "absolute";
  closeButton.style.left = "0";
  closeButton.style.top = "0";
  closeButton.style.zIndex = "10002";
  closeButton.addEventListener("click", function () {
    captureArea.remove(); // Remove the captureArea from the DOM
    captureArea = null;
    isCropping = false;
    isResizing = false;
    isMoving = false;
    // document.body.classList.remove("cropping-mode");
    startX = null;
    startY = null;
    endX = null;
    endY = null;
    movingX = null;
    movingY = null;
    document.body.style.cursor = "default";
    document.body.style.pointerEvents = "auto";

    //
  });
  captureArea.appendChild(closeButton);

  return captureArea;
}
let captureArea, resizer, okButton, closeButton;
let startX, startY, endX, endY;
let movingX, movingY;
let isCropping = false,
  isResizing = false,
  isMoving = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "startCropping") {
    showCaptureArea();
    isCropping = true;
    document.body.style.cursor = "crosshair";
    // document.body.classList.add("cropping-mode");
  }
});

function showCaptureArea() {
  if (!captureArea) {
    captureArea = createCaptureArea();
    document.body.appendChild(captureArea);
  }
  captureArea.style.display = "block";
}

document.addEventListener("mousedown", handleMouseDown, true);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);

// okButton.addEventListener("click", handleOkButtonClick);

function handleOkButtonClick() {
  // Calculate the dimensions of the capture area
  let cropWidth = endX - startX;
  let cropHeight = endY - startY;

  // Send a message to the background script to capture the tab
  chrome.runtime.sendMessage({ action: "captureTab" }, (response) => {
    if (response && response.dataUrl) {
      cropImage(
        response.dataUrl,
        { x: startX, y: startY, width: cropWidth, height: cropHeight },
        (croppedDataUrl) => {
          downloadImage(croppedDataUrl, "cropped-image.png");
        }
      );
    } else {
      console.error("Failed to capture tab.");
    }
  });
}

function cropImage(dataUrl, cropArea, callback) {
  const dpr = window.devicePixelRatio || 1; // Get the device pixel ratio
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = cropArea.width * dpr; // Adjust for device pixel ratio
    canvas.height = cropArea.height * dpr; // Adjust for device pixel ratio
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      cropArea.x * dpr, // Adjust x coordinate for device pixel ratio
      cropArea.y * dpr, // Adjust y coordinate for device pixel ratio
      cropArea.width * dpr, // Use cropped width adjusted for device pixel ratio
      cropArea.height * dpr, // Use cropped height adjusted for device pixel ratio
      0,
      0,
      canvas.width,
      canvas.height
    );

    callback(canvas.toDataURL("image/png"));
  };
  image.onerror = () => {
    console.error("Image could not be loaded for cropping.");
  };
  image.src = dataUrl; // Set the source to the data URL of the captured tab
}

function downloadImage(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function updateCaptureAreaCoordinates() {
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  let rect = captureArea.getBoundingClientRect();
  startX = rect.left + scrollX;
  startY = rect.top + scrollY;
  endX = startX + rect.width;
  endY = startY + rect.height;
}

function handleMouseDown(e) {
  if (e.target === resizer) {
    isResizing = true;
  } else if (e.target === captureArea) {
    isMoving = true;
    movingX = e.clientX - captureArea.offsetLeft;
    movingY = e.clientY - captureArea.offsetTop;
    captureArea.style.cursor = "grabbing";
  } else if (isCropping) {
    // This could be the start of defining a new crop area
    startX = e.clientX;
    startY = e.clientY;
    captureArea.style.left = startX + "px";
    captureArea.style.top = startY + "px";
    captureArea.style.width = "0px";
    captureArea.style.height = "0px";
    captureArea.style.display = "block";
  }
  e.preventDefault();
}

function handleMouseMove(e) {
  e.stopPropagation();
  if (isResizing) {
    // Update the dimensions of the capture area during resizing
    captureArea.style.width = `${Math.max(
      10,
      e.clientX - captureArea.offsetLeft
    )}px`;
    captureArea.style.height = `${Math.max(
      10,
      e.clientY - captureArea.offsetTop
    )}px`;
  } else if (isMoving) {
    // Move the capture area
    let newLeft = e.clientX - movingX;
    let newTop = e.clientY - movingY;
    captureArea.style.left = `${newLeft}px`;
    captureArea.style.top = `${newTop}px`;
  } else if (isCropping) {
    // Dynamically update the size of the capture area as the mouse moves
    let width = e.clientX - startX;
    let height = e.clientY - startY;
    captureArea.style.width = `${Math.abs(width)}px`;
    captureArea.style.height = `${Math.abs(height)}px`;
    captureArea.style.left = `${width > 0 ? startX : startX + width}px`;
    captureArea.style.top = `${height > 0 ? startY : startY + height}px`;
  }
}

function handleMouseUp(event) {
  if (isMoving || isResizing || isCropping) {
    // Finalize the position and size of captureArea
    updateCaptureAreaCoordinates();
  }
  isCropping = false;
  isResizing = false;
  isMoving = false;
  // captureArea.style.cursor = "grab";
}
