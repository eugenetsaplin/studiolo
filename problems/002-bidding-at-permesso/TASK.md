# 002. Do the bots leave money on the table at the auction of Permesso?

## The problem

Permesso (`rulesets/permesso_3.json` to `permesso_7.json`) opens with an auction. Each player says how few cards they will change after the deal. The one who goes lowest plays alone against the others, lays down the worst cards of the hand and calls the same number by name from the other hands (Torino 1787, *Primi elementi e regole del giuoco de' tarocchi*, pp. 60-66). The declarer wins with 46 of the 91 points. The stake is the Onoranza of the contract, and one coin more for each five points beyond 45; a declarer who loses pays (pp. 66-70).

The bots bid by sampling the hidden cards, like the card play ([`docs/BOT.md`](../../docs/BOT.md), section on the bid). We do not know whether their auction is good.

## What we know

All numbers are for the rules of this repository at revision 14 (`rulesets/REVISIONS.md`), measured on 27 and 28 November 2026, on the seed `tune`, 100 deals each, `--workers 4`. The level is `normal` at every seat unless the line says otherwise. Since revision 11 the bot judges a bid equal to the standing one like every other bid, so its auction at three and five seats differs from that of revision 10.

- The declarer wins 0.66 of the declared hands at three seats and 0.76 at five. The command is `node tools/botlab.mjs --games permesso_3:3 --alone --a normal --deals 100 --seed tune` (declarer won 0.657 [0.559..0.743], 99 declared hands, 232 s) and the same with `permesso_5:5` (0.760 [0.668..0.833], 100 declared hands, 209 s). Every seat plays `normal`; the share is of the declared hands of all seats.
- It looks like timid bidding, so we asked whether bidding more would pay. The level key `bid_margin` allows values from 0 up, and `normal` asks for 0, so a bot that bids more often than `normal` cannot be made from a level file here; an earlier test with a lower bar is not part of the code and is not repeated. In its place we measured the other direction, the sample level `examples/my-level.json` (`bid_margin` 40: a bid must beat the pass by 40 book points) at seat `a` among `normal` seats, with the baseline `normal` against `normal` beside it. Money per deal of `a` minus the mean of the others:

| Seats | Command (seat `a`) | Declared, won | `a minus the others` |
|---|---|---|---|
| 3 | `node tools/botlab.mjs --games permesso_3:3 --a-level examples/my-level.json --b normal --deals 100 --seed tune` | 15, 0.533 | -1.755 [-3.333..-0.177] |
| 3 | the same with `--a normal` (baseline) | 38, 0.605 | -0.270 [-2.284..1.745] |
| 5 | `node tools/botlab.mjs --games permesso_5:5 --a-level examples/my-level.json --b normal --deals 100 --seed tune` | 11, 0.818 | -0.887 [-2.717..0.943] |
| 5 | the same with `--a normal` (baseline) | 19, 0.842 | 0.600 [-1.636..2.836] |

  The bot that bids less declares less and does not earn more; no interval lies above zero, and at three seats the whole interval lies below it.
- Earlier, in shorter runs of 24 to 52 deals on earlier revisions, we also tried: a bar of 45 points less and a bar of 15 points more; a model of the other bidders fitted to the bids of the real bots; a weight of the win in the bid of 0 and of 10; three times as many sampled worlds. None was clearly above zero: every interval included zero or lay below it. These runs are not repeated here.
- At five seats the bots take the light contract almost every time (contracts of the baseline run: `three` 43, `two` 50, `one` 7 of 100 hands). We think the high declarer share comes from choosing the contract to fit the hand, not from weak defence.

## The question

With these payments, is a declarer share of 0.66 at three seats and 0.76 at five what good bidding gives? Or do the bids of the bots leave money on the table, and how would one show it?

## Acceptance

For code: 400 deals on our seeds, one solver seat among `normal` seats, `permesso_3:3` and `permesso_5:5`: money per deal minus the others with the 95 % interval above 0.

Two identical `normal` bots differ by -0.270 [-2.284..1.745] on 100 deals at three seats (seed `tune`) and by 0.600 [-1.636..2.836] at five: the noise is large. 100 deals take about 4 minutes at three seats and 3 minutes at five on four threads. We have no paired measure yet (the same set of deals for two bots at the same seat, the difference taken deal by deal); if you build one, that is a result too.

For a written answer: a calculation or an argument with numbers that we can check by playing. We play the hands your answer talks about, 100 deals per table, on our seeds.

## How to run it

```
node tools/botlab.mjs --games permesso_3:3 --a-level examples/my-level.json --b normal --deals 100 --seed tune
node tools/botlab.mjs --games permesso_5:5 --a-level examples/my-level.json --b normal --deals 100 --seed tune
```

Use the seed `tune` for tuning. The keys of a level file are in `docs/BOT.md`. `examples/my-level.json` is a sample level file (put your own file in its place); for a bot module in place of a level file use `--a-bot` (section «A bot of your own» of `docs/BOT.md`; [`examples/02-permesso-for-three.md`](../../examples/02-permesso-for-three.md) shows both).

The same command with the level `normal` in place of your file gives the baseline on the seed `tune`:

```
node tools/botlab.mjs --games permesso_3:3 --a normal --b normal --deals 100 --seed tune
```

```
permesso_3:3 normal vs normal hands 100 share 0.332 [0.247..0.429] fair 0.333 margin 1.7 decisions 8551 | money -0.180 [-1.523..1.163] per hand, thrown in 0.010, declared 38 won 0.605, contracts {"two":52,"three":25,"one":18,"sans_prendre":4}, a minus the others -0.270 [-2.284..1.745]
written <WORK>/botlab/normal_vs_normal.json 216 s
```

In words: seat `a` declared 38 of the 100 hands and won 61 % of them (`declared 38 won 0.605`, the number to set beside the 0.66 above, which counts the declarers of all seats). Its money is -0.180 coins per hand, and `a minus the others` is -0.270 [-2.284..1.745]. Both levels are `normal`, so the true difference is zero; the interval of 100 deals is 2 coins wide on each side. A solver whose lower end must pass 0 has to beat that width.

The line also prints `a minus the others`: the money of the seat `a` less the mean of the others, which is the number of the acceptance. The run above took 216 s with `--workers 4`.

## What to send back

- A level file or a bot module, or a written argument with numbers.
- `REPORT.md` with your numbers on the seed `tune`.
- Do not change `core/` or `rulesets/`.

How to send, and how we accept: [`problems/README.md`](../README.md).
