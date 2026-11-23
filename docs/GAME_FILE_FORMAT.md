# Studiolo game file, format 3

Specification, 22 November 2026. Schema: `rulesets/schema/game.schema.json` (game file) and `rulesets/schema/texts.schema.json` (texts file), JSON Schema draft 2020-12. Check: `node tools/validate-rulesets.mjs` (built-in Node modules only). Examples: `rulesets/venticinque.json`, `rulesets/morto.json`, `rulesets/texts/venticinque.texts.json`. Rules that do not fit cleanly: `docs/FORMAT_OPEN_POINTS.md`.

The games are those of the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787); the list of games and of the core modules follows its list of games. Page numbers below are the printed pages of the book; the examples quote it as the first reading of the games did.

## Contents

1. Principle
2. Files
3. The rule leaf
4. Top level of a game file
5. Cards: ids, selectors, deck, orders, points, the Fool
6. Seats and sides
7. Agreements, variants, inheritance
8. The hand: phases
9. Contracts
10. Amounts
11. The modules (catalogue)
12. Match
13. Penalties
14. View
15. Bot
16. Texts file
17. Rules page, memo and lesson: one source
18. What a module is
19. Compatibility with format 2
20. Every game of the book in this format
21. Validation

---

## 1. Principle

One framework: a rules core for 2 to 7 seats, the server, the table, a hand of any size, the score panel, the memo, hints, the lesson and one configurable bot. A game differs from another **only by its files**:

- the **game file** `rulesets/<id>.json`: every rule as data, each with its source;
- the **texts file** `rulesets/texts/<id>.texts.json`: names, the ninety-second version, memo lines, hints, lesson steps, in Russian and English.

A new game is a game file plus a texts file. A new mechanism is one new core module (section 18), which every later game can then use by naming it in its phases. Nothing in a game file is code: no expressions, no scripts. Where a rule needs a choice the format offers a closed list of values; where the list is short of a value, that is a new value of a module (a code change in one place) and an entry in `FORMAT_OPEN_POINTS.md`, never a script in a game file.

The same two files feed the table (rules engine, memo, hints, lesson, bot) and the game's public rules page on the site (section 17). Numbers live only in the game file; texts reach them through placeholders, so the memo, the rules page and the lesson cannot disagree.

## 2. Files

```
rulesets/
  <id>.json                     game file (format 3)
  texts/<id>.texts.json         texts file (format 3, kind "texts")
  schema/game.schema.json
  schema/texts.schema.json
core/modules/<module>/          one folder per module (code, not in this run)
core/texts/<module>.<lang>.json the module's sentences: memo and rules-page templates per setting value
tools/validate-rulesets.mjs
```

The id is lowercase ASCII with underscores (`venticinque`, `permesso_3`, `chiamare_il_re`). Files are UTF-8 JSON with tabs; a rule leaf stays on one line, as in format 2.

## 3. The rule leaf

Every rule is a rule leaf, as in format 2:

```json
"hand_size": {"value": 25, "source": "[D] Torino 1787, p. 53: «Del giuoco di venticinque carte in due persone»: the player who does not deal receives 25 cards."}
```

| key | type | required | meaning |
|---|---|---|---|
| `value` | any JSON value, typed per key (below) | yes | what the engine plays |
| `source` | string | yes | starts with a mark and a space: `[D] `, `[R] ` or `[S] `, then the source in words |
| `alt` | same type as `value` | no | the other reading of a `[R]` rule; a variant or a test can switch to it |
| `pages` | array of integers | no | printed pages, when the generator should not parse them from `source` |
| `by` | id | no | key of the `sources` table: the source the rule is taken from, or, for a [S] leaf, whose reading the decision follows; ours = our own decision with no source behind it |
| `note` | string | no | a remark for developers; never shown to players |
| `unused` | `true` | no | the file keeps this setting, but this game does not use it: it is never shown as a rule (see «Unused leaves» below) |

The marks:

- `[D]` printed in a source: the book (or another named source), the page, a short quotation in Italian in «».
- `[R]` our reading of a passage that reads more than one way: give the words and the other reading (in `source`, and as a value in `alt` when the other reading is playable).
- `[S]` the source is silent, the decision is ours: say what is missing.

A [S] leaf has by when it follows the reading of a source (dummett1980, torino1846, …); a [S] leaf without by is our own decision, the same as by: ours.

A leaf whose source is not the 1787 book names the source in the text («[D] Dummett 1980, p. 261 (after RI): …») and may also set `by`. A number in a `source` always carries its page.

**Unused leaves.** A file converted from an older format lists every setting of that format, also those the game never reads (the race target of a match that is a fixed number of hands, the dry-hand line when a won hand is always one game point). Such a leaf carries `"unused": true` after `source`: it keeps its `value` and `source`, so the file still lists the setting and the check against the older format still matches it word for word, but the rules page, the short version and the generated pages leave it out. Mark a leaf only when no reading of the file can reach it; a setting that says something true about the game (`max_stake`: no doubling) stays a shown rule.

**Seat-dependent values.** Wherever the type allows (marked «by seats» in the tables), `value` may be `{"by_seats": {"2": 25, "3": 25, "4": 19, "5": 15, "6": 13, "7": 11}}`. The engine picks the entry for the number of seats at the table. Example: Meno, p. 78, one game file for two to seven players.

**Role-dependent counts.** Card counts (`deal.hand_size`, `discard.count`) may be `{"by_role": {"dealer": 13, "others": 12}}` (roles: `dealer`, `non_dealer`, `declarer`, `others`). Example: Mitigati for two, p. 85, «sino al numero di tredici, e chi le ricevette ne scarta dodici».

**What is not a rule leaf.** Structure (`id`, `module`, `during`, `after`, `until`), presentation (`view`) and the texts are not rules and carry no source. A phase may carry a `source` for the fact that the phase exists at all (for example that there is a discard).

## 4. Top level of a game file

| key | type | required | read by | meaning |
|---|---|---|---|---|
| `format` | `3` | yes | loader | format number |
| `id` | id | yes | everything | game id, also the file name |
| `extends` | id | no | loader | game file this one inherits from (section 7.3) |
| `family` | id | no | site | groups games on the site (`permesso`, `venticinque`) |
| `status` | `documented` / `playable_with_decisions` / `from_later_source` / `draft` | no | site | the grade of clarity of the first reading; `from_later_source` for Venticinque for three (RI 1830 through Dummett) |
| `about` | string | yes | site, developers | one paragraph in English: what the game is, what is ours |
| `versions` | object of integers | no | engine, journal | rule versions; a journal of a table records them |
| `revision` | integer ≥ 1 | no | journal, site | number of the last Studiolo rules revision that changed this file; the log is `rulesets/REVISIONS.md`; a journal of a table records it |
| `converted_from` | `{format, file, note}` | no | validator | where a converted file came from (section 19) |
| `sources` | object id → `{cite, short_ru, short_en, held}` | no | rules page | bibliography for `by`; the 1787 book is built in as `torino1787` |
| `seats` | object | yes | table, deal, tricks | section 6 |
| `sides` | object | yes | count, result, settle, view | section 6 |
| `cards` | object | yes | every module | section 5 |
| `options` | array | no | table setup, settle | agreements before the deal (section 7.1) |
| `variants` | array | no | table setup | customs and later sources as patches (section 7.2) |
| `contracts` | array | no | bidding, exchange, call_partner, result, settle | section 9 |
| `hand` | `{phases: [...]}` | yes | engine | section 8 |
| `match` | object | no | match runner | section 12; absent: one hand |
| `penalties` | array | no | engine, rules page | section 13 |
| `view` | object | no | table | section 14 |
| `bot` | object | no | bot | section 15; absent: the bot's defaults |
| `left_out` | array of `{id, source, why}` | no | rules page | rules of the source the engine does not play, and why |
| `texts` | string | no | loader | path of the texts file; default `texts/<id>.texts.json` |

## 5. Cards

### 5.1 Card ids

| card | id | example |
|---|---|---|
| trionfo by its number as printed in the 1787 list (pp. 9-10) | `T0` … `T21` | `T0` the Fool, `T1` the Bagatto, `T20` the Angel, `T21` the World |
| suit card | `<suit>:<rank>` | `cups:K`, `swords:10`, `coins:1` |

Suits: `cups`, `coins`, `swords`, `batons`. Ranks: `1` … `10`, `J` (fante, jack), `N` (cavallo, knight), `Q` (donna, queen), `K` (re, king). The art of a card and its name in every language come from the deck files of the framework, not from the game file. A source that numbers the trionfi differently (Milan) still uses these ids, by subject; its order is written out as a list (5.4). See `FORMAT_OPEN_POINTS.md`, point 30.

### 5.2 Selectors

A selector names a set of cards. String forms:

| selector | cards |
|---|---|
| `T20`, `cups:K` | one card |
| `rank:K` | the four kings |
| `suit:cups` | the fourteen cups |
| `trumps` | `T0` … `T21` (the Fool included) |
| `suits` | the 56 suit cards |
| `counters` | cards with a value in `cards.card_points` above the plain value |
| `plain` | the other cards (the book's «cartacce») |
| `all` | the deck |
| `set:<name>` | a set defined in `cards.sets` |

Object forms combine them: `{"any": [...]}` (union), `{"all": [...]}` (intersection), `{"not": selector}`, and `{"if": condition}` (the selector applies only when the condition holds, used for exceptions, 5.6). Conditions: section 8.3.

### 5.3 `cards.deck`

| value | meaning |
|---|---|
| `"full78"` | the 78-card pack (p. 9: «Settant'otto Tarocchi si richiedono») |
| `{"include": [...], "exclude": [...]}` | a reduced pack for later sources, by selectors; e.g. `{"exclude": ["swords:2", "swords:3"]}` |

Read by: `deal`, and every count check of the validator.

### 5.4 `cards.trump_order`, `cards.suit_order`

`trump_order`: a preset or the list of trionfo ids from highest to lowest. Presets (the format 2 names): `torino_1787` (by printed number, the Angel `T20` above the World `T21`, p. 13; the Fool outside the order), `printed` (printed number, no exception), `pavia_c` (the Pavia C order of the format 2 engine). A list may include `T0`: then the Fool ranks where it stands; Sedici and Trent'uno put it lowest («viene preso assolutamente da Bagatto», pp. 36, 38): `["T20", "T21", "T19", …, "T1", "T0"]`.

`suit_order`: `italian` (cups and coins: K, Q, N, J, 1, 2 … 10; swords and batons: K, Q, N, J, 10 … 1; pp. 11-13), `straight` (K, Q, N, J, 10 … 1 in all four), or an object `{"cups": ["K","Q","N","J","1",…], …}` highest first.

Read by: `tricks` (who takes), `call_partner` (the ladder), `bot`, view (the strength reminder).

### 5.5 `cards.card_points` and `cards.sets`

`card_points`: a preset or an object selector → value **in the book's numbers** (a king 5, p. 13).

| preset | values (book's numbers) | used by |
|---|---|---|
| `honours_4_angel` = `book_1787` | K 5, Q 4, N 3, J 2, `T20` 5, `T1` 5, `T0` 5, every other card 1 | the long games of the book |
| `honours_4` | as above with `T21` in place of `T20` | Morto (format 2, Milanese) |
| `book_1787_short` | K 5, Q 4, N 3, J 2, `T20` 5, `T1` 5, `T0` 1, the others `count.plain_value` | Sedici, Trent'uno (pp. 14, 38, 51) |

The format 2 engine stores these as «points less one» in half-points; the arithmetic is the same (section 11, `count`). Example of an explicit table: `{"rank:K": 5, "rank:Q": 4, "rank:N": 3, "rank:J": 2, "T20": 5, "T1": 5, "T0": 5}`; a card not named is plain.

`sets`: named selector lists other modules refer to as `set:<name>`. The honours of the book (p. 34: «nessun Re, nè l'Angelo, nè il Folle, nè Bagatto»):

```json
"sets": {"honours": {"value": ["rank:K", "T20", "T0", "T1"], "source": "[D] Torino 1787, p. 34: «Nessun onore, cioè nessun Re, nè l'Angelo, nè il Folle, nè Bagatto»."}}
```

When `sets.honours` is absent, the honours are the counters worth 5 of `card_points` (the format 2 rule).

### 5.6 The Fool

| key | type | values | default | read by |
|---|---|---|---|---|
| `fool` | enum | `excuse` (shown, takes nothing, is never taken: p. 54); `trump` (an ordinary trionfo ranked by `trump_order`: Sedici, p. 36); `low_trump`, `high_trump` (format 2 lab values) | `excuse` | tricks, count |
| `fool_exchange` | bool | the owner gives a plain card for the Fool at the end of the hand (p. 52) | `true` with `excuse` | count |
| `fool_exchange_card` | enum | `cheapest` (engine picks), `owner_choice` (the owner picks, p. 52 «qualunque gli piaccia») | `cheapest` | count |
| `fool_exchange_to` | enum | `opponent_side`; `trick_winner` (the winner of the trick in which the Fool was shown: Quintilio, Sestilio, Settilio, pp. 77-78) | `opponent_side` | count |
| `fool_no_tricks` | enum | `give_none` (format 2), `give_fool` (a side without tricks gives the Fool itself: Dummett 1980, p. 259, after RI) | `give_none` | count |
| `fool_last_trick` | enum | `kept`, `lost` | `kept` | tricks |
| `fool_show_any_time` | bool | the Fool may be shown and laid aside outside a trick (Baronetti, p. 50 «solo mi basterà mostrarlo») | `false` | tricks, open_piles |

## 6. Seats and sides

### 6.1 `seats`

| key | type | values | read by |
|---|---|---|---|
| `count` | integer 2-7, or a list of them | `2`; `[2, 3, 4]` (Sedici, pp. 14-15, 36, 43) | table, validator |
| `direction` | enum | `right` (pp. 35, 37 «gli altri sempre a destra procedendo»), `left` | tricks, bidding, deal |
| `first_dealer` | enum | `draw_trump` (p. 16), `draw_high`, `best_cut` (Partita, p. 89 «Chi coppa meglio», [R]), `random`, `host` | table |
| `cut_by` | enum | `left` (pp. 16-18), `right`, `none` | deal |
| `cut_min` | integer | `2` (p. 17 «Una carta sola non si può coppare») | deal |
| `dealer_rotation` | enum | `right`, `left`, `alternate`, `loser_deals`, `winner_passes_to_companion` (p. 41), `same` | match runner |
| `seating` | enum | `free`, `partners_opposite` (Partita, p. 89 «a faccia a faccia»), `partners_adjacent` (Consiglio, p. 97), `draw_high_pairs` | table |

### 6.2 `sides`

| key | type | values | read by |
|---|---|---|---|
| `mode` | enum, by seats | `each_for_self`; `fixed_pairs` (Partita 2×2); `declarer_vs_rest` (Permesso: «gli altri due compagni insieme mi sono incontra», p. 61); `called_partner` (Chiamare il Re); `by_contract` (the winning contract decides, section 9) | count, result, settle, view |
| `pool` | enum | `seat`, `side` (partners' points in one heap: p. 61-62, p. 89 «di due mucchj un solo mucchio») | count |
| `partners_share_hands` | bool | Consiglio, p. 97 «mostransi il giuoco» | view |
| `partners_talk` | bool | Consiglio, p. 97 «si consultano liberamente» | table chat |
| `signals` | enum | `forbidden` (pp. 25-26, 72-73), `free` | table chat, penalties |

`pool` defaults to `side` for every mode but `each_for_self`.

## 7. Agreements, variants, inheritance

### 7.1 `options`: what the players agree before the deal

The book asks the players to settle stakes and premiums before dealing (p. 21: «Tutto questo si dee concludere chiaramente prima di dare le carte»). These are options: the table creator picks them; the rules page lists them as «by agreement».

```json
"options": [
	{"id": "stake", "choices": [1, 2, 5, 10], "default": 1, "source": "[D] Torino 1787, p. 21: the simple game is agreed before the deal.", "affects": ["hand.settle.amount"]},
	{"id": "vola", "choices": [false, true], "default": false, "source": "[D] Torino 1787, p. 55: «Quì giuocasi la vola, il marcio, il triplice, il quadriplice ec., purchè si voglia».", "affects": ["hand.settle.premiums"]}
]
```

An option's value reaches the rules through an amount `{"option": "stake"}` (section 10) or a condition `{"option": {"vola": true}}` (section 8.3). `affects` lists the rule paths it changes, for the rules page.

### 7.2 `variants`: customs and later sources

A variant is a named patch on the game file, chosen when the table is made. It carries its own source. Examples: Consiglio's two customs (p. 97, «presso cert'uni … presso altri»), Bagatt'ultimo's local exception (p. 96, «Eccettuazione»), Sestilio «a giuoco sciolto» (pp. 76-77), a rule set «after the rules of 1830» beside the book's.

```json
"variants": [
	{"id": "sum_of_four", "source": "[D] Torino 1787, p. 97: «presso altri» the side with more points over a round of four deals wins.",
	 "patch": {"match": {"kind": {"value": "fixed_hands", "source": "…"}, "hands": {"value": 4, "source": "…"}}}}
]
```

The patch merges as `extends` does (7.3). The rules page shows each variant as a box «variant: …» with its source.

### 7.3 `extends`: a game written as another game plus differences

The book writes many games as «the same as …»: Morto «non giuocasi altrimente che a Venticinque carte» (p. 57), Quadrilio «è lo stesso, che il Permesso in tre persone» (p. 71), Consiglio «tutto è simile al giuoco di Partita in quattro» (p. 97), Trent'uno after the rules of Sedici (p. 45). The format follows the book: a child file names its parent in `extends` and holds only what differs.

Merge rules:

1. Objects merge key by key, recursively.
2. A rule leaf is replaced whole, never merged, so a value never travels without its source.
3. Arrays are replaced whole, except `hand.phases`.
4. `hand.phases` merges by phase `id`: a child phase with a parent's id merges into it (its `settings` merge by key, leaves replaced whole); `"remove": true` deletes the parent's phase; a new id is inserted after the phase named in `after`, or at the end.
5. `id`, `about`, `status`, `converted_from` are never inherited.

The engine and the rules page see the merged file; the rules page says «as in game X» for every leaf inherited unchanged (it links the parent's page).

## 8. The hand: phases

`hand.phases` is the ordered list of module instances that make one hand. Each instance:

| key | type | required | meaning |
|---|---|---|---|
| `id` | id | yes | unique in the file; the rule paths of texts use it: `hand.<id>.<key>` |
| `module` | enum | yes | which core module runs it (section 11) |
| `settings` | object of rule leaves | no | the module's settings; keys and types per module |
| `source` | source string | no | source for the existence of the phase |
| `when` | condition | no | the phase runs only if the condition holds (8.3) |
| `during` | phase id | for hooks | the module is a hook of another phase (prize_stock, open_piles, fuora attach to `tricks`) |
| `after` | phase id | no | placement in a child file (7.3) |
| `remove` | bool | no | deletes an inherited phase (7.3) |
| `until`, `phases` | | for `repeat` | a group of phases repeated until `fuora`, `stock_empty` or `fuora_or_stock_empty` (Sedici, p. 39: «finchè alcuno si chiami fuora») |

The same module may appear twice with other settings (Mitigati for two: deal, discard by both, deal again, discard by the dealer: pp. 85-86).

### 8.1 Order

Phases run in list order; a hook (`during`) runs inside its host at the moments the module defines (prize_stock: after each trick). The usual order: `deal` → `a_monte`? → `discard` → `bidding` → `exchange` / `call_partner` → `declarations` → `tricks` (+ hooks) → `count` → `result` → `settle`. The validator requires a `deal`, a `tricks`, a `count` and a `result` in every complete (not `extends`) file.

### 8.2 Rule paths

A rule path names one leaf: `seats.count`, `cards.trump_order`, `match.hands`, `hand.<phase id>.<key>` (a phase's setting), `options.<id>`. Texts, the rules page, penalties and options use rule paths.

### 8.3 Conditions

A condition is an object; all its keys must hold. No expressions.

| key | type | true when |
|---|---|---|
| `seats` | list of integers | the table has one of these seat counts |
| `contract` | list of contract ids | the winning contract is one of these |
| `all_passed` | bool | everybody passed in the bidding |
| `option` | object id → value | the agreed options have these values |
| `hand_has` / `hand_lacks` | selector | the seat concerned holds / does not hold such a card |
| `hand_count` | `{of: selector, min, max}` | the seat concerned holds that many such cards |
| `declared` | declaration id | that declaration was made this hand |

## 9. Contracts

A game with a bidding or a call names its contracts once, at the top level:

| key | type | meaning |
|---|---|---|
| `id` | id | `three`, `two`, `one`, `sans_prendre`, `call_king`, `sciolto` |
| `source` | source | where the book names it |
| `rank` | integer | a higher rank overcalls a lower |
| `exchange` | integer | cards the declarer calls and exchanges (Permesso: 3, 2, 1, 0) |
| `onoranza` | number | the Onoranza of this contract (Permesso, p. 67: on three 2, on two 3, on one 4, sans prendre 5) |
| `sides` | enum | the sides this contract makes (`declarer_vs_rest`, `called_partner`, `each_for_self`) |
| `pays` | object | other per-contract amounts a settle may refer to |

Example (Permesso for three, from the book; sources shortened here):

```json
"contracts": [
	{"id": "three", "rank": 1, "exchange": 3, "onoranza": 2, "sides": "declarer_vs_rest", "source": "[D] Torino 1787, p. 67: «Chi va a tre carte, guadagna l'Onoranza di due»."},
	{"id": "two", "rank": 2, "exchange": 2, "onoranza": 3, "sides": "declarer_vs_rest", "source": "[D] Torino 1787, pp. 62, 67."},
	{"id": "one", "rank": 3, "exchange": 1, "onoranza": 4, "sides": "declarer_vs_rest", "source": "[D] Torino 1787, pp. 62, 67."},
	{"id": "sans_prendre", "rank": 4, "exchange": 0, "onoranza": 5, "sides": "declarer_vs_rest", "source": "[D] Torino 1787, pp. 62, 67."}
]
```

## 10. Amounts

Payments and declarations use amounts: a number, or an object with one of these keys (plus an optional `note`):

| form | value |
|---|---|
| `5` | five units |
| `{"stake": "simple"}` | the agreed simple game (`double`, `marcia` = twice, `onoranza` = the contract's, `agreed` = the option `stake`) |
| `{"contract": "onoranza"}` | a field of the winning contract |
| `{"option": "stake"}` | an agreed option |
| `{"per_points": {"of": "declarer_side", "from": 45, "every": 5, "unit": 1, "round": "nearest_half_down", "direction": "both"}}` | one unit for every 5 points beyond 45 (Permesso, pp. 69-70: «Ogni cinque punti … guadagnasi un soldo»; examples 62→60, 57→55, 67½→65, 33→35) |
| `{"table": {"by": "count", "rows": {"3": 10, "4": 15, "5": 20}, "beyond": {"every": 1, "add": 5}}}` | a tariff by a count, continued (Bagatt'ultimo, p. 94, «e così vadasi dicendo»; the continuation is [R]) |
| `{"table": {"by": "trumps", "rows": {}, "same_as_count": true}}` | as many units as the cards counted (10 trumps → 10: p. 94; Mitigati for two, p. 86) |
| `{"sum": [a, b]}` | a + b (Onoranza plus the points) |
| `{"times": [a, 2]}` | a × 2 |

Rounding values: `down`, `up`, `nearest_half_down` (to the nearest step, a half step down: our decision for 47½ → 45), `nearest_half_up`, `none`.

## 11. The modules (catalogue)

For every module: what it does, its settings (key, type, values, default), the actions it accepts from a seat, what it adds to a seat's view, the events it emits. Settings not given take the default. «Format 2» marks a key that keeps its format 2 name and values.

### 11.1 `deal`

Shuffles (or takes the cards left by an earlier phase), lets `seats.cut_by` cut, gives the hands, lays out piles and the rest.

| key | type | values | default |
|---|---|---|---|
| `hand_size` | count, by seats, by role | cards to each seat (format 2); `"half_rest"` (half of the cards still undealt: Mitigati, p. 85 «metà per uno»); `"all_rest"` | required |
| `dealer_extra` | integer, by seats | extra cards of the dealer, for the discard (format 2) | `0` |
| `extra_to` | enum | `dealer`, `declarer` | `dealer` |
| `extra_when` | enum | `first`, `last` (Quintilio, p. 74 «l'ultime tre»), `any` | `last` |
| `packets` | list of integers, `dealer_choice`, `one_by_one`, by seats | packets per round from the first receiver: `[5, 10, 10]` (Bagatt'ultimo, pp. 91-92 «tale è l'uso») | `one_by_one` |
| `packets_announced` | bool | the dealer says his packets before the cut (pp. 18, 41-42, 53) | `false` |
| `order` | enum | `from_right` (p. 59: dealt face down starting on the right), `from_left`, `opponent_first` | `from_right` |
| `pile_count`, `pile_size` | integer | format 2 piles: `pile_count` piles of `pile_size` per seat, the last card face up (Pagat 21 + 6) | `0`, `3` |
| `piles` | list of integers | piles of unequal size per seat: Baronetti `[10, 10, 10, 9]` (pp. 48-49) | none |
| `pile_top` | enum | `up`, `down` | `up` |
| `dead` | enum | what happens to the cards not dealt (format 2): `out` (face down, out of play: p. 57), `prize` (a stock for prize_stock), `none` (all dealt), `stock` (kept for a later deal: Sedici), `dealer` (to the dealer for his discard: Settilio, p. 77) | `out` |
| `from` | enum | `deck`, `stock`, `rest` (a second deal from the undealt cards) | `deck` |
| `face` | enum | `down`, `up` | `down` |

Actions: `cut {at}` (the cutter; `at` ≥ `seats.cut_min` from either end), `choose_packets {packets}` (the dealer, when `packets` is `dealer_choice`). Seat view: own hand, the other hands' sizes, own piles with their tops, the tops of all piles, the size of the rest. Events: `dealt`.

Example (Bagatt'ultimo, from the book):

```json
{"id": "deal", "module": "deal", "settings": {
	"hand_size": {"value": 25, "source": "[D] Torino 1787, p. 91: «venticinque carte a ciascuno … onde ne prenderà ventiotto»."},
	"dealer_extra": {"value": 3, "source": "[D] Torino 1787, p. 91: 28 to the dealer, 3 for the discard."},
	"packets": {"value": [5, 10, 10], "source": "[D] Torino 1787, pp. 91-92: «debbonsi queste dare in tre volte; tale è l'uso»: 5, then 10, then 10."},
	"extra_when": {"value": "last", "source": "[S] Ours: pp. 91-92 do not say when the dealer takes his three; the last three of the pack, as «l'ultime tre» on p. 74."},
	"dead": {"value": "none", "source": "[D] Torino 1787, p. 91: 25 + 25 + 28 = 78, nothing is left."}
}}
```

### 11.2 `discard`

| key | type | values | default |
|---|---|---|---|
| `who` | enum | `dealer`, `declarer`, `each`, `dealer_then_other` | `dealer` |
| `count` | count, by seats, by role | cards put away | `deal.dealer_extra` |
| `count_mode` | enum | `exact` (Permesso, p. 59: «Guardati però di scartare più o meno di tre carte»), `up_to` (Quadrilio, p. 71 «non può scartarne più di due», [R]; Mitigati, p. 85 «sino a») | `exact` |
| `discard_honours_barred` | bool | the honours (`set:honours`) may not be put away (format 2) | `true` |
| `barred` | selectors | cards that may not be put away, when more than the honours (Partita, p. 90: «Bagatto non iscartasi, nè alcun Re») | none |
| `allowed_exceptions` | selectors | barred cards allowed under a condition: `[{"if": {"hand_lacks": "T0", "hand_count": {"of": "trumps", "max": 1}}, "any": ["T1"]}]` (p. 34: the Bagatto when it is the only trump and the hand has no Fool) | none |
| `counts_for` | enum | whose points this discard joins: `discarder`, `dealer`, `nobody`, `discarder_unless_no_tricks`; needed when a hand has two discards (Mitigati for two, pp. 85-86); with one discard, format 2 `count.dealer_forfeit` says the same and wins if both are given | `discarder` |
| `announce` | enum | `ho_scartato` (pp. 54, 60: after the words the discard cannot change), `none` | `ho_scartato` |
| `face` | enum | `down`, `up` | `down` |

Actions: `discard {cards}`. Legal when the count and the bars hold. Seat view: the discarder sees his discard; others see its size. Events: `discarded {seat, n}`.

### 11.3 `a_monte`

Throwing the deal in by unanimous consent (pp. 29-30, 98: «cambiar le carte … o affatto rifare la data»).

| key | type | values | default |
|---|---|---|---|
| `consent` | enum | `unanimous` | `unanimous` |
| `what` | enum | `redeal`, `replace_some`, `either` | `redeal` |
| `windows` | list | phase ids after which it may be proposed (Venticinque for three by RI: after each packet round) | `["deal"]` |

Actions: `propose_a_monte {what}`, `agree`, `refuse`. A proposer who withdraws pays (penalty `a_monte_retract`, p. 30). Events: `a_monte {result}`.

### 11.4 `bidding`

The Permesso auction (pp. 60-66) and its short form in Chiamare il Re (pp. 82, 84).

| key | type | values | default |
|---|---|---|---|
| `contracts` | list of contract ids | the contracts that may be bid, lowest first | required |
| `opens` | enum | `dealer_right` («primo in mano», p. 60), `dealer`, `non_dealer` | `dealer_right` |
| `dealer_speaks` | enum | `in_turn`, `last` (Dummett 1980, p. 266; the book is silent), `first` (Chiamare il Re: only the dealer calls, p. 80) | `in_turn` |
| `tie` | enum | who keeps an equal bid: `earlier_seat` (p. 62 «Sempre solo andrà quegli, il quale va a meno»; equal: the first in hand), `challenger` (Chiamare il Re, p. 82: «Ad una vado io» takes it), `dealer` | `earlier_seat` |
| `pass_is_final` | bool | «Io passo» stays passed (p. 65) | `true` |
| `all_pass` | string | `redeal`, `redeal_next_dealer`, `contract:<id>` (a fallback contract: `contract:call_king` in Chiamare il Re, `contract:sciolto` in Sestilio) | `redeal_next_dealer` |
| `bid_binds` | bool | a bid must be played (p. 65 «dovrà andare irremissibilmente») | `true` |
| `lay_down_fewer` | enum | `plays_at_laid` (p. 66: named three, laid down two, plays at two), `forbidden` | `plays_at_laid` |

Actions: `bid {contract}`, `pass`. Seat view: the auction so far, the current best bid and its holder, own legal bids. Events: `bid`, `contract_won {contract, declarer}` or `all_passed`. The sides of the hand become those of the contract.

### 11.5 `exchange`

The called exchange of Permesso (p. 61: «chiami tre carte a suo piacimento, e ne getti via in tavola tre»).

| key | type | values | default |
|---|---|---|---|
| `count` | integer or `"contract"` | cards exchanged; `contract` takes `exchange` of the winning contract | `contract` |
| `lay_down_first` | bool | the declarer lays his cards face down before calling (p. 61) | `true` |
| `face` | enum | `down` (p. 61: given and taken face down, unseen) | `down` |
| `callable` | selectors | cards that may be called | `all` |
| `card_not_held` | enum | a called card in the declarer's own hand or in the discard: `from_discard` (Dummett 1980, p. 266, a guess), `lost`, `forbidden` | `forbidden` |

Actions: `lay_down {cards}`, `call {cards}` (the declarer). The holders give the called cards and receive one laid card each, automatically and unseen («Chi ha queste carte me le dà subito», p. 61). Seat view: the declarer sees what he received; a holder sees what he gave and got; the others see only how many. Events: `exchanged {n}`.

### 11.6 `call_partner`

Calling a king (Chiamare il Re, pp. 80-83).

| key | type | values | default |
|---|---|---|---|
| `caller` | enum | `dealer` (p. 80), `declarer` | `dealer` |
| `ladder` | list of ranks | `["K", "Q", "N", "J"]` (pp. 81-82: all four kings in hand → a queen; kings and queens → a knight; and so on) | `["K"]` |
| `step_down` | enum | `caller_holds_all_of_rank` | same |
| `secret` | bool | the holder does not reveal himself (p. 80) | `true` |
| `own_card` | enum | calling one's own card: `plays_alone_unless_forgiven` (p. 83), `plays_alone`, `forbidden` | `plays_alone` |
| `card_in_discard` | enum | `forbidden` (our proposal: the caller knows his discard), `plays_alone` | `forbidden` |

Actions: `call {card}`. Seat view: the called card (all), «you are the partner» (the holder only). Events: `partner_called {card}`; `partner_revealed` when the card is played.

### 11.7 `declarations`

Announcing honours, trumps and Mitigati (Bagatt'ultimo, pp. 93-95; Mitigati for two, p. 86).

| key | type | values | default |
|---|---|---|---|
| `kinds` | list of declaration kinds | below | required |
| `window` | enum | `after_discard_before_first_card` (p. 95), `before_first_trick_covered` (p. 86 «prima dee accusarli, che coperta siasi la prima mano») | `after_discard_before_first_card` |
| `late` | enum | `right_lost` (p. 95) | `right_lost` |
| `mode` | enum | `auto` (the engine declares for the seat), `manual` (the seat must press; forgetting loses it) | `auto` |
| `paid` | enum | `at_once` (p. 95 «e subito, e non sul fine della partita»), `end_of_hand` | `at_once` |
| `paid_by` | enum | `each_other` (each opponent pays the amount), `others_together` | `each_other` |

A declaration kind: `{"id", "of": selector, "min": n, "all_of": bool, "show": "announce_count" | "announce" | "expose", "pays": amount}`. Example from p. 93-94: honours, three or more, announced without naming them, 3 → 10, 4 → 15, 5 → 20 and so on: `{"id": "onori", "of": "set:honours", "min": 3, "show": "announce_count", "pays": {"table": {"by": "count", "rows": {"3": 10, "4": 15, "5": 20}, "beyond": {"every": 1, "add": 5}}}}`; ten trumps or more, laid out and shown, as many as the trumps: `{"id": "trionfi", "of": "trumps", "min": 10, "show": "expose", "pays": {"table": {"by": "count", "rows": {}, "same_as_count": true}}}`; Mitigati (Angel, Bagatto, Fool): `{"id": "mitigati", "of": {"any": ["T20", "T1", "T0"]}, "min": 3, "all_of": true, "show": "announce", "pays": 10}`.

Actions: `declare {kind}` (manual mode). Seat view: all declarations made (count only, or the cards for `expose`). Events: `declared {seat, kind, n}` (settle pays them).

### 11.8 `tricks`

| key | type | values | default |
|---|---|---|---|
| `first_leader` | enum | `non_dealer` (format 2; p. 54), `dealer_right` (p. 35 «Chi è a destra di chi dà, comincia»), `declarer`, `previous_last_taker` (Dottore, p. 75 «Chi è ultimo a prendere giuoca il primo», [R]) | `dealer_right` |
| `next_leader` | enum | `trick_winner` (p. 50 «Chi prende giuoca sempre il primiero») | `trick_winner` |
| `follow_suit` | bool | format 2 (p. 49) | `true` |
| `must_trump` | bool | void in the led suit, a trump must be played (format 2) | `true` |
| `must_overtrump` | bool | a higher trump must be played if held (format 2) | `false` |
| `play_from` | enum | `hand`, `pile_tops` (Baronetti: only the open cards, p. 49) | `hand` |
| `fool_may_lead` | bool | the Fool may be led | `true` |
| `tricks` | integer | the number of tricks, when not every card is played | all cards |

Actions: `play {card}`; with `cards.fool_show_any_time`, also `show_fool`. Legal cards follow suit → trump → any, with the Fool per `cards.fool`. Seat view: the current trick, who leads, own legal cards (for hints), the tricks won per seat (number only; closed tricks are not shown, pp. 32-33), the last trick per `view.last_trick`. Events: `card_played`, `trick_won {seat, cards}`, `last_trick_won`.

### 11.9 `prize_stock` (hook of `tricks`)

Morto (pp. 57-58). Settings: `stock` (`rest`: the cards `deal.dead` = `prize` left), `per_trick` (cards per trick, 1), `take` (`top`), `show_to` (`opponents`, `all`, `nobody`), `goes_to` (`won_pile`, `hand`), `fool_trick` (who draws for a trick in which the Fool was shown: `trick_winner`, `fool_owner`, `nobody`). No actions. Seat view: the stock's size, the card just drawn (to those it is shown to). Events: `stock_drawn {seat, card}`. Example: `rulesets/morto.json`, phase `morto`.

### 11.10 `open_piles` (hook of `tricks`)

Baronetti's piles (pp. 48-50): after each trick both turn the next card of the pile they played from, «ma non prima di aver giuocato, e risposto». Settings: `reveal` (`after_trick`, `after_own_play`), `empty_pile` (`play_from_others`). The piles themselves come from `deal.piles`. No actions (cards are played by `tricks.play` from a pile top). Seat view: every pile's size and open top. Events: `pile_revealed`.

### 11.11 `fuora` (hook of `tricks`)

Going out in Sedici and Trent'uno (pp. 35, 39-41, 46).

| key | type | values | default |
|---|---|---|---|
| `target` | number | 16 (p. 35), 31 (p. 46) | required |
| `claim_when` | enum | `any_time`, `after_trick`, `own_turn` | `after_trick` |
| `false_claim` | list | penalties by the claimer's real points: `[{"below": 8, "pays": {"stake": "double"}}, {"from": 8, "pays": {"stake": "simple"}}]` (p. 39) | none |
| `after_first_out` | enum | `hand_ends`, `others_continue` (Sedici for three «a scaricare», pp. 43-44) | `hand_ends` |
| `stock_empty` | enum | `reshuffle_untaken`, `hand_ends_most_points`, `hand_ends_no_winner` | `reshuffle_untaken` |

Actions: `claim_fuora`. The engine counts aloud for the claimer (p. 41). Events: `fuora_claimed {seat, valid, points}`. With `repeat` (8): `{"id": "rounds", "module": "repeat", "until": "fuora", "phases": [deal of 4, tricks]}`.

### 11.12 `count`

Counts the cards each seat or side has won (and the discard, the stock cards, the Fool's card).

| key | type | values | default |
|---|---|---|---|
| `count_unit` | enum | `half_point` (format 2: cards counted in pairs, so each card is worth its value less a half) | — |
| `group` | `1`, `2`, `3`, `4` or `"option:<id>"` | cards per group (pp. 51-52: in pairs; p. 96: in threes; p. 89: by four or two; p. 75: by one, two or three as agreed) | `2` |
| `plain_value` | number | a plain card's value when counted singly (Sedici: not printed, [S] 0) | `1` |
| `odd_card` | enum | the cards left over a whole number of groups: `half_point` (format 2; p. 54 «Una carta sola, ancorchè scompagnata»), `drop`, `as_group` | `half_point` |
| `trick_multipliers` | bool | format 2 (Duello's) | `false` |
| `last_trick_bonus` | number | format 2, half-points | `0` |
| `dealer_forfeit` | bool | format 2: `false` the discard counts for the dealer; `true` likewise, but a dealer without tricks gives it to the winner of the last trick | `false` |
| `fool_card` | enum | for targets «dedotta la carta del Folle» (pp. 81, 87): `counted`, `deducted` | `counted` |

The arithmetic. Each card has its value `v` from `cards.card_points` (plain cards: 1 when grouped, `plain_value` when `group` is 1). A group of `g` cards is worth the sum of its values less `g − 1` (p. 52: a king with a plain card 5, two plain cards 1). Hence each card is worth `v − (g−1)/g`, and the total of the deck is the same however the cards fall into groups: 91 with pairs, 78 with threes (130 − 52), 130 counted singly with plain cards 1. The odd cards follow `odd_card`. The format 2 engine counts in half-points with the values less one; the results are identical. `sides.pool` = `side` puts partners' cards in one heap before grouping.

No actions. Seat view after the hand: the breakdown listed in `view.score_panel.after_hand`. Events: `counted {points per seat or side}`.

### 11.13 `result`

Decides who won the hand and how.

| key | type | values | default |
|---|---|---|---|
| `winner` | enum | `more_points` (format 2; p. 54), `threshold` (every seat or side reaching `target` wins: Bagatt'ultimo 26, p. 95; Baronetti 46, p. 51), `declarer_threshold` (the declarer's side against `target`, with `bands`: Permesso 46), `fewest_points` (Meno, p. 78 «guadagna chi fa meno punti»), `first_out` (by `fuora`) | `more_points` |
| `target` | number | 46, 26, 16, 31 | none |
| `tie` | enum | format 2 `no_game_points`; `redeal_next_dealer` (p. 70 «tocca al compagno appresso a mischiare»); `declarer_loses` (our reading of p. 74 «non si può mai rifare per eguaglianza di punti»); `draw` | `no_game_points` |
| `bands` | list of `{min, max, outcome, pays}` | finer outcomes by the declarer's points: 46+ win; 45½ draw; 43½-45 loss on the Onoranza only (pp. 66-70) | none |
| `game_points` | enum | format 2: `one`, `one_or_two_dry`; `none` (the hand settles in stakes only) | `one` |
| `shut_num`, `shut_den` | integer | format 2: the dry line | `1`, `3` |

Example (Permesso, from the book):

```json
"bands": {"value": [
	{"min": 46, "outcome": "win", "pays": "full"},
	{"min": 45.5, "max": 45.5, "outcome": "draw", "pays": "nothing"},
	{"min": 43.5, "max": 45, "outcome": "loss", "pays": "onoranza_only"},
	{"max": 43, "outcome": "loss", "pays": "full"}
], "source": "[D] Torino 1787, pp. 66-70: 46 wins; «quarantatrè punti e mezzo» to 45 loses the Onoranza only; 45½ «la partita si deve ripigliar da capo» (p. 70)."}
```

Events: `result {outcome per seat, margin, band}`.

### 11.14 `settle`

Turns the result and the events of the hand into payments between seats.

| key | type | values | default |
|---|---|---|---|
| `unit` | enum | `stake`, `marca` (p. 93: «siasi conchiuso di quanto vaglia la marca»), `soldo` (p. 69), `game_point` | `stake` |
| `mode` | enum | `loser_pays_winner`; `declarer_vs_each` (the declarer collects from each or pays each: pp. 64, 68-69, 73-74 «come fosse egli tre giuocatori in un solo»); `losers_pay_winner` (Sedici for three, p. 43 «da tutti e due i compagni perdenti»); `a_scaricare` (only the last loser pays, for two: pp. 43-44); `pair_split` (each winner collects from one opponent: p. 90); `winners_from_losers` (each loser pays each winner) | `loser_pays_winner` |
| `amount` | amount | the payment for the hand: `{"stake": "simple"}`; Permesso: `{"sum": [{"contract": "onoranza"}, {"per_points": {…}}]}` | `{"stake": "simple"}` |
| `premiums` | list | `{id, when: vola / loser_below_fraction / winner_times_loser, fraction, times, effect: {multiply, add}, option}`: marcio (p. 99 «vale posta doppia»), vola (p. 100), triplice, quadriplice (p. 55); `option` makes it count only if agreed | none |
| `payments` | list | event payments, each with its own source: `{id, on, from, to, amount, source}` | none |

Event payments, `on`: `declaration:<kind>`, `last_trick_won_with:<card>`, `lost_in_last_trick:<card>`, `lost_before_last_trick:<card>`, `reached_target`, `penalty:<id>`. `from` / `to`: `each_other`, `event_seat`, `losers`, `each_loser`, `winners`, `each_winner`. Example, the Bagatto last (p. 96):

```json
"payments": [
	{"id": "bagatto_last", "on": "last_trick_won_with:T1", "from": "each_other", "to": "event_seat", "amount": 30, "source": "[D] Torino 1787, p. 96: «ritirerà dai compagni trenta»; [R] from each or in all: from each, as «pagherà trenta a ciascuno».", "alt": "together"},
	{"id": "bagatto_lost_last", "on": "lost_in_last_trick:T1", "from": "event_seat", "to": "each_other", "amount": 30, "source": "[D] Torino 1787, p. 96: «pagherà trenta a ciascuno»."},
	{"id": "bagatto_lost", "on": "lost_before_last_trick:T1", "from": "event_seat", "to": "each_other", "amount": 5, "source": "[D] Torino 1787, p. 96: «cinque marche per ciascuno»."}
]
```

When there is no `settle` phase, the result's `game_points` feed the match (format 2 behaviour). Seat view: the payments of the hand and the running ledger. Events: `paid {from, to, amount, why}`.

### 11.15 `repeat`

A structural group, not a game mechanism: runs its `phases` again and again `until` a condition (`fuora`, `stock_empty`, `fuora_or_stock_empty`). Used for the repeated deals of Sedici and Trent'uno.

## 12. Match

The match wraps the hand. Format 2 keys keep their names.

| key | type | values | default |
|---|---|---|---|
| `kind` | enum | `single_hand`; `fixed_hands` (`hands` hands); `race` (to `target` game points); `running_total` (Venticinque for three by RI: `rounds` rounds, each seat scores its points less `round_target`, the first positive total wins: Dummett 1980, p. 260); `ledger` (stakes accumulate hand after hand, the table ends when the players leave) | from `hands`: 0 → `race`, N → `fixed_hands`; no match section → `single_hand` |
| `target` | number | format 2 | `5` |
| `hands` | integer | format 2 (0 = race) | — |
| `tiebreak` | enum | format 2: `none`, `card_points` | `none` |
| `tie_replay` | bool | format 2 | `true` |
| `max_hands` | integer | format 2 | `60` |
| `max_stake`, `crawford`, `double_window_cards` | | format 2 (Duello's doubling; must be 1, false, any for the book's games) | |
| `round_target` | number | `running_total`: 26 | none |
| `rounds` | integer | `running_total`: 3 | none |

The dealer changes by `seats.dealer_rotation`.

## 13. Penalties

The general penalties of the book (pp. 17-34, 72-73) and those of each game. At an online table most offences cannot happen: the engine deals, counts and refuses an illegal card. The penalty is still kept: the rules page tells it as the book's rule, and a module may need it when the offence is possible by choice.

| key | type | values |
|---|---|---|
| `id` | id | |
| `offence` | enum | `revoke`, `misdeal`, `faced_card`, `wrong_deal_method`, `wrong_discard_count`, `change_discard`, `peek_stock`, `peek_pile`, `open_two`, `signal`, `talk`, `show_cards`, `false_fuora`, `refuse_bid`, `call_without_laying`, `call_own_card`, `hint_partner`, `a_monte_retract`, `take_others_points`, `deal_out_of_turn` |
| `enforce` | enum | `prevent` (the engine makes it impossible; the page tells the book's penalty), `apply` (possible by choice; the engine applies the effect: `false_fuora`, `a_monte_retract`, `call_own_card`), `text_only` |
| `effect` | rule leaf | what the offender pays or loses, as data with its source |
| `hand` | enum | `continues`, `ends`, `redeal` |

Example: `rulesets/morto.json`, `peek_morto` (p. 58).

## 14. View

Only what must differ per game; everything else is the table's default. Plain values, no sources.

| key | values | default |
|---|---|---|
| `piles.rest` | `hidden`, `face_down_count`, `face_down` | `face_down_count` |
| `piles.discard` | `owner_only`, `hidden`, `all_after_hand` | `owner_only` |
| `piles.seat_piles` | `tops_up` | `tops_up` |
| `piles.exchange` | `face_down` | `face_down` |
| `stock_draw` | `show_to_all_then_cover`, `show_to_taker` | `show_to_all_then_cover` |
| `declarations` | `count_only`, `cards` | per kind `show` |
| `last_trick` | `hidden`, `until_next_lead`, `always` | `until_next_lead` |
| `partners_hands` | `hidden`, `shown` | from `sides.partners_share_hands` |
| `score_panel.live_points` | `hidden` (the book counts at the end; closed tricks need not be shown, pp. 32-33), `own`, `side`, `all` | `hidden` |
| `score_panel.after_hand` | list of `pairs`, `groups`, `odd_card`, `fool_card`, `discard`, `stock_cards`, `declarations`, `premiums`, `bands`, `payments`, `running_total` | `["groups"]` |
| `score_panel.ledger` | bool: show the stakes ledger | `true` with a `settle` phase |

The score panel explains each line of `after_hand` with the module's sentence and the rule path behind it, so a click on «the Fool's card» opens the rule on the rules page.

## 15. Bot

One configurable bot plays every game. A game file names settings only where its game needs them; without a `bot` section the bot uses its defaults (legal play, a simple card-value heuristic).

| key | type | meaning |
|---|---|---|
| `profile` | string | a named built-in profile |
| `bid` | list of `{contract, when: condition, source}` | when to bid a contract. The book gives advice that fits here as data: Quintilio, pp. 74-75 (to go alone, at least four high trumps); Chiamare il Re, p. 84 (eight trumps, four of them high, and a pair of kings) |
| `call` | rule leaf | how to choose called cards (Quadrilio, p. 72: usually trumps; with good trumps, kings, queens, knights) |
| `discard` | rule leaf | discard policy |
| `play` | list of rule leaves | play advice (Trent'uno, p. 46: seldom lead kings; declare «fuora» at once) |

Advice from the book is marked `[D]` like a rule; it never constrains a human player, only the bot and the hints.

## 16. Texts file

`rulesets/texts/<id>.texts.json`, format 3, `"kind": "texts"`, `"game": "<id>"`, one object per language (`ru`, `en` required; others may be added under their two-letter code).

| key | type | used by | meaning |
|---|---|---|---|
| `name` | string | everything | the game's name in that language |
| `subtitle` | string | site, lobby | the historical name («Venticinque for two») |
| `tagline` | string | site, lobby | one sentence |
| `short` | list of 1-8 lines | rules page (short), lobby, lesson intro | the ninety-second version |
| `memo` | list of lines | table memo | short lines per phase |
| `hints` | list of lines | table hints | situational hints |
| `lesson` | list of steps `{id, title, text, rules, setup, expect}` | lesson | a guided first hand; `setup` fixes the cards, `expect` the awaited action (`play:T0`, `play:suit`, `discard:3`) |
| `rule_text` | object rule path → sentence | rules page (full) | replaces the module's own sentence for that rule |
| `terms` | object | glossary | the book's words (onori, scarto, cartaccia, partita) |
| `variant_names`, `option_names` | object | table setup, rules page | names of variants and options |

A line is `{id?, text, rules, phase?}`:

- `text`: words, with placeholders `{<rule path>}` for every number or value of a rule. `{card:T20}` renders a card's name, `{set:honours}` a set as a list of names. `{<rule path>:src}` renders the leaf's source in plain words (section 17).
- `rules`: the rule paths the line speaks about, placeholders included. The validator checks that each exists in the game file and that every placeholder is listed.
- `phase`: the phase id during which a memo or hint line is shown.

Rules for texts, checked by the validator:

1. No digit outside a placeholder in `short`, `memo`, `hints`, `lesson`. A number of the rules always comes from the game file.
2. Every rule path exists in the (merged) game file.
3. Texts never state a rule the game file does not hold: a line about a rule lists its path; a line with no `rules` is not allowed.

## 17. Rules page, memo and lesson: one source

The game's public page on the site has two versions, both generated at build time from the merged game file, the texts file and the module sentences (`core/texts/<module>.<lang>.json`).

### 17.1 Short version, «how to play in ninety seconds»

Built from `texts.<lang>.short`, in order. Each line's placeholders are filled from the game file. Under each line, a small mark sums up the sources of the rules it lists: «from the book» if all are `[D]`, «some is our reading» if any is `[R]`, «some is our decision» if any is `[S]`. Then `seats.count`, `cards.deck` and the length of a match are shown as facts, and a link to the full version.

### 17.2 Full version

Generated by walking the merged game file in a fixed order:

1. Who plays: `seats`, `sides`.
2. The cards: `cards` (deck, orders, points, the Fool).
3. Before the deal: `options` («by agreement»), `variants`.
4. The hand: for each phase of `hand.phases`, in order, a heading (the module's name, or `texts.rule_text["hand.<id>"]`), then one paragraph per rule leaf of its `settings`, then its hooks.
5. The match: `match`.
6. Penalties: `penalties` (for `prevent`: «the table does not allow it; by the book: …»).
7. What the game leaves out: `left_out`.
8. Sources: every source named, with what we hold and what we do not.

Each rule paragraph is: the sentence (`texts.rule_text[path]`, else the module's sentence for that key and value, with placeholders filled), then the source in plain words:

| mark | source names | shown as |
|---|---|---|
| `[D]` | Torino 1787 | «from the book, p. 53» |
| `[D]` | another source (`by` or its name in `source`) | «from Dummett (1980), p. 260» (the short name of the source in the language of the page: `sources.<by>.short_en`, `short_ru`) |
| `[R]` | | «our reading (book, p. 61)», with the other reading from `alt` or the source text |
| `[S]` | | «our decision» and what the book does not say |

Pages come from `pages`, else from the first «p. N» / «pp. N-M» of `source`. The Italian quotation of a `[D]` source is shown on demand (a short quote, under fifteen words). No page image, no transcription of the scan ever reaches the page.

### 17.3 Why the three never disagree

- The rules engine, the memo, the rules page and the lesson read the same merged game file; there is no second copy of a number.
- Texts reach numbers only through placeholders; the validator forbids digits in texts.
- Every text line lists its rule paths; when a leaf changes, the build lists every line that speaks of it for review (the line is not stale by number, since the number is a placeholder, but its words may need a look).
- The rules page's full version is generated, not written; the short version is the same `short` lines the lobby and the lesson open with.

## 18. What a module is

A module is one mechanism of the core, written once and used by every game that names it in its phases. Each module has:

| part | what it is |
|---|---|
| name | the `module` value (`deal`, `bidding`, …), lowercase |
| settings | its keys, their types, allowed values and defaults: one `$defs/m_<name>` in the schema and one table in section 11 |
| requires | sections or earlier phases it reads (`exchange` needs a winning contract; `prize_stock` needs `deal.dead` = `prize`) |
| state | what it keeps during the hand (the auction, the stock, the piles) |
| actions | what a seat may send while the module runs, with their payloads and legality; everything else is refused |
| seat view | what it adds to each seat's view: private parts only to their owner, public parts to all |
| events | what it emits for later modules, settle, hints, the journal and the bot |
| sentences | `core/texts/<module>.<lang>.json`: the memo line and the rules-page sentence for each setting and value, with placeholders |
| lesson hooks | the positions and expected actions a lesson step can use |
| bot hooks | the list of legal actions and a default policy, tuned by `bot` settings |
| version | a module version; the journal of a table records it |

Rules for modules:

1. A module reads only its own settings, the top-level sections (`seats`, `sides`, `cards`, `contracts`, `options`) and the events and public state of earlier phases. It never reads another module's settings.
2. A module never knows a game by name. A rule that only one game has is still a setting with a value, so that a later game can use it.
3. A new mechanism means: a module folder, a `$defs/m_<name>` and an enum entry in the schema, its sentences in both languages, a section in this file, a test game file. Existing game files do not change.
4. A new value of an existing setting is added the same way, in one module; the files that do not use it do not change.

## 19. Compatibility with format 2

Format 3 is a superset of format 2: every format 2 key keeps its name, value and source and moves into the section or module that reads it. The conversion is mechanical:

| format 2 | format 3 |
|---|---|
| `format: 2` | `format: 3` |
| `name` | `id` |
| `about`, `versions`, `left_out` | same keys, unchanged |
| `game.deck` | `cards.deck` |
| `game.trump_order`, `game.suit_order`, `game.card_points` | `cards.*` |
| `game.fool`, `fool_exchange`, `fool_exchange_card`, `fool_last_trick` | `cards.*` |
| `game.hand_size`, `dealer_extra`, `pile_count`, `pile_size`, `dead` | phase `deal`, `settings.*` |
| `game.discard_honours_barred` | phase `discard`, `settings.*` |
| `game.first_leader`, `follow_suit`, `must_trump`, `must_overtrump` | phase `tricks`, `settings.*` |
| `game.count_unit`, `odd_card`, `trick_multipliers`, `last_trick_bonus`, `dealer_forfeit` | phase `count`, `settings.*` |
| `game.winner`, `tie`, `game_points`, `shut_num`, `shut_den` | phase `result`, `settings.*` |
| `match.*` | `match.*`, unchanged |
| `game.dead` = `prize` | also a phase `prize_stock` with `during: "tricks"` |

The algorithm: create the phases `deal`, `discard` (when `dealer_extra` > 0), `tricks`, (`prize_stock`), `count`, `result`; move every leaf as in the table, byte for byte; refuse a format 2 key the table does not place. Format 3 then needs what format 2 left implicit: `seats.count` (2 for every format 2 file), `sides.mode` (`each_for_self`), the discard's `who` and `count`. A converted file records `converted_from {format, file, note}`, and its note lists what was added.

The validator checks a conversion with `--f2 <folder of format 2 files>`: every format 2 leaf must be found in the format 3 file under the same key with the same value and the same source, and `about`, `versions` and `left_out` must be unchanged. The format 2 files keep their old wording and are not ours to change, so before the comparison every string of the format 2 file goes through `tools/open-wording.mjs`: the three Cyrillic marks of the old wording become the Latin `[D]`, `[R]` and `[S]`, the legend sentence of the description becomes the one legend the game files carry («Marks: [D] documented, [R] our reading, [S] sources silent.»), and the payment words «marks» and «mark» become «marche» and «marca» (whole lowercase words only). A difference that remains after this is a real difference. Format 1 files (Duello, Trionfi H0: `config` instead of `game`) are a different game type and are not covered.

The values of format 2 keys stay in force: the engine of the Steam game can read a format 3 file by flattening the leaves back by this table.

## 20. Every game of the book in this format

How each game of the book is written; «open» refers to `FORMAT_OPEN_POINTS.md`.

| game (pages) | seats, sides | phases | special keys | open |
|---|---|---|---|---|
| Venticinque for two (53-56) | 2, each | deal, discard, tricks, count, result, (settle) | `rulesets/venticinque.json` | 1 |
| Morto (57-58) | 2, each | + prize_stock | `rulesets/morto.json`; extends Venticinque later | 2 |
| Baronetti (47-53) | 2, each | deal (`piles` [10,10,10,9]), tricks (`play_from: pile_tops`), open_piles, count, result (`threshold` 46) | `fool_show_any_time` | 3 |
| Mitigati for two (85-87) | 2, each | deal, discard (`each`, by role 13/12, `up_to`), deal (`from: rest`, `half_rest`, extra 3), discard, declarations (`before_first_trick_covered`), tricks, count (`fool_card: deducted`), result (`threshold` 46), settle | first deal size `[R]` | 4 |
| Bagatt'ultimo (91-96) | 3, each | deal (packets 5,10,10), discard, declarations, tricks, count (`group` 3), result (`threshold` 26), settle (payments Bagatto last) | variant «Eccettuazione» | 5 |
| Venticinque for three (8; RI) | 3, each | deal, a_monte (windows), discard, tricks, count (`group` 3), result, settle | `status: from_later_source`; match `running_total` | 6 |
| Partita for three (87-88) | 3, each | as Venticinque, 25/25/28 | settle `losers_pay_winner` | 7 |
| Permesso for three (58-70) | 3, `by_contract` | deal, discard, bidding, exchange, tricks, count, result (`declarer_threshold` 46, bands), settle (`declarer_vs_each`, Onoranza + per 5 points) | contracts three/two/one/sans_prendre | 8, 9, 10 |
| Quadrilio (71-74) | 4 | extends Permesso 3: hand 19, extra 2 (`up_to`), tie `declarer_loses` | | 11 |
| Quintilio (74-75, 77-78) | 5 | extends: 15, extra 3 (`last`), `fool_exchange_to: trick_winner` | | |
| Sestilio, giuoco sciolto (76-78) | 6 | extends: 13, no discard (`remove`), `all_pass: contract:sciolto`, phases with `when` | variant «sciolto» | 12 |
| Settilio (77-78) | 7 | extends: 11, `dead: dealer` (1 card), discard 1 | | |
| Dottore (75-76) | 5, each | deal 15+3, discard, tricks (`previous_last_taker` [R]), count (`group: option:group`), result | option `group` 1/2/3 | 13 |
| Meno (78-79) | 2-7, each | deal (`hand_size` by seats), tricks, count, result (`fewest_points`) | | 14 |
| Chiamare il Re (79-84) | 4, `by_contract` | deal 19+2, discard, bidding (`dealer_speaks: first`, `tie: challenger`, `all_pass: contract:call_king`), call_partner (ladder), exchange (`ad_una`), tricks, count (`fool_card: deducted`), result (`threshold` 46), settle | | 15 |
| Partita 2×2 (88-90) | 4, `fixed_pairs`, opposite | deal 19+2, discard (barred Bagatto, kings), tricks, count (`group` 2 or 4), result, settle (`pair_split`) | `seating: draw_high_pairs` | 16 |
| Consiglio (97) | 4, pairs adjacent | extends Partita 2×2: `partners_share_hands`, `partners_talk` | variants 46 / four deals | 17 |
| Sedici (14-18, 35-45) | 2-4, each | repeat(deal 4, tricks + fuora), count (`group` 1), result (`first_out`), settle | `fool: trump`, order with `T0` lowest, `book_1787_short` | 18 |
| Trent'uno (45-46) | 2-4, each | extends Sedici: 8 cards, target 31 | | 19 |

## 21. Validation

```
node tools/validate-rulesets.mjs                       # every rulesets/*.json and rulesets/texts/*.texts.json
node tools/validate-rulesets.mjs --f2 <format 2 folder> # also: format 2 rules kept word for word
```

The checker is a small JSON Schema validator written for the keywords these schemas use (it refuses a schema keyword it does not know, so nothing is skipped silently), followed by the checks a schema cannot make: every `source` starts with a mark ([D], [R] or [S], Latin letters); every `value` has a `source` (outside `view` and `options`); phase ids are unique and `during` / `after` point at a phase; a complete file has `deal`, `tricks`, `count`, `result`; the simple deal fits the deck for every allowed seat count (`dead: none` leaves nothing, `prize` leaves a card per trick, the dealer's extra cards equal his discard unless `up_to`); the texts' rule paths and placeholders exist and no digit stands outside a placeholder. Three checks keep a game file fit for publication (the open wording): a `source` must not hold a Cyrillic mark, and no string outside the values of `short_ru` may hold a Cyrillic letter; no string may hold one of the internal words of our working notes (the list is `INTERNAL_WORDS` in the validator); no string may hold a date written with dots, day and month (a section number after `GAME_FILE_FORMAT` or `FORMAT_OPEN_POINTS` is not a date). The log `rulesets/REVISIONS.md` has one heading «## Revision N» per revision; `node tools/validate-rulesets.mjs --stamp N` writes its block of hashes under the heading. No `package.json`, no packages.
