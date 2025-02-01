import { resolveShader } from "./resolveShader.js";

/**
 * @param {{device: GPUDevice, numBoids: number}} options
 */
export const buildCompute = async ({ device, numBoids }) => {
  const module = await device.createShaderModule({
    label: "compute module",
    code: await resolveShader("src/shaders/compute.wgsl"),
  });

  const pipeline = device.createComputePipeline({
    label: "compute pipeline",
    layout: "auto",
    compute: {
      module,
      entryPoint: "compute",
    },
  });

  const forceStrengths = new Float32Array([1, 1, 1, 1]);
  const forceStrengthsBuffer = device.createBuffer({
    label: "force strengths buffer",
    size: forceStrengths.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(forceStrengthsBuffer, 0, forceStrengths);

  const visionDistance = new Float32Array([10]);
  const visionDistanceBuffer = device.createBuffer({
    label: "vision distance buffer",
    size: visionDistance.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(visionDistanceBuffer, 0, visionDistance);

  /**
   * @param {{boidsIn: GPUBuffer, boidsOut: GPUBuffer, vertices: GPUBuffer}} options
   */
  const compute = async ({ boidsIn, boidsOut, vertices, forceStrengths, visionDistance }) => {
    // TODO: move this into a callback so we only update the force strengths when the user changes them
    const forceStrengthsArray = new Float32Array(forceStrengths);
    device.queue.writeBuffer(forceStrengthsBuffer, 0, forceStrengthsArray);

    const visionDistanceArray = new Float32Array([visionDistance]);
    device.queue.writeBuffer(visionDistanceBuffer, 0, visionDistanceArray);

    const bindGroup = device.createBindGroup({
      label: "bind group",
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: boidsIn } },
        { binding: 1, resource: { buffer: boidsOut } },
        { binding: 2, resource: { buffer: vertices } },
        { binding: 3, resource: { buffer: forceStrengthsBuffer } },
        { binding: 4, resource: { buffer: visionDistanceBuffer } },
      ],
    });

    const encoder = device.createCommandEncoder({ label: "compute encoder" });
    const pass = encoder.beginComputePass({ label: "compute pass" });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(numBoids);
    pass.end();
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
  };

  return compute;
};
