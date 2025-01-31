import { assert } from "./assert.js";

/**
 * @param {{device: GPUDevice, buffer: GPUBuffer}} options
 */
export const readFloat32Buffer = async ({ device, buffer }) => {
  assert(
    buffer.size % 4 === 0,
    "Buffer must be divisible by 4 (4 bytes per f32)"
  );
  const resultBuffer = device.createBuffer({
    label: "result buffer",
    size: buffer.size,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const encoder = device.createCommandEncoder({ label: "read buffer encoder" });
  encoder.copyBufferToBuffer(buffer, 0, resultBuffer, 0, resultBuffer.size);
  device.queue.submit([encoder.finish()]);
  await device.queue.onSubmittedWorkDone();
  await resultBuffer.mapAsync(GPUMapMode.READ);

  return new Float32Array(resultBuffer.getMappedRange());
};

/**
 * @param {{device: GPUDevice, buffer: GPUBuffer}} options
 */
export const readVec3fBuffer = async ({ device, buffer }) => {
  assert(
    buffer.size % 12 === 0,
    "Buffer must be divisible by 12 (3 values of 4 bytes)"
  );
  const resultBuffer = await readFloat32Buffer({ device, buffer });

  const result = [];

  for (let i = 0; i < resultBuffer.length; i += 3) {
    result.push({
      x: resultBuffer[i],
      y: resultBuffer[i + 1],
      z: resultBuffer[i + 2],
    });
  }

  return result;
};

/**
 * @param {{device: GPUDevice, buffer: GPUBuffer}} options
 */
export const readBoidsBuffer = async ({ device, buffer }) => {
  assert(
    buffer.size % 24 === 0,
    "Buffer must be divisible by 24 (2 vectors of 12 bytes)"
  );
  const vectors = await readVec3fBuffer({ device, buffer });
  const boids = [];

  for (let i = 0; i < vectors.length; i += 2) {
    boids.push({
      position: vectors[i],
      velocity: vectors[i + 1],
    });
  }

  return boids;
};
