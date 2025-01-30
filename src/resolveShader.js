import { assert } from "./assert.js";

export const resolveShader = async (path) => {
  const text = await resolveTextFile(path);
  const prefix = path.split("/").slice(0, -1).join("/");
  const dependencies = await resolveDependencies(prefix, text);
  return `${text}\n${dependencies.join("\n")}`;
};

const resolveTextFile = async (path) => {
  const response = await fetch(path);
  assert(response.ok, `Failed to load shader: ${path}`);
  return response.text();
};

/**
 * @param {string} text
 * @returns {Promise<string[]>}
 */
const resolveDependencies = (prefix, text) => {
  const regex = /@include\s+"(?<path>[^"]+)"/g;
  const matches = text.matchAll(regex);

  const paths = matches.map((match) => {
    return `${prefix}/${match.groups.path}`;
  });

  return Promise.all(paths.map(resolveShader));
};
