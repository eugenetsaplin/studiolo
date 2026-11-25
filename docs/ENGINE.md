# The engine in ten minutes

The engine plays the card games of the Turin rulebook of 1787 by the rule files of this repository. It is plain JavaScript. It has no dependencies. This page tells you how to run it, how a hand goes through it, and what a bot may see.

## What you need

- Node 24 (`node --version`). Nothing else: there is no `npm install` step.
- `npm test` runs the tests of the core, the bots and the tools. `npm run check:pure` runs in a few seconds and checks that `core/` and `bots/` use no files, no clock and no `Math.random`, and name no game.

## How the core reads a game file

A game is a JSON file in `rulesets/` ([format](GAME_FILE_FORMAT.md)). Every rule in it is a setting with a value, a source and a mark: [D] documented, [R] our reading, [S] sources silent. Some settings carry an `alt`: the other reading, with its reason.

```js
import fs from 'node:fs';
import { loadGame, newHand } from './core/index.js';

const getFile = (id) => JSON.parse(fs.readFileSync(`rulesets/${id}.json`, 'utf8'));
const game = loadGame('sedici_2', getFile, { seats: 2 });
```

`loadGame(id, getFile, opts)` merges the files that the game extends, applies a variant (`opts.variant`), the number of seats, the options and any `alts` you name, and returns a `Game`. The core never reads a file itself: you pass `getFile`, so the same code runs in a browser. `game.support.runnable` tells whether the core plays every rule of the file; `checkSupport` lists what it does not.

## A hand, from the deal to the result

```js
const hand = newHand(game, { seed: 'demo', dealer: 0 });
while (!hand.isOver()) {
	const seat = hand.toAct()[0];
	hand.apply(seat, hand.legal(seat)[0]); // the action at the head of the list
}
console.log(hand.result().outcome, hand.checksum());
```

- `newHand(game, {seed, dealer})` shuffles, cuts and deals by the file. The seed is a string.
- `hand.toAct()` lists the seats that must act (one seat, or several while the table votes).
- `hand.legal(seat)` lists every legal action of that seat. It is empty when the seat is not to act.
- `hand.apply(seat, action)` plays an action and answers `{ok: true, events}`, or `{ok: false, code, why}` and changes nothing. An action counts when it equals one that `legal` lists.
- `hand.view(seat)` is all that the seat may know. `hand.result()` has the points, the winners and the payments. `hand.checksum()` is a 16-digit hash of the whole state.
- `replayHand(game, {seed, dealer}, log)` plays a record of actions again. A match of several hands is `newMatch`.

Points are counted in twelfths of a book point, as integers: 240 in a result is 20 points. [`CORE_API.md`](CORE_API.md) has every entry point, action, event and the shape of the view.

## What a bot sees, and what it never sees

A bot gets `{game, view, level, seed}` and answers one entry of `view.legal`. The view holds the seat's own hand, the cards played, the open trick, the counts of the other hands and the legal actions. It never holds another seat's cards, the cards left in the pack or the log of the hand. In `botlab --a-bot` and `play --bots bot:<module>` the `seed` is an opaque string, the same for the same decision; use it for your own random numbers; it does not tell the deal. [`BOT.md`](BOT.md) describes how the bot builds possible deals that fit its view, and how to write a bot of your own. A test deals two hands that give the same view and demands the same answer.

## Three commands

Each command prints the same numbers every time, except the times in `ms/hand` and `s`.

**Play one hand.** Here the seat 0 plays at level `normal`, the seat 1 at level `easy`. The output goes on for every move; the start and the end are shown.

```
$ npm run play -- sedici_2 --seats 2 --seed demo --bots normal,easy
game sedici_2, rules revision 10, 2 seats
seed demo, hand 0, hand seed demo:sedici_2:2:0, dealer seat 0
seat 0: normal
seat 1: easy
deal
  seat 0: swords:1 batons:10 coins:1 T18
  seat 1: batons:Q coins:7 T10 T14
  undealt: 70 cards
moves
   1  seat 1  play coins:7
   2  seat 0  play coins:1
        trick won by seat 0 (coins:7 coins:1)
   ...
  33  seat 1  claim_fuora
        fuora_claimed {"seat":1,"valid":true,"points":20}
result
  outcome: win (fuora)
  winners: seat 1
  points: side 0 72, side 1 240
  payments: seat 0 to seat 1 1 (loser_pays_winner)
  money: seat 0 -1, seat 1 +1 (sum 0)
  checksum 7ffbcfce09e90a3e
```

With `--json` the command prints the record of the hand, and `replayHand` plays it again. With `--hands 200 --summary` it plays many hands and prints shares and money per seat.

**Check the engine with a random robot.** It plays hands with random legal actions and counts each kind of failure: a broken invariant (each card exactly once), a points recount that differs, a leak of hidden cards, a replay that differs, and a legal action the core refused. It also tries illegal actions: `6/6` means the core refused all six.

```
$ npm run robots -- --games sedici_2:2 --deals 20 --seed demo
game      seats  hands  actions  invariant  recount  secrecy  replay  refused-legal  illegal tried/refused  ms/hand
sedici_2  2      21     631      0          0        0        0       0              6/6                    17.53
failures: 0; written <WORK>/robots_core.json
```

**Measure one bot against another.** Seat `a` plays one level, the other seats play level `b`. Seats rotate every hand, and every pair of bots plays the same hands. The line gives the share of hands won by `a` with its 95 % interval, and the money per hand.

```
$ npm run botlab -- --games sedici_2:2 --a normal --b easy --deals 20 --seed demo
sedici_2:2 normal vs easy hands 20 share 0.600 [0.387..0.781] fair 0.500 margin 0.6 decisions 586 | money 0.200 [-0.241..0.641] per hand, thrown in 0.000, no declarer, contracts {}, a minus the others 0.400 [-0.482..1.282]
written <WORK>/botlab/normal_vs_easy.json 5 s
```

With 20 hands the interval is wide: 0.600 here cannot be told from 0.500. Reports go to the folder named by `STUDIOLO_WORK`, or to `out/` in the repository.

## Where the determinism is

- The cards depend on the seed and the number of the hand, and on nothing else. Hand `H` of a series with seed `S` has the seed `S:<game>:<seats>:H`.
- The bot has no clock. Its budget is a count of actions applied in its rollouts, not milliseconds. The same `(game, view, level, seed)` gives the same answer on every call.
- The core and the bots use no `Math.random`. `makeRng(seed)` gives a seeded generator.
- A pool of threads in the lab changes the speed, not the numbers: the summary of `play` is the same on one thread and on three.

## The core knows no game by name

`core/` and `bots/` hold no game name. A game is a file; a rule is a setting. When a game needs something new, the format grows a setting and the core a module that plays it, never a branch on the name of a game. `npm run check:pure` fails if a game name appears in `core/` or `bots/`, even in a comment. When you write a bot, keep to the same rule: the game arrives as an argument.

## Where to go next

- Three worked examples: [`examples/01-sedici-for-two.md`](../examples/01-sedici-for-two.md), [`examples/02-permesso-for-three.md`](../examples/02-permesso-for-three.md) and [`examples/03-is-the-deal-fair.md`](../examples/03-is-the-deal-fair.md).
- [`BOT.md`](BOT.md): the bot, its levels, a bot of your own, a level from a file.
- [`CORE_API.md`](CORE_API.md): the core in detail.
- [`../problems/`](../problems/): open questions with the commands to start.
