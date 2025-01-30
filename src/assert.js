export function assert(condition, message = "Assertion failed") {
  if (condition) return;
  throw new Error(message);
}
