# 001. A stronger opponent for two players

## The problem

The bot plays every game of the book by sampling the hidden cards ([`docs/BOT.md`](../../docs/BOT.md), `bots/`). Its level `strong` is not stronger than `normal` at two players. We want an opponent that is clearly stronger, so that a good player has something to climb to.

## What we know

All numbers are for rules revision 10, with seats swapped on each deal (one deal is two games), the bot of level `strong` against `normal`. A share is the share of games won by `strong`.

Revision 11 (`rulesets/REVISIONS.md`, an outside check of the game files against the books) may move some of these numbers, and they were not measured again. In Sedici and Trent'uno «fuora» is now said by the player and not for him, and the bot plays a card that wins the game now before any other choice (`docs/BOT.md`): both can change the games of `sedici_2` and `trentuno` for both levels. In Baronetti the loser now deals next. Venticinque and Morto are played as before. The known limitation in `docs/BOT.md` (a world scores the win and the margin together) is not measured either.

| Game | Deals (games) | Share, with 95 % interval |
|---|---|---|
| `sedici_2` | 200 (400) | 0.495 [0.466..0.524] |
| `trentuno` | 200 (400) | 0.517 [0.486..0.549] |
| `venticinque` | 100 (200) | 0.505 [0.470..0.540] |
| `morto` | 100 (200) | 0.515 [0.480..0.550] |
| `baronetti` | 20 (40) | 0.550 [0.483..0.617] |

The Baronetti row is a short measure: 20 deals, a wide interval.

The same measure with the command of this repository, on the seed `tune`. The command plays one game per hand and changes the seat of `strong` every hand, so 200 hands are 200 games, and its interval is wider than the one in the table above:

| Game | Command | Hands | Share, with 95 % interval |
|---|---|---|---|
| `sedici_2` | `node tools/botlab.mjs --games sedici_2:2 --a strong --b normal --deals 200 --seed tune` | 200 | 0.560 [0.491..0.627] |
| `trentuno` | `node tools/botlab.mjs --games trentuno:2 --a strong --b normal --deals 200 --seed tune` | 200 | 0.505 [0.436..0.574] |

The two measures play different deals, and their intervals overlap in both games. With 200 hands, a share near 0.56 cannot be told from 0.50.

A bot that sees all the cards of the others wins 0.58 to 0.69 of its games against `normal` (50 deals in each of the five games, 48 playouts per move). The deal decides much, so the room above `normal` is small. We do not know how small.

We tried, with no gain:

- more worlds (`strong` samples 600 worlds, `normal` 200);
- a search to the end of the hand when 4 cards are left (alpha-beta, a greedy playout at the leaves);
- weighting each world by how well it explains the opponent's plays;
- the same random numbers in the playouts of every candidate move.

## Acceptance

1,000 deals on our seeds; the lower end of the 95 % interval above 0.52 against `normal`, in at least two of `sedici_2`, `trentuno`, `venticinque`, `morto`, `baronetti`. A move takes at most 0.5 s at the 95th percentile and 2 s at worst, on one core.

Our two numbers for `strong` against `normal` at `sedici_2`: 0.495 in our lab (200 deals, 400 games, its own deals) and 0.560 [0.491..0.627] with the command below on the seed `tune` (200 deals, 200 games). On 200 deals the interval is about 0.14 wide, so the acceptance measure is 1,000 deals. With `--deals 1000 --workers 4` at `sedici_2:2`, `strong` against `normal` gives 0.509 [0.478..0.540] on the seed `tune`; the run takes about 9 minutes on four threads (523 s).

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
