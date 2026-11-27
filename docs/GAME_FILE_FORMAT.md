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
| `fool` | enum | `excuse` (shown, takes nothing, is never taken: p. 54); `trump` (an ordinary trionfo ranked by `trump_order`, which must then list `T0`, the lowest: Bagatto takes it, it takes plain cards as a trionfo, a lone Fool must answer a trionfo, it counts its `card_points`; no Fool exchange happens and `fool_exchange` is ignored; every special case of the excuse in `tricks`, `count`, the bot and the table applies only with `excuse`: Sedici, p. 36); `low_trump`, `high_trump` (format 2 lab values) | `excuse` | tricks, count |
| `fool_exchange` | bool | the owner gives a plain card for the Fool at the end of the hand (p. 52) | `true` with `excuse` | count |
| `fool_exchange_card` | enum | `cheapest` (engine picks), `owner_choice` (the owner picks, p. 52 «qualunque gli piaccia») | `cheapest` | count |
| `fool_exchange_to` | enum | `opponent_side`; `trick_winner` (the winner of the trick in which the Fool was shown: Quintilio, Sestilio, Settilio, pp. 77-78) | `opponent_side` | count |
| `fool_no_tricks` | enum | `give_none` (format 2), `give_fool` (a side without tricks gives the Fool itself: Dummett 1980, p. 259, after RI) | `give_none` | count |
| `fool_last_trick` | enum | `kept`, `lost` | `kept` | tricks |
| `fool_show_any_time` | bool | `true`: on his own turn (leading or answering) the owner of an open Fool may show it and lay it among his won cards (Baronetti, p. 50 «solo mi basterà mostrarlo»). This is not his play: the next card of that pile turns at once and he still plays a card. He may play the Fool into a trick instead; then it is the excuse (it takes nothing and is not lost). He cannot show it as his last card. It needs `open_piles`. The cards laid aside count as the seat's won cards | `false` | tricks, open_piles, count |

## 6. Seats and sides

### 6.1 `seats`

| key | type | values | read by |
|---|---|---|---|
| `count` | integer 2-7, or a list of them | `2`; `[2, 3, 4]` (Sedici, pp. 14-15, 36, 43) | table, validator |
| `direction` | enum | `right` (pp. 35, 37 «gli altri sempre a destra procedendo»), `left` | tricks, bidding, deal |
| `first_dealer` | enum | `draw_trump` (p. 16), `draw_high`, `best_cut` (Partita, p. 89 «Chi coppa meglio», [R]), `random`, `host` | table |
| `cut_by` | enum | `left` (pp. 16-18), `right`, `none` | deal |
| `cut_min` | integer | `2` (p. 17 «Una carta sola non si può coppare») | deal |
| `dealer_rotation` | enum, by seats | `right`, `left`, `alternate`, `loser_deals`, `winner_passes_to_companion` (p. 41: the winner hands the pack to his «companion»: for two players the other one deals, for three and four the seat to the right of the winner; a partita with no winner: the seat to the right of the last dealer), `same`. Trent'uno writes it by seats: `winner_passes_to_companion` for two, `right` for three and four | match runner |
| `seating` | enum | `free`, `partners_opposite` (Partita, p. 89 «a faccia a faccia»), `partners_adjacent` (Consiglio, p. 97), `draw_high_pairs` | table |

### 6.2 `sides`

| key | type | values | read by |
|---|---|---|---|
| `mode` | enum, by seats | `each_for_self`; `fixed_pairs` (Partita 2×2); `declarer_vs_rest` (Permesso: «gli altri due compagni insieme mi sono incontra», p. 61); `called_partner` (Chiamare il Re); `by_contract` (the winning contract decides, section 9; played only with a `bidding` phase: the sides live in the hand) | count, result, settle, view |
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

A variant may limit itself to some numbers of seats by patching `seats.count`: `"patch": {"seats": {"count": {"value": [2, 3], "source": "…"}}}`. The core then refuses the variant at the other numbers of seats («this game is not played with N seats»), the rules page does not print it there, and the general checks do not try it there. Meno's short forms use it (revision 10): a variant is offered at a number of seats only if, in 200 hands of random players, at most 15 % have no winner and at most 50 % have more than one winning side.

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

**Nested phases and hooks (as the core plays them).** The `phases` of a `repeat` group are phases like the others: the loader puts them into the plan in order, each marked with its group, and `checkSupport` checks their settings like those of the top-level phases (the rule path is `hand.phases[<id>]`, the same as for a top-level phase; ids are unique in the file). A hook (`during`) stands at the top level of `hand.phases`, outside the group, so that a variant or a child file can patch it by id (FORMAT_OPEN_POINTS 50a). A hook module may offer its host these functions, all optional: `onEnter` (the host phase starts), `onPlay` (a card has left the seat), `afterTrick`, `playable` (the cards the seat chooses from instead of its hand), `visibleHand`, `extraLegal` and `extraToAct` (actions and seats beside the host's: the claim window), `applyExtra` (it may end the hand at once), `hold` (the phase stays open after the host is done: a claim window before the next deal), `viewOf` (a part of the seat view under the module's name).

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

A phase whose `when` holds `contract` or `all_passed` stays in the plan and is judged at run time: the engine skips it in a hand where the condition is false. `seats` and `option` are judged when the game is loaded. Two phases of one module that depend on the contract (Permesso for six: two tricks phases) never run in one hand; the state of a module that may run twice in a hand is kept by phase id.
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

A contract is won in the bidding (or fixed by `all_pass: contract:<id>`) and sets the sides of the hand: `declarer_vs_rest` (the declarer alone, the others together), `called_partner` (the declarer and the holder of the called card; the holder joins when the card is called, secretly), `each_for_self`. Bids are ordered by `rank`; a higher rank overcalls a lower.

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

Rounding values: `down`, `up`, `nearest_half_down` (to the nearest step, a half step down: our decision for 47½ → 45), `nearest_half_up`, `none`, `toward_zero` (revision 10: only whole steps from `from` count, on either side: with `from: 45`, `every: 5` 48 is 0 steps, 50 is 1, 43 is 0, 40 is -1; the part of a step left over is dropped).

## 11. The modules (catalogue)

For every module: what it does, its settings (key, type, values, default), the actions it accepts from a seat, what it adds to a seat's view, the events it emits. Settings not given take the default. «Format 2» marks a key that keeps its format 2 name and values.

### 11.1 `deal`

Shuffles (or takes the cards left by an earlier phase), lets `seats.cut_by` cut, gives the hands or the piles, and keeps the rest.

| key | type | values | default |
|---|---|---|---|
| `hand_size` | count, by seats, by role, `"half_rest"` | cards to each seat (format 2). `"half_rest"`: what is left in `s.rest`, less `dealer_extra`, shared equally; the dealer gets his extra cards on top (Mitigati for two, p. 86: 27 left, 12 to the non-dealer, 12 + 3 to the dealer). Only with `from: rest`. `"all_rest"` and unresolved `by_seats` are not played. Required unless `piles` is given | required |
| `dealer_extra` | integer, by seats | extra cards of the dealer, for the discard (format 2) | `0` |
| `extra_to` | enum | `dealer` | `dealer` |
| `extra_when` | enum | `first`, `last`, `any` | `last` |
| `packets` | list of integers, `dealer_choice`, `one_by_one` | packets per round from the first receiver. `dealer_choice` is dealt by the core in one go: with a fair shuffle the way of dealing changes no hand | `one_by_one` |
| `packets_announced` | bool | the dealer says his packets before the cut | `false` |
| `order` | enum | `from_right`, `from_left`, `opponent_first` (the dealer's opponent first, the dealer last: for two it is the same as `from_right`) | `from_right` |
| `pile_count`, `pile_size` | integer | format 2 piles: not played (only 0) | `0`, `3` |
| `piles` | list of integers | piles of each seat, in the order they are dealt: Baronetti `[10, 10, 10, 9]` (pp. 48-49). The deal lays pile 1 to every seat in the dealing order, then pile 2, and so on, from the top of the pack. Every seat gets the same piles. Replaces `hand_size` (a file with both is refused). The sum over the piles and the seats, plus `dealer_extra`, must fit the pack, and equal 78 with `dead: none` | none |
| `pile_top` | enum | `up` (the top card of each pile is open), `down` | `up` |
| `dead` | enum | `out` (face down, out of play), `prize` (a stock for `prize_stock`), `none` (all dealt), `stock` (the undealt cards stay in `s.rest` in order, for the next round of a `repeat` group: Sedici) | `out` |
| `from` | enum | `deck` (shuffle and cut the whole pack), `rest` (a later deal of the same hand: no shuffle, no cut, the cards come from `s.rest` as it lies and join the hands the seats still keep; played only with `hand_size: half_rest`) | `deck` |
| `face` | enum | `down`, `up` | `down` |

Rounds from the stock. Inside a `repeat` group a deal with `dead: stock` deals its first round from the shuffled and cut pack. In every later round (the engine's `s.round` above 0) it deals from the top of `s.rest` as it lies: no shuffle, no cut, no new dealer rule. The group ends when `s.rest` holds fewer cards than one round gives (`s.stockEmpty`).

A hand may hold two deal phases (Mitigati for two: 26 and 25 cards, a discard of 13 and 12, then the rest). Every deal and every discard keeps its state by phase id (`s.m.<phase id>`); the first deal of a file that has one deal is still `s.m.deal`. A second deal is `from: rest` and cannot be the first phase. With `dead: none` it must use up `s.rest`: the validator counts the cards deal by deal and discard by discard for the dealer and for any other seat, and refuses a file where the seats would end with unequal hands (the tricks could not be played out).

The preset (the bots' worlds, the lessons): `preset.hands = {<seat>: [cards]}` lists the cards of each seat in the order they are dealt, `preset.rest` the undealt cards in order (they feed the later rounds). With `piles`, `preset.piles = {<seat>: [[bottom..top], ...]}` lays the piles exactly as they lie (the top is the last card), and `preset.hands` must be empty. Every card of the pack appears once; a wrong size is an error.

State: `s.hands[seat]` holds every card the seat owns; with piles `s.piles[seat] = [{cards: [bottom..top], open: bool}]` says where they lie (`open`: the top card is turned up). The view of a seat shows only the open tops (`view.hand`, `view.open_piles`); the count of all its cards stays in `view.handCounts`.

Actions: none of the deal's own (the cut and the packets are automatic). Seat view: own hand, the other hands' sizes, the size of the rest. Events: `dealt {round}`.

Example (Baronetti, from the book):

```json
{"id": "deal", "module": "deal", "settings": {
	"piles": {"value": [10, 10, 10, 9], "source": "[D] Torino 1787, pp. 48-49: three piles of ten, one of nine for each player."},
	"pile_top": {"value": "up", "source": "[D] Torino 1787, pp. 48-49: the last card of each pile is turned up."},
	"order": {"value": "opponent_first", "source": "[D] Torino 1787, p. 48: the first pile to the dealer's opponent."},
	"dead": {"value": "none", "source": "[D] Torino 1787, pp. 48-49: 39 and 39, nothing is left."}
}}
```

### 11.2 `discard`

| key | type | values | default |
|---|---|---|---|
| `who` | enum | `dealer`, `declarer`, `each`, `dealer_then_other` | `dealer` |
| `count` | count, by seats, by role | cards put away | `deal.dealer_extra` |
| `count_mode` | enum | `exact` (Permesso, p. 59: «Guardati però di scartare più o meno di tre carte»), `up_to` (Quadrilio, p. 71 «non può scartarne più di due», [R]; Mitigati, p. 85 «sino a»). The core plays only `exact`: `up_to` needs an action to stop early, and in a hand with a second deal it would leave the hand sizes open (the validator refuses it there: Mitigati for two plays `exact`, question 5) | `exact` |
| `discard_honours_barred` | bool | the honours (`set:honours`) may not be put away (format 2) | `true` |
| `barred` | selectors | cards that may not be put away, when more than the honours (Partita, p. 90: «Bagatto non iscartasi, nè alcun Re») | none |
| `allowed_exceptions` | selectors | barred cards allowed under a condition: `[{"if": {"hand_lacks": "T0", "hand_count": {"of": "trumps", "max": 1}}, "any": ["T1"]}]` (p. 34: the Bagatto when it is the only trump and the hand has no Fool) | none |
| `counts_for` | enum | whose points this discard joins: `discarder`, `dealer`, `nobody`, `discarder_unless_no_tricks`; needed when a hand has two discards (Mitigati for two, pp. 85-86); with one discard, format 2 `count.dealer_forfeit` says the same and wins if both are given, except that `nobody` always wins over it (revision 11: the discard is out of the count, Venticinque for two, the other reading of question 32) | `discarder` |
| `announce` | enum | `ho_scartato` (pp. 54, 60: after the words the discard cannot change), `none` | `ho_scartato` |
| `face` | enum | `down`, `up` | `down` |

Actions: `discard {cards}`. Legal when the count and the bars hold. Seat view: the discarder sees his discard; others see its size. Events: `discarded {seat, n}`.

Two discard phases in one hand (Mitigati for two) keep their state by phase id. The count adds the whole discard of a seat once, whatever the number of discard phases; the `counts_for` of the first phase of a seat holds for all its discards.

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
| `overbid_returns` | bool | the second reading of «subito» (revision 11, [R]; Torino 1787, pp. 62-63, 82): `false`, after a raise the word goes on in the order of speech; `true`, it returns at once to the seat that was overbid, who holds with an equal bid, overbids or gives way, and then the auction goes on. For four to seven seats it is a transfer from the dialogue of three | `false` |
| `after_dealer_pass` | enum | `call` (with `dealer_speaks: first` and a fallback `all_pass: contract:<id>`: the dealer's pass ends the auction and he declares the fallback contract, the others never speak; Chiamare il Re, p. 82), `others_bid` | `others_bid` |

The auction as played (revision 7). The order of speech is the order of priority: a seat earlier in it may match the standing bid of a later seat («A due anch'io», pp. 62-64), a later seat must bid higher (`tie: challenger`: any seat but the dealer may match a bid of the dealer, once, and takes it; the dealer then has only a higher bid or a pass; `tie: dealer`: only the dealer may match). A pass is final; the auction ends when every seat but the last bidder has passed. All pass: `redeal` and `redeal_next_dealer` throw the hand in (nobody pays; it counts as a dealt hand); `contract:<id>` plays that contract with the dealer as the declarer. With one contract in `contracts` that is also the `all_pass` fallback (`contract:<that id>`: a free game agreed beforehand, Sestilio and Settilio, pp. 76-77) there is nothing to bid: the phase sets the contract on entering, with the dealer as the declarer, and the hand goes on to the next phase with no action.

Actions: `bid_<contract id>`, `pass` (an action type is at most 24 characters, so a contract id is at most 20). Seat view: `view.bidding = {order, bids: [{seat, bid}], best, done}`, `view.contract`. Seat view: the auction so far, the current best bid and its holder, own legal bids. Events: `bid`, `contract_won {contract, declarer}` or `all_passed`. The sides of the hand become those of the contract.

### 11.5 `exchange`

The called exchange of Permesso (p. 61: «chiami tre carte a suo piacimento, e ne getti via in tavola tre»). The declarer lays cards down face down, one action each, then calls the same number of cards by name; the holders give the called cards and take the laid ones, unseen. A contract with `exchange` 0 skips the phase. A phase that needs a contract stands in the plan with `when: {contract: [...]}` (Chiamare il Re: the exchange runs only at the contract `one`).

| key | type | values | default |
|---|---|---|---|
| `count` | integer or `"contract"` | cards exchanged; `contract` takes `exchange` of the winning contract | `contract` |
| `lay_down_first` | bool | the declarer lays his cards down before calling (p. 61); only `true` is played | `true` |
| `face` | enum | `down` (p. 61: given and taken face down, unseen) | `down` |
| `callable` | selectors | cards that may be called | `["all"]` |
| `card_not_held` | enum | a called card that lies in the dealer's discard: `from_discard` (the declarer takes it; the dealer's discard takes one laid card in its place; Dummett 1980, p. 266, a guess); `forbidden` is not played (a list of legal calls would show the dealer's discard) | `from_discard` |
| `give` | enum | who gets which laid card: `random` (each holder gets, unseen, as many laid cards as he gave; the laid cards are drawn by the seed of the deal, so a replay gives the same; [S]: p. 61 says only «Chi ha queste carte me le dà subito»); `declarer_assigns` is not played | `random` |
| `discard_honours_barred` | bool | the honours (`set:honours` when the file defines it, else the cards worth 5 or more) may not be laid down (rule 38) | `false` |
| `barred` | selectors | more cards that may not be laid down | none |
| `allowed_exceptions` | selectors | cards laid down in spite of the bar; same meaning as in `discard` (the `if` conditions are judged on the hand with the cards already laid counted as held). Permesso: `[{"any": ["T0"]}]`, the Fool may be laid (pp. 34-35) | none |

If every card left in the declarer's hand is barred, all of them may be laid (as in `discard`).

Cards that may be called: any card that is not in the declarer's hand, not in his own discard, not laid and not called already, and that the `callable` selectors name. The declarer cannot tell where a card lies, so the list of legal calls shows nothing (the phase needs `deal.dead` = `none`; the validator refuses another deal).

Actions (the declarer; `type` and `card` only): `lay_down {card}` (one card at a time; barred cards are not offered); `lay_done` (stop laying: offered after at least one card is laid and before the count of the contract is reached, only when `bidding.lay_down_fewer` is `plays_at_laid` (or absent): the contract becomes the one of the same `sides` whose `exchange` equals the cards laid, with its Onoranza; laying none is not allowed); `call {card}` (one card at a time, as many as were laid). When the last card is called, the exchange is made at once: for each called card its holder gives it to the declarer and takes one laid card (the laid cards are shuffled by the seed `<seed>:<phase id>:give` and handed out in the order of the calls). A card from the dealer's discard goes to the declarer and the dealer's discard takes the laid card at the same place.

State: `s.m.<phase id> = {stage: lay | call | done, need, laid, called, gave: {seat: [cards]}, got: {seat: [cards]}}`.

Seat view `view.exchange = {laid: n, called: [cards], mine: {laid, gave, got}}`: `laid` and `called` are public (how many cards are laid; the names called). `mine.laid` is the declarer's own laid cards (nobody else sees them); after the exchange `mine.got` of the declarer is the cards he received. A holder (or the dealer whose discard gave a card) sees, after the exchange, `mine.gave` (what he gave) and `mine.got` (the laid cards he got); nobody else sees which laid card went to which holder. `view.contract.laid` is the count of laid cards. Events: `laid {seat, n, contract}` (when the laying is over; `contract` is the contract played, changed by `lay_done`), `called {cards}`, `exchanged {n}`.

### 11.6 `call_partner`

Calling a king (Chiamare il Re, pp. 80-84). The caller names a card by its rank; the holder of the named card is his partner, secret until that card is played.

| key | type | values | default |
|---|---|---|---|
| `caller` | enum | `dealer` (p. 80), `declarer` | `dealer` |
| `ladder` | list of ranks | `["K", "Q", "N", "J"]` (pp. 81-82) | `["K"]` |
| `step_down` | enum | `caller_holds_all_of_rank`: the caller names a card of the first rank of the ladder of which he does not hold all four cards (in his hand and his own discard together); with all four kings he names a queen, and so on | same |
| `secret` | bool | the holder does not reveal himself until the card is played (p. 80); `false`: everybody knows at once | `true` |
| `own_card` | enum | the caller names a card he holds himself: `plays_alone_unless_forgiven` (p. 83: he plays alone against the rest; the others cannot know the card is his, so forgiveness is not offered: [R], open question 28), `plays_alone` (the same), `forbidden` (such cards are not offered) | `plays_alone` |
| `card_in_discard` | enum | a card of the caller's own discard: `forbidden` (the caller knows it; not offered) | `forbidden` |

Legal calls: the four cards of the first rank of the ladder that the caller does not hold whole, less the cards of his own discard (and less his own hand cards when `own_card` is `forbidden`). If the caller holds all four cards of every rank of the ladder (all sixteen courts), nothing can be called: the caller plays alone as the contract of the file with `exchange` 0 and `sides` `declarer_vs_rest` (the highest rank of them; [S]); event `no_call {seat, contract}`, the phase is over at once, `s.contract` changes (and with it the settle that runs).

Action (the caller): `call_partner {card}`. The partner is the seat that holds the card (the caller himself, if he holds it: he plays alone). The sides become: the declarer and the holder side 0, the rest side 1 (`Hand.setPartner`). With `secret` true: `s.secret = {card, holder}` until the card is played; the engine calls `onCardPlayed(h, entry, seat, card)` after every card played in the tricks; the called card clears `s.secret` and gives the event `partner_revealed {seat}` (the holder).

State: `s.m.<phase id> = {caller, stage, card, holder, revealed}`.

Seat view `view.call = {card, revealed, partner}`: the card is public once called (null before); `partner` is the holder for the holder himself (and so for a caller who called his own card), and for everybody once `revealed`; else null. `view.sides` shows null for the seats a viewer does not know while `s.secret` stands (the caller knows only himself; the holder and, after the reveal, everybody know all); `view.contract.called` holds the called card. Events: `partner_called {card}`, `partner_revealed {seat}`, `no_call {seat, contract}`.

### 11.7 `declarations`

Announcing honours, trumps and Mitigati (Bagatt'ultimo, pp. 93-95; Mitigati for two, p. 86).

| key | type | values | default |
|---|---|---|---|
| `kinds` | list of declaration kinds | below | required |
| `window` | enum | `after_discard_before_first_card` (p. 95), `before_first_trick_covered` (p. 86 «prima dee accusarli, che coperta siasi la prima mano»; revision 11, see «The window of the first trick» below) | `after_discard_before_first_card` |
| `late` | enum | `right_lost` (p. 95) | `right_lost` |
| `mode` | enum | `auto` (the engine declares for the seat), `manual` (the seat must press; forgetting loses it) | `auto` |
| `paid` | enum | `at_once` (p. 95 «e subito, e non sul fine della partita»); `end_of_hand` is not played | `at_once` |
| `paid_by` | enum | `each_other` (each opponent pays the amount); `others_together` is not played | `each_other` |

A declaration kind: `{"id", "of": selector, "min": n, "all_of": bool, "show": "announce_count" | "announce" | "expose", "pays": amount, "includes": id}`. `includes` (revision 11, optional) is the id of another kind of the list that this kind pays with: declaring it pays that kind too, once and by the count of the hand, unless that kind was declared before; naming the included kind afterwards pays nothing more (Mitigati pays the three honours as well, p. 94). The included kind must not include another and must not be held whole (`all_of`). `id` is 1-16 letters `a-z` and `_` (the action is `declare_<id>`, and an action type is journaled as `[a-z_]{1,24}`). `of` selects cards of the hand; the seat qualifies when it holds at least `min` of them, and with `all_of` when it holds every card the selector names. `n` is the number of cards held. `pays` is a number, `{"table": …}` (section 10) or another amount of section 10. The table: `rows` by `n`, above the last row `rows[last] + floor((n − last) / every) × add`, below the first row nothing; `same_as_count` pays `n`.

Example from p. 93-94: honours, three or more, announced without naming them, 3 → 10, 4 → 15, 5 → 20 and so on: `{"id": "onori", "of": "set:honours", "min": 3, "show": "announce_count", "pays": {"table": {"by": "count", "rows": {"3": 10, "4": 15, "5": 20}, "beyond": {"every": 1, "add": 5}}}}`; ten trumps or more, laid out and shown, as many as the trumps: `{"id": "trionfi", "of": "trumps", "min": 10, "show": "expose", "pays": {"table": {"by": "count", "rows": {}, "same_as_count": true}}}`; Mitigati (Angel, Bagatto, Fool): `{"id": "mitigati", "of": {"any": ["T20", "T1", "T0"]}, "min": 3, "all_of": true, "show": "announce", "pays": 10}`.

The turn. The window is played before the first card, in play order from the first leader (`tricks.first_leader`, in a hand with a leader of the previous hand the leader of the match). Each seat has one turn; a seat whose hand qualifies for no kind has no turn. In its turn a seat sees the kinds it may declare, one at a time: the actions `declare_<kind id>` for each kind its hand qualifies for and it has not declared yet, and `declare_done`. After a declaration the same seat goes on while it has a kind left; `declare_done` (or the end of the list) passes the turn. Once a seat has passed the turn it cannot declare any more (`late: right_lost`): the first card ends every right. With `mode: auto` the engine declares every kind for every seat in order, with no actions.

The window of the first trick (`window: before_first_trick_covered`, `mode: manual`, revision 11; Mitigati for two, p. 86). There is no declaring turn before the first card. Every seat may declare at any moment of its own choice until the first trick is closed: the actions `declare_<kind id>` stand beside its card in the first trick, and once more, after the last card of the trick has lain and before it is closed, each seat that still has a kind on offer is asked in play order (`declare_done`, «continue», stands first in its list). After the first trick is closed nothing can be declared (`late: right_lost`). The window before the first card, one turn for each seat as above, is played with `window: after_discard_before_first_card` (Bagatt'ultimo, p. 95) and is the other reading at Mitigati for two. The tricks module asks the declarations for the extra actions and for the closing window.

Payments. Each declaration is paid at once by every other seat to the declarer (`paid_by: each_other`), `why: declaration`. The payments are kept in `s.m.<phase id>.paid` and given to `settle` by `handPayments` (11.14); with `show: expose` the cards of the kind become public for the hand.

State: `s.m.<phase id> = {order, at, made: [{seat, kind, n, cards?}], paid: [{from, to, amount, why, kind}]}`. Seat view `view.declarations = {open, made: [{seat, kind, n, cards?}], offer: [kind ids]}`; `open` is true while the phase runs, `offer` is non-empty only for the seat to act; `cards` only for `show: expose`. Events: `declared {seat, kind, n, cards?}` (the money is paid by `settle`: the declarations come first, `paid {from, to, amount, why: declaration}`). Actions: `declare_<kind id>`, `declare_done`, both `{type}` with no card.

### 11.8 `tricks`

| key | type | values | default |
|---|---|---|---|
| `first_leader` | enum | `non_dealer` (format 2; p. 54), `dealer_right` (p. 35 «Chi è a destra di chi dà, comincia»), `declarer`, `previous_last_taker` (Dottore, p. 75 «Chi è ultimo a prendere giuoca il primo», [R]; from the second hand of a match the taker of the last trick of the previous hand), `round_last_taker` (a game dealt in rounds: the first round of every hand starts on the dealer's right, each later round of the same hand with the taker of the last trick of the round before; Torino 1787, pp. 35 and 37) | `dealer_right` |
| `next_leader` | enum | `trick_winner` (p. 50 «Chi prende giuoca sempre il primiero») | `trick_winner` |
| `follow_suit` | bool | format 2 (p. 49) | `true` |
| `must_trump` | bool | void in the led suit, a trump must be played (format 2) | `true` |
| `must_overtrump` | bool | a higher trump must be played if held (format 2) | `false` |
| `play_from` | enum | `hand`, `pile_tops` (Baronetti: only the open cards, p. 49) | `hand` |
| `fool_may_lead` | bool | the Fool may be led | `true` |
| `tricks` | integer | the number of tricks, when not every card is played | all cards |

Actions: `play {card}`; with `cards.fool_show_any_time` (only together with an `open_piles` phase), also `show_fool`. `play_from: pile_tops` also needs an `open_piles` phase. Legal cards follow suit → trump → any, with the Fool per `cards.fool` (a trionfo of the order with `trump`, the excuse of p. 54 with `excuse`). In a `repeat` group `first_leader` is read in every round (`previous_last_taker`: the taker of the last trick of the round before). Seat view: the current trick, who leads, own legal cards (for hints), the tricks won per seat (number only; closed tricks are not shown, pp. 32-33), the last trick per `view.last_trick`. Events: `card_played`, `trick_won {seat, cards}`, `last_trick_won`.

### 11.9 `prize_stock` (hook of `tricks`)

Morto (pp. 57-58). Settings: `stock` (`rest`: the cards `deal.dead` = `prize` left), `per_trick` (cards per trick, 1), `take` (`top`), `show_to` (`opponents`, `all`, `nobody`), `goes_to` (`won_pile`, `hand`), `fool_trick` (who draws for a trick in which the Fool was shown: `trick_winner`, `fool_owner`, `nobody`). No actions. Seat view: the stock's size, the card just drawn (to those it is shown to). Events: `stock_drawn {seat, card}`. Example: `rulesets/morto.json`, phase `morto`.

### 11.10 `open_piles` (hook of `tricks`)

Baronetti's piles (pp. 48-50). Each seat owns the piles `deal.piles` dealt. Only the top card of a pile is open; the seat plays only open cards (`tricks.play_from: pile_tops`: the legal cards are the open tops, then follow suit and trump duties apply to them). After a trick (both cards played) each seat turns the next card of the pile it played from, «ma non prima di aver giuocato, e risposto». A pile played to empty stays empty.

| key | type | values | default |
|---|---|---|---|
| `reveal` | enum | `after_trick` (both cards of the trick are played, then each seat turns the next card of its pile). `after_own_play` is not played yet | `after_trick` |
| `empty_pile` | enum | `play_from_others` (a seat whose pile is used up plays from its other piles) | `play_from_others` |

Actions: `show_fool {card: "T0"}` when `cards.fool_show_any_time` is true. It is offered to the seat whose turn it is, when the Fool is an open top of one of its piles and the seat holds at least one other card. It lays the Fool among the seat's won cards, turns the next card of that pile at once, and the seat keeps its turn. Playing the Fool into a trick is the ordinary `play` (the excuse of `cards.fool: excuse`).

A card left without a partner: a seat that showed the Fool has one card fewer than the other. When the seat has played its last card and the other seat holds one card, that card is not played: it joins its owner's won cards at the end of the last trick (event `cards_kept`). [S] ours: the book does not say.

Seat view `view.open_piles = {piles: {<seat>: [{size, top}]}, shown: {<seat>: [cards]}}`. `size` counts the covered cards, `top` is the open top or `null` (a pile played to empty, or turned only after the trick). Covered cards are never listed, not even to their owner. Events: `pile_revealed {seat, pile, card}`, `fool_shown {seat}`, `cards_kept {seat, cards}`. Example: `rulesets/baronetti.json`, phase `piles`.

### 11.11 `fuora` (hook of `tricks`)

Going out in Sedici and Trent'uno (pp. 35, 39-41, 46).

| key | type | values | default |
|---|---|---|---|
| `target` | number | 16 (p. 35), 31 (p. 46) | required |
| `claim_when` | enum | `after_trick` (played), `own_turn` (played: a claim at any turn of the seat to act, see below), `any_time` (not played) | `after_trick` |
| `false_claim` | list | typed rows by the claimer's real points (book points): `{"below": 8, "pays": {"stake": "marcia"}, "to": "each_other"}` or `{"from": 8, "pays": {"stake": "simple"}}`; `pays.stake` is `simple`, `marcia` or `double` (marcia and double are twice the simple stake); `to` is `each_other`, the only payee played: the claimer pays every other seat (FORMAT_OPEN_POINTS 56) | none |
| `after_false_claim` | enum | `play_on` (the claimer pays the row and play goes on), `hand_ends` (a false claim loses the partita: the hand ends, every other seat wins, and the row is paid by the claimer to each other seat as the price of the lost game, with no second payment for the win) | `play_on` |
| `at_round_end` | enum | `deal_on` (played: nothing forces a claim at the end of a packet; when the pack is spent a last window asks each seat in turn, from the taker of the last trick, for `claim_fuora` or `pass_fuora`, `pass_fuora` first in the list), `must_claim` (the old reading: the taker of the last trick of a packet who has the points must claim before the next deal) | `deal_on` |
| `winner_is` | enum | `claimer` (the seat that claims rightly), `first_reached` (the first seat whose count reached the target, whoever claims; with no right claim at the end of the pack it wins too; Prammatica [1846], p. 12) | `claimer` |
| `after_first_out` | enum | `hand_ends` (played), `others_continue` (Sedici for three «a scaricare», pp. 43-44; played at three seats, with `winner_is: claimer` and `after_false_claim: play_on`: the first to go out lays his cards face down and wins, the other two play on in tricks of two cards and the next packets are dealt to the two; `s.out` is the first to go out, `s.outs` all in order; the second to go out ends the hand; the table settles with `settle.mode: a_scaricare`) | `hand_ends` |
| `stock_empty` | enum | `hand_ends_no_winner` (played), `others_pay_first` (played only with `others_continue`: the pack runs out after the first to go out and no second said «fuora», so there is no last and both pay the first one stake [S]; when nobody went out the hand still ends with no winner), `reshuffle_untaken`, `hand_ends_most_points` (not played) | `reshuffle_untaken` |

**The claim window (`claim_when: after_trick`).** Right after a trick only the seat that took it may claim, before anything else happens; points come only with a taken trick, so nobody else can have gone out. The seat has the action `claim_fuora` beside its cards until it plays a card. After the last trick of a round the window comes before the next deal, but there it is offered only when the claim is right (a false claim could only cost) and is then the only action: the engine waits for it. The engine counts aloud for the claimer (p. 41): the points of the cards it has won so far, counted by the count phase's rules (the same number as `view.points.mine`). Enough points (`target` or more): the claimer is out (`s.out`), the hand ends at once and goes on to count, result and settle. Too few: it pays the row of `false_claim` that fits its points (an event `paid`, `why: false_claim`, made by the settle phase to each other seat, whoever wins the hand) and play goes on (`play_on`); one claim at a time. The pack running out with no claim: the hand ends with no winner (`stock_empty`).

**The claim window (`claim_when: own_turn`).** The seat to act in the tricks may claim at any of its turns: before a lead, before an answer in the middle of a trick, and right after a trick it took. One claim a turn (a false one is followed by a card). A right claim ends the hand at once; the cards lying in a trick not yet closed are counted for nobody. A false claim pays the same `false_claim` rows and goes on as `after_false_claim` says. The window after the last trick of a round (the engine waits for a right claim before the next deal) stays as under `after_trick`.

**Game points of a false claim.** In a match that counts game points (`result.game_points` not `none`) a false claim whose row pays `marcia` or `double` gives each other seat two game points (a «vada doppio»), a row paying `simple` one (Prammatica [1846], p. 13). They are added to the hand's `gamePoints` beside the winner's own (11.13).

Actions: `claim_fuora`. Events: `fuora_claimed {seat, valid, points}` (points in book points), `stock_empty`. Seat view: `view.fuora = {target, canClaim, claims: [{seat, valid, points}]}`. With `repeat` (11.15): `{"id": "rounds", "module": "repeat", "until": "fuora", "phases": [deal of 4, tricks]}` and the hook `{"id": "fuora", "module": "fuora", "during": "tricks"}` beside it.

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

No actions. After the hand every seat's view carries the breakdown in `result.breakdown` (CORE_API section 3, Result); the file's `view.score_panel.after_hand` is the list of lines the table shows. The core sends them ready, as numbers in that order: `view.scoreLines.lines[]` with the key, the rule path and the numbers by unit or seat (CORE_API section 3, View); the words stay the table's. Events: `counted {points per seat or side}`.

### 11.13 `result`

Decides who won the hand and how.

| key | type | values | default |
|---|---|---|---|
| `vola` | enum | `sole_winner` (revision 11, [D] Torino [1846], part I, p. 32: «nella vola non perde uno solo, ma tutti, ad eccezione di chi la fa ch'è l'unico vincitore»: the side that takes every trick of the hand wins alone, every other side loses, whatever the points; with `more_points` and `fewest_points`), `none` (the points decide) | `none` |
| `winner` | enum | `more_points` (format 2; p. 54), `threshold` (every seat or side reaching `target` wins: Bagatt'ultimo 26, p. 95; Baronetti 46, p. 51), `declarer_threshold` (the declarer's side against `target`, with `bands`: Permesso 46), `fewest_points` (Meno, p. 78 «guadagna chi fa meno punti»), `first_out` (by `fuora`) | `more_points` |
| `target` | number | 46, 26, 16, 31 | none |
| `tie` | enum | format 2 `no_game_points`; `redeal_next_dealer` (p. 70 «tocca al compagno appresso a mischiare»: the outcome is `draw`, nobody pays, the hand counts as dealt); `declarer_loses` (our reading of p. 74 «non si può mai rifare per eguaglianza di punti»); `draw`; `share` (revision 10, `more_points` and `fewest_points`: when several sides are level at the best points they all win, `result.winners` holds all their seats, `outcome: win`, and `worst` is the worst of the others; when every side is level it is a tie as before) | `no_game_points` |
| `bands` | list of `{min, max, outcome, pays}` | finer outcomes by the declarer's points: 46+ win; 45½ draw; 43½-45 loss on the Onoranza only (pp. 66-70) | none |
| `game_points` | enum | format 2: `one`, `one_or_two_dry`; `none` (the hand settles in stakes only) | `one` |
| `shut_num`, `shut_den` | integer | format 2: the dry line | `1`, `3` |

`declarer_threshold` (played, revision 7): the points of the declarer's side (book points, halves exact) select the first row of `bands` that holds them. `outcome: win` makes the declarer's side the winners, `loss` the other sides, `draw` has no winner (`result.outcome: draw`). `pays` says how much of the settle amount is paid: `full`, `onoranza_only` (the points beyond the line are left out), `nothing`. `result.band = {outcome, pays}`, `result.contract`, `result.declarer`. Without `bands` the declarer wins with `target` and loses otherwise. `threshold` with `tie: declarer_loses` and a declarer: when no side reaches the target (45½ each) the other sides win. A hand thrown in in the bidding has `outcome: thrown_in`.

With `winner: first_out` the winner is the seat that went out (a valid `fuora`); `result.reason` is `fuora`, `false_claim` (`after_false_claim: hand_ends`) or `stock_empty`. A hand with no winner has `outcome: none`, no winners, no payment and no game point (it is not a tie, so a race never deals it again by the same dealer). `game_points: one` gives the winner of the partita one point, a «vada»; the false-claim points of the `fuora` module come on top.

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
| `mode` | enum | `loser_pays_winner`; `declarer_vs_each` (the declarer collects from each opponent or pays each: pp. 64, 68-69, 73-74 «come fosse egli tre giuocatori in un solo»; played); `losers_pay_winner` (Sedici for three, p. 43 «da tutti e due i compagni perdenti»); `a_scaricare` (only the last loser pays, for two: pp. 43-44; played only with a fuora phase whose `after_first_out` is `others_continue`; the second to go out neither pays nor collects; with no last, both pay one stake); `pair_split` (each winner collects from one opponent: p. 90; with unequal sides, one against three, it is played as `declarer_vs_each` with the same amount [S]); `winners_from_losers` (each loser pays each winner) | `loser_pays_winner` |
| `amount` | amount | the payment for the hand: `{"stake": "simple"}`; Permesso: `{"sum": [{"contract": "onoranza"}, {"per_points": {…}}]}` | `{"stake": "simple"}` |
| `premiums` | list | `{id, when: vola / loser_below_fraction / winner_times_loser, fraction, times, effect: {multiply, add}, option}`: marcio (p. 99 «vale posta doppia»), vola (p. 100), triplice, quadriplice (p. 55); `option` makes it count only if agreed | none |
| `payments` | list | event payments, each with its own source: `{id, on, from, to, amount, source}` | none |

The amount of a declarer game is a sum: `{contract: onoranza}` (the contract's field) and `{per_points}` (steps of `every` points between the declarer side's points and `from`, rounded by `round` on the scale of points and counted whatever the sign: 40 points on three lose 2 + 1 = 3 to each of two opponents, six in all). The rows are written apart (`why`: `onoranza`, `points`, the mode, the id of an event payment, `false_claim`, `declaration`). The band's `pays` cuts the amount. The payments of events (declarations, `payments`) come first.

Event payments, `on`: `declaration:<kind>` (the seat that declared the kind), `last_trick_won_with:<card>` (the seat that played the card in the last trick and took that trick), `lost_in_last_trick:<card>` (played in the last trick, the trick taken by another seat), `lost_before_last_trick:<card>` (played before the last trick and not taken by its player; an excuse kept by its owner is never lost). `from` / `to`: `each_other` (every seat but the event seat), `event_seat`, `winners` and `each_winner`, `losers` and `each_loser` (by `result.winners`). Every payer pays every payee the amount (never himself). `reached_target` and `penalty:<id>` are not played. `payments` is played when every row names a unique `id`, one of the events above, `from`/`to` of the list above and an amount.

The payments of the hand are made by `handPayments(h, set)` of `core/modules/payments.js`: first the payments of the declarations of the hand (`why: declaration`, in the order they were declared), then the rows of `settle.payments` in file order, each with `why` equal to the row `id`; a row whose event did not happen gives nothing. `settle` calls it and puts these payments before the payment of the game, after the payments of false `fuora` claims. The function reads the hand and changes nothing. Example, the Bagatto last (p. 96):

```json
"payments": [
	{"id": "bagatto_last", "on": "last_trick_won_with:T1", "from": "each_other", "to": "event_seat", "amount": 30, "source": "[D] Torino 1787, p. 96: «ritirerà dai compagni trenta»; [R] from each or in all: from each, as «pagherà trenta a ciascuno».", "alt": "together"},
	{"id": "bagatto_lost_last", "on": "lost_in_last_trick:T1", "from": "event_seat", "to": "each_other", "amount": 30, "source": "[D] Torino 1787, p. 96: «pagherà trenta a ciascuno»."},
	{"id": "bagatto_lost", "on": "lost_before_last_trick:T1", "from": "event_seat", "to": "each_other", "amount": 5, "source": "[D] Torino 1787, p. 96: «cinque marche per ciascuno»."}
]
```

When there is no `settle` phase, the result's `game_points` feed the match (format 2 behaviour). Seat view: the payments of the hand and the running ledger. Events: `paid {from, to, amount, why}`. The payments of false `fuora` claims (the `fuora` module) come first (`why: false_claim`), whoever wins the hand and also in a hand with no winner; the stake of the partita follows by `mode`. A partita with no winner pays no stake.

### 11.15 `repeat`

A structural group, not a game mechanism: runs its `phases` again and again `until` a condition (`fuora`, `stock_empty`, `fuora_or_stock_empty`). Used for the repeated deals of Sedici and Trent'uno. The group holds a `deal` and a `tricks` phase (the checker requires both) and, for `until: fuora`, the file needs a `fuora` phase. Each round after the first: `s.round` counts up, the open trick and the state of the inner modules are cleared, the deal runs again (`deal.dead: stock` keeps the undealt cards in order in `s.rest`, and a later round deals from them with no shuffle and no cut; `dead: stock` is played only inside a repeat group), the dealer stays the same and the cards won in the earlier rounds stay won. The group ends when the next deal cannot be made (fewer cards in the pack than one deal takes: event `stock_empty`, `s.stockEmpty`), or at once when a hook ends the hand (a valid claim).

## 12. Match

The match wraps the hand. Format 2 keys keep their names.

| key | type | values | default |
|---|---|---|---|
| `kind` | enum | `single_hand`; `fixed_hands` (`hands` hands); `race` (to `target` game points); `running_total` (Venticinque for three by RI: `rounds` rounds, each seat scores its points less `round_target`, the greatest total wins if it is above zero (Torino [1846], part I, p. 34: «Vince chi ha … un maggior numero di punti»), as the core plays it; Dummett 1980, p. 260 has the first player to reach a positive total in the last round); `ledger` (stakes accumulate hand after hand; with `dealer_rounds` the match ends after that many rounds of dealers, the greatest balance wins and equal balances are a draw, «pace»; without it the table ends the match when the players leave) | from `hands`: 0 → `race`, N → `fixed_hands`; no match section → `single_hand` |
| `target` | number | format 2: the game points a `race` is played to | `5` |
| `hands` | integer | format 2 (0 = race) | — |
| `tiebreak` | enum | format 2: `none`, `card_points` | `none` |
| `tie_replay` | bool | format 2 | `true` |
| `max_hands` | integer | format 2 | `60` |
| `max_stake`, `crawford`, `double_window_cards` | | format 2 (Duello's doubling; must be 1, false, any for the book's games) | |
| `round_target` | number | `running_total`: 26 | none |
| `rounds` | integer | `running_total`: 3 | none |
| `dealer_rounds` | integer | `ledger`: the match ends after this many rounds of dealers (deals = rounds x seats); without the key a ledger match never ends | none |
| `payout` | `per_hand`, `match_end`, or `{at: match_end, mode, amount}` | revision 10. `per_hand`: each hand pays its stake as the `settle` phase says. `match_end`: the hands pay no stake (the payments of events, declarations and false claims, stay); once, when the match is over, the losers of the match pay its winners: `mode` (`loser_pays_winner`, `losers_pay_winner`, `winners_from_losers`, `pair_split`, as `settle.mode`) and `amount` (numbers, `stake`, `option`, `sum`, `times`, as `settle.amount`) are those of the `settle` phase unless the object form gives its own. Winners of the match are those of `kind` (`fixed_hands`, `race`: the side with most game points, then `tiebreak`; `running_total`: the greatest positive total); no winners (level) - nobody pays. `loser_pays_winner` takes the payers from the worst of the match (`running_total`: the lowest total; else the sides lowest by game points, then card points when `tiebreak: card_points`), the other modes every loser. Not for `ledger` and `single_hand`. The payment is `standing.payments` (`[{from, to, amount, why}]`, `[]` while the match runs) and is added to `standing.ledger` when the match is over; `view.match.payments` repeats it. Both fields exist only when the file has `payout: match_end`; a file that pays per hand sends the views it always sent | `per_hand` |

The dealer changes by `seats.dealer_rotation`. A hand thrown in (everybody passed, `outcome: thrown_in`) or drawn (`outcome: draw`) counts as a dealt hand in `dealer_rounds`: nobody pays, the next dealer follows the rotation; it is never dealt again by the same dealer (that is `tie_replay` of a tied race hand only).

**A race of a going-out game (Sedici, Trent'uno at two).** `kind: race`, `target: 5`, `result.game_points: one`: a partita (one hand, however many rounds of deals it has) won by a valid «fuora» gives its winner one point, a «vada»; a false «fuora» whose row pays `marcia` or `double` gives each other seat two points, a «vada doppio», a row paying `simple` one (Prammatica [1846], p. 13). The match ends when a seat has `target` points after a partita and one side leads alone (`max_hands` otherwise): when the leaders are level at the target or above, another partita is played, until one side leads alone (revision 6); the most points win. Only `max_hands` can end a race level, with no winner. A partita with no winner (the pack ran out) has `outcome: none`, scores nothing, and the next dealer follows `dealer_rotation` (`tie_replay` is for a tied hand only). The other reading («al primo vada») is `kind: ledger` with `dealer_rounds: 1`: every partita stands alone and is paid at once; the core plays both forms. `view.score_panel.ledger: false` hides the stakes ledger: the stake of the whole partita is paid at its end, which the format cannot compute yet (FORMAT_OPEN_POINTS 54).

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
| `score_panel.live_points` | `hidden` (the book counts at the end; closed tricks need not be shown, pp. 32-33), `own` (played: the book points of the cards the seat has won so far in this partita, counted by the count phase's rules, as `view.points.mine`), `side`, `all` (not played) | `hidden` |
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
| `penalty_names`, `contract_names` | object | rules page | names of offences (by `offence`, else the penalty id) and of bids (by contract id); a name the page lacks shows the id in plain letters, and a test fails on it |
| `left_out` | object | rules page | for each `left_out` id of the game file the whole line the page prints, in this language, name first; the Russian page needs it, the English page may fall back to the `why` of the game file |

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
