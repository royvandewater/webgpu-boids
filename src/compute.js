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

  /**
   * @param {{boidsIn: GPUBuffer, boidsOut: GPUBuffer, vertices: GPUBuffer}} options
   */
  const compute = async ({ boidsIn, boidsOut, vertices }) => {
    const bindGroup = device.createBindGroup({
      label: "bind group",
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: boidsIn } },
        { binding: 1, resource: { buffer: boidsOut } },
        { binding: 2, resource: { buffer: vertices } },
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
