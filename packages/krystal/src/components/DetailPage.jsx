import { Breadcrumbs } from "./Breadcrumbs.jsx";
import { DataState } from "./DataState.jsx";
import { PageHeader } from "./PageHeader.jsx";
import { SubTabs } from "./SubTabs.jsx";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs.jsx";

// DetailPage — the page about one record: breadcrumbs, a header, sections behind tabs, an aside
// column, and a loading or failed state for the whole page. It fetches nothing and owns no routing;
// the site hands it the record's words, the flags and the callbacks.
//
// The header is a `hero` node (a site's Hero), or a plain head built from `title`, `sub`, `meta` (a row
// of pills under the title) and `actions`. `crumbs` are Breadcrumbs `items`, drawn above both, and
// `onNavigate` takes a plain left click on one.
//
// `tabs` are `{ value, label, icon?, count?, countTone?, title?, badgeNoun? }`, with `value` and
// `onChange` choosing one. `tabsKind` picks what they are:
//   sections  (default) in-page panels, drawn as Tabs. `renderTab(value)` draws the chosen panel, or
//             `children` are TabPanels of the matching values
//   routes    each tab is a page of its own, so the site's router owns the choice: drawn as SubTabs
//             (a strip, a native select at phone width). `renderTab(value)` or `children` is the body
// `tabsExtra` sits at the end of the tab row (a page-wide control beside the tabs). Without `tabs`,
// `children` is the body.
//
// `aside` is a second column beside the body at wide widths and under it at phone width.
//
// `loading` and `error` replace the header, tabs and body, under the crumbs, and `isEmpty` with
// `emptyTitle`, `emptyBody` and `emptyAction` is the record not being found; all draw through DataState.
/**
 * @typedef {object} DetailTab
 * @property {string | number} value
 * @property {import("react").ReactNode} label
 * @property {string} [icon] A Lucide name.
 * @property {number} [count] A pill after the label when above zero.
 * @property {"neutral" | "accent" | "info" | "ok" | "warn" | "danger" | "muted"} [countTone]
 * @property {string} [title] A hover hint (routes tabs).
 * @property {string} [badgeNoun] What the count counts, for the phone select (routes tabs).
 */
/**
 * @typedef {object} DetailPageOwnProps
 * @property {{ label: import("react").ReactNode, href?: string }[]} [crumbs]
 * @property {(href: string, event: import("react").MouseEvent<HTMLAnchorElement>) => void} [onNavigate]
 * @property {import("react").ReactNode} [hero] The header, in place of the plain head.
 * @property {import("react").ReactNode} [title]
 * @property {import("react").ReactNode} [sub]
 * @property {import("react").ReactNode} [meta] Pills under the title.
 * @property {import("react").ReactNode} [actions]
 * @property {DetailTab[]} [tabs]
 * @property {string | number} [value] The chosen tab.
 * @property {(value: any) => void} [onChange]
 * @property {"sections" | "routes"} [tabsKind]
 * @property {string} [tabsLabel] The tab row's accessible name.
 * @property {import("react").ReactNode} [tabsExtra] At the end of the tab row.
 * @property {(value: any) => import("react").ReactNode} [renderTab] Draws the chosen tab's body.
 * @property {import("react").ReactNode} [aside]
 * @property {boolean} [loading]
 * @property {Error | string | null | false} [error]
 * @property {() => void} [onRetry]
 * @property {import("react").ReactNode} [skeleton]
 * @property {boolean} [isEmpty] The record was not found.
 * @property {import("react").ReactNode} [emptyTitle]
 * @property {import("react").ReactNode} [emptyBody]
 * @property {import("react").ReactNode} [emptyAction]
 * @property {string} [className]
 * @property {import("react").ReactNode} [children]
 * @typedef {DetailPageOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof DetailPageOwnProps | "title" | "onChange">} DetailPageProps
 */
/** @param {DetailPageProps} props */
function DetailPage({
  crumbs, onNavigate, hero, title, sub, meta, actions, tabs, value, onChange, tabsKind = "sections", tabsLabel = "Sections",
  tabsExtra, renderTab, aside, loading = false, error, onRetry, skeleton, isEmpty, emptyTitle, emptyBody, emptyAction,
  className, children, ...rest
}) {
  const sections = tabs && tabsKind === "sections";
  const routes = tabs && tabsKind === "routes";
  const current = tabs && (tabs.some((t) => String(t.value) === String(value)) ? value : tabs[0] && tabs[0].value);

  const head = hero != null ? hero : (title != null || actions != null) && (
    <div className="k-detailpage__head">
      <PageHeader title={title} sub={sub} actions={actions} />
      {meta && <div className="k-detailpage__meta">{meta}</div>}
    </div>
  );

  const tabRow = tabs && (
    <div className="k-detailpage__tabs">
      {sections && (
        <TabList label={tabsLabel}>
          {tabs.map((t) => (
            <Tab key={t.value} value={t.value} icon={t.icon} count={t.count} countTone={t.countTone}>{t.label}</Tab>
          ))}
        </TabList>
      )}
      {routes && (
        <SubTabs active={String(current)} onChange={onChange}
          tabs={tabs.map((t) => ({
            id: String(t.value), label: t.label, icon: t.icon, title: t.title, badge: t.count,
            badgeTone: t.countTone, badgeNoun: t.badgeNoun,
          }))} />
      )}
      {tabsExtra && <div className="k-detailpage__tabs-extra">{tabsExtra}</div>}
    </div>
  );

  const body = renderTab && tabs
    ? (sections ? <TabPanel value={current}>{renderTab(current)}</TabPanel> : renderTab(current))
    : children;

  const grid = (
    <div className={"k-detailpage__grid" + (aside ? " k-detailpage__grid--aside" : "")}>
      <div className="k-detailpage__main">{body}</div>
      {aside && <aside className="k-detailpage__aside">{aside}</aside>}
    </div>
  );

  const inner = (
    <>
      {head}
      {tabRow}
      {grid}
    </>
  );

  return (
    <div {...rest} className={"k-detailpage" + (className ? " " + className : "")}>
      {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} onNavigate={onNavigate} />}
      <DataState loading={loading} error={error} onRetry={onRetry} skeleton={skeleton} isEmpty={isEmpty}
        emptyTitle={emptyTitle} emptyBody={emptyBody} emptyAction={emptyAction}>
        {sections
          ? <Tabs value={current} onChange={onChange} className="k-detailpage__sections">{inner}</Tabs>
          : inner}
      </DataState>
    </div>
  );
}

export { DetailPage };
