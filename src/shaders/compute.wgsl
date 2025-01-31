// @include "./boid.wgsl"

@group(0) @binding(0) var<storage, read_write> boidsIn: array<Boid>;
@group(0) @binding(1) var<storage, read_write> boidsOut: array<Boid>;
@group(0) @binding(2) var<storage, read_write> vertices: array<vec4f>;

// compute the new position and velocity of each boid. Also convert each boid's position & velocity to vertices
@compute @workgroup_size(1) fn compute(
    @builtin(global_invocation_id) id: vec3u
) {
  let boid = boidsIn[id.x];
  boidsOut[id.x] = boid;

  let vi = id.x * 3;

  let position = boid.position;

  let triangle: array<vec4f, 3> = array<vec4f, 3>(
    vec4f(0.0, 0.1, 0.0, 1.0), // the w values have to be 1.0 for some reason
    vec4f(-0.1, -0.1, 0.0, 1.0),
    vec4f(0.1, -0.1, 0.0, 1.0),
  );

  vertices[vi + 0] = position + triangle[0];
  vertices[vi + 1] = position + triangle[1];
  vertices[vi + 2] = position + triangle[2];
}
