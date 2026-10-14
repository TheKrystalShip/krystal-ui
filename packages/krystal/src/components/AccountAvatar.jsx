import { Avatar } from "./Avatar.jsx";

// AccountAvatar — a person, as a circle: a teal-gradient disc with their initial. An Avatar whose
// `user` is the account record (`display`, else `name`) and whose `size` is a diameter in pixels.
/**
 * @param {object} props
 * @param {{ display?: string, name?: string } | null} [props.user] The person; their initial is drawn.
 * @param {number} [props.size] Diameter in pixels.
 */
function AccountAvatar({ user, size = 24 }) {
  const who = (user && (user.display || user.name)) || "";
  return <Avatar name={who ? Array.from(who.trim())[0] : undefined} size={size} />;
}

export { AccountAvatar };
