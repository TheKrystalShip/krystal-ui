// What a file a person attaches becomes before it is uploaded (`wire-contract.md` §2.2): a picture
// shrunk to what the model reads, or a text file read and measured. The assistant checks everything
// again and its check is the rule; this is for an answer as the file is attached.
//
// A picture is never refused for its size. It is resized to 2048 pixels on its longer side with the
// browser's high-quality resampling, then written as whichever of PNG and JPEG is smaller, with the
// JPEG's quality and then its size stepped down until it is under a few megabytes. The model reads a
// picture at a fixed budget, and its server's own downscaling of a larger one loses small text that a
// picture shrunk here keeps. Writing it again also drops what a camera stores beside it, its location
// among them. A PNG already within the size is sent as it is.
//
// A text file is UTF-8 with no NUL byte, counted in tokens as the assistant counts them (three
// characters each), and refused with how to trim it when it is longer than a message carries. A PDF,
// an office document, a recording, a video or an archive is refused with what to send instead.

const IMAGE_EDGE = 2048;
const IMAGE_TARGET_BYTES = 3 * 1024 * 1024;
const JPEG_QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5];
const CHARS_PER_TOKEN = 3;

const IMAGE_NAME = /\.(png|jpe?g|gif|webp|avif|heic|heif|bmp|tiff?)$/i;

// The text types a single picker for files and pictures names, for a site that draws one. The chat's own
// file picker names no type at all, because a phone greys out a file whose extension it does not map: a
// file is text if it reads as text, and anything else is refused on its chip.
const TEXT_ACCEPT = [
  "text/*", ".txt", ".md", ".log", ".json", ".jsonc", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
  ".properties", ".csv", ".tsv", ".xml", ".env", ".sh", ".bash", ".ps1", ".bat", ".sql", ".diff", ".patch",
  ".js", ".jsx", ".ts", ".tsx", ".py", ".rb", ".go", ".rs", ".java", ".kt", ".cs", ".c", ".h", ".cpp",
  ".lua", ".html", ".css", ".service",
].join(",");

// The `accept` of one picker for pictures and files: pictures only where the assistant reads them. A
// phone given pictures among its types opens its photo and camera chooser alone, which is why the chat
// draws two pickers.
/**
 * @param {{ images?: boolean } | null | undefined} limits
 * @returns {string}
 */
function acceptFor(limits) {
  return (limits && limits.images ? "image/*," : "") + TEXT_ACCEPT;
}

const isImage = (file) => (file.type || "").startsWith("image/") || IMAGE_NAME.test(file.name || "");

const tokensOf = (text) => Math.ceil(text.length / CHARS_PER_TOKEN);

const fmt = (n) => n.toLocaleString("en-US");

// The refusal of text that comes to more than a message carries, in the assistant's own words.
function tooLong(what, tokens, max) {
  return what + " comes to about " + fmt(tokens) + " tokens, and the files of a message may come to "
    + fmt(max) + " together. Attach the part that matters instead: the last lines of a log, the lines "
    + "around an error, one stretch of time, or one section of a config.";
}

const withExtension = (name, ext) => {
  const base = (name || "picture").replace(/\.[^./\\]+$/, "");
  return base + ext;
};

function canvasOf(width, height) {
  if (typeof OffscreenCanvas === "function") return new OffscreenCanvas(width, height);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

function encode(canvas, type, quality) {
  if (typeof canvas.convertToBlob === "function") return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, quality));
}

// The picture drawn at a size, once as it is (for PNG) and once on white (for JPEG, which has no
// transparency to keep).
async function draw(bitmap, width, height) {
  const sized = width === bitmap.width && height === bitmap.height
    ? bitmap
    : await createImageBitmap(bitmap, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" });
  const clear = canvasOf(width, height);
  clear.getContext("2d").drawImage(sized, 0, 0);
  const white = canvasOf(width, height);
  const ctx = white.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(sized, 0, 0);
  if (sized !== bitmap) sized.close();
  return { clear, white };
}

async function shrink(bitmap, maxBytes) {
  const target = Math.min(IMAGE_TARGET_BYTES, maxBytes || IMAGE_TARGET_BYTES);
  let scale = Math.min(1, IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  let smallest = null;
  for (;;) {
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const { clear, white } = await draw(bitmap, width, height);
    const png = await encode(clear, "image/png");
    if (png.size <= target) return { blob: png, width, height };
    for (const quality of JPEG_QUALITIES) {
      const jpeg = await encode(white, "image/jpeg", quality);
      if (!smallest || jpeg.size < smallest.blob.size) smallest = { blob: jpeg, width, height };
      if (jpeg.size <= target) return { blob: jpeg, width, height };
    }
    if (Math.max(width, height) <= 256) return smallest;
    scale *= 0.75;
  }
}

/**
 * @param {File} file
 * @param {import("./types.js").AttachmentLimits} limits
 * @returns {Promise<import("./types.js").PreparedOrError>}
 */
async function prepareImage(file, limits) {
  const name = file.name || "picture";
  if (!limits.images) return { error: "This assistant can’t read pictures." };

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { error: "`" + name + "` isn’t a picture this browser can open." };
  }

  try {
    const within = Math.max(bitmap.width, bitmap.height) <= IMAGE_EDGE;
    if (file.type === "image/png" && within && file.size <= IMAGE_TARGET_BYTES) {
      return { kind: "image", blob: file, name, mimeType: "image/png", width: bitmap.width, height: bitmap.height };
    }
    const shrunk = await shrink(bitmap, limits.maxImageBytes);
    if (!shrunk) return { error: "`" + name + "` couldn’t be made small enough to send." };
    const png = shrunk.blob.type === "image/png";
    return {
      kind: "image",
      blob: shrunk.blob,
      name: withExtension(name, png ? ".png" : ".jpg"),
      mimeType: shrunk.blob.type,
      width: shrunk.width,
      height: shrunk.height,
    };
  } finally {
    bitmap.close();
  }
}

/**
 * @param {File} file
 * @param {import("./types.js").AttachmentLimits} limits
 * @returns {Promise<import("./types.js").PreparedOrError>}
 */
async function prepareText(file, limits) {
  const name = file.name || "file.txt";
  const notText = "`" + name + "` isn’t a picture or a text file, so the assistant can’t read it.";
  if (limits.maxTextBytes && file.size > limits.maxTextBytes) {
    return { error: tooLong("`" + name + "`", Math.ceil(file.size / CHARS_PER_TOKEN), limits.maxTextTokens) };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.includes(0)) return { error: notText };
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { error: notText };
  }
  const tokens = tokensOf(text);
  if (limits.maxTextTokens && tokens > limits.maxTextTokens) {
    return { error: tooLong("`" + name + "`", tokens, limits.maxTextTokens) };
  }
  return { kind: "text", blob: new Blob([bytes], { type: "text/plain" }), name, mimeType: "text/plain", tokens };
}

// A file as it will be uploaded — `{ kind, blob, name, mimeType, tokens? }` — or `{ error }`, a
// sentence for the person.
// The kinds of file a person reaches for that are neither a picture nor text, each with what to send
// instead. Told apart by name or type before anything is read, so the chip says it at once.
const UNSUPPORTED = [
  { test: (t, n) => t === "application/pdf" || /\.pdf$/i.test(n),
    why: (name) => "`" + name + "` is a PDF, which can\u2019t be attached yet. Paste the text you need, or attach a screenshot of the page." },
  { test: (t, n) => /\.(docx?|xlsx?|pptx?|od[tsp]|pages|numbers|key)$/i.test(n)
      || /^application\/(msword|vnd\.ms-|vnd\.openxmlformats|vnd\.oasis\.opendocument)/.test(t),
    why: (name) => "`" + name + "` is an office document, which can\u2019t be attached yet. Paste the text you need, or save it as plain text (a spreadsheet as CSV)." },
  { test: (t, n) => t.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|amr|3ga)$/i.test(n),
    why: (name) => "`" + name + "` is a recording, which can\u2019t be attached. To say something to the assistant, use the microphone." },
  { test: (t, n) => t.startsWith("video/") || /\.(mp4|m4v|mov|mkv|webm|avi|3gp)$/i.test(n),
    why: (name) => "`" + name + "` is a video, which can\u2019t be attached. Attach a screenshot of the moment instead." },
  { test: (t, n) => /\.(zip|7z|rar|tar|gz|tgz|bz2|xz)$/i.test(n) || /^application\/(zip|x-7z|x-rar|x-tar|gzip)/.test(t),
    why: (name) => "`" + name + "` is an archive, which can\u2019t be attached. Attach the files inside it instead." },
];

function unsupported(file) {
  const type = (file.type || "").toLowerCase();
  const name = file.name || "";
  const kind = UNSUPPORTED.find(k => k.test(type, name));
  return kind ? kind.why(name || "file") : null;
}

/**
 * A file as it will be uploaded, or `{ error }`, a sentence for the person.
 * @param {File} file
 * @param {import("./types.js").AttachmentLimits} limits
 * @returns {Promise<import("./types.js").PreparedOrError>}
 */
async function prepareAttachment(file, limits) {
  if (!file || file.size === 0) return { error: "`" + ((file && file.name) || "file") + "` is empty." };
  const refused = unsupported(file);
  if (refused) return { error: refused };
  return isImage(file) ? prepareImage(file, limits) : prepareText(file, limits);
}

// Whether the text files of a message, `tokens` each, come to more than it carries: the refusal, or null.
/**
 * Whether the text files of a message come to more than it carries: the refusal, or null.
 * @param {{ kind?: string, tokens?: number }[]} attached
 * @param {import("./types.js").AttachmentLimits | null | undefined} limits
 * @returns {string | null}
 */
function textOverLimit(attached, limits) {
  const tokens = attached.reduce((sum, a) => sum + (a.kind === "text" ? a.tokens || 0 : 0), 0);
  return limits && limits.maxTextTokens && tokens > limits.maxTextTokens
    ? tooLong("The files of this message", tokens, limits.maxTextTokens).replace(" comes to", " come to")
    : null;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
const sizeLabel = (bytes) => (bytes >= 1024 * 1024
  ? (bytes / (1024 * 1024)).toFixed(1) + " MB"
  : Math.max(1, Math.round(bytes / 1024)) + " KB");

export { acceptFor, prepareAttachment, textOverLimit, sizeLabel };
