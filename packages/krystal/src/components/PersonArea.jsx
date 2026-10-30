import React from "react";
import { PageHeader } from "./PageHeader.jsx";
import { SubTabs } from "./SubTabs.jsx";
import { ThemePicker } from "./ThemePicker.jsx";
import { activeTab } from "../lib/person.js";

// PersonArea — Profile or Settings, drawn from the site's `person` table (lib/person.js): the page's
// header, a strip of the area's tabs, and the page of the tab the address names. It fetches nothing and
// owns no routing: the site reads the tab from its address and hands it in, and a press on a tab comes
// back through `onTabChange`. An address that names no tab the area has draws the first one.
//
// A strip of one tab is not drawn: a tab holding the whole area is a heading over a heading. `hidden`
// leaves tabs out for this person or this device and `disabled` dims them. `pageProps` reach every
// tab's page, so a page that needs the site's connection state takes it from there.
// `stage`, when given, draws the active page inside the site's own transition: it gets the tab's id and
// a function that draws the page of any tab it is handed.
/**
 * @typedef {object} PersonAreaOwnProps
 * @property {import("../lib/person.js").Person} person The site's table.
 * @property {"profile" | "settings"} area Which of the two this is.
 * @property {string} [tab] The tab the address names.
 * @property {(id: string) => void} onTabChange Receives the id of the tab the person chose.
 * @property {import("react").ReactNode} title The page's heading.
 * @property {import("react").ReactNode} [sub] A line under the title.
 * @property {import("react").ReactNode} [actions] Controls opposite the title.
 * @property {string[]} [hidden] Ids of the tabs left out.
 * @property {string[]} [disabled] Ids of the tabs drawn dimmed and not pressable.
 * @property {Record<string, { badge?: number, badgeTone?: "accent" | "info" | "ok" | "warn" | "danger" | "muted" | "neutral", badgeNoun?: string }>} [badges] Per tab, a count beside its name.
 * @property {object} [pageProps] Props every tab's page receives.
 * @property {import("react").ComponentType<{ tab: string, render: (id: string) => import("react").ReactNode }>} [stage] The site's transition around the page.
 * @property {string} [className] Class name added to the root element.
 * @typedef {PersonAreaOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof PersonAreaOwnProps | "title">} PersonAreaProps
 */

/** @param {PersonAreaProps} props */
export function PersonArea({
  person, area, tab, onTabChange, title, sub, actions, hidden = [], disabled = [], badges = {}, pageProps, stage: Stage, className = "", ...rest
}) {
  const tabs = person[area].filter((t) => !hidden.includes(t.id));
  const active = activeTab(tabs, tab);
  const render = (id) => {
    const found = tabs.find((t) => t.id === id) || tabs[0];
    const Page = found.page || (found.standard === "appearance" ? ThemePicker : null);
    return Page ? <Page {...pageProps} /> : null;
  };
  return (
    <div className={"k-person k-person--" + area + (className ? " " + className : "")} {...rest}>
      <PageHeader title={title} sub={sub} actions={actions} />
      {tabs.length > 1 && (
        <SubTabs active={active} onChange={onTabChange}
          tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon, disabled: disabled.includes(t.id), ...badges[t.id] }))} />
      )}
      {Stage ? <Stage tab={active} render={render} /> : render(active)}
    </div>
  );
}
