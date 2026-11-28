# The rules core: API as built

Plain JavaScript, ES modules, Node 24, no dependency. `core/` is pure: no files, no network, no clock, no `Math.random`, so the same code runs in a browser. It knows no game by name: a game is a game file (format 3); every rule is a setting with a value. Check: `node tools/check-core-pure.mjs`.

Core version `1.0.0` (`VERSION`). Module versions (`MODULE_VERSIONS`, for the record of a hand):

| module | version | module | version |
|---|---|---|---|
| deal | 1.0.0 | prize_stock (hook of tricks) | 1.0.0 |
| a_monte | 1.0.0 | count | 1.0.0 |
| discard | 1.0.0 | result | 1.0.0 |
| tricks | 1.0.0 | settle | 1.0.0 |
| repeat (group) | 1.0.0 | fuora (hook of tricks) | 1.0.0 |
| open_piles (hook of tricks) | 1.0.0 | | |

## 1. Entry points (`core/index.js`)

```js
import { loadGame, checkSupport, newHand, replayHand, newMatch, makeRng, VERSION, MODULE_VERSIONS } from './core/index.js';
```

- `loadGame(id, getFile, opts)` → `Game`. `getFile(id)` returns the parsed JSON of `rulesets/<id>.json` (the caller reads files). `opts = {seats, options: {id: value}, variant: id|null, alts: [leaf path]}`. Order: merge `extends` (format 7.3), apply the variant patch, pick the seat count, apply the alts, resolve `by_seats`, apply the options (defaults when absent; a value not in `choices` throws), resolve `option:<id>` values, drop phases whose `when` fails, build the plan, check the support. Bad arguments throw (no such file, variant, option, alt path; a leaf without `alt`); unsupported rules never throw.
  - An alt path uses the validator's notation: `seats.dealer_rotation`, `cards.fool_exchange`, `hand.phases[count].settings.dealer_forfeit`. The leaf's `alt` takes the place of its `value`; the `alt` key is removed from that leaf. Nothing else changes.
  - `Game = {id, seats, chain (ids, child first), rules (the merged file), alts (paths applied), revision, support, version, options (resolved), variant, cfg (plain values of seats, sides, cards, match), plan, hooks, tables, sides}`. The core never hashes files: the caller adds file hashes where it needs them.
- `checkSupport(rules, seats)` → `{runnable, missing: [{path, module, key, value, why}], alts: [{path, value, alt, supported}]}`. Every module declares in `module.supports` the settings and values it plays; anything else in the file is listed in `missing` (a module the core lacks: `key` null). `alts` lists every leaf that carries an `alt` and whether the core plays the alt value. `newHand` throws on a game whose `support.runnable` is false; a caller and the robots refuse it earlier.
- `newHand(game, {seed, dealer, preset?, carry?})` → `Hand`. `seed` is a string. With `preset = {hands: {"0": [ids], ...}, rest: [ids]}` nothing is shuffled or cut: each seat gets exactly its listed cards (the dealer's extra cards included; the order of a list is the order of dealing, which matters only for packet rounds), the undealt `rest` keeps its order, a prize stock is drawn from its start. The preset is for the first deal only; an a monte redeal shuffles. `carry` is what a match passes (`lastTaker`, `match`).
- `replayHand(game, {seed, dealer, preset, carry}, log)` → `Hand`; throws on the first refused action.
- `newMatch(game, {seed, firstDealer, preset?})` → `Match` (section 5). `preset` deals the first hand, as in `newHand`.
- `makeRng(seed)` → `{next(), int(n)}`: sfc32 seeded by cyrb128. `shuffle(arr, rng)`: Fisher-Yates from the end, `j = int(i + 1)`.
- Also exported: `DECK` (canonical order), `CARD_INDEX`, `sortCards`, `compareCards`, `hashOf`, `canonical`, `valueTable`, `countTwelfths`, `cardTwelfths`.

## 2. Cards, seats, order

Card ids: `T0` (the Fool), `T1`..`T21`, `<suit>:<rank>` with suits `cups coins swords batons`, ranks `1`..`10`, `J N Q K`. Canonical order (sorting, tie-breaks, hands in views): swords 1..K, batons, cups, coins, `T1`..`T21`, `T0`.

Seats are `0..n-1`; seat `i+1` (mod n) is to the right of seat `i`. `dealer_right = dealer + 1`. Pairs at four seats: 0 with 2, 1 with 3 (`partners_opposite`: side = seat mod n/2; `partners_adjacent`: side = floor(seat/2)).

## 3. The hand

```js
hand.toAct()        // [seat]: one seat, or several during a consent vote
hand.legal(seat)    // every legal action of that seat, enumerated; [] when it is not to act
hand.apply(seat, action) // {ok: true, events} | {ok: false, code, why}; a refused action changes nothing
hand.view(seat)     // all that seat may know
hand.isOver(); hand.result(); hand.snapshot(); hand.checksum(); hand.clone(); hand.log
```

Refusal codes: `over`, `not_to_act`, `bad_action`, `illegal`. An action is accepted only if an enumerated legal action has the same `type` and `card`; the log keeps the enumerated action, never the client's object. `{type: "next"}` is not a core action (a table's «next hand» message); the core refuses it.

### Actions (objects, `type` first)

| action | when |
|---|---|
| `{type:"discard", card}` | one card per action, `count` times; «ho scartato» is implicit when the count is reached |
| `{type:"play", card}` | tricks |
| `{type:"a_monte_propose"}`, `{type:"a_monte_pass"}` | a window, one seat at a time from the right of the dealer |
| `{type:"a_monte_agree"}`, `{type:"a_monte_refuse"}` | the vote: all the others at once; unanimous consent redeals, one refusal closes the window |
| `{type:"fool_give", card}` | the Fool's owner picks the plain card the owner gives (`fool_exchange_card: owner_choice`), after the last trick; not asked when the one who took the trick with the Fool is on the owner's own side and the side counts one heap (`sides.pool: side`): no card is given, no `fool_given` event, `foolGive` stays null |
| `{type:"claim_fuora"}` | a fuora hook: the taker of a trick, right after it (and after the last trick of a round, when the claim is right) |
| `{type:"show_fool", card:"T0"}` | an open_piles hook with `cards.fool_show_any_time`: on the seat's turn the owner of an open Fool lays it among the won cards of the owner; the next card of its pile turns and the seat still plays |

The cut and the dealer's packets are automatic. A successful a monte redeals with the hand seed + `"/a"` + count (`1`, `2`, ...).

### View (JSON, per seat)

`{game, revision, seat, seats, dealer, phase: {id, module}, toAct, hand, handCounts, discard: {mine, counts}, rest: {count}, stock: {count, drawn: [{trick, seat, card}]}, trick: {leader, cards: [{seat, card}]}, tricks: [{leader, cards, winner, fool, prize, reason}], won: {seat: n}, sides: {mode, of}, legal, aMonte, result, match}`; after the hand also `scoreLines`.

- `hand` is the dealt-so-far hand (canonical order) during packet rounds. `discard.mine` holds only the seat's own discard. `rest` and `stock` show counts only; `stock.drawn` and `tricks[].prize` show only the cards shown to this seat (`show_to`). Closed tricks stay in `tricks` as public history. Live points are never shown.
- Newer parts: `points = {mine}` (with `view.score_panel.live_points: own`: the book points of the cards the seat has won so far, counted by the count phase's rules; fractions are halves); `round = {index, stock}` inside a repeat group (`stock` = cards left in the pack); `fuora = {target, canClaim, claims: [{seat, valid, points}]}` with a fuora hook; `open_piles = {piles: {seat: [{size, top}]}, shown: {seat: [cards]}}` with piles (covered cards are only counted). With piles `hand` is the open tops of the seat's own piles (a hook's `visibleHand`) and `handCounts` counts every card the seat still owns, covered or not. `result` has `reason` (`fuora`, `false_claim`, `stock_empty`) with `winner: first_out`.
- `aMonte`: `null` outside a window, else `{stage: "ask"|"vote", proposer, awaiting, redeals}`.
- `partnerHands` appears only with `sides.partners_share_hands`.
- `match` is `null` for a bare hand; a hand made by a match carries `{kind, handIndex, standing: null}`; `match.view(seat)` fills `standing` (section 5) and adds `handCount` and `target`: `{kind, handIndex, standing, handCount, target}`. `handCount` is the number of hands of the match when it is known before play (`single_hand` 1, `fixed_hands` `match.hands`, `running_total` `match.rounds`, `ledger` with `dealer_rounds` that many rounds x seats), else `null` (a race: tied hands are dealt again; a ledger without an end). `target` is the game points a race is played to (`match.target`, 5 when the file does not say), `null` for the other kinds. A table sends `match.view` (since 24 November 2026; before, `hand.view` with `standing: null`). The standing holds only the results of finished hands, which every seat already saw as `view.result`; nothing of the hand in play.

- `tricks[].reason` (added 24 November 2026) — why the winner took the closed trick, one code of a closed list (`TRICK_REASONS` in `core/modules/tricks.js`), read from the trick as the tricks module decides the winner. The suit led is the suit of the first card that is not the Fool as an excuse (when the excuse leads, the card after it sets the suit). The Fool as a trump (`cards.fool: trump`) is an ordinary trump here.
  - `high_suit` — the highest card of the suit led; no trump was played.
  - `high_trump` — trumps were led; the highest trump.
  - `trumped` — a plain suit was led; the winner played the highest trump.
  - `alone` — every other card of the trick was the Fool as an excuse (it never takes a trick): the only other card takes it.
  The code is computed for the view only; the snapshot, the checksum and `result` do not hold it.
- `scoreLines` (added 24 November 2026) — only when the hand is over (`result` set): the ready lines of the score panel, one for every entry of the file's `view.score_panel.after_hand` (default `["groups"]`), in that order. No words: the table names the lines in its own languages.
  `{units: [{id, seats}], totals: {unitId: twelfths}, lines: [{key, rule, by, unit, values, band?}]}`.
  - `units` are the counted units: `seat<q>` for each seat, or `side<s>` when the game pools a side's cards or a contract made the sides (the same ids a table uses). `totals` is `result.points` of each unit.
  - `key` is the entry of `after_hand`; `rule` is the rule path behind the line in the form of `support.missing` (`hand.phases[count].settings.group`; `null` when the game has no such phase); `by` is `unit` (values by unit id) or `seat` (values by seat); `unit` is `twelfths` (of a book point, as `result.points`) or `stake` (as `result.payments[].amount`).
  - The numbers: `groups`/`pairs` the cards won in tricks as the table lists them, before the Fool's exchange and without the stock cards (`breakdown.won`); `groups`, `fool_card`, `discard` and `stock_cards` are the steps of one count of the unit's heap (the cards of the tricks, then the stock, then the exchange for the Fool, then the discard), each the difference of two counts: they add up to the unit's total, in whole halves of a point (in whole points when counted by fours); `odd_card` the part of the odd cards left over the full groups (`count.odd_card`) — a part of the `groups`/`pairs` number, not added to it; it belongs to the heap of the tricks before the Fool's exchange, so it may show a half point where the final heap has none; `fool_card` `breakdown.fool`; `discard` `breakdown.discard`; `stock_cards` `breakdown.stock` (with the card above); `declarations` the net stake of each seat from payments `why: declaration`; `premiums` the net stake from the file's own payments (`settle.payments` ids); `bands` the points of each unit, with `band` = `result.band` (or `null`); `payments` the net stake of each seat of all payments; the `rule` of `payments` and `premiums` is the path of the settle phase of the contract played (`when.contract`), the first settle phase when the file holds one; `running_total` what this hand adds to the running total (`points − match.round_target × 12`).
  - Built from this seat's view (the result, the tricks, the stock cards shown to it) and the rules (`core/score.js`): nothing in it that the seat does not learn at the end of the hand. `result` is not changed: the conformance with the other core and the recorded checksums read it as before.
  Example (two seats, `after_hand: ["pairs", "odd_card", "fool_card", "discard"]`; 558 = 498 + 6 + 54, the odd card 6 is inside 498): `"scoreLines":{"units":[{"id":"seat0","seats":[0]},{"id":"seat1","seats":[1]}],"totals":{"seat0":558,"seat1":192},"lines":[{"key":"pairs","rule":"hand.phases[count].settings.group","by":"unit","unit":"twelfths","values":{"seat0":498,"seat1":198}},{"key":"odd_card","rule":"hand.phases[count].settings.odd_card","by":"unit","unit":"twelfths","values":{"seat0":6,"seat1":6}},{"key":"fool_card","rule":"cards.fool_exchange","by":"unit","unit":"twelfths","values":{"seat0":6,"seat1":-6}},{"key":"discard","rule":"hand.phases[discard].settings.counts_for","by":"unit","unit":"twelfths","values":{"seat0":54,"seat1":0}}]}`. A trick: `{"leader":1,"cards":[{"seat":1,"card":"T16"},{"seat":0,"card":"T4"}],"winner":1,"fool":null,"prize":null,"reason":"high_trump"}`.

### Snapshot (ground truth, never sent to a client)

`{seed, dealer, phase, toAct, cut, packets, hands, discard, rest, stock, won, trick, tricks, foolGive, log, redeals, drawn, state, result}`; `hands`, `discard`, `won` are `{seat: [ids]}`. Invariant after every action: hands, discard, rest, stock, won and the open trick together are the deck, each card exactly once. The exception is the called exchange: while it runs, the cards the declarer laid down lie only in the phase state (`s.m.<phase id>.laid`, and `gave`/`got` after the swap) and are counted there, so a check of the invariant adds them. `checksum()` is FNV-1a 64 (hex, 16 digits) of the canonical JSON (sorted keys) of the snapshot.

### Events (`e` first)

`dealt {round}`, `discarded {seat, n}`, `card_played {seat, card}`, `fool_kept {seat}`, `trick_won {seat, cards}`, `stock_drawn {seat, card}`, `fool_given {from, to, card}`, `a_monte {result: "redeal"|"refused", count?}`, `counted {points}`, `result {outcome, winners}`, `paid {from, to, amount}`, `fuora_claimed {seat, valid, points}`, `round_dealt {index}`, `stock_empty {}`, `pile_revealed {seat, pile, card}`, `fool_shown {seat}`, `cards_kept {seat, cards}` (the one card left without a partner after a shown Fool joins its owner's won cards). Events carry ground truth (a drawn card, a given card): a table turns them into views and does not forward them.

### Result

`{points: {seat: twelfths}, sidePoints: {side: twelfths}, winners: [seat], outcome: "win"|"tie"|"threshold"|"none", gamePoints: {seat: n}, payments: [{from, to, amount, why}], breakdown: {seat: {won, discard, fool, stock}}, worst: [seat], vola?: true}`. `vola: true` stands when a vola decided the hand (absent otherwise). `worst` is the last-placed seat(s), used by `loser_pays_winner` and `loser_deals`. With `sides.pool` side, `points[seat]` is the side's points for every seat of the side (so do not add them up); `sidePoints` counts each side once.

## 4. Points

The core counts in twelfths of a book point, as integers. A group of g cards is worth the sum of its book values less (g-1). In twelfths a card in a full group is `12v - 12(g-1)/g`: g=2: `12v-6`, g=3: `12v-8`, g=4: `12v-9`, g=1: `12v`. All 78 cards in pairs are 1092 twelfths (91 points), in threes 936 (78), in fours 858 (71.5), singly 1560 (130). A half-point is 6 twelfths. Left-over cards (`count.odd_card`): `half_point` each worth as in a full group; `drop` nothing; `as_group` a short group of k cards, the sum less (k-1).

## 5. The match (`core/match.js`)

`match.hand` (the current Hand), `match.next(opts?)` (the next hand once the current is over; throws before and after the end; `opts = {preset?, dealer?}`: the next hand is dealt from `preset` as in `newHand`, and by `dealer` instead of the rotation; a preset the deal refuses throws and leaves the match as it was), `match.isOver()`, `match.standing()`, `match.handCount()`, `match.view(seat)`. The hand seed is `seed + ":" + handIndex`, the first hand is index 0. `firstDealer` absent: `makeRng(seed + ":dealer").int(seats)`. The dealer moves by `seats.dealer_rotation`: `right` (+1), `left` (-1), `alternate` (+1: for two seats this alternates), `loser_deals` (the last-placed seat of the hand; nobody last: +1), `same`.

`standing()` is `{kind, hands: [Result], gamePoints: {seat: n}, totals: {seat: twelfths}, ledger: {seat: amount}, winners: [seat]|null}`; `winners` is `null` until the match is over, `[]` for a draw. Revision 10, only for a game file with `match.payout: match_end`: `standing.payments` is `[{from, to, amount, why}]` (`[]` until the match is over; then the one payment of the match, also added to `ledger`), and `view.match.payments` repeats it; a game that pays per hand has neither field (GAME_FILE_FORMAT section 12).

| kind | over when | winners |
|---|---|---|
| `single_hand` | the hand is over | the hand's winners |
| `fixed_hands` | `match.hands` hands are over | most game points; a tie goes to the card points (`tiebreak: card_points`: higher total, lower when the game's result is `fewest_points`); still tied: `[]` |
| `race` | a seat has `match.target` game points and one side leads alone (level leaders at or above the target play another game), or `max_hands` | most game points (as above); a tied hand is dealt again by the same dealer (`tie_replay`); a partita with no winner (`outcome: none`) scores nothing and the dealer moves by `dealer_rotation`; a hand's game points are `result.gamePoints` (one for the winner of a first_out partita) plus the false-claim points |
| `running_total` | `match.rounds` hands are over | `totals` = the points less `round_target` per round; the seats with the highest total if it is above zero, else `[]`. No payout unless the file says `match.payout: match_end` (revision 10) |
| `ledger` | without `match.dealer_rounds`: never (the table ends it); with it: `dealer_rounds` x seats hands are over (every seat deals once in a round) | `null` while no end; at the end the seats of the side with the greatest balance in `ledger` (the sum of a side's seats); equal greatest balances: `[]`. The marche are settled after every hand as before |

## 6. Modules and what they play

One file per module, `core/modules/<name>.js`, exporting `{name, version, supports, ...}`. A value outside `supports` goes to `checkSupport().missing`. "Any" means any value of the right type; the file's constants kept only so that it lists every rule (`pile_size`, `shut_num`, ...) are accepted and unused.

- **deal**: `hand_size` (number, `by_role`; `by_seats` is resolved at load), `dealer_extra`, `extra_to` dealer, `extra_when` first/last/any, `packets` (list, `dealer_choice`, `one_by_one`), `packets_announced`, `order` from_right/from_left/opponent_first, `pile_count` 0, `pile_size`, `pile_top`, `dead` out/prize/none, `from` deck, `face` down. Not played: `piles`, `half_rest`, `all_rest`, `dead` stock/dealer, `extra_to` declarer. The hands must fit the deck, `dead: none` must leave nothing, a packet list must add up to the hand size. The dealer's extra cards come with the last packet of the dealer (first with `extra_when: first`).
- **a_monte**: `consent` unanimous, `what` redeal, `windows` `deal.packet` (after every packet round, the last included) and `deal` (after the whole deal). It must follow the deal phase.
- **discard**: `who` dealer/each, `count` (number or `by_role`), `count_mode` exact, `discard_honours_barred`, `barred`, `allowed_exceptions` (with `if`: seats, option, hand_has, hand_lacks, hand_count), `counts_for` discarder/dealer/nobody/discarder_unless_no_tricks, `announce`, `face` down. `count` defaults to `deal.dealer_extra`. Honours: `set:honours` when the file defines it, else the cards worth 5 or more. Not played: `count_mode: up_to`, `who: declarer`.
- **tricks**: `first_leader` non_dealer/dealer_right/round_last_taker (a first round on the dealer's right, a later round of the hand with the last taker), previous_last_taker (the last trick's winner of the previous hand, from `carry`; the right of the dealer in a first hand), `next_leader` trick_winner, `follow_suit`, `must_trump`, `must_overtrump`, `fool_may_lead` (true/false), `play_from` hand / pile_tops (with an open_piles phase). In a repeat group `first_leader` is read in every round. Not played: `first_leader: declarer`, `tricks`. `out_leads` free/trumps_then_kings (revision 12: in the last hand of a running-total match the seat whose total is above `match.round_target` leads a trump, else a king; the totals come in `carry.match.totals`, the mark in `carry.match.last`; `view.outLead`).
- **prize_stock** (hook of tricks): `stock` rest, `per_trick` 1, `take` top, `show_to` opponents/all/nobody, `goes_to` won_pile, `fool_trick` trick_winner/fool_owner/nobody. Needs `deal.dead: prize`.
- **count**: `count_unit` half_point, `group` 1-4 (`option:<id>` is resolved at load), `plain_value`, `odd_card` half_point/drop/as_group, `trick_multipliers` false, `last_trick_bonus` 0, `dealer_forfeit` true/false, `fool_card` counted. The Fool's exchange runs when the phase is entered (cards settings below). Not played: `fool_card: deducted`, a last-trick bonus.
- **result**: `winner` more_points/fewest_points/threshold, `target`, `vola` none/sole_winner (revision 11: with `more_points` and `fewest_points`, the side that took every trick wins alone and every other side loses; `result.worst` then holds all the others), `tie` no_game_points/draw, `game_points` one/none/one_or_two_dry, `shut_num`, `shut_den`. `first_out`: the seat with a valid claim (`s.out`) wins; no claim, no winner (`outcome: none`); with `game_points` not `none` the false-claim points of the fuora hook (2 for a marcia or double row, 1 for a simple one) go to each other seat. Not played: `declarer_threshold`, `bands`, `tie: redeal_next_dealer`.
- **settle**: `unit` stake/marca/soldo (labels), `mode` loser_pays_winner/losers_pay_winner/winners_from_losers/pair_split, `amount` (number, `{stake: simple|double|marcia|agreed}`, `{option: id}`, `sum`, `times`), no `premiums`, no `payments`. The payments of false fuora claims come first (`why: false_claim`). Played with `fuora.after_first_out: others_continue` (Sedici for three, «a scaricare»): `mode: a_scaricare` (the last to go out pays the first two stakes, the second nothing; with no second both pay one). Not played: `declarer_vs_each`, `per_points`, `table`, `contract` amounts.
- Sections: `seats` (count, direction right, first_dealer any of the five, cut_by, cut_min, dealer_rotation right/left/alternate/loser_deals/same, seating free/partners_opposite/partners_adjacent), `sides` (each_for_self, fixed_pairs; pool seat/side; partners_share_hands), `cards` (deck full78; trump_order torino_1787/printed/list; suit_order italian/straight; card_points presets or a table; sets; fool excuse; fool_exchange; fool_exchange_card cheapest/owner_choice; fool_exchange_to opponent_side/trick_winner; fool_no_tricks give_none/give_fool; fool_last_trick kept), `match` (the five kinds above). `cards.fool: trump` is played when `trump_order` is an explicit list that holds `T0` (the Fool is then the lowest trionfo, counts its card points, no exchange happens); the meno variants `four_cards` and `eight_cards` stay not runnable until their file lists `T0`. `dealer_rotation: winner_passes_to_companion` is played (the seat to the right of the winner; no winner: the right of the last dealer). Penalties with `enforce: apply` and live points other than `hidden` and `own` are listed as missing. `deal.dead: stock` is played only inside a repeat group; `tricks.play_from: pile_tops` and `cards.fool_show_any_time: true` only with an open_piles phase.

- **repeat** (a group, not a plan entry): `until` fuora / stock_empty / fuora_or_stock_empty. The loader flattens the nested phases into the plan with `group = {id, until, first, last}`. When the last inner phase is done and the group is not done, the engine returns to the first inner phase: `s.round++` (it starts at 0), `s.trick = []`, the inner modules' `s.m` entries are deleted, `enter()` runs again, event `round_dealt {index}`. The group is done when fewer cards are left in `s.rest` than one deal takes (`s.stockEmpty`, event `stock_empty`). A hook's `endHand` leaves the group at once. The cards won in the rounds before stay won.
- **fuora** (hook of tricks): `target`, `claim_when` after_trick/own_turn, `false_claim` rows (below/from, pays stake simple/marcia/double, to each_other), `after_false_claim` play_on/hand_ends (hand_ends: the claimer loses the hand, every other side wins, and the row is paid as the price of it), `at_round_end` deal_on/must_claim (actions `claim_fuora` and `pass_fuora`; the last window at the end of the pack; with `claim_when: after_trick` and `deal_on` a packet end stays open for the taker of its last trick, who is asked before the next deal), `winner_is` claimer/first_reached (with `hand_ends` a false claim that ends the hand leaves the win to the first seat to reach the target, `reason: fuora`; the claimer pays the row), `after_first_out` hand_ends/others_continue, `stock_empty` hand_ends_no_winner/others_pay_first. State `s.m.fuora = {claimant, claims: [{seat, valid, points, stake, ends?}], ended, first, at, reached}`, `s.out = {seat, points}` after a valid claim (the first to go out). With others_continue (three seats, Sedici «a scaricare») the hand goes on: `s.outs = [{seat, points}]` lists those who went out in order, the cards of a seat that went out lie face down in its `s.discard` (no view shows them: its `view.discard.mine` is empty), `view.fuora.out = [{seat, points}]`, a trick has one card from each seat that plays and the packets go to those seats (`hand.playing()`, `hand.nextPlaying(seat)`); the second claim ends the hand and `result.order = [first, second, last]`, `result.worst = [last]`. `result.winner: first_out` reads it; `settle` pays the false claims.
- **Hook functions** (all optional; `h.game.hooks.tricks` lists the hook entries): `onEnter(h, entry)`, `onPlay(h, entry, seat, card) -> events` (called by tricks.apply after the card left the seat, before the trick is judged), `afterTrick(h, entry, rec, index) -> events`, `playable(h, entry, seat) -> cards | null` (the cards the seat chooses from; tricks.legal applies follow-suit and trump duties to this list), `visibleHand(h, entry, seat) -> cards | null`, `extraLegal(h, entry, seat) -> actions`, `extraToAct(h, entry) -> seats`, `hold(h, entry) -> bool` (the host phase stays open although it is done), `applyExtra(h, entry, seat, action) -> {events, endHand?}`, `viewOf(h, entry, seat) -> object` (put into `view[entry.module]`). `Hand.legal(seat)` = host legal plus every hook's `extraLegal`; `Hand.apply` routes an action a hook offered to its `applyExtra`.

## 7. Engine defaults not written in the game files

Each is a candidate key for the next rules revision. The first five are the contract's.

1. The Fool led: the next card played sets the led suit; the Fool's owner never wins that trick.
2. The Fool (`cards.fool: excuse`) is never taken: its owner takes it back into the won cards of the owner, in the last trick too.
3. `fool_exchange_card: cheapest`: the won card with the fewest points, then the earliest in the canonical order; an owner with no other won card gives nothing (`give_none`).
4. A Fool drawn from a prize stock is counted like any card; nothing is given for it.
5. If every card left in the discarder's hand is barred, all of them become discardable.
6. `first_leader: non_dealer` at more than two seats is the right of the dealer.
7. `fool_exchange_to: opponent_side` is the first seat to the owner's right who is on another side. The card is taken from the won cards of the owner's whole side (pool), the owner chooses among the plain ones (value 1 or less), or among the cheapest when the owner has none. With a side that counts one heap there is no exchange when the receiver stands on the owner's own side.
8. `odd_card: drop`: the cheapest cards are dropped (as many as the odd ones), whatever the order they were won in; the rest are counted in full groups.
   A game whose hands are unequal when the tricks start (from deal and discard phases alone) is refused by `checkSupport` (`runnable: false`).
9. `loser_pays_winner` at more than two sides: only the last-placed side pays (each seat of it, each winner); `losers_pay_winner` and `winners_from_losers`: every non-winner pays every winner. `pair_split`: each winner collects from the first not yet used losing seat to the right of the winner.
10. `{stake: simple}` is the option `stake` when the file has one, else 1; `double` and `marcia` twice that; `agreed` is the option.
11. Results: equal best points: outcome `tie`, no winner, no payment; a threshold nobody reaches: outcome `none`; a threshold several reach: all of them win. Game points: 1 per winning seat (2 for a dry hand with `one_or_two_dry`: loser times `shut_den` at most winner times `shut_num`).
12. The a monte windows ask the seats in turn from the right of the dealer; the vote goes to all the others at once; after a refusal or a full round of passes the next packet round is dealt and the next window opens.
13. `show_to: opponents` shows a drawn prize card to the drawer and the seats of the other sides.
14. `dealer_forfeit` (when the file gives it, and there is one discard) overrides `discard.counts_for`: true is `discarder_unless_no_tricks` (a dealer who won no trick gives the discard to the winner of the last trick), false is `discarder`.
15. `race` with `tie_replay`: a tied hand is dealt again by the same dealer; `running_total` ends after `rounds` hands.
16. The cut: `cut_min + int(78 - 2*cut_min + 1)` cards go from the top to the bottom; no cut with `cut_by: none`. A packet list is recorded in the snapshot; for `dealer_choice` and `one_by_one` the deal is one round.

## 7a. Later changes

- Pair matches (`fixed_hands`, `race`): the sides compete, not the seats. `winners` are all seats of the winning side; a draw (`[]`) only when several sides are still level after the `card_points` tie-break.
- `preset`: a seat with fewer cards than the deal gives is refused (`newHand` throws "fewer cards"), as is a seat with more.
- `hashOf` and `fnv1a64`: FNV-1a 64 over the UTF-8 bytes of the text (a seed with non-ASCII letters hashes the same in any language).
- `Support.alts` lists every leaf of the merged file that carries an alt; a leaf in a phase of a module the core lacks, or in a nested phase, has `supported: false`.
- `checkSupport` also reads `view.piles.discard` (only `owner_only`) and `view.last_trick` (only `until_next_lead`: closed tricks are always public history here). `view.partners_hands` is not checked: what partners see follows `sides.partners_share_hands`.
- `hand.view(seat)` with a seat outside 0 ... n-1 throws a `RangeError`; a caller checks seats before.
- `snapshot().packets` for `dealer_choice` and `one_by_one` is the list of the rounds as dealt (the cards of the seat on the dealer's right in each round); the cards come in one round, so the list has one item.
- Decided in rules revision 2, `discard` 1.1.0: the conditions of `allowed_exceptions` are judged on the hand as dealt to this discard. The cards the seat has already put away in this phase still count as held, so putting another trump (or, where the Fool may go, the Fool) away first does not free the Bagatto.

## 8. Tests: `npm test`

`npm test` runs every test (`node --test "test/**/*.test.js" "test/**/*.test.mjs"`). The core tests are in `test/core/`: 2000 random hands of each of venticinque (2), morto (2), venticinque_3 (3), partita_3 (3), partita_4 (4) and meno (2, 4, 5, 7) with the cards checked after every action; replay checksums; refused actions; view secrecy; the 1092 and 936 twelfths; legal play on prepared deals; the Fool's settings; the deal arithmetic; a monte; support, alts, options, variants; match kinds; the random robot.

## 9. Contracts, sides in the hand, throw-in

- **Sides live in the hand.** `Hand.sides()` returns `s.sides` (set by a contract) or the fixed map `game.sides`. Every read of the sides in the core goes through it (count, result, settle, view). `s.sides = {mode, of: [side per seat], pool}`. `Hand.setContract(id, declarer)` sets `s.contract`, `s.declarer` and `s.sides` by the contract's `sides` (`declarer_vs_rest`: the declarer is side 0, the others side 1; `called_partner`: the same, and the holder of the called card joins by `Hand.setPartner(seat)`; `each_for_self`). `sides.mode: by_contract` is played only with a `bidding` phase. The match (`core/match.js`) keeps the static map.
- **State** (plain JSON; in `snapshot()` only when not empty): `s.contract`, `s.declarer`, `s.sides`, `s.secret` (`{card, holder}`: a called partner not yet revealed), `s.allPassed`.
- **Conditions by contract.** A phase with `when: {contract: [...]}` or `when: {all_passed: true}` stays in the plan with `entry.when`; `Hand.runs(entry)` judges it at run time and `advance` skips an entry that does not run. The load-time conditions (`seats`, `option`) are unchanged. The state of the new modules is kept by phase id (`s.m[entry.id]`).
- **Throw-in.** `Hand.throwIn(reason)` ends the hand at once: `result = {outcome: "thrown_in", winners: [], reason, payments: [], gamePoints: all 0, points: {}, sidePoints: {}, breakdown: {}, worst: []}`, event `thrown_in {reason}`. The match counts it as a dealt hand (`dealer_rounds`), the next dealer follows `seats.dealer_rotation`, nobody pays; never the `tie_replay` branch. A result tie with `tie: redeal_next_dealer` has `outcome: "draw"` and is counted the same way.
- **Listeners.** After every card played in `tricks` the engine calls `onCardPlayed(h, entry, seat, card)` of every running plan module that exports it (`call_partner`: `partner_revealed`).
- **View parts.** A plan module may export `viewPart(h, entry, seat)` (an object merged into the seat view: `bidding`, `exchange`, `call`, `declarations`) and `contractView(h, entry)` (`{laid, called}`, merged into `view.contract`).
- **Seat view, new parts.** `view.contract = {id, declarer, laid, called}` (null before a contract; present in games with a bidding phase); `view.bidding = {order, bids: [{seat, bid}], best: {seat, contract} or null, done}`; `view.sides.of[seat]` is null where the seat does not know (a secret partner: the holder sees all; the declarer and the defenders see the declarer, themselves and nobody else); `view.result` adds `contract`, `declarer` and `band {outcome, pays}`, and its payments carry `why`.
- **Actions** are `{type, card?}`: `bid_<contract id>`, `pass`; `lay_down`, `lay_done`, `call`; `call_partner`; `declare_<kind id>`, `declare_done`. Events: `bid`, `contract_won`, `all_passed`, `thrown_in`, `laid`, `called`, `exchanged`, `partner_called`, `partner_revealed`, `declared`, `paid {from, to, amount, why}`.
- **Bidding** (`core/modules/bidding.js`): the order of speech is the order of priority; an earlier seat may match the standing bid of a later seat (`tie: earlier_seat`; `challenger`: any seat may match; `dealer`: the dealer may), a later seat must bid higher; a pass is final; the auction ends when every seat but the last bidder has passed. All pass: `all_pass` redeal or redeal_next_dealer (throw-in) or `contract:<id>` (that contract, the dealer declares). `after_dealer_pass: call` (the dealer speaks first): the dealer's pass ends the auction and the dealer declares the fallback contract. `overbid_returns: true` (revision 11, the second reading of «subito»): after a raise the word goes back at once to the seat that was overbid. A game agreed beforehand (one contract that is also the `all_pass` fallback) has no auction: the contract is set on entering the phase.
- **Result** `declarer_threshold`: the points of the declarer's side against `bands` (the first row that holds them): `win` (the declarer's side wins), `loss` (the other sides win), `draw` (outcome `draw`); `result.band = {outcome, pays}`. Without `bands`: `target` decides. `threshold` with `tie: declarer_loses`: equal points (nobody reaches the target) are won by the other sides.
- **Settle** `declarer_vs_each`: the declarer collects from each opponent or pays each; `pair_split` with unequal sides (one against three) plays the same way. Amounts `{contract: "onoranza"}` and `{per_points: {...}}` and their `sum`; `band.pays`: `full`, `onoranza_only` (per_points left out), `nothing`. Rows are written apart: `why` is `onoranza`, `points`, the mode, or the id of a `settle.payments` row; the payments of events come first (`handPayments`).
