# Ondra - Practice Pages

Simple static web app with practice pages for English irregular verbs and multiplication tables.

## What the app does

- Shows one prompt at a time.
- User types an answer and checks it.
- Each prompt is removed from the active set after **2 correct answers in a row**.
- Tracks:
  - Remaining items
  - Current streak for current verb (`0 / 2`, `1 / 2`)
  - Total correct answers

## Project structure

- `index.html`: home page with links to practice sets.
- `irregular-verbs-1.html`: first verb set (`initialItems`) and shared app mount points.
- `irregular-verbs-2.html`: second verb set (`initialItems`) and shared app mount points.
- `times-tables.html`: multiplication training page with checkbox selection for tables 2-12.
- `practice.js`: all quiz logic and state management.
- `styles.css`: styling.

## How data is wired

Verb pages define:

```js
const initialItems = [
  { prompt: "learn (učit se)", answer: "learnt" },
  // ...
];
```

`practice.js` reads `initialItems` from the page and creates runtime items with extra fields:

- `id`: unique numeric id.
- `prompt`: text shown to user.
- `answer`: expected past simple form.
- `streak`: consecutive correct count for that item.

`times-tables.html` generates `initialItems` dynamically from selected checkboxes.

## Core app logic

### Startup

1. Build `items` from `initialItems` with `streak: 0`.
2. Pick a random item with `pickRandomItem()`.
3. Render prompt, input, buttons, stats, and remaining list.

### Answer checking

`checkAnswer()` normalizes input and expected answer:

- lowercase
- trim
- collapse repeated spaces

Then compares normalized values.

### 2-correct-in-a-row removal rule

For a correct answer:

1. Increment `currentItem.streak`.
2. Increment `totalCorrect`.
3. If `currentItem.streak >= 2`:
   - Remove item from `items`.
   - Show success message saying the verb was learned and removed.
   - Update stats/list.
   - Load next random prompt after a short delay.
4. If `streak === 1`:
   - Keep item in set.
   - Show message that one more correct answer removes it.
   - Load next random prompt.

For a wrong answer:

1. Reset `currentItem.streak = 0`.
2. Show correct answer.
3. Disable input/buttons temporarily.
4. Wait 4 seconds (or Enter) and load another prompt.

## Reset behavior

`resetApp()` restores the original full set from `initialItems`, clears counters/state, and starts again.

## Running locally

Because this is static HTML/JS, open `index.html` directly in a browser, or serve the folder with any static server.
