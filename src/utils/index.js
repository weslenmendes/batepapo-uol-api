import { stripHtml } from "string-strip-html";

const sanitizeString = (string) => {
  return stripHtml(string).result.trim();
};

export { sanitizeString };
