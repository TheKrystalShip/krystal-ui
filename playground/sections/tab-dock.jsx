import React from "react";
import { TabDock } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const page = (id, icon, label, extra) => ({ id, icon, label, ...extra });

// A film site's pages in its sections, and the four slots it starts with.
const PAGES = [
  { id: "watch", label: "Watch", items: [
    page("home", "house", "Home"), page("movies", "film", "Movies"), page("tv", "tv", "TV Shows"),
    page("anime", "sparkles", "Anime"), page("discover", "compass", "Discover"),
  ] },
  { id: "yours", label: "Yours", items: [
    page("wants", "bookmark", "Want to watch"), page("plans", "calendar", "Plans"), page("history", "history", "History"),
    page("following", "bell", "Following", { badge: 3, tone: "info" }),
  ] },
  { id: "more", label: "More", items: [
    page("assistant", "bot", "Assistant"), page("me", "user", "Me", { badge: 2, tone: "warn" }), page("about", "info", "About"),
  ] },
];
const DEFAULTS = ["movies", "discover", "assistant", "me"];

export default function TabDockSection() {
  const [current, setCurrent] = React.useState("home");
  const [slots, setSlots] = React.useState(DEFAULTS);
  const [open, setOpen] = React.useState(false);
  const draw = (item) => ({ ...item, active: item.id === current, onClick: () => setCurrent(item.id) });
  const sections = PAGES.map((section) => ({ ...section, items: section.items.map(draw) }));
  return (
    <Section id="tab-dock" title="TabDock">
      <Sub title="TabDock (phone width only; Home in the middle, four slots the person chooses)">
        <code style={{ fontSize: 12, color: "var(--fg-3)" }}>{(open ? "open " : "closed ") + current + " " + JSON.stringify(slots)}</code>
        <TabDock home={draw(PAGES[0].items[0])} sections={sections} slots={slots} defaultSlots={DEFAULTS}
          onSlotsChange={setSlots} open={open} onOpenChange={setOpen} />
      </Sub>
    </Section>
  );
}
