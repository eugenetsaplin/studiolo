# 003. The short form of Meno for three: a property of the game or a misreading?

## The problem

In Meno the player with the fewest points wins. The book names two short forms: "four cards, as at Sedici" and "eight cards, as at Trent'uno" (Torino 1787, *Primi elementi e regole del giuoco de' tarocchi*, p. 78; `rulesets/meno.json`, variants `four_cards` and `eight_cards`). With so few cards, many hands end with several players level on the fewest points. We want to know if that is how the game is, or if we read the book wrongly.

## What we know

All numbers are for the rules of this repository at revision 12 (`rulesets/REVISIONS.md`), measured on 27 November 2026. Each is a check of 200 hands played by random players, on the seed `play` that the command uses when no seed is named. With 200 hands an interval is wide: 0.44 has a 95 % interval of [0.37..0.51]. Revisions 11 and 12 did not change the form of four cards. The new rule of the vola in revision 11 (a player who takes all eight tricks is the only winner) is for the form of eight cards.

- We offer a form at a number of seats when no winner happens in at most 15 % of the hands and more than one winner in at most 50 %.
- Four cards, three seats: 44.0 % [37.3..50.9] of the hands have two winners or more (88 of 200); no winner in 3.0 %. It passes, close to the limit. The command is in the next section. An earlier check of 200 other hands gave 46 %: the two numbers come from different deals, and both are honest. From four seats up the form of four cards failed by a wide margin in that earlier check. The core of this repository does not play four cards at four seats and more (`support.runnable` is false), so no number for them is given here and none can be repeated with these tools.
- Eight cards, random players, share of hands with several winners at two, three, four and five seats: 0.0 %, 6.5 %, 15.5 % and 28.0 % (`--variant eight_cards`, the command of the next section with `--seats` changed). It passes at two to five seats. At six and seven seats the earlier check found it fails; the core does not play eight cards there, so no number is given.
- The full game (no `--variant`), several winners at two to seven seats: 0.0 %, 3.0 %, 4.0 %, 5.0 %, 13.5 % and 43.0 % (86 of 200 at seven seats). It passes at every number of seats.
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

The upper line plays the check as we made it, with random players. The lower line plays the same hands with the bot of level `normal`: on the seed `play`, 200 hands, it gives 50.0 % [43.1..56.9] of hands with several winners (100 of 200). Both lines print the share in the row `several winners`. Add `--seed <text>` to play other hands; the same seed gives the same numbers.

## What to send back

A calculation or an argument, with the page you rely on. Code is optional. Do not change `core/` or `rulesets/`; if you think a rule of `rulesets/meno.json` should read differently, say which leaf and why.

How to send, and how we accept: [`problems/README.md`](../README.md).
