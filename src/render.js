import { autoResize, resizeCanvas } from "./autoResize.js";
import { resolveShader } from "./resolveShader.js";

/**
 * @param {{canvas: HTMLCanvasElement, device: GPUDevice, numBoids: number}} options
 */
export const buildRender = async ({ canvas, device, numBoids }) => {
  resizeCanvas(canvas, device);

  const context = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format: presentationFormat,
  });

  const module = device.createShaderModule({
    label: "render module",
    code: await resolveShader("src/shaders/render.wgsl"),
  });

  const pipeline = device.createRenderPipeline({
    label: "render pipeline",
    layout: "auto",
    vertex: {
      entryPoint: "vertexShader", // Converts grid coordinates to screen coordinates
      module,
    },
    fragment: {
      entryPoint: "fragmentShader",
      module,
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  const renderPassDescriptor = {
    label: "our basic canvas render pass",
    colorAttachments: [
      {
        clearValue: [0.0, 0.0, 0.0, 1.0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  // const screenDimensions = Float32Array.from([
  //   0,
  //   0,
  //   canvas.width,
  //   canvas.height,
  // ]);
  // const screenDimensionsBuffer = device.createBuffer({
  //   label: "screen dimensions buffer",
  //   size: screenDimensions.byteLength,
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // });
  // device.queue.writeBuffer(screenDimensionsBuffer, 0, screenDimensions);

  // const camera = Float32Array.from([0, 0, 1]);
  // const cameraBuffer = device.createBuffer({
  //   label: "camera buffer",
  //   size: camera.byteLength,
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // });
  // device.queue.writeBuffer(cameraBuffer, 0, camera);

  autoResize(canvas, device, ({ width, height }) => {
    // const screenDimensions = Float32Array.from([width, height]);
    // device.queue.writeBuffer(screenDimensionsBuffer, 0, screenDimensions);
  });

  /**
   * @param {{vertices: GPUBuffer, camera: {position: {x: number, y: number}, zoom: number}}} options
   */
  const renderLoop = async ({ camera, vertices }) => {
    // const cameraArray = Float32Array.from([
    //   camera.position.x,
    //   camera.position.y,
    //   camera.zoom,
    // ]);

    // device.queue.writeBuffer(cameraBuffer, 0, cameraArray);

    const bindGroup = device.createBindGroup({
      label: "render bind group",
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: vertices } },
        // { binding: 1, resource: { buffer: screenDimensionsBuffer } },
        // { binding: 2, resource: { buffer: cameraBuffer } },
      ],
    });

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({
      label: "out render encoder",
    });

    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context
      .getCurrentTexture()
      .createView();
    const renderPass = encoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(numBoids * 3);
    renderPass.end();

    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
  };

  return renderLoop;
};
