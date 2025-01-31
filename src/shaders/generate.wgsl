// @include "./boid.wgsl"

@group(0) @binding(0) var<storage, read_write> boids: array<Boid>;

@compute @workgroup_size(1) fn generate(
    @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x;
  let seed = u32(boids[i].position.x);

  let px = hashCell(i, seed);
  let py = hashCell(i, seed + i);

  let scale = 0.01;
  let vx = hashCell(i, seed + i * 2) * scale;
  let vy = hashCell(i, seed + i * 3) * scale;

  boids[i] = Boid(
    // the vertex shader requires the w value to be 1.0 for some reason
    vec4f(px, py, 0.0, 1.0), 
    // Only the x and y values are used for the velocity at the moment
    vec4f(vx, vy, 0.0, 0.0),
  );
}

// A hash function to generate a pseudo-random value between -1 and 1
fn hashCell(i: u32, seed: u32) -> f32 {
  // Combine i and seed into a single integer
  let input = i + seed;

  // Use a mix of bitwise operations and arithmetic to hash
  var hashed = input ^ 0x27d4eb2d;
  hashed = (hashed ^ (hashed >> 15)) * 0x85ebca6b;
  hashed = (hashed ^ (hashed >> 13)) * 0xc2b2ae35;
  hashed = hashed ^ (hashed >> 16);

  // Map the hashed value to [0, 1]
  let normalized = f32(hashed & 0x7FFFFFFF) / f32(0x7FFFFFFF);

  // Map the normalized value to [-1, 1]
  return (normalized - 0.5) * 2.0;
}
