// Every example on one long page, grouped into the sections the visual harness shoots. Each section
// keeps its id, so #controls, #dialogs and the ids of the files in sections/ land on it.
import * as E from "../examples.jsx";
import { row, Section } from "../kit.jsx";

// A section of its own is a file in sections/ whose default export is a component drawing one
// <Section>; every one is drawn after the built-in sections, in file-name order, and linked from the quick links.
const FILES = Object.entries(import.meta.glob("../sections/*.jsx", { eager: true }))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => ({ id: path.replace(/^.*\/|\.jsx$/g, ""), Draw: mod.default }));

const BUILT_IN = [
  ["controls", "Controls", [E.ButtonExamples, E.IconButtonExamples, E.InputExamples, E.FieldExamples, E.PasswordInputExamples,
    E.ProviderButtonExamples, E.CheckboxExamples, E.SelectExamples, E.OptionListExamples, E.MeterExamples]],
  ["badges", "Badges", [E.PillExamples, E.NavItemBadgeExamples, E.SubTabsExamples, E.ShowcaseCardExamples, E.TabBarExamples, E.BriefCardCountExamples]],
  ["page", "Page", [E.PageHeaderExamples, E.ShelfExamples, E.PosterCardExamples, E.NoticeExamples, E.EmptyStateExamples, E.BreadcrumbsExamples, E.ToolbarExamples]],
  ["settings", "Settings", [E.SettingsExamples]],
  ["dialogs", "Dialogs", [E.DialogExamples]],
  ["lists", "Lists", [E.ListExamples]],
  ["cardscreen", "CardScreen and CopyField", [E.CardScreenExamples, E.CopyFieldExamples]],
  ["frame", "Frame", [E.FrameExamples]],
  ["chat", "Chat", [E.ChatCardExamples]],
];

export const SECTION_IDS = [...BUILT_IN.map(([id]) => id), ...FILES.map((f) => f.id)];

export function AllView() {
  return (
    <>
      <nav style={{ ...row, marginTop: 16 }} aria-label="Sections">
        {SECTION_IDS.map((id) => <a key={id} href={"#" + id}>#{id}</a>)}
      </nav>
      {BUILT_IN.map(([id, title, parts]) => (
        <Section key={id} id={id} title={title}>
          {parts.map((Part, i) => <Part key={i} />)}
        </Section>
      ))}
      {FILES.map(({ id, Draw }) => <Draw key={id} />)}
    </>
  );
}
