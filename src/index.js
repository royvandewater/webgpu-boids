import { assert } from "./assert.js";
import { buildCompute } from "./compute.js";
import { buildRender } from "./render.js";
import { generate } from "./generate.js";
import { FpsTracker } from "./fpsTracker.js";
import { registerPinchZoom } from "./registerPinchZoom.js";
import { registerPan } from "./registerPan.js";

async function main() {
  assert(globalThis.navigator, "window.navigator is not defined, WebGPU is not supported");

  const searchParams = new URLSearchParams(window.location.search);

  const numBoids = Number(searchParams.get("numBoids")) || 1000;
  const seed = Number(searchParams.get("seed")) || Math.floor(Math.random() * 1000000);
  const separationForceStrength = Number(searchParams.get("separation")) || 10;
  const alignmentForceStrength = Number(searchParams.get("alignment")) || 50;
  const cohesionForceStrength = Number(searchParams.get("cohesion")) || 5;
  const speed = Number(searchParams.get("speed")) || 1000;
  const visionDistance = Number(searchParams.get("vision")) || 200;

  assert(Number.isInteger(numBoids), "numBoids must be an integer");
  assert(Number.isInteger(seed), "seed must be an integer");
  assert(Number.isInteger(separationForceStrength), "separation must be an integer");
  assert(Number.isInteger(alignmentForceStrength), "alignment must be an integer");
  assert(Number.isInteger(cohesionForceStrength), "cohesion must be an integer");
  assert(Number.isInteger(speed), "speed must be an integer");
  assert(Number.isInteger(visionDistance), "vision must be an integer");

  const adapter = await navigator.gpu.requestAdapter();

  // Our biggest buffer will be the vertices buffer, which needs to be
  // numBoids * 3 vertices that are each 4 floats that are each 4 bytes
  const bytesPerBoid = 3 * 4 * 4; // 48
  const minBufferSize = numBoids * bytesPerBoid;
  const maxBufferSize = adapter.limits.maxBufferSize;
  const maxStorageBufferBindingSize = adapter.limits.maxStorageBufferBindingSize;
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
    const scale = 0.001 * Math.pow(camera.zoom, 1 / 100);
    camera.position.x += dx * scale;
    camera.position.y += dy * scale;
  });

  const frame = async () => {
    const forceStrengths = [separationForceStrength, alignmentForceStrength, cohesionForceStrength, speed];
    await compute({ boidsIn, boidsOut, vertices, forceStrengths, visionDistance });
    await render({ boids: boidsOut, camera, vertices });
    [boidsIn, boidsOut] = [boidsOut, boidsIn];

    fpsTracker.update();
    document.getElementById("fps").textContent = `${fpsTracker.fps} fps`;
    requestAnimationFrame(frame);
  };
  frame();
}

await main();
