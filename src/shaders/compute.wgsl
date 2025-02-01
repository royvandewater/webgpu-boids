// @include "./boid.wgsl"

@group(0) @binding(0) var<storage, read_write> boidsIn: array<Boid>;
@group(0) @binding(1) var<storage, read_write> boidsOut: array<Boid>;
@group(0) @binding(2) var<storage, read_write> vertices: array<vec4f>;

// compute the new position and velocity of each boid. Also convert each boid's position & velocity to vertices
@compute @workgroup_size(1) fn compute(
    @builtin(global_invocation_id) id: vec3u
) {
  let boid = boidsIn[id.x];
  boidsOut[id.x] = nextBoid(boid);

  let vi = id.x * 3;

  let position = boid.position;
  let velocity = boid.velocity;

  let triangle: array<vec2f, 3> = array<vec2f, 3>(
    vec2f(0.1, 0.0),
    vec2f(-0.1, 0.1),
    vec2f(-0.1, -0.1),
  );

  vertices[vi + 0] = position + rotate(triangle[0], velocity.xy);
  vertices[vi + 1] = position + rotate(triangle[1], velocity.xy);
  vertices[vi + 2] = position + rotate(triangle[2], velocity.xy);
}

fn nextBoid(boid: Boid) -> Boid {
  let position = boid.position + boid.velocity;
  let velocity = boid.velocity;

  return Boid(position, reflect_off_wall(position, velocity));
}

fn reflect_off_wall(position: vec4f, velocity: vec4f) -> vec4f {
  var nextVelocity = velocity;
  if (position.x < -1.0 && velocity.x < 0.0) {
    nextVelocity.x = -velocity.x;
  }
  if (1.0 < position.x && 0.0 < velocity.x) {
    nextVelocity.x = -velocity.x;
  }
  if (position.y < -1.0 && velocity.y < 0.0) {
    nextVelocity.y = -velocity.y;
  }
  if (1.0 < position.y && 0.0 < velocity.y) {
    nextVelocity.y = -velocity.y;
  }

  return nextVelocity;
}

fn rotate(vertex: vec2f, vRotation: vec2f) -> vec4f {
  let uRotation = normalize(vRotation);

  let rotated = vec2f(
    vertex.x * uRotation.x - vertex.y * uRotation.y, 
    vertex.x * uRotation.y + vertex.y * uRotation.x,
  );

  return vec4f(rotated.x, rotated.y, 0.0, 0.0);
}
