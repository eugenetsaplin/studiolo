# Example 3. Is the deal fair?

A player may ask whether the pack «plays along»: whether some card goes more often to the dealer, or to one seat, or stays out of the hands more often than chance allows. This example answers it for one game with a command that deals a hundred thousand hands and counts where every card lies right after the deal. The game is Venticinque for two players, in which the dealer is dealt more cards than the other seat, so the check has to know that.

You need Node 24 and this repository.

## 1. The question

If the shuffle and the deal are fair, a card falls in a place with the chance (cards in that place) / (cards of the pack), the same for every card. In `rulesets/venticinque.json` the dealer is dealt 28 cards, the other seat 25, and 25 stay undealt. So each card goes to the dealer with the chance 28/78 = 0.359 and to each of the other two places with 25/78 = 0.321. The command takes these shares from the deals themselves, so it needs no table of them.

## 2. The command

```
$ node tools/deal-check.mjs venticinque --seats 2 --deals 100000 --seed fair
```

Hand H of the series has the seed `fair:venticinque:2:H` and the dealer H mod 2, the same as in `tools/play.mjs`. The same arguments print the same bytes at any `--workers`. The run took 1 second on four workers. `--json` prints the same numbers as an object.

```
game venticinque, 2 seats, 100000 deals, seed fair, pack of 78 cards

places by seat number (the dealer turns by deal number)
place     expected  lowest [card]       highest [card]
seat 0    0.3397    0.3367 [T17]              0.3451 [cups:3]
seat 1    0.3397    0.3355 [cups:3]           0.3441 [T17]
out       0.3205    0.3167 [coins:4]          0.3241 [T14]
chi-square 169.97, 156 degrees of freedom, probability of this or more with a fair deal 0.2101
largest single cell: z 3.57 (cups:3, seat 0); cells beyond 3 sigma: 1 of 234, expected 0.63

places relative to the dealer (d+1 is the seat to the right of the dealer)
place     expected  lowest [card]       highest [card]
dealer    0.3590    0.3553 [T1]               0.3628 [swords:2]
dealer+1  0.3205    0.3163 [swords:2]         0.3244 [coins:7]
out       0.3205    0.3167 [coins:4]          0.3241 [T14]
chi-square 185.64, 156 degrees of freedom, probability of this or more with a fair deal 0.0527
largest single cell: z -2.85 (swords:2, dealer+1); cells beyond 3 sigma: 0 of 234, expected 0.63
```

## 3. How to read it

There are two tables from the same deals. One counts places by seat number. The other counts them relative to the dealer, because a bias, if there is one, is tied to the dealer and would wash out over the seat numbers. The last place, `out`, is every card that is in no hand.

- **expected** is the share the card should have in the place. The dealer's 0.3590 is larger than the 0.3205 of the other places: this is the larger hand, not a favour. In the table by seat number the two seats share the dealer's turns and both have 0.3397.
- **lowest** and **highest** are the least and the most frequent card in the place, with the card. Even a fair deal spreads: with 100 000 deals the share of one card in one place has a standard deviation of about 0.0015, so a spread of a few thousandths around the expected share is chance. A card far outside the spread would be a finding.
- **chi-square** adds up, over all 78 cards and all places, how far the counts are from the expected counts. A table with no bias gives about as much as it has degrees of freedom (156 here). The probability is the chance of a value as large as this or larger from a fair deal: 0.2101 and 0.0527.
- **largest single cell** is the cell that is farthest from its expectation, in standard deviations, and the number of cells beyond 3 standard deviations against the number to expect from chance (234 cells times 0.0027 is 0.63). One cell beyond is what chance gives about every second run.

## 4. What follows, and what does not

- The counts show no bias of a size that 100 000 deals can show. The probabilities are not small; the second one, 0.0527, is the kind of value a fair deal gives about one time in twenty. A second series with another seed (`--seed other`) tells whether it repeats. A bias would repeat, a chance value would not.
- We repeated the check on 400 base seeds, for this game and for Sedici for two, with 3,000 and with 30,000 deals each. The probabilities spread evenly between 0 and 1, which is what a fair deal gives. The same deals reshuffled by an independent generator give the same picture.
- A probability above the usual threshold does not prove the deal fair. It says that this check found no bias in these 100 000 deals. A bias of one card by a few hundredths of a percent needs many more deals to be seen.
- The check looks at the deal and nothing else. It says nothing on what a bot is shown (the bot gets the view of its own seat, see [`docs/BOT.md`](../docs/BOT.md)), on the strength of the players, or on what a later redeal or an exchange does to the cards.
- The test `test/tools/deal-check.test.mjs` runs the same counting on a made-up deal that gives one card to the dealer a little more often than chance. The check rejects it with a probability far below 0.001 and passes a fair made-up deal, so a bias of that size would show.

Try another game and another number of seats, for instance `node tools/deal-check.mjs permesso_4 --seats 4 --deals 100000 --seed fair`.
