/**
 * Extracts all [[Note Title]] references from note content.
 * Returns an array of title strings.
 */
const extractLinks = (content) => {
  if (!content) return [];
  const regex = /\[\[([^\[\]]+)\]\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  // Return unique titles only
  return [...new Set(matches)];
};

module.exports = { extractLinks };
