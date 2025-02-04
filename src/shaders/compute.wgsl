// @include "./boid.wgsl"

@group(0) @binding(0) var<storage, read_write> boidsIn: array<Boid>;
@group(0) @binding(1) var<storage, read_write> boidsOut: array<Boid>;
@group(0) @binding(2) var<storage, read_write> vertices: array<vec4f>;
// x: separation force strength, y: alignment force strength, z: cohesion force strength, w: speed
@group(0) @binding(3) var<storage, read_write> forceStrengths: vec4f;
// distance at which boids can see each other. a number between 0 and 1000.
@group(0) @binding(4) var<storage, read_write> visionDistance: f32;

// compute the new position and velocity of each boid. Also convert each boid's position & velocity to vertices
@compute @workgroup_size(1) fn compute(
    @builtin(global_invocation_id) id: vec3u
) {
  let boid = boidsIn[id.x];
  boidsOut[id.x] = nextBoid(boid);

  let vi = id.x * 3;

  let position = boid.position;
  let velocity = boid.velocity;

  let scale = 0.01;
  let triangle: array<vec2f, 3> = array<vec2f, 3>(
    vec2f(scale, 0.0),
    vec2f(-scale, scale),
    vec2f(-scale, -scale),
  );

  vertices[vi + 0] = position + rotate(triangle[0], velocity.xy);
  vertices[vi + 1] = position + rotate(triangle[1], velocity.xy);
  vertices[vi + 2] = position + rotate(triangle[2], velocity.xy);
}

fn nextBoid(boid: Boid) -> Boid {
  let position = boid.position + boid.velocity;
  var velocity = boid.velocity;

  velocity += separationForce(boid);
  velocity += alignmentForce(boid);
  velocity += cohesionForce(boid);
  velocity = reflect_off_wall(position, velocity);
  velocity = enforceSpeed(velocity);

  return Boid(boid.id, position, velocity);
}

fn enforceSpeed(velocity: vec4f) -> vec4f {
  let xy = normalize(velocity.xy) * 0.00001 * forceStrengths.w;
  return vec4f(xy.x, xy.y, velocity.z, velocity.w);
}

fn separationForce(boid: Boid) -> vec4f {
  let position = boid.position;
  let numBoids = arrayLength(&boidsIn);

  let visionDistance = visionDistance / 500.0;

  var separation = vec4f(0.0, 0.0, 0.0, 0.0);
  for (var i: u32 = 0; i < numBoids; i++) {
    let other = boidsIn[i];

    if (other.id == boid.id) {
      continue;
    }

    let difference = position - other.position;
    let distance = length(difference);

    if (distance < 0.0001 || visionDistance < distance) {
      continue;
    }

    separation += normalize(difference) / (distance * distance);
  }

  if (isZero(separation)) {
    return vec4f();
  }

  return normalize(separation) * forceStrengths.x;
}


fn alignmentForce(boid: Boid) -> vec4f {
  let position = boid.position;
  let numBoids = arrayLength(&boidsIn);
  let visionDistance = visionDistance / 500.0;

  var alignment = vec4f(0.0, 0.0, 0.0, 0.0);
  for (var i: u32 = 0; i < numBoids; i++) {
    let other = boidsIn[i];

    if (other.id == boid.id) {
      continue;
    }

    let distance = length(position - other.position);
    if (distance < 0.0001 || visionDistance < distance) {
      continue;
    }

    alignment += normalize(other.velocity) / (distance * distance);
  }

  if (isZero(alignment)) {
    return vec4f();
  }

  return normalize(alignment) * forceStrengths.y;
}

fn cohesionForce(boid: Boid) -> vec4f {
  let position = boid.position;
  let numBoids = arrayLength(&boidsIn);
  let visionDistance = visionDistance / 500.0;

  var averagePosition = position;
  for (var i: u32 = 0; i < numBoids; i++) {
    let other = boidsIn[i];

    if (other.id == boid.id) {
      continue;
    }

    let difference = other.position - position;
    let distance = length(difference);
    if (distance < 0.0001 || visionDistance < distance) {
      continue;
    }

    averagePosition += difference / (distance * distance);
  }

  let force = averagePosition - position;

  if (isZero(force)) {
    return vec4f();
  }

  return normalize(force) * forceStrengths.z;
}

fn isZero(v: vec4f) -> bool {
  return v.x == 0.0 && v.y == 0.0 && v.z == 0.0 && v.w == 0.0;
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
