
@group(0) @binding(0) var<storage, read> vertices: array<vec4f>;

// camera is a vec3f that represents the camera's position. The first two are the
// x & y position, and the third is the zoom level. Think of the zoom level as the
// distance between the camera and the maze.
@group(0) @binding(1) var<uniform> camera: vec3f;

// adjust coordinate for the camera's position and zoom
@vertex fn vertexShader(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let coordinate = vertices[index];
  let xy = coordinate.xy;

  // Apply zoom to the coordinate
  let zoomed = xy * camera.z;

  // Apply camera translation
  let cameraAdjustedCoordinate = vec2f(zoomed.x - camera.x, zoomed.y - camera.y);

  // Convert to clip space (-1 to 1 range)
  return vec4f(cameraAdjustedCoordinate, coordinate.z, 1.0);

  // ignore all the calculations and just return the original coordinate while we debug
  // return coordinate;
}

@fragment fn fragmentShader(@builtin(position) position: vec4f) -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 1.0, 1.0);
}
