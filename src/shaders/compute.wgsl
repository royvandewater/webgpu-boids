@group(0) @binding(0) var<uniform> gridDimensions: vec2u;
@group(0) @binding(1) var<storage, read_write> gridIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> gridOut: array<u32>;

// The workgroup size is 1x1 because we're using a single thread per cell. When we turn it up, it allows
// us to use multiple threads per cell. Since this shader isn't written in a way that takes advantage of
// multiple invocations per cell, we want this number to be low. Turning it up just allocates more GPU 
// resources that we would use to do duplicate work.
// I suppose we might be able to use multiple threads per cell to have each thread look at a different
// neighbor, but I'm not sure how we'd combine the results of the threads.
@compute @workgroup_size(1) fn compute(
    @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x + (id.y * gridDimensions.x);

  let count = numNeighbors(i);

  gridOut[i] = u32(count == 3) | (gridIn[i] & u32(count == 2));
}

fn numNeighbors(i: u32) -> u32 {
  return 0
    + northwest(i)
    + north(i)
    + northeast(i)
    + west(i)
    + east(i)
    + southwest(i)
    + south(i)
    + southeast(i);
}

fn northwest(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (gridSize + i - gridDimensions.x - 1) % gridSize;
  return gridIn[index];
}

fn north(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (gridSize + i - gridDimensions.x) % gridSize;
  return gridIn[index];
}

fn northeast(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (gridSize + i - gridDimensions.x + 1) % gridSize;
  return gridIn[index];
}

fn west(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (gridSize + i - 1) % gridSize;
  return gridIn[index];
}

fn east(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (i + 1) % gridSize;
  return gridIn[index];
}

fn southwest(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (i + gridDimensions.x - 1) % gridSize;
  return gridIn[index];
}

fn south(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (i + gridDimensions.x) % gridSize;
  return gridIn[index];
}

fn southeast(i: u32) -> u32 {
  let gridSize = gridDimensions.x * gridDimensions.y;
  let index = (i + gridDimensions.x + 1) % gridSize;
  return gridIn[index];
}
