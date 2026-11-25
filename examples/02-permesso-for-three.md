# Example 2. Permesso for three players

Permesso opens with an auction. Each player says how few cards they will change after the deal; the one who goes lowest plays alone against the other two, lays down the worst cards of the hand, calls the same number by name from the other hands, and is paid in money if the declarer wins. The file is `rulesets/permesso_3.json`. This example reads the auction in the output of one hand, makes a level of your own and a bot of your own, and measures the money. It leads to [problem 002](../problems/002-bidding-at-permesso/TASK.md).

You need Node 24 and this repository.

## 1. The auction in one hand

```
$ npm run play -- permesso_3 --seats 3 --seed demo --bots normal
```

The start of the output, with the long lines of the deal cut:

```
game permesso_3, rules revision 10, 3 seats
seed demo, hand 0, hand seed demo:permesso_3:3:0, dealer seat 0
seat 0: normal
seat 1: normal
seat 2: normal
deal
  seat 0: swords:1 swords:6 ... T17 T19 T21
  seat 1: swords:3 swords:4 ... T2 T4 T11 T15
  seat 2: swords:2 swords:5 ... T7 T8 T16 T18 T20 T0
moves
   1  seat 0  discard swords:1
   2  seat 0  discard swords:7
   3  seat 0  discard swords:6
        discarded {"seat":0,"n":3}
   4  seat 1  pass
        bid {"seat":1,"bid":"pass"}
   5  seat 2  bid_three
        bid {"seat":2,"bid":"three"}
   6  seat 0  bid_one
        bid {"seat":0,"bid":"one"}
   7  seat 2  pass
        bid {"seat":2,"bid":"pass"}
        contract_won {"contract":"one","declarer":0}
   8  seat 0  lay_down cups:10
        laid {"seat":0,"n":1,"contract":"one"}
   9  seat 0  call T20
        called {"cards":["T20"]}
        exchanged {"n":1}
```

How to read it, with the file:

- **Moves 1 to 3.** The dealer has 28 cards and the others 25. The dealer puts three away, and with 25 the dealer is level with the others (p. 59).
- **Moves 4 to 7.** The auction. The player on the dealer's right, who is in hand, opens the auction (p. 60); the dealer speaks last (`dealer_speaks: last`, marked `[R]`: the book is silent, we read it from Torino [1846], *Il giuocatore di tarocchi al tavoliere*, part I, pp. 41-42). Seat 1 passes, and a pass is final (`pass_is_final`, p. 66). Seat 2 bids three: seat 2 will change three cards. Seat 0 bids one: seat 0 goes lower, and the one who goes to fewer cards plays alone (pp. 63-64). Seat 2 passes. The contract is `one`, the declarer is seat 0.
- **Moves 8 and 9.** The declarer lays one card face down, and calls one card by name from the other hands: here the trump T20 (pp. 60-61). Seat 2 holds T20, so it changes hands.

The end of the output is the money:

```
result
  outcome: win
  winners: seat 0
  contract: one, declarer seat 0
  points: side 0 576, side 1 516
  payments: seat 1 to seat 0 4 (onoranza); seat 2 to seat 0 4 (onoranza); seat 1 to seat 0 1 (points); seat 2 to seat 0 1 (points)
  money: seat 0 +10, seat 1 -5, seat 2 -5 (sum 0)
  checksum a2f0ea328d9d5ea8
```

Points are in twelfths: 576 is 48 of the 91 points, and the declarer needs 46. The stake is the Onoranza of the contract, 4 for `one` (p. 67), and one coin more for each five points beyond 45. The leaf `settle.amount` is marked `[R]` and names the doubt: the book disagrees with itself on where the steps fall, and 48 points count as one step in our reading (open question 33).

## 2. Make a level

The bot decides a bid by sampling the hidden cards and playing them out. The level key `bid_margin` says how much a bid must beat a pass, in book points, before the bot bids ([`docs/BOT.md`](../docs/BOT.md), the table of keys). The level `normal` leaves it at 0. The file [`examples/my-level.json`](my-level.json) is `normal` with `bid_margin` 40: a bot that bids less often.

Measure it. Seat `a` plays the level of the file; the other two seats play `normal`; seats rotate every hand:

```
$ node tools/botlab.mjs --games permesso_3:3 --a-level examples/my-level.json --b normal --deals 10 --seed tune
permesso_3:3 my-level vs normal hands 10 share 0.283 [0.099..0.588] fair 0.333 margin 2.1 decisions 785 | money -0.300 [-5.137..4.537] per hand, thrown in 0.100, declared 2 won 1.000, contracts {"two":6,"three":2,"one":1}, a minus the others -0.450 [-7.705..6.806]
written <WORK>/botlab/my-level_vs_normal.json 155 s
```

The run took 155 s on one thread. How to read the line:

- `money -0.300 [-5.137..4.537] per hand`: the money of the seat `a` per hand, in the coins of the game, with its 95 % interval.
- `a minus the others -0.450 [-7.705..6.806]`: the money of `a` less the mean money of the other seats. The money of a table adds up to zero, so with `n` seats this is the money of `a` times `n/(n-1)`. This is the number problem 002 asks about.
- `thrown in 0.100`: the share of hands where nobody bid and the cards were thrown in.
- `declared 2 won 1.000`: the declarer won two hands of the two where the seat `a` was declarer. `contracts` counts the contracts of all declarers.

With 10 hands the interval is wide: from -5 to +4.5 coins. The interval narrows with the square root of the number of hands: four times as many hands give half the width. This run cannot say that the level is better or worse than `normal`. The card of problem 002 names 100 hands.

## 3. Make a bot

[`examples/my-bot.mjs`](my-bot.mjs) is a bot of 17 lines. It asks the bot of this repository for an answer and changes the answer in one case: when the answer is a bid and the hand holds fewer than eight trumps (card ids that start with `T`), it passes. It names no game: the type of an action that starts with `bid_` is a bid in every game with an auction, and `pass` is in `view.legal` when a pass is allowed. The contract of such a module is in [`docs/BOT.md`](../docs/BOT.md), section «A bot of your own»: it receives `{game, view, level, seed}`, sees nothing but its own view, and answers one entry of `view.legal`.

Play one hand with it at seat 0:

```
$ node tools/play.mjs permesso_3 --seats 3 --seed demo --bots bot:examples/my-bot.mjs,normal,normal
```

The deal is the same as in part 1, but the play is not. The bot hands its `seed` on to the bot of this repository, and the seed that a solver's bot gets is an opaque print, not the seed that `normal` gets (see `docs/BOT.md`). So the sampled worlds differ, seat 0 puts away the same three cards in another order and passes at the auction, and seat 2 plays the contract `three` (the hand ends with `checksum 07ccce3e3c8699fd`, money: seat 0 +3, seat 1 +3, seat 2 -6). Measure it against `normal`:

```
$ node tools/botlab.mjs --games permesso_3:3 --a-bot examples/my-bot.mjs --b normal --deals 10 --seed tune
permesso_3:3 bot:my-bot vs normal hands 10 share 0.400 [0.168..0.687] fair 0.333 margin 3.3 decisions 863 | money 2.000 [-2.274..6.274] per hand, thrown in 0.000, declared 3 won 1.000, contracts {"one":2,"two":6,"three":2}, a minus the others 3.000 [-3.411..9.411]
written <WORK>/botlab/bot_my-bot_vs_normal.json 109 s
```

The run took under two minutes on two threads. Again 10 hands, and again a wide interval. Do not read the numbers as strength.

Play `normal` against `normal` on the same 10 hands (`--a normal --b normal`) and the line is close but not equal: the money of `a` is 2.000 in both, the interval is [-3.497..7.497] there. The two differ because the bot of a solver gets its own stream of random numbers, and because its rule sometimes passes. On 10 hands neither difference can be told from noise. A rule that rarely changes a move is a rule that this measure cannot judge. Change `MIN_TRUMPS` and run it again to see the line move.

## 4. The baseline: `normal` against `normal`

`normal` against `normal` at three seats, 100 hands, seed `tune` (it took 1894 s on one thread):

```
$ node tools/botlab.mjs --games permesso_3:3 --a normal --b normal --deals 100 --seed tune
permesso_3:3 normal vs normal hands 100 share 0.362 [0.274..0.459] fair 0.333 margin 0.77 decisions 8589 | money 0.420 [-0.891..1.731] per hand, thrown in 0.010, declared 36 won 0.722, contracts {"two":58,"three":29,"one":8,"sans_prendre":4}, a minus the others 0.630 [-1.336..2.597]
written <WORK>/botlab/normal_vs_normal.json 1894 s
```

The levels are the same, so the true difference is zero. The line shows what zero looks like on 100 hands: `a minus the others` is 0.630 coins per hand, with the interval [-1.336..2.597]. The seat `a` declared 36 hands and won 72 % of them, as the card of problem 002 says for the declarers of all seats (0.70). A bot of your own must show a lower end above 0 on a measure like this one; with a width of 2 coins on each side, a small gain cannot be seen in 100 hands.

The 100 hands use the same seed `tune` as the 10 hands of part 3: they are hands 0 to 9 of this run.

## Where next

- Problem 002 asks whether the bids of the bots leave money on the table. You now have the command to ask it with a level of your own or a bot of your own.
- [`docs/BOT.md`](../docs/BOT.md) lists every key of a level.
- [Example 1](01-sedici-for-two.md) is the short game for two.
