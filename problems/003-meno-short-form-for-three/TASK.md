# 003. The short form of Meno for three: a property of the game or a misreading?

## The problem

In Meno the player with the fewest points wins. The book names two short forms: "four cards, as at Sedici" and "eight cards, as at Trent'uno" (Torino 1787, *Primi elementi e regole del giuoco de' tarocchi*, p. 78; `rulesets/meno.json`, variants `four_cards` and `eight_cards`). With so few cards, many hands end with several players level on the fewest points. We want to know if that is how the game is, or if we read the book wrongly.

## What we know

All numbers are for rules revision 10 (`rulesets/REVISIONS.md`). Each is a check of 200 hands played by random players at that number of seats, made in our lab. The core of this repository does not play Meno at four seats and more, so the command below repeats the three-seat line and not the others.

Revision 11 (`rulesets/REVISIONS.md`, an outside check of the game files against the books) does not change the form of four cards, nor the full game: the new rule of the vola (a player who takes all eight tricks is the only winner) is for the form of eight cards. The eight-card figures below were not measured again and may move a little. The two commands below were run again on revision 11 and print the same 44.0 % and 50.0 %.

- We offer a form at a number of seats when no winner happens in at most 15 % of the hands and more than one winner in at most 50 %.
- Four cards, three seats: 46 % of the hands have two winners or more (our lab, 200 hands of random players, on its own deals). It passes, close to the limit. The command below, on the seed `play` that it uses when no seed is named, 200 hands, random players, gives 44.0 % [37.3..50.9] (88 hands of 200). The two numbers come from different deals, and both are honest: with 200 hands the interval is wide. From four seats up it fails: 83 %, 97 %, 100 % and 100 % at four, five, six and seven seats.
- Eight cards passes at two to five seats (29 % at most) and fails at six and seven (57 % and 80 %).
- The full game passes at every number of seats: at seven seats 38 % of the hands have several winners.
- Players level on the fewest points all win. This is our decision (mark [S]): Torino 1787, pp. 78-79, and Dummett, *The Game of Tarot* (1980), p. 269, are silent on it.
- The book does not say how the cards are counted or how a tie is settled (pp. 78-79). We read "as at Sedici" to cover the count and the order of the trumps (mark [R] in the file).

## The question

Is 46 % a property of four cards at three seats under the book's count? Or is it a trace of a wrong reading: the count, the tie, the order of the trumps "as at Sedici"? What would the share be with skilled players instead of random ones?

## Acceptance

There is no code to submit. We accept an answer that gives a number or a clear argument, and the page of the book it rests on. We check the number by playing 1,000 hands per setting on seeds that are not in this card, and we compare with yours.

## How to run it

```
node tools/play.mjs meno --seats 3 --variant four_cards --hands 200 --bots random --summary
node tools/play.mjs meno --seats 3 --variant four_cards --hands 200 --bots normal --summary
```

The upper line plays the check as we made it, with random players. The lower line plays the same hands with the bot of level `normal`: on the seed `play`, 200 hands, it gives 50.0 % [43.1..56.9] of hands with several winners (100 of 200). Add `--seed <text>` to play other hands; the same seed gives the same numbers.

## What to send back

A calculation or an argument, with the page you rely on. Code is optional. Do not change `core/` or `rulesets/`; if you think a rule of `rulesets/meno.json` should read differently, say which leaf and why.

How to send, and how we accept: [`problems/README.md`](../README.md).
