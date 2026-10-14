// What each interactive page documents for keyboard and screen-reader use, read from the component's
// header comment and its markup: the keys that do something, the roles and labels it sets. A page with
// no entry here is static content or draws only native elements, and shows its header comment alone.
// { keys: [[key, effect]], semantics: [line] }

export const BEHAVIOUR = {
  button: {
    keys: [
      ["Enter, Space", "Press the button; an `href` renders a link, which Enter follows"],
      ["Tab", "Moves to the next control; a disabled or busy button is skipped"],
    ],
    semantics: [
      "A native `<button>` (`type=\"button\"` by default), or an `<a>` when `href` is set, with `aria-disabled` when it is disabled.",
      "`pressed` sets `aria-pressed`. `busy` keeps the label and swaps the icon for a spinner.",
      "An IconButton has no words, so `label` is required: it is the accessible name and the tooltip, which keyboard focus shows too.",
    ],
  },
  input: {
    keys: [
      ["Tab", "Moves into and out of the field"],
      ["Enter (PasswordInput reveal button)", "Reveals or hides what is typed; focus stays in the input"],
    ],
    semantics: [
      "Native `<input>` and `<textarea>` elements; every native attribute reaches them, `aria-*` included, and the ref reaches the element.",
      "`invalid` sets `aria-invalid`. PasswordInput's reveal button is named by `revealLabel`.",
    ],
  },
  field: {
    keys: [],
    semantics: [
      "The frame is a `<label>`, so a click on the words reaches the control without an id.",
      "`hintId` and `errorId` name the hint and the error line for the control's `aria-describedby`. A frame with `group` becomes a labelled group.",
    ],
  },
  checkbox: {
    keys: [
      ["Space", "Toggles a Checkbox or a Toggle"],
      ["Tab", "Moves to the next control"],
    ],
    semantics: [
      "Checkbox is a native checkbox inside its `<label>`. Toggle is `role=\"switch\"` with `aria-checked`, named by `label` when its words sit elsewhere.",
      "A Toggle takes effect when it is flipped, so no Save follows it.",
    ],
  },
  select: {
    keys: [["Enter, Space, arrows", "As a native `<select>`: the browser's own picker"]],
    semantics: ["A native `<select>`: value, `onChange(event)`, `disabled` and `aria-*` behave as on a plain select."],
  },
  combobox: {
    keys: [
      ["Typing", "Opens the list and moves the highlight to the first match"],
      ["ArrowDown, ArrowUp", "Move the highlight, opening the list first"],
      ["Alt+ArrowDown", "Opens the list without moving"],
      ["Enter", "Picks the highlighted option; never submits a form while the list is open"],
      ["Escape", "Closes the list, then clears the field"],
      ["Tab", "Closes the list and moves on"],
    ],
    semantics: [
      "The editable combobox with a listbox popup. The input keeps focus; the highlighted option is named by `aria-activedescendant`.",
      "Leaving the field puts the chosen option's label back in it.",
    ],
  },
  "option-list": {
    keys: [
      ["Tab", "Moves to the group; one stop on the chosen row of a single choice"],
      ["Arrows", "Move a single choice between rows"],
      ["Space", "Chooses a row, or checks one in a multiple choice"],
    ],
    semantics: [
      "Every row holds a real `<input>` inside its `<label>`, so a click on the words reaches it and a screen reader names it.",
      "A single choice is a `radiogroup` and a multiple one a `group`; `label` names it when its heading is drawn elsewhere.",
    ],
  },
  "radio-group": {
    keys: [
      ["Tab", "One stop, on the chosen option"],
      ["ArrowRight, ArrowDown", "Next option, chosen at once"],
      ["ArrowLeft, ArrowUp", "Previous option, chosen at once"],
    ],
    semantics: ["`role=\"radiogroup\"` of `role=\"radio\"` buttons with `aria-checked`; `label` names the group."],
  },
  slider: {
    keys: [
      ["ArrowRight, ArrowUp", "Up by `step`"],
      ["ArrowLeft, ArrowDown", "Down by `step`"],
      ["PageUp, PageDown", "By a tenth of the range"],
      ["Home, End", "To the ends"],
    ],
    semantics: [
      "`role=\"slider\"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext` (the words `format` returns). The thumb is the one tab stop.",
    ],
  },
  progress: {
    keys: [],
    semantics: [
      "Meter is a `role=\"progressbar\"` with `aria-valuenow` and `aria-valuetext`, named by `label`; its segments speak each part's label and share.",
      "Spinner is hidden from assistive technology unless it has a `label`, then it is a `status`. Skeleton is `aria-hidden`.",
    ],
  },
  "status-dot": {
    keys: [],
    semantics: ["A `role=\"img\"` named by `label`: the state is always said in words, never by colour alone."],
  },
  tabs: {
    keys: [
      ["ArrowRight, ArrowLeft", "Move to the next or previous tab (ArrowDown, ArrowUp for a vertical list); with `activation=\"auto\"` the tab is chosen at once"],
      ["Home, End", "First and last tab"],
      ["Enter, Space", "Choose the focused tab when `activation=\"manual\"`"],
      ["Tab", "From the tab list into the chosen panel"],
    ],
    semantics: [
      "`role=\"tablist\"` named by `label`, `role=\"tab\"` with `aria-selected` and `aria-controls`, `role=\"tabpanel\"` labelled by its tab.",
    ],
  },
  "sub-tabs": {
    keys: [["Tab, Enter, Space", "Buttons in a labelled strip; at phone width the strip is a `<select>`"]],
    semantics: ["A labelled group of buttons on a wide screen and a native select on a phone."],
  },
  disclosure: {
    keys: [
      ["Enter, Space", "Open or close the summary"],
      ["ArrowDown, ArrowUp", "Next or previous summary in an Accordion, with wrap"],
      ["Home, End", "First and last summary in an Accordion"],
    ],
    semantics: [
      "The summary is a button with `aria-expanded` and `aria-controls`; the content is a `role=\"region\"` the summary labels.",
    ],
  },
  pagination: {
    keys: [["Tab, Enter", "Each page is a button; the current one carries `aria-current`"]],
    semantics: ["A labelled navigation; `aria-current=\"page\"` on the current page. Pages are 0-indexed in props and 1-indexed in labels."],
  },
  breadcrumbs: {
    keys: [["Tab, Enter", "Every crumb but the last is a real link: middle-click and copy-link work"]],
    semantics: ["A labelled navigation; the last crumb carries `aria-current`. A string label is also the crumb's `title`."],
  },
  rail: {
    keys: [
      ["Tab", "Tabbing to an off-screen card scrolls it into view"],
      ["Shift+wheel, trackpad", "Scroll the shelf sideways"],
    ],
    semantics: ["A labelled `role=\"group\"`; the arrows are buttons that call `scrollBy`."],
  },
  table: {
    keys: [
      ["Tab", "Moves through sortable headers, interactive cells and row actions"],
      ["Enter, Space", "Sorts a header; opens a row that has `onRowOpen` or `rowHref`"],
    ],
    semantics: [
      "A real `<table>` with the roles stated outright (`table`, `rowgroup`, `row`, `columnheader`, `cell`) so they hold when a phone lays rows out as cards.",
      "A sortable header holds a button and carries `aria-sort`. An unknown value is drawn as an explicit dash, read aloud as \"unknown\".",
    ],
  },
  list: {
    keys: [["Tab, Enter", "A row with `onOpen` or `href` is one control; its actions are separate stops"]],
    semantics: ["`selected` marks the row's title control with `aria-current`. A disabled row blocks `onOpen`."],
  },
  card: {
    keys: [["Tab, Enter", "A card with `onOpen` or `href` opens as a whole; its `actions` are their own targets"]],
    semantics: ["The title (or `label`, when there is no head) becomes the button or link; `selected` carries `aria-current`."],
  },
  dialog: {
    keys: [
      ["Escape", "Closes the topmost dialog only, unless `canClose` is false"],
      ["Tab, Shift+Tab", "Cycle inside the dialog; focus is trapped"],
      ["Enter", "In a field of a dialog drawn `as=\"form\"`, submits it"],
    ],
    semantics: [
      "`role=\"dialog\"` with `aria-modal`, named by its `title` (or `label`). Focus moves in on open and returns to the opener on close; the page behind is inert.",
      "A press on the scrim closes it, held off by `canClose`.",
    ],
  },
  "form-dialog": {
    keys: [
      ["Enter", "In a field, submits the form"],
      ["Escape", "Cancels; held while the form is submitting"],
    ],
    semantics: ["A Dialog that is a `<form>` (`noValidate`): the handle's rules judge, the foot's Cancel and submit buttons are held while a submission runs."],
  },
  steps: {
    keys: [
      ["Tab", "Moves between the steps"],
      ["Enter, Space", "Chooses the step"],
    ],
    semantics: [
      "A `<nav>` named by `label` holding one native button per step; the current one has `aria-current=\"step\"`.",
      "A dot has no words, so it is named by its step's `label`.",
    ],
  },
  "confirm-dialog": {
    keys: [["Escape", "Cancels; held while the confirmation is working"]],
    semantics: ["A Dialog: the confirm is a danger Button with the dialog's icon, and `busyLabel` replaces its label while it works."],
  },
  drawer: {
    keys: [
      ["Escape", "Closes the topmost overlay only"],
      ["Tab, Shift+Tab", "Cycle inside the sheet; focus is trapped"],
      ["Pull down (touch)", "Dismisses a bottom sheet from its handle"],
    ],
    semantics: ["`role` is `dialog` (default), `alertdialog` or `menu`; `aria-modal` is set for the dialogs only."],
  },
  popover: {
    keys: [
      ["Enter, Space", "On the trigger: toggles the panel"],
      ["Escape", "Closes it and returns focus to the trigger; an enclosing dialog stays open"],
      ["Tab past either end", "Closes it and leaves focus on the trigger"],
    ],
    semantics: [
      "The trigger carries `aria-haspopup=\"dialog\"`, `aria-expanded` and `aria-controls`; the panel is a `role=\"dialog\"` named by `label` or `title`. Focus moves to its first control on open.",
    ],
  },
  tooltip: {
    keys: [
      ["Focus", "Shows the tip"],
      ["Escape", "Hides the tip and leaves Escape to any layer around it"],
    ],
    semantics: ["`role=\"tooltip\"`, tied to its trigger by `aria-describedby` while it shows. A touch never shows it."],
  },
  menu: {
    keys: [
      ["Enter, Space, ArrowDown", "On the trigger: open with the first item focused"],
      ["ArrowUp", "On the trigger: open on the last item"],
      ["Arrows", "Move between items, with wrap"],
      ["Home, End", "First and last item"],
      ["A typed letter", "Next item whose label starts with what was typed"],
      ["Enter, Space", "Select the item"],
      ["Escape", "Close and return focus to the trigger"],
      ["Tab", "Close and move on from the trigger"],
    ],
    semantics: [
      "The WAI-ARIA menu button pattern: items take focus by script, so Tab never walks through them. A disabled item stays visible, is skipped by the arrows and is announced as disabled.",
    ],
  },
  toolbar: {
    keys: [["Tab", "Each control is its own stop"]],
    semantics: ["Every control is labelled; a sort direction and a filter group are named by their label."],
  },
  toasts: {
    keys: [],
    semantics: ["The stack is a live region (`aria-live`); an error toast has `role=\"alert\"` and the others `role=\"status\"`."],
  },
  notice: {
    keys: [],
    semantics: ["A danger notice has `role=\"alert\"` and is announced; the others carry no live role."],
  },
  "app-shell": {
    keys: [
      ["Tab", "Sidebar items are links or buttons; the collapsed rail keeps their labels"],
      ["Swipe from the edge (phone)", "Opens the drawer"],
    ],
    semantics: ["The sidebar and the tab bar are labelled navigations; the active item carries `aria-current`."],
  },
  "copy-field": {
    keys: [["Tab, Enter", "The copy button sits in the suffix"]],
    semantics: ["`label` names the copy button; `onCopied(value)` runs after a copy that worked."],
  },
  avatar: {
    keys: [],
    semantics: ["Hidden from assistive technology unless `label` names it; `statusLabel` says what the status dot means."],
  },
  kbd: {
    keys: [],
    semantics: ["A chord is a `kbd` of `kbd` keys, so a screen reader announces each key and the separator as text."],
  },
  "stat-tile": {
    keys: [["Tab, Enter", "A tile with `onOpen` is one button"]],
    semantics: ["An unmeasured value is drawn as an explicit dash, never a zero."],
  },
  "theme-picker": {
    keys: [["Tab, Enter", "Each theme is a button; the label sits outside the swatch and renders in the applied theme"]],
    semantics: ["The chosen theme's button carries `aria-pressed`."],
  },
  tv: {
    keys: [["Arrows, Enter", "A site's navigator moves focus between parts; `useSpatialFocus` reads where they are"]],
    semantics: ["A TvCard is a link named by `label`; every other prop reaches the link."],
  },
};
