# The bot

One bot for every game the core plays: Perfect-Information Monte Carlo (PIMC). It reads the rules from the `Game` (settings by module and key), never a game id. `bots/` is pure (`npm run check:pure`): no files, no clock, no `Math.random`.

## API

```js
import { BOT_ID, parseLevel, chooseAction } from './bots/index.js';
chooseAction({ game, view, level, seed })  // -> { action, eval: [{action, value}], stats: {worlds, plays, candidates} }
```

- `game`: `core.loadGame(...)` with the table's options. `view`: `hand.view(seat)`, the view of one seat. `level`: from `parseLevel(json)`. `seed`: a string (to a bot of a solver, see below, an opaque one).
- The answer is one of `view.legal`. The same `(game, view, level, seed)` gives the same answer on every machine: the clock of the bot is a count of applied actions (`budget_plays`), never milliseconds.
- `{"id": "random"}` is the random level: `bots/random.js` seeded with `seed`; `eval` is empty.
- `eval` lists at most 8 actions, best first, values rounded to 3 decimals (mean world score).

## How it thinks

1. A view with one legal action is answered at once. Non-card actions go to `bots/policy.js` (below), without sampling.
2. `noise`: with this chance the answer is a uniform random legal action.
3. `bots/worlds.js` builds up to `worlds` complete deals consistent with the view:
   - known cards: own hand, own discard, every played card (`view.tricks`, `view.trick`), the shown stock cards, the partner's hand when the view shows it;
   - unknown cards are put, one at a time, most constrained first, into slots: the hand of each other seat (its size from `handCounts`), its discard (`discard.counts`), and one sink for stock and rest;
   - voids are inferred from the rules of the game file: a seat that did not follow the led suit (`follow_suit`) is void in it; one that did not trump (`must_trump`) is void in trumps; the Fool never counts as a follow. Each void is left out of the sampling with chance `forget` in tries 0-3 (a world that breaks a void is refused by the rebuild, so `forget` only costs worlds; later tries keep every void);
   - a card the discard rules would bar is unlikely in a discard slot (a hint; the rebuild decides);
   - which tricks drew a stock card is inferred from the shown draws and the `fool_trick` setting.
4. Each world is rebuilt as a core `Hand` with `newHand(game, {preset})`, then the public history is applied: the deal-throwing windows (all pass), the discards, the plays. The rebuilt `view(seat)` must equal the real one in hand, legal list, tricks, open trick and own discard; otherwise the world is dropped. The first leader comes from the view (`carry.lastTaker`); before the play of a later hand of a match it is sampled.
5. For each legal action: clone the world, apply the action, play the hand to the end (`rollout.js`), score it. The same worlds judge every action. World score = `win_weight * sign(result)` + margin in book points (own side's points less the best other side's; reversed when the fewest points win). Sign comes from `result.winners`.
6. `halving`: after 3, 6, 12, ... worlds the worse half of the actions is dropped (never below two actions). Sampling stops at `worlds`, or when `budget_plays` is spent (a sweep is always finished, and at least 2 worlds are used).
7. The best mean wins; ties go to the card with the fewest points, then canonical order. `temperature > 0` picks by softmax over the means (book points).
8. If no world can be built (the view does not add up, or the voids cannot be met in any of the tries) the bot plays the greedy policy.

Rollouts: `random` plays uniform legal trick cards; `greedy` plays a cheap rule (follow with the cheapest card that does not waste points; win with the cheapest winning card when the trick holds honours and not with a trump for plain cards; with fewest-points games dump points on tricks others win; never lead the Fool; do not overtake a partner). Discards and the Fool's card are always chosen by the greedy rule inside rollouts. Rollouts read the sampled hand's internals (`hand.s`) only: that is the bot's own simulation, never hidden state of the real table.

## Policies (`bots/policy.js`)

- Deal-throwing (`a_monte_*`): judged on the cards dealt so far. «Poor» = points above the plain value minus the deck mean per card, plus half a point per trump from 15 up, below -2. Asked: propose when poor, else pass. Voting: agree when poor, else refuse.
- The Fool's card (`fool_give`): the fewest points, then canonical order.
- Discard in rollouts: when the discard counts for the discarder, the dearest card; otherwise the cheapest; ties: shortest suit, weakest.

## Level file (`bots/levels/<id>.json`, format 1)

| key | meaning |
|---|---|
| `format` | 1 |
| `id`, `name {ru, en}` | id: letters, digits, `_`; shown names |
| `worlds` | most worlds sampled per decision (1..1000) |
| `budget_plays` | most actions applied in rollouts per decision |
| `halving` | drop the worse half of the actions after 3, 6, 12, ... worlds |
| `rollout` | `random` or `greedy` |
| `noise` | 0..1, chance of a uniform random legal card |
| `temperature` | 0 = take the best; else softmax over means |
| `forget` | 0..1, chance to ignore each inferred void in a world |
| `win_weight` | weight of the win/lose sign against the margin in points |
| `pace_ms` | for a table: least time before the move is shown; the bot lab ignores it |
| `bid_margin` | optional, 0..1000, default 0: how much a bid's mean world score must beat the pass's (book points) |
| `slip` | optional, 0..1, default 0.3 (`SLIP`): chance that a `greedy` rollout player plays a random legal card in the card search (not in the bid search) |

`parseLevel` throws on an unknown or a missing key, or a bad value (`bid_margin` and `slip` may be left out). Final values:

| level | worlds | budget_plays | halving | rollout | noise | forget | win_weight | pace_ms |
|---|---|---|---|---|---|---|---|---|
| easy | 2 | 3000 | no | random | 0 | 1 | 5 | 700 |
| normal | 200 | 60000 | yes | greedy | 0.02 | 0 | 5 | 700 |
| strong | 600 | 220000 | yes | greedy | 0 | 0 | 5 | 700 |

`easy` has `temperature` 6 (the others 0). `easy` is weak by design, not by random cards: two worlds, every inferred void forgotten, random rollouts, a softmax pick among cards of near value. It never plays a uniform random card.

A `greedy` rollout player slips to a random legal card with chance 0.3 (`SLIP` in rollout.js, or the level's `slip`): a pure greedy model of the others was weaker at three seats. `temperature` is measured in book points of margin (no `win_weight`).

### A level from a file

A level is a JSON file of the format above. [`examples/my-level.json`](../examples/my-level.json) is one: the level `normal` with `bid_margin` 40. To measure a level, give its path to the bot lab:

```
node tools/botlab.mjs --games sedici_2:2 --a-level examples/my-level.json --b normal --deals 20 --seed tune
```

`--a-level` sets the level of the seat `a`; `--b-level` sets the level of the other seats. The bot lab reads the file with `parseLevel`, so a file with an unknown key or a bad value is refused with a message that names the key. The label of the row is the file name without `.json`. `--a-level` and `--b-level` do not go with `--alts`.

## A bot of your own

You can replace the bot at the seat `a` with a module of your own. It exports one function:

```js
export function chooseAction({ game, view, level, seed }) {
	return { action: view.legal[0] };
}
```

- **What arrives.** `game`: the `Game` (the rules, no state of the hand). `view`: the view of your seat, as `hand.view(seat)` gives it, a copy of it. `level`: the parsed level of the seat `a`, from `--a-level`, else from `--a`, else `normal`. `seed`: an opaque string, the same for the same decision; use it for your own random numbers; it does not tell the deal. (The lab gives it as the first 32 hex digits of a sha256 of its own seed of the decision; a bot of this repository, a level, gets the seed of the decision itself.) Nothing else arrives: no snapshot, no hands of other seats.
- **What to answer.** An object `{action}` where `action` is one of the entries of `view.legal`. More keys (`eval`, `stats`) are allowed and ignored. The answer is given at once: a promise is an error.
- **What happens at a wrong answer.** The run stops with one line, such as `solver bot, sedici_2:2, hand 3 (seed tune), seat 0, decision 12: the action {...} is not in view.legal`, and exit code 1. The same happens when the module throws, answers without `{action}`, cannot be loaded or has no `chooseAction`. The lab never plays another move in its place.
- **Rules of the road.** Use no clock and no `Math.random`, so that the same input gives the same answer. Do not import `core/` to look into the hand: the lab can guard what it hands you, not what you import. Do not name a game in your code; the game is an argument.
- **Which seats.** Your bot plays every seat of the side `a` (both seats of a pair in the games of pairs). The row is labelled `bot:<file name>`. `--a-bot` does not go with `--alts` or `--alone`.

[`examples/my-bot.mjs`](../examples/my-bot.mjs) is a complete bot of 17 lines: it calls the bot of this repository and passes when it is asked to bid with fewer than eight trumps. To measure it:

```
node tools/botlab.mjs --games permesso_3:3 --a-bot examples/my-bot.mjs --b normal --deals 20 --seed tune
```

`node tools/play.mjs <game> --seats N --bots bot:examples/my-bot.mjs,normal,normal` plays a single hand with it, and prints every move.

## Rounds, a stock and piles

Two structures of the third round of games are sampled by `bots/worlds_ext.js`; the choice comes from the view: `view.round` (a repeat group) or `view.open_piles` (piles). No game is named.

**A repeat group** (deals again and again from one stock until a seat goes out). The view shows `view.round = {index, stock}`, every trick of the whole partita, the own hand and the other hand sizes. The bot knows every card of the earlier rounds (each was played out) and its own hand. It samples the other seats' hands of the current round, with the voids of THIS round only (a new deal gives new hands), and the order of the stock tail (the next rounds' deals). The history is replayed through the core: round 0 as `preset.hands`, rounds 1.. as the first cards of `preset.rest` in the dealing order, then the sampled tail. The rebuilt view must equal the real one (hand, legal list without `claim_fuora`, tricks, open trick, round index and stock size). A claim made earlier by someone (a false one) is not replayed: a false claim changes payments, not the play.

**Piles** (only the open tops are played; every covered card is hidden, the own ones too). The view shows `view.open_piles = {piles: {seat: [{size, top}]}, shown}`. Covered cards are free: they never lay open in the past, so a world places the unknown cards into them at random. What is sampled with care is the PILE each played or shown card came from (`preset.piles` needs the whole pile). A card taken from a pile turns the next one up after its trick (a shown Fool: at once), and a seat that did not follow the led suit had no card of it (and, when it had to trump, no trump) among its open tops. The sampler walks the plays in time order and gives each one a pile (depth first, a budget of 4000 steps), so that no card lay open when it could not have: the exact rule of the core, checked while sampling. The time of a shown Fool is not in the view: it is put before a random turn of its owner. The rebuild compares hand (the open tops), legal list, tricks, open trick and `open_piles` with the real view.

**The Fool as a trump** (`cards.fool` "trump"). It is an ordinary trionfo, the lowest: it counts for void inference (a seat that played it to a plain suit is void in the suit, but it did not show a lack of trumps), and in the greedy rollout it has the strength of `T0` in the trump order. Every special case of the excuse (never lead it, it takes nothing, it is excluded from voids) is only for `cards.fool` "excuse".

### Policies for the non-card actions

- `claim_fuora`: claim exactly when `view.points.mine >= view.fuora.target`; never a false claim. When `view.points` is missing the bot counts the cards it won (tricks it took, the excuse Fool back to its owner, the cards it showed) by the count settings of the game. If the claim is the only action offered (a window that stands only for a right claim) it is answered at once. In rollouts every seat claims as soon as it is out.
- Revision 11, «fuora» is said by the player: nobody says it for him. In his own turn the bot claims as soon as it has the target; in the last window (the pack is spent) it takes `claim_fuora` with the target and `pass_fuora` without it. Under the rule «the first to reach the target wins» it behaves the same.
- A card that wins the game now (`winNowAction`, before any other choice and before the noise of a level): the seat plays the last card of a trick, the card takes the trick, and the cards it then holds make the target; the claim follows at once. Only the view is used. Under «the first to reach wins» the card is named only when no other seat has the target.
- `show_fool`: shown at once when offered: it cannot be lost by showing it, and the next card of its pile turns early. No level key; it is the policy.

### Scoring a world of such a game

`win_weight * sign + margin`, as before. The sign comes from `result.winners` (`first_out`: the seat that went out, or nobody when the pack ran out: 0). The margin is the own side's points less the best other side's, in book points of the partita so far: from `result.sidePoints` when the result has them, else counted from the cards each seat won (and showed).

### What the bot does not do

No false claim, ever (it does not bluff: the claim costs the false-claim payment). It does not choose the way of dealing (the core deals all packets at once). It does not model when an opponent shows a Fool: it is placed at random.

## Contracts, an exchange, a called partner, declarations

Revision 11: a bid equal to the standing one (Permesso, an earlier seat answers «a due anch'io») is judged like every other bid of the legal list, in the search and in the cheap policy; the judge offers it only where the rules allow it. The book points of a hand with contracts are counted by the count phase of the contract played (the free game of the six and seven seat games is counted by one, two or three cards as agreed; the four contracts of Permesso in pairs), and `core/score.js` writes the score lines of the table by the same phase.

The same bot plays the ten games with contracts. No game is named; the code reads `game.contracts`, the plan modules (`bidding`, `exchange`, `call_partner`, `declarations`) and the view (`view.contract`, `view.bidding`, `view.exchange`, `view.call`, `view.sides`, `view.declarations`). The level files did not change.

**The bid** (`bots/bid.js`). A view of the bidding phase whose legal list holds a bid and `pass` is judged by sampling, like a card:
- worlds: the hidden hands as dealt, consistent with the view (own hand, own discard, the other hand sizes and discard counts: `prepare` and `place` of `worlds.js`); the deal is rebuilt in the core and the public history replayed (a_monte passes, the discards, the bids so far); the rebuilt view must equal the real one in hand, legal, discard and bidding;
- every legal bid and the pass are applied and the hand is played to the end by the rollout: the later bids of every seat, the exchange, the calls and the play by the policies below and the greedy rollout; the world score is `win_weight * sign + money`, as for a card;
- the same worlds judge every action; `halving` drops the worse half of the bids, never the pass; `worlds` and `budget_plays` are the level's;
- the best mean wins, but a bid has to beat the pass's mean by `bid_margin` (default 0); no `noise` at a bid;
- no world built: the cheap bid policy below.

Why: the cheap policy alone passed almost always (bots alone threw in 82 to 96 % of the hands at three to seven seats). Its bar sat where the hand would win as declarer nine times in ten, and the cards the declarer calls in the exchange counted for almost nothing.

**Policies** (`bots/policy.js`, no sampling, no new level key). A view whose legal list holds `pass` (when sampling is not possible), `lay_down`, `lay_done`, `call`, `call_partner` or a `declare_*` action is answered at once:
- `bid` (the cheap policy: inside rollouts for every seat, and the fallback): the hand is worth trumps above the tenth (the highest, from XVI, twice), kings, queens, a little for low trumps. The ratio to an average hand, plus a little for each card the exchange can still change, must reach a bar (`TUNE` in policy.js: 1.7 at three seats, +0.22 for each seat more; set by short labs of the declarer's money). It bids the highest legal contract that passes the bar, else passes. It never bids with fewer than three trumps above the tenth, judges an equal bid with the other bids and the pass when the judge offers it (revision 11: only an earlier seat may match the standing bid, a later seat is never offered one, so an auction always ends) and never bids an illegal contract.
- `lay_down`: plain suits first, the fewest points, the shortest suit; never `lay_done` while a card can be laid.
- `call`: the strongest card it lacks: high trumps, then kings of its long suits, then queens. The rank of a trump is taken from the game's trump order, so the Angel is called before the World where the game puts it above.
- `call_partner`: a card of the highest rank offered (the ladder), in the suit where it is longest and holds a high card; never a card of its own hand while another can be called.
- declarations: everything offered, one at a time, then `declare_done`.
The same policies drive every seat inside rollouts (bids from the real standing bid of the sampled hand). So a bot that judges a bid by sampling models the others' later bids with the cheap, timid policy.

**Worlds** (`bots/worlds_contract.js`, for a card to play in such a game). The hidden hands are sampled as they stand after the exchange: the called cards (public) lie with the declarer; exposed cards of declarations lie with their seat; when the seat is the declarer, the cards it laid lie with the other seats (voids kept); the cards a defender never saw laid are simply unknown cards. A secret partner is not named: the holder of the called card is whoever the sample gives it to (never contradicting the plays; the seat itself knows if it holds the card). The discards of the other seats are unknown. The history is replayed in the core on a deal where no called card lies with the declarer (bids, laid count, calls, the partner call, declarations); the hands, discards and rest are then set to the sample just before the first phase after the exchange is entered (the bot reads and sets `hand.s` of its own simulation only). The rebuilt view must equal the real one in hand, legal, tricks, trick, discard, contract and sides.

**Scoring.** Rollouts use `hand.sides()` (sides live in the hand). For games with contracts the world score is `win_weight * sign + money`: payments received less paid by the seat, in units of the Onoranza, times five book points. Other games as before.

**Not done.** A discard decision of Mitigati for two (two deals) is not sampled: the greedy discard is played. The bot never matches a bid, never stops laying early, never calls its own card on purpose, never bluffs. The exchange given to a holder by seed is not modelled (the laid cards are placed at random among the holders). The cheap bid bar was set by short labs against easy level; it now decides only inside rollouts and as the fallback.

## What the bot never sees

Only `view`. Never a snapshot, the log, or another seat's hand (a partner's hand only when the view carries `partnerHands`). The test `view only` builds two deals that give the same view and demands the same answer.

## Determinism

World `i` is sampled from `makeRng(seed:w<i>:<try>)`, a rollout from `makeRng(seed:r<i>:<action>)`, noise and temperature have their own streams. There is no clock: the budget is a count. Two calls with the same arguments, or one with a view taken from `hand.clone()`, give the same answer.

## Known limitations

**A world scores a win and the margin together (`bots/rollout.js`, `scoreOf`: `win_weight * winSign + marginOf`).** The mixture can prefer a risk with a large margin in book points to a sure win; with `win_weight` 5 in `normal` the margin of a few points is worth about as much as a win. The outside report (`studiolo-solutions-2026-11-26`, section 2) names this as a candidate cause of the missed immediate wins in Sedici and Trent'uno, without proving that it is the cause. The formula is not changed. The two missed wins are now caught by a tactical check before the search (`winNowAction`); whether the mixture costs anything elsewhere has not been measured. There is no measurement yet, so nothing here says the mixture is wrong: a measurement is to be made (the same bot with the score of the win alone, against the present one, on the same deals) and this paragraph is to be changed after it.

## What the bot lab measures

`node tools/botlab.mjs --alone --a normal --games <id:seats,...>`: every seat plays level a. The line gives, for the whole table, the share of hands thrown in, the share with a declarer, the share of declared hands the declarer won (Wilson 95 % interval) and its money per declared hand (95 % interval, in the coins of the game). `--targets id:seats=alone` checks a bar of our own: at most 30 % thrown in, and the declarer wins 45 % to 75 % of the declared hands.

Strength between levels and against the random robot, time per decision per (game, seats), the share of worlds that could not be built, and calibration of `win_weight`, `forget` and `temperature`. Known so far: greedy rollouts with a 0.3 slip beat random rollouts at every table size; `strong` is not clearly stronger than `normal` (more worlds add little).

### Cyclic mode: every deal from every seat

By default the lab seats level `a` at one seat per deal and turns the seat from deal to deal. The luck of a deal then sits in the number of every game, and 100 to 200 deals cannot tell a share of 0.56 from 0.50. `--mode cyclic` removes most of that luck:

```
node tools/botlab.mjs --games permesso_3:3 --a <level> --b normal --mode cyclic --budget-games 300 --seed tune
node tools/botlab.mjs --games sedici_2:2 --a <level> --b normal --mode cyclic --deals 200 --seed tune
```

- **What is played.** Each deal is played once for every seat of level `a` (twice at two seats; in the games of pairs once for each pair), the other seats play level `b`. The cards and the dealer are the same in every turn; only the seat of `a` changes.
- **The unit is the deal.** The observation is the mean of `a` over the turns of one deal (its share of wins, its money). The interval is Student's interval for paired data over the deals, `mean ± t · s / √D`, with D the number of deals. The games of one deal are not independent, so they are never counted as independent games. A deal with a failed game is left out whole.
- **Budget.** `--deals D` is the number of deals, each played as many times as there are turns. `--budget-games N` is the number of games to play in all: D = N divided by the turns, rounded down. Give one of them. With several games in `--games` the budget is taken for each game.
- **`--safe-t`.** For a share the lab prints a second interval next to the plain one, `safe-t`: its error is `√(SS + 0.25) / D`, with SS the sum of squares of the deal means about their mean, cut to 0..1. It is wider, and it does not shrink to a point when every deal comes out 1:1. `--safe-t` makes it the interval of the row, the verdicts and the file. The money has no such variant.
- **Seeds.** The deal is the same in every turn. The random choices of a decision take the role of the seat (`A` or `B`), the seat and the turn into their seed, so `normal` against `normal` plays different games in the turns and the interval is not falsely narrow. The rival does not share random numbers with `a`. The seeds of the default mode are unchanged: its numbers stay as they were.
- **The report.** The line and the JSON row carry `mode`, the deals, the games, the share (or the money) with its interval and half width, the safe-t interval, and for comparison the interval the default mode gives on the same games (`old`, where the games count as independent). `ms` stays empty.
- **Not with** `--alts`, `--alone`, `--timing`.

What it promises. The mean over the seats is unbiased: it is the same quantity the default mode measures. Luck of the cards and the advantage of a seat cancel in the mean fully only when `a` and `b` are the same level, and only on average; when they differ, how much `a` gains on one deal and how much on another still varies, and that part stays in the interval. So the interval is narrower than the default one by a factor you read off the row (`half` against `old ... half`), not by a fixed one. The level itself is noisy: two runs of `normal` on the same cards may bid or lay off differently, and that noise remains; it is smaller than the luck of the cards but it is not zero. In `permesso_3`, `normal` against `normal` on 198 games (66 deals, seed `tune`, 28 November 2026) gave an interval of ±0.67 coins per deal, where the default mode gives ±0.91 on the same games; do not expect to see a difference of 0.3 coins with that. On the share of wins at two seats, `strong` against `normal`, the interval was 2.1 times narrower than the default one at Sedici (400 games) and 1.6 times at Morto (200 games).

What it does not promise. The coverage of the interval has not been checked for the games with money, where payments come in steps and have long tails and few deals; a small number of deals (under 30) makes the Student interval doubtful. Games of pairs and games with a secret partner have not been checked in this mode. It is not a test of play alone: the bids are played by `a` too.

When to use it. To tell two levels or two bots apart by a small difference; to check that a level is not stronger than itself (`normal` against `normal` must give an interval around the fair value); for a verdict with `--targets`. Use the default mode for the bar against random robots, where the gap is large, and when you need `--alts`, `--alone` or `--timing`.
