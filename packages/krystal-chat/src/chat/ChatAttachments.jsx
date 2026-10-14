// The files a person attaches to a message: as chips over the composer while they are prepared and
// uploaded, and in their message once it is sent, pictures as thumbnails that open full size and text
// files as chips that open the file.
//
// An attachment already sent is read back through the assistant's client (`load(attachment)`, a
// Promise of a Blob), because reading one takes the person's credential like every other call; an
// `<img>` pointed at the route could not carry it. What this browser itself sent is shown from the
// copy it holds (`localUrl`) until the page is reloaded.

import React from "react";
import { createPortal } from "react-dom";

import { IconButton } from "@thekrystalship/krystal";
import { Icon } from "@thekrystalship/krystal";
import { useModalBehaviour } from "@thekrystalship/krystal";
import { sizeLabel } from "./attachments.js";

// Object URLs of attachments read back, by id. An attachment never changes under its id, so one read
// serves every bubble that shows it for the life of the page.
const loaded = new Map();

function useAttachmentUrl(attachment, load) {
  const cached = attachment.localUrl || (loaded.get(attachment.id) && loaded.get(attachment.id).url);
  const [url, setUrl] = React.useState(cached || null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    if (url || !load || !attachment.id) return undefined;
    let live = true;
    let entry = loaded.get(attachment.id);
    if (!entry) {
      entry = { url: null, promise: Promise.resolve(load(attachment)).then((blob) => {
        if (!blob) throw new Error("no attachment");
        entry.url = URL.createObjectURL(blob);
        return entry.url;
      }) };
      loaded.set(attachment.id, entry);
      entry.promise.catch(() => loaded.delete(attachment.id));
    }
    entry.promise.then((u) => { if (live) setUrl(u); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [attachment, load, url]);
  return { url, failed };
}

// A picture full size, over everything, until it is closed; it takes focus and makes the page inert.
/**
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.name]
 * @param {() => void} props.onClose
 */
function ChatLightbox({ src, name, onClose }) {
  const root = React.useRef(null);
  useModalBehaviour(root, { onClose });
  return createPortal(
    <div ref={root} className="chat-lightbox" role="dialog" aria-modal="true" aria-label={name} onClick={onClose}>
      <img className="chat-lightbox__img" src={src} alt={name} onClick={(e) => e.stopPropagation()} />
      <IconButton className="chat-lightbox__close" icon="x" label="Close" variant="ghost" size="sm" onClick={onClose} />
    </div>,
    document.body,
  );
}

function SentPicture({ attachment, load }) {
  const { url, failed } = useAttachmentUrl(attachment, load);
  const [open, setOpen] = React.useState(false);
  if (failed || (!url && !load)) {
    return (
      <span className="chat-attachment chat-attachment--sent" title={attachment.name}>
        <Icon name="image" size={14} className="chat-attachment__icon" />
        <span className="chat-attachment__name">{attachment.name}</span>
      </span>
    );
  }
  return (
    <>
      <button type="button" className="chat-turn__picture" title={attachment.name} aria-label={"Open " + attachment.name}
        onClick={() => url && setOpen(true)}>
        {url ? <img src={url} alt={attachment.name} loading="lazy" /> : <span className="chat-turn__picture-wait" />}
      </button>
      {open && url && <ChatLightbox src={url} name={attachment.name} onClose={() => setOpen(false)} />}
    </>
  );
}

function SentFile({ attachment, load }) {
  const { url } = useAttachmentUrl(attachment, load);
  return (
    <a className="chat-attachment chat-attachment--sent" href={url || undefined} target="_blank" rel="noreferrer"
      title={attachment.name} aria-disabled={!url}>
      <Icon name="file-text" size={14} className="chat-attachment__icon" />
      <span className="chat-attachment__name">{attachment.name}</span>
      {attachment.size > 0 && <span className="chat-attachment__size">{sizeLabel(attachment.size)}</span>}
    </a>
  );
}

// The attachments of a sent message, pictures first as they read at a glance.
/**
 * @param {object} props
 * @param {import("./types.js").AttachmentInfo[]} [props.attachments]
 * @param {(attachment: import("./types.js").AttachmentInfo) => Promise<Blob>} [props.load] reads a sent attachment back through the assistant's client
 */
function ChatMessageAttachments({ attachments, load }) {
  if (!attachments || attachments.length === 0) return null;
  const pictures = attachments.filter(a => a.kind === "image");
  const files = attachments.filter(a => a.kind !== "image");
  return (
    <div className="chat-turn__attachments">
      {pictures.length > 0 && (
        <div className="chat-turn__pictures">
          {pictures.map(a => <SentPicture key={a.id || a.localUrl} attachment={a} load={load} />)}
        </div>
      )}
      {files.length > 0 && (
        <div className="chat-turn__files">
          {files.map(a => <SentFile key={a.id || a.name} attachment={a} load={load} />)}
        </div>
      )}
    </div>
  );
}

// The attachments waiting in the composer. Each is `{ key, kind?, name, previewUrl?, status, progress,
// error? }`; `status` is "preparing", "uploading", "ready" or "error".
/**
 * @param {object} props
 * @param {import("./types.js").ComposerAttachment[]} [props.items]
 * @param {(key: string) => void} [props.onRemove]
 */
function ComposerAttachments({ items, onRemove }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="chat-attachments" role="list" aria-label="Attachments">
      {items.map(item => {
        const working = item.status === "preparing" || item.status === "uploading";
        return (
          <div key={item.key} role="listitem"
            className={"chat-attachment" + (item.status === "error" ? " chat-attachment--error" : "")
              + (working ? " chat-attachment--working" : "")}
            title={item.error || item.name}>
            {item.kind === "image" && item.previewUrl
              ? <img className="chat-attachment__thumb" src={item.previewUrl} alt="" />
              : <Icon name={item.status === "error" ? "triangle-alert" : item.kind === "image" ? "image" : "file-text"}
                  size={14} className="chat-attachment__icon" />}
            <span className="chat-attachment__text">
              <span className="chat-attachment__name">{item.name}</span>
              {item.status === "error"
                ? <span className="chat-attachment__error">{item.error.replace(/`/g, "")}</span>
                : working && (
                  <span className="chat-attachment__progress" aria-label={item.status === "preparing" ? "Preparing" : "Uploading"}>
                    <span className="chat-attachment__bar" style={{ width: Math.round((item.progress || 0) * 100) + "%" }} />
                  </span>
                )}
            </span>
            <IconButton icon="x" label={"Remove " + item.name} variant="ghost" size="xs"
              className="chat-attachment__remove" onClick={() => onRemove(item.key)} />
          </div>
        );
      })}
    </div>
  );
}

export { ChatMessageAttachments, ComposerAttachments, ChatLightbox };
