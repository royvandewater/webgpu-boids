@group(0) @binding(0) var<storage, read_write> boidsIn: array<vec3f>;
@group(0) @binding(1) var<storage, read_write> boidsOut: array<vec3f>;
@group(0) @binding(2) var<storage, read_write> vertices: array<vec3f>;

// compute the new position and velocity of each boid. Also convert each boid's position & velocity to vertices
@compute @workgroup_size(1) fn compute(
    @builtin(global_invocation_id) id: vec3u
) {
  let i = id.x * 2;
  let position = boidsIn[i];
  let velocity = boidsIn[i + 1];
  boidsOut[i] = position;
  boidsOut[i + 1] = velocity;

  vertices[i] = vec3f(position.x, position.y, position.z);
  vertices[i + 1] = vec3f(position.x + velocity.x, position.y + velocity.y, position.z);
  vertices[i + 2] = vec3f(position.x + 1, position.y + 1, position.z);
}
