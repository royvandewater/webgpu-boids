import { resolveShader } from "./resolveShader.js";

/**
 * @param {{device: GPUDevice, width: number, height: number}} options
 */
export const buildCompute = async ({ device, grid, width, height }) => {
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

  const gridDimensions = Uint32Array.from([width, height]);
  const gridDimensionsBuffer = device.createBuffer({
    label: "dimensions buffer",
    size: gridDimensions.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(gridDimensionsBuffer, 0, gridDimensions);

  /**
   * @param {{grid: GPUBuffer}} options
   */
  const compute = async ({ gridIn, gridOut }) => {
    const bindGroup = device.createBindGroup({
      label: "bind group",
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: gridDimensionsBuffer } },
        { binding: 1, resource: { buffer: gridIn } },
        { binding: 2, resource: { buffer: gridOut } },
      ],
    });

    const encoder = device.createCommandEncoder({ label: "compute encoder" });
    const pass = encoder.beginComputePass({ label: "compute pass" });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(width, height);
    pass.end();
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
  };

  return compute;
};
