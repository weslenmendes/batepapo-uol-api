import { stripHtml } from "string-strip-html";

const utf8Decode = (utf8String) => {
  if (typeof utf8String != "string")
    throw new TypeError("parameter ‘utf8String’ is not a string");

  const unicodeString = utf8String
    .replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, (c) => {
      return String.fromCharCode(
        ((c.charCodeAt(0) & 0x0f) << 12) |
          ((c.charCodeAt(1) & 0x3f) << 6) |
          (c.charCodeAt(2) & 0x3f)
      );
    })
    .replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, (c) => {
      return String.fromCharCode(
        ((c.charCodeAt(0) & 0x1f) << 6) | (c.charCodeAt(1) & 0x3f)
      );
    });
  return unicodeString;
};

const sanitizeString = (string) => {
  const newString = string || "<br/>";
  return utf8Decode(stripHtml(newString).result.trim());
};

export { sanitizeString };
