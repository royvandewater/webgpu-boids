import { assert } from "./assert.js";
import { buildCompute } from "./compute.js";
import { buildRender } from "./render.js";
import { generate } from "./generate.js";
import { FpsTracker } from "./fpsTracker.js";
import { readBoidsBuffer } from "./readGpuBuffer.js";
import { registerPinchZoom } from "./registerPinchZoom.js";
import { registerPan } from "./registerPan.js";

async function main() {
  assert(
    globalThis.navigator,
    "window.navigator is not defined, WebGPU is not supported"
  );

  const searchParams = new URLSearchParams(window.location.search);

  const numBoids = searchParams.get("numBoids") ?? 3;
  const seed = searchParams.get("seed") ?? 0;

  const adapter = await navigator.gpu.requestAdapter();

  // Our biggest buffer will need to be numBoids * 3 vertices that are each 3 floats that are each 4 bytes
  const bytesPerBoid = 3 * 3 * 4;
  const minBufferSize = numBoids * bytesPerBoid;
  const maxBufferSize = adapter.limits.maxBufferSize;
  const maxStorageBufferBindingSize =
    adapter.limits.maxStorageBufferBindingSize;
  assert(
    maxBufferSize >= minBufferSize,
    new Error(
      `Max buffer size (${maxBufferSize}) is too small, need at least ${minBufferSize} for ${numBoids} boids. Max number of boids is ${
        maxBufferSize / bytesPerBoid
      }`
    )
  );
  assert(
    maxStorageBufferBindingSize >= minBufferSize,
    new Error(
      `Max storage buffer binding size (${maxStorageBufferBindingSize}) is too small, need at least ${minBufferSize} for ${numBoids} boids. Max number of boids is ${
        maxStorageBufferBindingSize / bytesPerBoid
      }`
    )
  );

  const device = await adapter.requestDevice({
    requiredLimits: {
      maxBufferSize: minBufferSize,
      maxStorageBufferBindingSize: minBufferSize,
    },
  });
  assert(device, new Error("Failed to get WebGPU device"));
  const canvas = document.querySelector("canvas");

  let { boidsIn, boidsOut, vertices } = await generate({
    device,
    numBoids,
    seed,
  });

  const boidsArray = await readBoidsBuffer({ device, buffer: boidsIn });
  console.log("boidsArray", JSON.stringify(boidsArray, null, 2));

  const fpsTracker = new FpsTracker();
  const compute = await buildCompute({ device, numBoids });
  const render = await buildRender({ canvas, device, numBoids });

  const camera = {
    position: { x: 0, y: 0 },
    zoom: 1,
  };
  registerPinchZoom(document.querySelector("canvas#boids"), (amount) => {
    camera.zoom *= 1 + amount / 100;
  });

  registerPan(document.querySelector("canvas#boids"), ({ dx, dy }) => {
    const scale = 0.001;
    camera.position.x += (dx * scale) / camera.zoom;
    camera.position.y += (dy * scale) / camera.zoom;
  });

  const frame = async () => {
    await compute({ boidsIn, boidsOut, vertices });
    await render({ boids: boidsOut, camera, vertices });
    [boidsIn, boidsOut] = [boidsOut, boidsIn];
    fpsTracker.update();
    document.getElementById("fps").textContent = `${fpsTracker.fps} fps`;
    requestAnimationFrame(frame);
  };
  frame();
}

await main();
