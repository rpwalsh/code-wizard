// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The handbook: what everything in here means, in the learner's words.
 *
 * The application makes a lot of judgments — ten separate ability numbers, a
 * ladder that takes help away, a chart drawn so that falling is good — and a
 * judgment nobody can look up is indistinguishable from an arbitrary one.
 * This is where each of them is written down.
 *
 * Content as data rather than as markdown files: it ships in the bundle, it
 * needs no fetch, and the one piece of formatting it uses is a backtick,
 * which `Inline` already renders. Headings and tables are deliberately not
 * available — an article that needs them is an article that has grown into
 * documentation, and documentation belongs in `docs/`.
 */

export interface Article {
  readonly id: string;
  readonly title: string;
  readonly section: string;
  /** Paragraphs. Backticks render as code; nothing else is markup. */
  readonly body: readonly string[];
}

export const HANDBOOK: readonly Article[] = [
  {
    id: 'what-this-is',
    title: 'What this is',
    section: 'Starting out',
    body: [
      'A gym for writing code. You read a little, then you write a little, and the machine tells you whether it worked. Ten minutes a day is the intended dose.',
      'It is not a course and not a quiz. Nothing here is graded by a person, nothing is shared with anyone, and there is no model generating hints or completions. The absence is the point: a skill you stop performing is a skill that fades, and the only way to get it back is to perform it.',
      'The question the whole product asks is narrower than "do you understand this": it is "can you produce working code in this language without help". Those come apart, and the gap between them is what gets measured here.',
    ],
  },
  {
    id: 'first-ten-minutes',
    title: 'Your first ten minutes',
    section: 'Starting out',
    body: [
      'Pick a language at the top. Everything below it — your plan, your map, your practice — changes with it.',
      'If you are not sure where to start, choose Practice. It is reading and answering: six questions, a few minutes, no editor and nothing installed. It works for every subject here.',
      'When you want the real thing, open an exercise from the dashboard. You get a prompt, an editor and a test suite. Red is normal — every working program spent most of its life red.',
      'After a handful of attempts the dashboard stops guessing about you. Before that it is honest about knowing nothing.',
    ],
  },
  {
    id: 'activities-and-exercises',
    title: 'Activities and exercises',
    section: 'How practice works',
    body: [
      'Activities are reading. Predict what a program prints, find the fault, put lines in order, sort things into groups, build a structure. They need no editor and no runtime, which is why every subject has them.',
      'Exercises are writing. You get real files and real tests, and your code actually runs.',
      'The two are not interchangeable and the software will not pretend they are. An activity can raise `knowledge`, `recognition`, `recall` and `debugging`. It can never raise `application`, `composition`, `transfer` or `independence` — recognizing the right answer among four is not evidence you could have produced it from an empty file. That ceiling is enforced by a test rather than by good intentions.',
    ],
  },
  {
    id: 'withdrawal-ladder',
    title: 'The withdrawal ladder',
    section: 'How practice works',
    body: [
      'Five modes, and they only ever take assistance away.',
      '`Learn` withholds nothing. `Practice` withholds the reference solution. `Fluency` also withholds hints, documentation and autocomplete. `Blank page` withholds the starter code — an empty file and the tests. `Simulation` withholds the tests too, and you decide when it is right.',
      'Full marks for recall require the blank page. Completing a skeleton is a different act from producing the code: a skeleton has already answered which shape, which signature and which imports before you were asked.',
      'Move down the ladder when a rung stops being difficult. There is no penalty for staying, and no reward for rushing.',
    ],
  },
  {
    id: 'hints',
    title: 'Hints, and what they cost',
    section: 'How practice works',
    body: [
      'Hints are ordered from a gentle nudge to the answer outright, and you reveal them one at a time.',
      'Taking one is recorded. That is a cost, quietly stated — not a punishment. Nothing is deducted, nothing turns red, and no streak breaks.',
      'What it changes is one number: assistance dependency. A hint you needed today is information about where you are, which is worth more than a clean-looking score.',
      'The instrument to reach for before a hint is Watch it run. It replays what your own code actually did, line by line, with the values changing.',
    ],
  },
  {
    id: 'ten-numbers',
    title: 'The ten numbers',
    section: 'What gets measured',
    body: [
      'Not one percentage, because these genuinely come apart.',
      '`Knowledge` is whether you know what the machine will do. `Recognition` is whether you know it when you see it. `Recall` is whether you can produce it from an empty file.',
      '`Application` is building something with it. `Composition` is combining several things at once. `Debugging` is finding the fault when it breaks. `Transfer` is using it somewhere new.',
      '`Speed` is working pace. `Retention` is whether it is still there next week. `Independence` is whether you did it without help.',
      'You can be high on knowledge and low on recall for years without noticing, which is exactly the condition this exists to find.',
    ],
  },
  {
    id: 'assistance-dependency',
    title: 'Assistance dependency',
    section: 'What gets measured',
    body: [
      'The chart that matters most, and the one drawn so that falling is good.',
      'It counts how often you still reach for a hint, the documentation or the reference solution. It is compared against your own earlier sessions and against nobody else.',
      'Rising is not failure. It usually means you moved down the ladder or started something harder, both of which are the right thing to do. What matters is the shape over weeks.',
      'This is the number that answers the question the product is actually about: not "did you solve it" but "how much help did you need to solve it".',
    ],
  },
  {
    id: 'skill-map',
    title: 'The skill map',
    section: 'What gets measured',
    body: [
      'What rests on what. Every skill sits above the ones it depends on, and the map is the same shape as the language.',
      'Select a skill and the map traces its dependencies, dimming everything unrelated. If a skill is stuck, the thing holding it back is usually underneath it rather than in it.',
      'A skill with no exercise yet says so rather than pretending. Nothing on the map is inferred from a skill you have not practiced.',
    ],
  },
  {
    id: 'reading-a-failure',
    title: 'Reading a failing test',
    section: 'When you are stuck',
    body: [
      'A failure here is a diagnosis, not a wall of traceback: what was expected, what arrived, and which skill the test was probing.',
      'Some tests are marked as edges. Those are the corners — the empty list, the value that is zero, the two things that tie. They fail last and teach most.',
      'Hidden tests exist and their details are stripped before they reach you. You are told one failed and which skill it touched, never what it contained.',
      'Watch it run is the instrument, not a longer explanation. Use it before a hint.',
    ],
  },
  {
    id: 'i-know-this',
    title: 'Claiming a skill you already have',
    section: 'When you are stuck',
    body: [
      'There is an "I know this — skip it" option, and claiming a skill is neither refused nor believed.',
      'You get one unseen exercise on the blank page. Passing it credits the skill and everything beneath it. Failing costs nothing but the shortcut.',
      'This exists because a working programmer arriving here should not have to prove they can write a for loop forty times before reaching anything interesting.',
    ],
  },
  {
    id: 'languages',
    title: 'Which languages run where',
    section: 'The product',
    body: [
      'Fourteen languages. Eight of them run in this browser tab with nothing installed: Python and SQL as CPython compiled to WebAssembly, JavaScript, TypeScript, React, Angular and Node on the browser engine, and PHP as a real PHP compiled to WebAssembly, fetched the first time you open it.',
      'The other six want a compiler — C, C++, C#, ASP.NET, Go and Rust — and run in the desktop app, where they get the real toolchain rather than an approximation of one. The language menu marks them.',
      'Four subjects are disciplines rather than languages: frontend, backend, middleware and architecture. They are practiced in the fourteen rather than beside them, and today they ship activities rather than exercises.',
    ],
  },
  {
    id: 'your-data',
    title: 'Where your work is kept',
    section: 'The product',
    body: [
      'On this device and nowhere else. In a browser it is IndexedDB, which survives closing the tab and restarting the computer. In the desktop app it is a SQLite file in your user directory.',
      'There is no account, no sign-in and no server. Nothing you do here is transmitted anywhere, because the page contains no address to transmit it to.',
      'It is yours to move or remove. "Your data stays on this device" in the footer opens one panel: save a copy to a file, load one back, or delete everything. Deleting takes two deliberate steps and cannot be undone.',
      'Because it is local, it is local to this browser. Firefox on a laptop and Chrome on a desktop are two separate histories, and the file is how you move between them.',
    ],
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    section: 'The product',
    body: [
      '`Ctrl K` opens the command palette, which reaches everything: switching language, changing mode, jumping between screens, saving or loading your progress, and opening this handbook.',
      '`Ctrl Enter` runs the tests from the editor.',
      '`Escape` closes anything that is open, including this.',
      'In the workspace, the divider between the task panel and the editor is draggable, and it also takes arrow keys once focused.',
    ],
  },
];

/** Sections in the order the navigation shows them. */
export function handbookSections(): readonly { section: string; articles: readonly Article[] }[] {
  const order: string[] = [];
  const bySection = new Map<string, Article[]>();

  for (const article of HANDBOOK) {
    const existing = bySection.get(article.section);
    if (existing) existing.push(article);
    else {
      order.push(article.section);
      bySection.set(article.section, [article]);
    }
  }

  return order.map((section) => ({ section, articles: bySection.get(section) ?? [] }));
}
