# Example 1. Sedici for two players

Sedici is the shortest game of the Turin rulebook: four cards at a time (the pack is dealt again as they are played), tricks played at once, and a player who is sure to have made sixteen points says «fuora» and wins. The file is `rulesets/sedici_2.json`. This example reads one rule in it, plays one hand and explains three moves, and changes one reading to see what it does.

You need Node 24 and this repository.

## 1. A rule in the file

Open `rulesets/sedici_2.json` and find `hand.phases[1]` (the phase `fuora`). One of its settings:

```json
"claim_when": {
  "value": "own_turn",
  "source": "[R] Torino 1787, p. 40: «Quando adunque tu prima del tuo compagno sappi d'aver fatti sedici punti»: «fuora» is said as soon as one knows the points are made. ...",
  "alt": "after_trick"
}
```

Four things stand in it.

- `value` is what the engine plays: a player may say «fuora» on any turn of their own.
- `source` begins with a mark. `[R]` means our reading: the book is not clear, and this is how we read it. The mark is followed by the book, the year and the page: Torino 1787, p. 40 (the rulebook), Dummett 1980, p. 269 (*The Game of Tarot*).
- `alt` is the other reading, here that «fuora» may be said right after a trick, by the one who took it, and at no other time. The text of `source` names the readings we did not take.
- A leaf marked `[D]` is printed in the book; a leaf marked `[S]` is our decision where the sources are silent.

The count is in the file too. In `hand.phases[2]` the leaf `plain_value` is `[R]`: the book gives no value to a plain card counted singly (pp. 13-14, 51), and we read 1 from Prammatica [1846], p. 12, where a plain card counts one. Its `alt` is 0, as Dummett 1980, p. 269 has it. The file counted 0 until revision 13; the rules of this repository at revision 14 count 1, and a hand of Sedici is about half as long as before.

## 2. One hand

```
$ npm run play -- sedici_2 --seats 2 --seed demo --bots normal,easy
```

The output (the whole hand is 17 moves):

```
game sedici_2, rules revision 14, 2 seats
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
   3  seat 0  play swords:1
   4  seat 1  play T14
        trick won by seat 1 (swords:1 T14)
   5  seat 1  play batons:Q
   6  seat 0  play batons:10
        trick won by seat 1 (batons:Q batons:10)
   7  seat 1  play T10
   8  seat 0  play T18
        trick won by seat 0 (T10 T18)
        round_dealt {"index":1}
        dealt {"round":1}
   ...
  15  seat 1  play T3
  16  seat 0  play coins:4
        trick won by seat 1 (T3 coins:4)
        round_dealt {"index":2}
        dealt {"round":1}
  17  seat 1  claim_fuora
        fuora_claimed {"seat":1,"valid":true,"points":17}
result
  outcome: win (fuora)
  winners: seat 1
  points: side 0 96, side 1 204
  payments: seat 0 to seat 1 1 (loser_pays_winner)
  money: seat 0 -1, seat 1 +1 (sum 0)
  checksum 41b6a2d9da790286
```

Three moves, read with the file:

- **Moves 1 and 2.** The dealer is seat 0, so seat 1, on the dealer's right, leads the opening trick (p. 35: «Chi è a destra di chi dà, comincia»). Seat 0 must answer in the suit (`follow_suit`, p. 35). In coins the lower number takes the higher: the ace takes the seven (`suit_order: italian`, pp. 11-13). Seat 0 takes the trick.
- **Moves 3 and 4.** The taker of a trick leads the next (`next_leader`, p. 37). Seat 0 leads the ace of swords. Seat 1 holds batons:Q, T10 and T14: no sword. Because `must_trump` is set, seat 1 must play a trump, and T14 takes the ace. This leaf is marked `[R]`: the duty is printed for the later games of the book (Torino [1846], *Il giuocatore di tarocchi al tavoliere*, part I, p. 36), and for Baronetti in 1787 (p. 49); we carry it back to Sedici. The file names the other reading.
- **Moves 5 and 6.** The taker leads the next trick: seat 1 leads batons:Q and seat 0 answers with batons:10. In batons the queen is above the ten, so seat 1 takes it. After move 8 the four cards of each player are played and the pack is dealt again (`round_dealt`).

Points are in twelfths of a book point: 204 is 17 points. Seat 1 had 16 or more, said «fuora» on their own turn (the setting `claim_when` above) and won the hand.

Nobody says «fuora» for a player. At move 16 seat 1 takes the last trick of a packet, and the claim at move 17 counts 17 points, so the points were already made. The engine does not claim at that moment: the next packet is dealt (`round_dealt`) and the claim is made on a turn of one's own, because the leaf `fuora.at_round_end` is `deal_on` (`[D]`, Torino 1787, pp. 39, 40, 46: the book prints no duty to say «fuora» when the last trick of a packet is taken). Its `alt` is `must_claim`: the taker of the last trick who has the points must claim before the next deal. Seat 1, the taker of the last trick, leads the new packet, and the first thing it does is to claim. Run the command again: the output is the same byte for byte, because the cards and the bots depend on the seed and nothing else.

## 3. Change one reading

The bot lab can play the same bot against itself on the same deals with a game as the file has it, and again with one `alt` in place of one `value`:

```
$ node tools/botlab.mjs --games sedici_2:2 --a normal --alts --only-alt plain_value --deals 40 --seed demo --workers 4
sedici_2:2 hand.phases[count].settings.plain_value: dealer 0.525 -> 0.575, leader 0.475 -> 0.425, ties 0.000 -> 0.000, dealer margin 1.375 -> 2.3, z 0.4/-0.4/0.0/0.3
written <WORK>/botlab/alts.json 14 s
```

```
$ node tools/botlab.mjs --games sedici_2:2 --a normal --alts --only-alt claim_when --deals 40 --seed demo --workers 4
sedici_2:2 hand.phases[fuora].settings.claim_when: dealer 0.525 -> 0.525, leader 0.475 -> 0.475, ties 0.000 -> 0.000, dealer margin 1.375 -> 1.375, z 0.0/0.0/0.0/0.0
written <WORK>/botlab/alts.json 7 s
```

Both lines were measured at revision 14, on 27 November 2026. How to read the line: the share of hands won by the dealer and by the leader, the share of ties, the dealer's margin in points, each as the value of the file `->` the value with the alt. The last four numbers are z-scores of the four differences (dealer share, leader share, ties, margin). A difference with `|z|` above 2.6 is marked as a difference in the table the command writes. With 40 hands the intervals are wide, so a difference that is not marked does not show that the two readings play alike.

What the two lines say, on 40 hands:

- With a plain card worth 0 in place of the 1 of the file, the dealer wins 0.575 of the hands in place of 0.525 and the dealer's margin rises from 1.375 to 2.3 points. The z-scores are all below 0.5 in size: with 40 hands the lab cannot tell this change from none. A bigger run would be needed to say more.
- With «fuora» allowed right after a trick and at no other time, the line does not move: the shares and the margin are the same as with the file's reading, and the z-scores are all 0.0. On these 40 hands the bots win and lose the same hands under both readings. This does not say that the two readings are equal for people. The number tells how the bots behave under our readings, not what the book meant.

`play.mjs` has no switch for an `alt`. To play one hand by an alt, load the game with `loadGame('sedici_2', getFile, {seats: 2, alts: ['hand.phases[count].settings.plain_value']})` (see [`docs/ENGINE.md`](../docs/ENGINE.md)).

## Where next

- [`docs/BOT.md`](../docs/BOT.md) says how the bot plays and how to make a level or a bot of your own.
- [Example 2](02-permesso-for-three.md) goes to a game with an auction and with money.
