export const registerPinchZoom = (canvas, onZoom) => {
  registerDesktopPinchZoom(canvas, onZoom);
  registerMobilePinchZoom(canvas, onZoom);
};

const registerDesktopPinchZoom = (canvas, onZoom) => {
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      onZoom(-event.deltaY);
    },
    { passive: false }
  );
};

/** Maybe this makes more sense as a class since we're kinda emulating a class anyway? */
const registerMobilePinchZoom = (canvas, onZoom) => {
  const evCache = {};
  let prevDiff = -1;
  const scale = 0.25;

  canvas.onpointerdown = pointerdownHandler;
  canvas.onpointermove = pointermoveHandler;

  canvas.onpointerup = pointerupHandler;
  canvas.onpointercancel = pointerupHandler;
  canvas.onpointerout = pointerupHandler;
  canvas.onpointerleave = pointerupHandler;

  function pointerdownHandler(ev) {
    evCache[ev.pointerId] = ev;
  }

  function pointerupHandler(ev) {
    delete evCache[ev.pointerId];

    if (Object.keys(evCache).length < 2) {
      prevDiff = -1;
    }
  }

  function pointermoveHandler(ev) {
    evCache[ev.pointerId] = ev;

    if (Object.keys(evCache).length === 2) {
      const [pointer0, pointer1] = Object.values(evCache);

      const curDiff =
        Math.abs(pointer0.clientX - pointer1.clientX) +
        Math.abs(pointer0.clientY - pointer1.clientY);

      if (prevDiff > 0 && curDiff !== prevDiff) {
        onZoom(-scale * (prevDiff - curDiff));
      }

      prevDiff = curDiff;
    }
  }
};
