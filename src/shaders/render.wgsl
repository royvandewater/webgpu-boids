
@group(0) @binding(0) var<storage, read> vertices: array<vec4f>;
// screen is an array of 2 unsigned integers. The first is the width, and the second is the height, in pixels
// @group(0) @binding(1) var<uniform> screen: vec4f;

// camera is a vec3f that represents the camera's position. The first two are the
// x & y position, and the third is the zoom level. Think of the zoom level as the
// distance between the camera and the maze.
// @group(0) @binding(2) var<uniform> camera: vec3f;

// adjust coordinate for the camera's position and zoom
@vertex fn vertexShader(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let coordinate = vertices[index];
  // let xy = coordinate.xy;

  // let normalizedCoord = ((xy - screen.xy) / (screen.zw - screen.xy));
  // let normalizedCamera = (camera.xy - screen.xy) / (screen.zw - screen.xy);

  // // Apply zoom to the centered coordinate
  // let zoomedCoordinate = normalizedCoord * (1 / camera.z);

  // // Apply camera translation
  // let cameraAdjustedCoordinate = vec2f(zoomedCoordinate.x + normalizedCamera.x, zoomedCoordinate.y - normalizedCamera.y);

  // // Convert to clip space (-1 to 1 range)
  // let actualCoordinate = vec4f(cameraAdjustedCoordinate, coordinate.z, 1.0);

  // ignore all the calculations and just return the original coordinate while we debug
  return coordinate;
}

@fragment fn fragmentShader(@builtin(position) position: vec4f) -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 1.0, 1.0);
}
