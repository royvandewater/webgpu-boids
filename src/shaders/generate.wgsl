struct Boid {
  position: vec4f,
  velocity: vec4f,
}

@group(0) @binding(0) var<storage, read_write> boids: array<Boid>;

@compute @workgroup_size(1) fn generate(
    @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x;
  let seed = u32(boids[i].position.x);
  let v = hashCell(i, seed);

  boids[i] = Boid(vec4f(v, v, v, 0.0), vec4f(v, v, v, 0.0));
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
  return normalized * 2 - 1;
}
