# 002. Do the bots leave money on the table at the auction of Permesso?

## The problem

Permesso (`rulesets/permesso_3.json` to `permesso_7.json`) opens with an auction. Each player says how few cards they will change after the deal. The one who goes lowest plays alone against the others, lays down the worst cards of the hand and calls the same number by name from the other hands (Torino 1787, *Primi elementi e regole del giuoco de' tarocchi*, pp. 60-66). The declarer wins with 46 of the 91 points. The stake is the Onoranza of the contract, and one coin more for each five points beyond 45; a declarer who loses pays (pp. 66-70).

The bots bid by sampling the hidden cards, like the card play ([`docs/BOT.md`](../../docs/BOT.md), section on the bid). We do not know whether their auction is good.

## What we know

All numbers are for rules revision 10. The level is `normal` at every seat unless the line says otherwise.

Revision 11 (`rulesets/REVISIONS.md`, an outside check of the game files against the books) may move these numbers, and the numbers of this card were not measured again. The baseline command below, run again on revision 11, prints a different line (seat `a` declared 37 hands and won 0.676; `a minus the others` 0.675 [-1.278..2.628]). The bot now judges a bid equal to the standing one like every other bid, so its auction can differ at three and five seats, which changes the declarer share and the money; the main rules of the auction and of the payments in Permesso for three and five are as before, and the second reading of «subito» (`bidding.overbid_returns`) is not the one played.

- The declarer wins 0.70 of the declared hands at three seats and 0.79 at five (100 deals at each).
- It looks like timid bidding. We tested it: one bot that bids more often (a bid must beat the pass by 25 book points less than at `normal`, where `normal` asks for none) sat among `normal` bots. Money per deal, minus the mean of the others, 100 deals: three seats -0.47 [-1.11..0.18], five seats -0.18 [-0.69..0.34]. In shorter runs of the same bot the declarer's share fell to 0.54-0.58 and the money did not rise. The level key `bid_margin` in this repository allows values from 0 up; the lower bar was an experiment that is not part of the code here.
- We also tried, in shorter runs of 24 to 52 deals: a bar of 45 points less and a bar of 15 points more; a model of the other bidders fitted to the bids of the real bots; a weight of the win in the bid of 0 and of 10; three times as many sampled worlds. None was clearly above zero: every interval includes zero or lies below it.
- At five seats the bots took the light contract almost every time. We think the high declarer share comes from choosing the contract to fit the hand, not from weak defence.

## The question

With these payments, is a declarer share of 0.7 to 0.8 what good bidding gives? Or do the bids of the bots leave money on the table, and how would one show it?

## Acceptance

For code: 400 deals on our seeds, one solver seat among `normal` seats, `permesso_3:3` and `permesso_5:5`: money per deal minus the others with the 95 % interval above 0.

Two identical `normal` bots differ by 0.63 [-1.34..2.60] on 100 deals (seed `tune`): the noise is large. 100 deals take about half an hour on one thread. We have no paired measure yet (the same set of deals for two bots at the same seat, the difference taken deal by deal); if you build one, that is a result too.

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
permesso_3:3 normal vs normal hands 100 share 0.362 [0.274..0.459] fair 0.333 margin 0.77 decisions 8589 | money 0.420 [-0.891..1.731] per hand, thrown in 0.010, declared 36 won 0.722, contracts {"two":58,"three":29,"one":8,"sans_prendre":4}, a minus the others 0.630 [-1.336..2.597]
written <WORK>/botlab/normal_vs_normal.json 1894 s
```

In words: seat `a` declared 36 of the 100 hands and won 72 % of them (`declared 36 won 0.722`, the number to set beside the 0.70 above, which counts the declarers of all seats). Its money is 0.420 coins per hand, and `a minus the others` is 0.630 [-1.336..2.597]. Both levels are `normal`, so the true difference is zero; the interval of 100 deals is 2 coins wide on each side. A solver whose lower end must pass 0 has to beat that width.

The line also prints `a minus the others`: the money of the seat `a` less the mean of the others, which is the number of the acceptance. A run of 100 deals takes about half an hour at three seats on one thread; `--workers 4` is faster.

## What to send back

- A level file or a bot module, or a written argument with numbers.
- `REPORT.md` with your numbers on the seed `tune`.
- Do not change `core/` or `rulesets/`.

How to send, and how we accept: [`problems/README.md`](../README.md).
