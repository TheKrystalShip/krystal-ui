// The Krystal playground, which is also its documentation: a page per component with its live
// examples, generated props and keyboard behaviour, the token reference and the guides, and every
// example on one page for the visual harness to shoot.
// Run: npm run play -- --port 5211, then open http://127.0.0.1:5211/ (#/button, #/tokens,
// #/all; on #/all the anchors #controls, #badges, #page, #settings, #dialogs, #lists, #cardscreen,
// #frame, #chat and the file name of each sections/*.jsx land on their sections).
import { createRoot } from "react-dom/client";
import "@thekrystalship/krystal/styles.css";
import "@thekrystalship/krystal-chat/styles.css";
import "./docs/docs.css";
import { App } from "./docs/App.jsx";

createRoot(document.getElementById("root")).render(<App />);
