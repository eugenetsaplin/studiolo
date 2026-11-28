# 001. A stronger opponent for two players

## The problem

The bot plays every game of the book by sampling the hidden cards ([`docs/BOT.md`](../../docs/BOT.md), `bots/`). Its level `strong` is not stronger than `normal` at two players. We want an opponent that is clearly stronger, so that a good player has something to climb to.

## What we know

All numbers are for the rules of this repository at revision 14 (`rulesets/REVISIONS.md`), measured on 27 November 2026 with the commands below, on the seed `tune`. The bot of level `strong` plays against `normal`; the command plays one game per hand and changes the seat of `strong` every hand, so 200 hands are 200 games. A share is the share of games won by `strong`, with its 95 % interval. Revision 14 changed Sedici: a plain card now counts 1 point when cards are counted one by one, where it counted 0 before, so a hand of Sedici is about half as long. The `sedici_2` row is therefore not comparable with the tables of earlier revisions. The table below is measured on the rules as they are now. The known limitation in `docs/BOT.md` (a world scores the win and the margin together) is not changed.

| Game | Command | Hands | Share, with 95 % interval |
|---|---|---|---|
| `sedici_2` | `node tools/botlab.mjs --games sedici_2:2 --a strong --b normal --deals 200 --seed tune` | 200 | 0.530 [0.461..0.598] |
| `trentuno` | `node tools/botlab.mjs --games trentuno:2 --a strong --b normal --deals 200 --seed tune` | 200 | 0.505 [0.436..0.574] |
| `venticinque` | `node tools/botlab.mjs --games venticinque:2 --a strong --b normal --deals 100 --seed tune` | 100 | 0.520 [0.423..0.615] |
| `morto` | `node tools/botlab.mjs --games morto:2 --a strong --b normal --deals 100 --seed tune` | 100 | 0.605 [0.507..0.695] |
| `baronetti` | `node tools/botlab.mjs --games baronetti:2 --a strong --b normal --deals 100 --seed tune` | 100 | 0.570 [0.472..0.663] |

The runs took 27, 125, 161, 190 and 514 s on four threads. The intervals are wide: with 100 to 200 hands, a share near 0.53 or 0.56 cannot be told from 0.50, and the lower end of the interval is above 0.50 only at `morto`. The Morto and Baronetti rows are short measures. A table of an earlier revision, played on other deals, put every game between 0.495 and 0.55; it is replaced by this one because its deals could not be repeated with the tools of this repository.

A longer measure of Morto, 1,000 deals on another seed (28 November 2026, eight threads, 1,329 s), gave `strong` 0.504 [0.473..0.535] against `normal`: the 0.605 of the short row above was the luck of 100 deals.

The lab has a second way to measure, `--mode cyclic` ([`docs/BOT.md`](../../docs/BOT.md)): every deal is played once from every seat and counts as one observation. On the seed `tune`, 28 November 2026:

| Game | Command | Games | Share, cyclic interval | The default interval on the same games |
|---|---|---|---|---|
| `sedici_2` | `node tools/botlab.mjs --games sedici_2:2 --a strong --b normal --mode cyclic --deals 200 --seed tune` | 400 | 0.493 [0.470..0.515] | [0.444..0.541], 2.1 times as wide |
| `morto` | `node tools/botlab.mjs --games morto:2 --a strong --b normal --mode cyclic --deals 100 --seed tune` | 200 | 0.558 [0.516..0.599] | [0.488..0.625], 1.6 times as wide |

The two measures of Morto sit apart: 0.558 [0.516..0.599] on 100 deals of the seed `tune`, and 0.504 [0.473..0.535] on 1,000 deals of another seed. The intervals barely meet. Either the 100 deals of `tune` are kind to `strong`, or the cyclic interval is too narrow on so few deals. We do not know which.

In an earlier test a bot that sees all the cards of the others won clearly more than half of its games against `normal`; that test used a tool that is not in this repository, so we give no number. The deal decides much, so the room above `normal` is small. We do not know how small.

We tried, with no gain (on earlier revisions of the rules):

- more worlds (`strong` samples 600 worlds, `normal` 200);
- a search to the end of the hand when 4 cards are left (alpha-beta, a greedy playout at the leaves);
- weighting each world by how well it explains the opponent's plays;
- the same random numbers in the playouts of every candidate move.

## Acceptance

1,000 deals on our seeds; the lower end of the 95 % interval above 0.52 against `normal`, in at least two of `sedici_2`, `trentuno`, `venticinque`, `morto`, `baronetti`. A move takes at most 0.5 s at the 95th percentile and 2 s at worst, on one core.

The first row of the table above is the same measure on 200 hands: 0.530 [0.461..0.598] at `sedici_2`. On 200 hands the interval is about 0.14 wide, so a share near 0.53 cannot be told from 0.50, and the acceptance measure is 1,000 deals. Measure it yourself with `--deals 1000 --workers 4` (the table of the first solution below gives the seconds of such runs on eight threads).

## A first solution, measured

A bot written for this card during an outside check of the project was measured by the rule above on 28 November 2026: 1,000 deals in each game on our own seed, against `normal`, eight threads. The time of a move is from 20 deals of each game on one thread.

| Game | Share, with 95 % interval | Seconds | A move: 95th percentile and worst, ms |
|---|---|---|---|
| `sedici_2` | 0.521 [0.490..0.552] | 28 | 5 and 15 |
| `trentuno` | 0.572 [0.541..0.602] | 159 | 64 and 171 |
| `morto` | 0.584 [0.553..0.614] | 406 | 46 and 178 |
| `venticinque` | 0.549 [0.518..0.580] | 377 | 42 and 162 |
| `baronetti` | 0.693 [0.664..0.721] | 965 | 34 and 49 |

The lower end of the interval is above 0.52 in three games, Trent'uno, Morto and Baronetti, so the measure is passed; Venticinque misses it by a hair, and at Sedici the bot is level with `normal`. A move is far inside the limit. We read the code before the run: it uses the card tables of `core/` (indexes, points, selectors) and falls back to our own bot in the games it does not handle; we found no file, no network, no clock and nothing carried from one game to the next.

The bot is not in this repository yet. Until it is, the card stays open, and these are the numbers to beat.

## How to run it

```
node tools/botlab.mjs --games sedici_2:2 --a-bot solutions/001-stronger-opponent/<your name>/bot.mjs --b normal --deals 1000 --seed tune --workers 4
```

Use the seed `tune` for tuning. Change `sedici_2:2` to another game and seat count to measure it. To see the command work before you write a bot, measure the example bot of this repository: `node tools/botlab.mjs --games sedici_2:2 --a-bot examples/my-bot.mjs --b normal --deals 20 --seed tune` (20 deals, a quick test of the command). The module of your own goes in `solutions/001-stronger-opponent/<your name>/bot.mjs`; see [`docs/BOT.md`](../../docs/BOT.md), section «A bot of your own».

## What to send back

- The bot module, with the same contract as `chooseAction` in `bots/index.js`.
- `REPORT.md` with your numbers on the seed `tune`.
- Do not change `core/`, `bots/` or `rulesets/`.

A written answer is welcome too: why the ceiling sits where it does, and what kind of method could pass it.

How to send, and how we accept: [`problems/README.md`](../README.md).
