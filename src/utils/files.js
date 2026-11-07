'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Recursively collect every .js file under a directory.
 * Returns an empty list if the directory does not exist.
 * @param {string} dir
 * @returns {string[]}
 */
function walkJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkJsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) results.push(full);
  }
  return results.sort();
}

module.exports = { walkJsFiles };
