// AccountAvatar — a person, as a circle: a teal-gradient disc with their initial.
function AccountAvatar({ user, size = 24 }) {
  const initial = ((user && (user.display || user.name)) || "?")[0].toUpperCase();
  return (
    <span style={{
      width: size, height: size, borderRadius: 999,
      background: "linear-gradient(135deg, var(--krystal-teal-hover), var(--krystal-teal-press))",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: "var(--fg-inverse)", fontSize: size * 0.46, fontWeight: 700,
      flexShrink: 0,
    }}>{initial}</span>
  );
}

export { AccountAvatar };
