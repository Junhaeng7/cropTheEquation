let captureArea = document.createElement("div");
captureArea.setAttribute("id", "capture-area");
captureArea.style.border = "2px dashed #000";
captureArea.style.position = "absolute";
captureArea.style.display = "none";
captureArea.style.zIndex = "10000"; // High z-index value
captureArea.style.cursor = "grab";
document.body.appendChild(captureArea);

let resizer = document.createElement("div");
resizer.style.width = "10px";
resizer.style.height = "10px";
resizer.style.background = "blue";
resizer.style.position = "absolute";
resizer.style.right = "0";
resizer.style.bottom = "0";
resizer.style.cursor = "nwse-resize";
captureArea.appendChild(resizer);

let okButton = document.createElement("button");
okButton.innerText = "OK";
okButton.style.position = "absolute";
okButton.style.zIndex = "10001"; // Make sure it's above the capture area
// Position the button - adjust as needed
okButton.style.bottom = "-30px";
okButton.style.right = "-30px";

captureArea.appendChild(okButton);

let startX, startY, endX, endY;
let movingX, movingY;
let isCropping = false,
  isResizing = false,
  isMoving = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "startCropping") {
    isCropping = true;
    captureArea.style.display = "block";
    document.body.classList.remove("grab-cursor");
  }
});

document.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);

okButton.addEventListener("click", handleOkButtonClick);

function handleOkButtonClick() {
  if (endX <= startX || endY <= startY) {
    console.error("Invalid crop dimensions.");
    return;
  }

  // Calculate the dimensions of the capture area
  let cropWidth = endX - startX;
  let cropHeight = endY - startY;

  console.error(cropWidth);

  // Ensure that the canvas dimensions are scaled by the device pixel ratio
  let dpr = window.devicePixelRatio || 1;
  cropWidth *= dpr;
  cropHeight *= dpr;

  // Ensure non-zero width and height
  if (cropWidth <= 0 || cropHeight <= 0) {
    console.error("Invalid crop dimensions.");
    return;
  }

  // Use html2canvas to capture just the desired portion of the screen
  html2canvas(document.body, {
    useCORS: true, // Allows images from external domains to be loaded (if CORS policy allows)
    // scale: window.devicePixelRatio, // Adjust for device pixel ratio
    x: startX, // Starting X coordinate
    y: startY, // Starting Y coordinate
    width: cropWidth, // Width of the capture area
    height: cropHeight, // Height of the capture area
    logging: true,
  }).then((canvas) => {
    let croppedCanvas = document.createElement("canvas");
    let ctx = croppedCanvas.getContext("2d");

    // Set the dimensions of the cropped canvas
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    // Draw the captured area onto the new canvas
    ctx.drawImage(
      canvas,
      0,
      0,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Convert the canvas to a data URL and then to a blob
    croppedCanvas.toBlob(function (blob) {
      let url = URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = url;
      a.download = "cropped-image.png";
      a.click();
      URL.revokeObjectURL(url); // Clean up the URL object
    }, "image/png");

    // captureArea.style.display = "none";
    // captureArea.style.width = "0px";
    // captureArea.style.height = "0px";
    // startX = 0;
    // startY = 0;
    // endX = 0;
    // endY = 0;
    // isCropping = false;
    // isResizing = false;
    // isMoving = false;
  });

  // Optionally, hide or remove the capture area and the button
}

// function handleOkButtonClick() {
//   let dpr = window.devicePixelRatio || 1;
//   let adjustedStartX = (startX + window.scrollX) * dpr;
//   let adjustedStartY = (startY + window.scrollY) * dpr;
//   let cropWidth = (endX - startX) * dpr;
//   let cropHeight = (endY - startY) * dpr;
//   // Use html2canvas to capture the entire body
//   html2canvas(document.body, {
//     useCORS: true, // This is important for loading images from external domains
//     onclone: function (clonedDoc) {
//       // Hide everything except the capture area in the cloned document
//       clonedDoc.body.style.overflow = "hidden";
//       clonedDoc.documentElement.scrollTop = 0;
//       clonedDoc.documentElement.scrollLeft = 0;

//       console.log(adjustedStartX, startX, cropHeight, cropWidth);

//       let clonedCaptureArea = clonedDoc.getElementById("capture-area");
//       if (clonedCaptureArea) {
//         clonedCaptureArea.style.border = "none";
//         clonedCaptureArea.style.top = `${adjustedStartY}px`;
//         clonedCaptureArea.style.left = `${adjustedStartX}px`;
//         clonedCaptureArea.style.width = `${cropWidth}px`;
//         clonedCaptureArea.style.height = `${cropHeight}px`;
//         clonedCaptureArea.style.position = "absolute";
//         clonedCaptureArea.style.zIndex = "9999";
//       }
//     },
//   }).then((canvas) => {
//     let croppedCanvas = document.createElement("canvas");
//     let ctx = croppedCanvas.getContext("2d");

//     croppedCanvas.width = cropWidth;
//     croppedCanvas.height = cropHeight;

//     // Draw the cropped area onto the new canvas
//     ctx.drawImage(
//       canvas,
//       adjustedStartX,
//       adjustedStartY,
//       cropWidth,
//       cropHeight,
//       0,
//       0,
//       cropWidth,
//       cropHeight
//     );

//     // Convert the canvas to a data URL and then to a blob
//     croppedCanvas.toBlob(function (blob) {
//       let url = URL.createObjectURL(blob);
//       let a = document.createElement("a");
//       a.href = url;
//       a.download = "cropped-image.png";
//       a.click();
//     }, "image/png");
//   });

//   // Optionally, hide or remove the capture area and the button
//   captureArea.style.display = "none";
// }

function updateCaptureAreaCoordinates() {
  let rect = captureArea.getBoundingClientRect();
  startX = rect.left + window.scrollX;
  startY = rect.top + window.scrollY;
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
  }
  e.preventDefault();
}

function handleMouseMove(e) {
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

  // Reset the interaction flags and cursor style
  isCropping = false;
  isResizing = false;
  isMoving = false;
  captureArea.style.cursor = "grab";
}
