import React from "react";
import { FilterDrawer, SearchField } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const opts = (...labels) => labels.map((label) => ({ value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label }));

// A film library's filters: Kind always holds one, Watched is a toggle.
const films = [
  { id: "kind", label: "Kind", kind: "one", base: "all", options: opts("All", "Movies", "TV shows", "Anime") },
  { id: "genre", label: "Genre", kind: "many", options: opts("Action", "Action & Adventure", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi & Fantasy", "Science Fiction", "TV Movie", "Thriller", "War", "War & Politics", "Western") },
  { id: "decade", label: "Decade", kind: "many", options: opts("2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "1950s", "1940s") },
  { id: "length", label: "Length", kind: "many", options: opts("Under 90 min", "90 to 150 min", "Over 150 min") },
  { id: "rating", label: "Rating", kind: "optional", options: opts("8 and up", "7 and up", "6 and up") },
  { id: "language", label: "Language", kind: "many", options: opts("English", "Chinese", "Danish", "French", "German", "Hindi", "Italian", "Japanese", "Korean", "Norwegian", "Portuguese", "Spanish", "Swedish", "Thai", "Turkish") },
  { id: "watched", label: "Watched", kind: "toggle", option: "Hide watched" },
];

// A recipe collection's filters: a slider, typed words, a long list and toggles with a note.
const recipes = [
  { id: "time", label: "Time", kind: "optional", options: opts("Under 30 min", "Under 60 min") },
  { id: "difficulty", label: "Difficulty", kind: "many", options: opts("Easy", "Medium", "Hard") },
  { id: "count", label: "Number of ingredients", kind: "range", min: 1, max: 21, any: 21,
    format: (v) => (v === 21 ? "Any" : "Up to " + v), chip: (v) => "Up to " + v + " ingredients" },
  { id: "have", label: "Ingredients I have", kind: "tokens", placeholder: "Add what's in your fridge" },
  { id: "region", label: "Region", kind: "many", options: opts("Dutch", "Belgian", "German", "Swiss", "British", "Irish", "Spanish", "Catalan", "Basque", "Bosnian", "Croatian", "Serbian", "Italian", "French", "Greek", "Portuguese", "Turkish", "Middle Eastern", "Moroccan", "North African", "Indian", "Indonesian", "Thai", "Chinese", "Japanese", "Mexican", "American", "Brazilian", "Peruvian", "Caribbean", "Korean", "Vietnamese") },
  { id: "label", label: "Nutrition and diet", kind: "many", options: opts("High protein", "High fibre", "Low fat", "Low sugar", "Low salt", "Under 500 kcal", "Vegetarian", "Vegan") },
  { id: "season", label: "Season", kind: "toggle", option: "In season only" },
  { id: "allergens", label: "Allergens", kind: "toggle", option: "Hide my allergens", note: "Peanuts, shellfish" },
];

function Example({ id, sections, start, placeholder }) {
  const [values, setValues] = React.useState(start);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <SearchField id={id} size="xl" value={q} onChange={setQ} onSubmit={() => {}} placeholder={placeholder}
        filters={<FilterDrawer sections={sections} values={values} onChange={setValues} onOpenChange={setOpen} />} />
      <code style={{ fontSize: 12, color: "var(--fg-3)" }}>{(open ? "open " : "closed ") + JSON.stringify(values)}</code>
    </div>
  );
}

export default function FilterDrawerSection() {
  return (
    <Section id="filter-drawer" title="FilterDrawer">
      <Sub title="A film library: one, many, optional and a toggle">
        <Example id="filters-films" sections={films} placeholder="Any movie or show"
          start={{ kind: "all", genre: ["comedy", "horror"], decade: ["1980s"] }} />
      </Sub>
      <Sub title="A recipe collection: a range, typed words, a long list and a toggle with a note">
        <Example id="filters-recipes" sections={recipes} placeholder="Recipes, ingredients, regions"
          start={{ time: "under-30-min", region: ["italian"], label: ["vegetarian"], have: ["tomatoes"] }} />
      </Sub>
    </Section>
  );
}
