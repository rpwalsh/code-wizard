#!/usr/bin/env node
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Hold the whole repository to American spelling.
 *
 * Run with: node scripts/american-spelling.mjs [--check]
 *
 * Prose, comments, display strings and *identifiers* alike — a codebase that
 * says `normalizeOutput` in one file and `normaliseToken` in the next is
 * harder to search than one that picks either and keeps to it. Skill ids and
 * directory names are included for the same reason, which is why this is worth
 * doing before anybody's stored progress refers to them.
 *
 * The list is explicit rather than a set of stems, deliberately. A stem rule
 * like `analys → analyz` also rewrites `analysis`, and `emphasis`,
 * `parenthesis` and `basis` are correct in both dialects — a rule that
 * "corrects" them introduces errors while claiming to remove them. Every entry
 * below is a whole word with its own inflections.
 *
 * Case is preserved for the three shapes that occur in practice: lower,
 * Capitalized and UPPERCASE.
 *
 * Matching is anchored only at the *end* of the word, not the start. A leading
 * word boundary would miss `onPractise`, `daysPractised`, `_normalise` and
 * `unrecognised` — none of which begin at a boundary, all of which are the
 * British spelling. Anchoring the tail instead means an entry also covers its
 * prefixed forms for free: `deserialise`, `reinitialise` and `sublicence` need
 * no entries of their own.
 *
 * The tail anchor is `(?![a-z])` rather than `\b`, so that camel case still
 * matches (`practiseMode`) while a longer lowercase word does not. That
 * distinction is what keeps `enroll`, `distill` and `appall` — which contain
 * `enrol`, `distil` and `appal` — from being "corrected" into misspellings.
 */
import { readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * British → American, whole words only.
 *
 * Ordered longest-first at match time so `memoisation` is rewritten before
 * anything could match `memoise` inside it.
 */
const SPELLINGS = {
  // -ise / -isation. Only the verb forms: `analysis`, `emphasis` and
  // `basis` are correct in both dialects and are absent from this list.
  analyse: 'analyze', analysed: 'analyzed', analyser: 'analyzer', analysing: 'analyzing',
  authorise: 'authorize', authorised: 'authorized', authorising: 'authorizing',
  authorisation: 'authorization',
  categorise: 'categorize', categorised: 'categorized', categorisation: 'categorization',
  characterise: 'characterize', characterised: 'characterized',
  characterisation: 'characterization',
  customise: 'customize', customised: 'customized', customising: 'customizing',
  emphasise: 'emphasize', emphasised: 'emphasized', emphasising: 'emphasizing',
  generalise: 'generalize', generalised: 'generalized',
  initialise: 'initialize', initialised: 'initialized', initialising: 'initializing',
  initialisation: 'initialization',
  materialise: 'materialize', materialised: 'materialized', materialising: 'materializing',
  materialisation: 'materialization', materialises: 'materializes',
  maximise: 'maximize', maximised: 'maximized', minimise: 'minimize', minimised: 'minimized',
  memoise: 'memoize', memoised: 'memoized', memoising: 'memoizing', memoisation: 'memoization',
  normalise: 'normalize', normalised: 'normalized', normalising: 'normalizing',
  normalisation: 'normalization', normalises: 'normalizes',
  optimise: 'optimize', optimised: 'optimized', optimising: 'optimizing',
  optimisation: 'optimization',
  organise: 'organize', organised: 'organized', organising: 'organizing',
  organisation: 'organization',
  paralyse: 'paralyze', paralysed: 'paralyzed',
  prioritise: 'prioritize', prioritised: 'prioritized',
  realise: 'realize', realised: 'realized', realising: 'realizing',
  recognise: 'recognize', recognised: 'recognized', recognising: 'recognizing',
  recognises: 'recognizes',
  serialise: 'serialize', serialised: 'serialized', serialisation: 'serialization',
  specialise: 'specialize', specialised: 'specialized',
  standardise: 'standardize', standardised: 'standardized',
  summarise: 'summarize', summarised: 'summarized', summarising: 'summarizing',
  summarises: 'summarizes',
  synchronise: 'synchronize', synchronised: 'synchronized', synchronisation: 'synchronization',
  utilise: 'utilize', utilised: 'utilized',
  visualise: 'visualize', visualised: 'visualized',
  apologise: 'apologize', catalyse: 'catalyze', catalysed: 'catalyzed',
  criticise: 'criticize', criticised: 'criticized', criticising: 'criticizing',
  familiarise: 'familiarize', familiarised: 'familiarized',
  finalise: 'finalize', finalised: 'finalized', finalising: 'finalizing',
  harmonise: 'harmonize', humanise: 'humanize', humanised: 'humanized',
  humanising: 'humanizing', hypothesise: 'hypothesize', itemise: 'itemize',
  itemised: 'itemized', modularise: 'modularize', monetise: 'monetize',
  containerise: 'containerize', containerised: 'containerized',
  neutralise: 'neutralize', neutralised: 'neutralized',
  parameterise: 'parameterize', parameterised: 'parameterized',
  penalise: 'penalize', penalised: 'penalized',
  pluralise: 'pluralize', pluralised: 'pluralized', pluralising: 'pluralizing',
  publicise: 'publicize', randomise: 'randomize', randomised: 'randomized',
  randomising: 'randomizing',
  rationalise: 'rationalize', rationalised: 'rationalized',
  relativise: 'relativize', relativised: 'relativized',
  sanitise: 'sanitize', sanitised: 'sanitized', sanitising: 'sanitizing',
  sanitisation: 'sanitization',
  socialise: 'socialize', stabilise: 'stabilize', stabilised: 'stabilized',
  symbolise: 'symbolize', tokenise: 'tokenize', tokenised: 'tokenized',

  // Agent nouns and adjectives. These need their own entries: the tail anchor
  // stops `normalise` from matching inside `normaliser`, which is exactly what
  // stops it matching inside `enroll` too.
  analysable: 'analyzable', analysers: 'analyzers', customisable: 'customizable',
  initialiser: 'initializer', initialisers: 'initializers',
  normaliser: 'normalizer', normalisers: 'normalizers',
  optimiser: 'optimizer', optimisers: 'optimizers',
  organiser: 'organizer', organisers: 'organizers',
  randomiser: 'randomizer', randomisers: 'randomizers',
  recognisable: 'recognizable',
  sanitiser: 'sanitizer', sanitisers: 'sanitizers',
  serialisable: 'serializable', serialiser: 'serializer', serialisers: 'serializers',
  tokeniser: 'tokenizer', tokenisers: 'tokenizers',

  // -ce / -se. American uses one form for both noun and verb.
  licence: 'license', licences: 'licenses', licenced: 'licensed', licencing: 'licensing',
  practise: 'practice', practises: 'practices', practised: 'practiced',
  practising: 'practicing',
  defence: 'defense', defences: 'defenses', offence: 'offense', offences: 'offenses',
  pretence: 'pretense',

  // -our / -or.
  behaviour: 'behavior', behaviours: 'behaviors', behavioural: 'behavioral',
  colour: 'color', colours: 'colors', coloured: 'colored', colouring: 'coloring',
  favour: 'favor', favours: 'favors', favoured: 'favored', favourite: 'favorite',
  honour: 'honor', honours: 'honors', honoured: 'honored', honouring: 'honoring',
  labour: 'labor', labours: 'labors', neighbour: 'neighbor', neighbours: 'neighbors',
  neighbouring: 'neighboring', rumour: 'rumor',
  colourful: 'colorful', colourless: 'colorless',
  favourable: 'favorable', favourably: 'favorably', favouritism: 'favoritism',
  honourable: 'honorable', honourably: 'honorably',
  labourer: 'laborer', labourers: 'laborers',
  neighbourhood: 'neighborhood', neighbourhoods: 'neighborhoods',
  endeavour: 'endeavor', endeavours: 'endeavors',
  armour: 'armor', harbour: 'harbor', harbours: 'harbors', parlour: 'parlor',
  rigour: 'rigor', rigours: 'rigors', savour: 'savor', savoury: 'savory',
  saviour: 'savior', splendour: 'splendor', valour: 'valor', vigour: 'vigor',

  // -re / -er.
  centre: 'center', centres: 'centers', centred: 'centered',
  fibre: 'fiber', litre: 'liter', metre: 'meter', metres: 'meters', theatre: 'theater',
  calibre: 'caliber', lustre: 'luster', meagre: 'meager', sabre: 'saber',
  sceptre: 'scepter', sombre: 'somber', spectre: 'specter',
  manoeuvre: 'maneuver', manoeuvres: 'maneuvers', manoeuvred: 'maneuvered',
  manoeuvring: 'maneuvering',

  // Doubled consonants Britain keeps and America does not. Note that
  // "cancellation" keeps its double L in both dialects and is absent below.
  cancelled: 'canceled', cancelling: 'canceling',
  labelled: 'labeled', labelling: 'labeling',
  modelled: 'modeled', modelling: 'modeling',
  signalled: 'signaled', signalling: 'signaling',
  travelled: 'traveled', travelling: 'traveling', fuelled: 'fueled',
  marvelled: 'marveled', levelled: 'leveled',
  traveller: 'traveler', travellers: 'travelers', modeller: 'modeler',
  modellers: 'modelers', labeller: 'labeler', signaller: 'signaler',
  counsellor: 'counselor', counsellors: 'counselors',
  fuelling: 'fueling', levelling: 'leveling', panelling: 'paneling',
  tunnelling: 'tunneling', unravelling: 'unraveling',
  jewellery: 'jewelry', marvellous: 'marvelous', woollen: 'woolen',

  // Single consonants Britain drops and America keeps.
  enrol: 'enroll', enrols: 'enrolls', enrolment: 'enrollment',
  fulfil: 'fulfill', fulfils: 'fulfills', fulfilment: 'fulfillment',
  instalment: 'installment', skilful: 'skillful', wilful: 'willful', distil: 'distill',
  appal: 'appall',

  // The rest.
  analogue: 'analog', analogues: 'analogs',
  artefact: 'artifact', artefacts: 'artifacts',
  catalogue: 'catalog', catalogues: 'catalogs', catalogued: 'cataloged',
  cheque: 'check', cheques: 'checks', cosy: 'cozy',
  dialogue: 'dialog', dialogues: 'dialogs',
  encyclopaedia: 'encyclopedia', mediaeval: 'medieval',
  speciality: 'specialty', specialities: 'specialties', sulphur: 'sulfur',
  grey: 'gray', greyed: 'grayed', greying: 'graying', greyscale: 'grayscale',
  judgement: 'judgment', judgements: 'judgments',
  programme: 'program', programmes: 'programs',
  sceptical: 'skeptical', scepticism: 'skepticism',
  storey: 'story', storeys: 'stories',
  aluminium: 'aluminum', draught: 'draft', plough: 'plow', kerb: 'curb', tyre: 'tire',
  maths: 'math',

  // Britishisms of word choice rather than spelling. Included because the
  // instruction was American English throughout, and these read as the giveaway.
  whilst: 'while', amongst: 'among', learnt: 'learned', spelt: 'spelled',
  dreamt: 'dreamed', leapt: 'leaped',
};

/** Longest first, so `memoisation` never loses to `memoise`. */
/*
 * The tail anchor sits inside a `(?-i:...)` modifier group: under the `i`
 * flag a bare `[a-z]` also matches uppercase, which silently exempted every
 * British word followed by a capital — `summariseAttempts` sailed through
 * while `summarise(` was caught. The modifier group keeps just the lookahead
 * case-sensitive, so camelCase interiors are matched and `enroll`/`distill`
 * (which contain `enrol`/`distil`) stay protected.
 */
const PATTERN = new RegExp(
  `(${Object.keys(SPELLINGS).sort((a, b) => b.length - a.length).join('|')})(?-i:(?![a-z]))`,
  'giu',
);

/**
 * Give the replacement the shape of the word it replaces.
 *
 * `Licence` → `License`, `LICENCE` → `LICENSE`, `licence` → `license`. Mixed
 * case beyond that does not occur in a single word and is left lower.
 */
function matchCase(source, replacement) {
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return replacement.toUpperCase();
  }
  if (source[0] === source[0]?.toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', '.git', '.results', 'renderer', '.vite']);

/**
 * Never rewritten.
 *
 * Vendored runtimes and build output are other people's words or regenerated
 * copies of ours; editing either is at best pointless and at worst a false
 * change to somebody else's source.
 */
const SKIP_PATHS = [
  'apps/web/public/runtime/',
  'apps/web/public/content/',
  'apps/desktop/content/',
  'apps/desktop/renderer/',
  'apps/web/src/assets/',
  'scripts/american-spelling.mjs',
];

const BINARY = new Set(['.png', '.jpg', '.webp', '.zip', '.whl', '.wasm', '.pyc', '.tsbuildinfo']);

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRECTORIES.has(entry.name)) continue;

    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

const check = process.argv.includes('--check');
const changedFiles = [];
const renamedPaths = [];
const counts = new Map();

for await (const file of walk(root)) {
  const rel = relative(file);
  if (SKIP_PATHS.some((prefix) => rel.startsWith(prefix))) continue;
  if (BINARY.has(path.extname(file).toLowerCase())) continue;

  const contents = await readFile(file, 'utf8');
  const updated = contents.replace(PATTERN, (word) => {
    counts.set(word.toLowerCase(), (counts.get(word.toLowerCase()) ?? 0) + 1);
    return matchCase(word, SPELLINGS[word.toLowerCase()]);
  });

  if (updated !== contents) {
    changedFiles.push(rel);
    if (!check) await writeFile(file, updated, 'utf8');
  }
}

/*
 * Paths, after contents.
 *
 * A directory named `memoisation` is as much part of the codebase as the word
 * inside it, and the exercise loader finds exercises by walking directories —
 * so a half-renamed tree is one where the manifest and its folder disagree.
 * Done second because renaming while walking is how a walk misses files.
 */
if (!check) {
  const paths = [];
  for await (const file of walk(root)) {
    const rel = relative(file);
    if (SKIP_PATHS.some((prefix) => rel.startsWith(prefix))) continue;
    paths.push(file);
  }

  // Deepest first, so renaming a parent never invalidates a child's path.
  const directories = [...new Set(paths.map((file) => path.dirname(file)))].sort(
    (a, b) => b.length - a.length,
  );

  for (const directory of [...paths, ...directories]) {
    const name = path.basename(directory);
    const renamed = name.replace(PATTERN, (word) => matchCase(word, SPELLINGS[word.toLowerCase()]));
    if (renamed === name) continue;

    const target = path.join(path.dirname(directory), renamed);
    await rename(directory, target);
    renamedPaths.push(`${relative(directory)} → ${renamed}`);
  }
}

console.log(check ? 'American spelling — check' : 'American spelling');
console.log('──────────────────────────');
console.log(`  ${changedFiles.length} file(s) ${check ? 'still contain' : 'rewritten for'} British spelling`);

if (counts.size > 0) {
  const ordered = [...counts].sort((a, b) => b[1] - a[1]);
  for (const [word, count] of ordered.slice(0, 12)) {
    console.log(`    ${String(count).padStart(4)}  ${word} → ${SPELLINGS[word]}`);
  }
  if (ordered.length > 12) console.log(`    …and ${ordered.length - 12} more`);
}

for (const entry of renamedPaths) console.log(`  renamed  ${entry}`);

if (check && changedFiles.length > 0) {
  console.log('');
  console.error('Run: npm run spelling');
  process.exitCode = 1;
}
