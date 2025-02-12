import { resolveShader } from "./resolveShader.js";

/**
 * Generate a random grid of 0s and 1s.
 * @param {{device: GPU, numBoids: number, seed: number}} options
 * @returns {GPUBuffer}
 */
export async function generate({ device, numBoids, seed }) {
  const module = await device.createShaderModule({
    label: "generate module",
    code: await resolveShader("src/shaders/generate.wgsl"),
  });

  const pipeline = device.createComputePipeline({
    label: "generate pipeline",
    layout: "auto",
    compute: {
      module,
      entryPoint: "generate",
    },
  });

  // 1 uint & 2 vectors per boid, 4 floats per vector (we only use 3, but WGSL requires us to map memory in powers of 2).
  // We calculate the uint as a vec4u, which takes up 16 bytes (the last 12 bytes are empty because of how WGSL maps memory).
  // The first vector is the position, the second is the velocity.
  const boids = new Float32Array(numBoids * 3 * 4).fill(seed);
  const boidsBuffer = device.createBuffer({
    label: "boids buffer 1",
    size: boids.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(boidsBuffer, 0, boids);

  // 3 vertices per boid, 4 floats per vertex. The first vector is the position, the second is the velocity.
  // the vectors are all vec4f even though we only use 3 floats. WGSL requires us to map memory in powers of 2.
  let vertices = new Float32Array(numBoids * 3 * 4).fill(0);
  const verticesBuffer = device.createBuffer({
    label: "vertices buffer",
    size: vertices.byteLength,
    usage:
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(verticesBuffer, 0, vertices);

  // This is the back buffer for double buffering
  const backBuffer = device.createBuffer({
    label: "boids buffer 2",
    size: boids.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    label: "bind group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: boidsBuffer } }],
  });

  const encoder = device.createCommandEncoder({ label: "generate encoder" });
  const pass = encoder.beginComputePass({ label: "generate pass" });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(numBoids);
  pass.end();
  encoder.copyBufferToBuffer(boidsBuffer, 0, backBuffer, 0, backBuffer.size);
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
  await device.queue.onSubmittedWorkDone();

  return {
    boidsIn: boidsBuffer,
    boidsOut: backBuffer,
    vertices: verticesBuffer,
  };
}
