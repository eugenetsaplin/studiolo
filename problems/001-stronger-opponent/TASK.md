# 001. A stronger opponent for two players

## The problem

The bot plays every game of the book by sampling the hidden cards ([`docs/BOT.md`](../../docs/BOT.md), `bots/`). Its level `strong` is not stronger than `normal` at two players. We want an opponent that is clearly stronger, so that a good player has something to climb to.

## What we know

All numbers are for the rules of this repository at revision 12 (`rulesets/REVISIONS.md`), measured on 27 November 2026 with the commands below, on the seed `tune`. The bot of level `strong` plays against `normal`; the command plays one game per hand and changes the seat of `strong` every hand, so 200 hands are 200 games. A share is the share of games won by `strong`, with its 95 % interval. Revision 11 changed the games (in Sedici and Trent'uno «fuora» is said by the player, and the bot plays a card that wins the game now before any other choice, `docs/BOT.md`); the table below is measured on the rules as they are now. The known limitation in `docs/BOT.md` (a world scores the win and the margin together) is not changed.

| Game | Command | Hands | Share, with 95 % interval |
|---|---|---|---|
| `sedici_2` | `node tools/botlab.mjs --games sedici_2:2 --a strong --b normal --deals 200 --seed tune` | 200 | 0.560 [0.491..0.627] |
| `trentuno` | `node tools/botlab.mjs --games trentuno:2 --a strong --b normal --deals 200 --seed tune` | 200 | 0.505 [0.436..0.574] |
| `venticinque` | `node tools/botlab.mjs --games venticinque:2 --a strong --b normal --deals 100 --seed tune` | 100 | 0.520 [0.423..0.615] |
| `morto` | `node tools/botlab.mjs --games morto:2 --a strong --b normal --deals 100 --seed tune` | 100 | 0.605 [0.507..0.695] |
| `baronetti` | `node tools/botlab.mjs --games baronetti:2 --a strong --b normal --deals 100 --seed tune` | 100 | 0.570 [0.472..0.663] |

The runs took 263, 291, 457, 387 and 1,095 s on four threads. The intervals are wide: with 100 to 200 hands, a share near 0.56 cannot be told from 0.50, and the lower end of the interval is above 0.50 only at `morto`. The Morto and Baronetti rows are short measures. A table of an earlier revision, played on other deals, put every game between 0.495 and 0.55; it is replaced by this one because its deals could not be repeated with the tools of this repository.

In an earlier test a bot that sees all the cards of the others won clearly more than half of its games against `normal`; that test used a tool that is not in this repository, so we give no number. The deal decides much, so the room above `normal` is small. We do not know how small.

We tried, with no gain (on earlier revisions of the rules):

- more worlds (`strong` samples 600 worlds, `normal` 200);
- a search to the end of the hand when 4 cards are left (alpha-beta, a greedy playout at the leaves);
- weighting each world by how well it explains the opponent's plays;
- the same random numbers in the playouts of every candidate move.

## Acceptance

1,000 deals on our seeds; the lower end of the 95 % interval above 0.52 against `normal`, in at least two of `sedici_2`, `trentuno`, `venticinque`, `morto`, `baronetti`. A move takes at most 0.5 s at the 95th percentile and 2 s at worst, on one core.

The first row of the table above is the same measure on 200 hands: 0.560 [0.491..0.627] at `sedici_2`. On 200 hands the interval is about 0.14 wide, so a share near 0.56 cannot be told from 0.50, and the acceptance measure is 1,000 deals. Measure it yourself with `--deals 1000 --workers 4` (on four threads this takes tens of minutes; we give no number for it).

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
