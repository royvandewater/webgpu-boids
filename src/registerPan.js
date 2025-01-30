export function registerPan(canvas, callback) {
  let mouseDown = false;

  canvas.addEventListener("pointerdown", (event) => {
    mouseDown = true;
  });

  canvas.addEventListener("pointerup", (event) => {
    mouseDown = false;
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!mouseDown) return;

    callback({
      dx: -event.movementX,
      dy: event.movementY,
    });
  });
}
