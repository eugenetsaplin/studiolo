# Baronetti

2 players. In the book of 1787: pp. 47-53. Status: playable, with decisions of ours where the book is silent. Rules revision 3.

Baronetti («De' Baronetti»), the boys' game of the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787, pp. 47-53), read on its scan (check of 2 November 2026): two players, the whole 78-card pack dealt into four piles each of 10, 10, 10 and 9 cards with only the top card of every pile face up (pp. 48-49); only open cards are played, the next card of the pile a player played from is turned after both have played (pp. 49-50); the trick-taker leads (p. 50); the cards are counted in pairs and 46 points win the hand (pp. 51-52); the Fool is never given up, it is only shown and laid among one's points, and its owner gives one plain card of his choice (pp. 50, 52). The book's own purpose is to teach boys to answer in the suit asked (p. 47). Where the book is silent (what a Fool shown inside a trick does to the trick, the tie at 45½, the order of dealers, the Fool led) nothing is invented: the leaf is a [R] reading or the rule is listed in left_out. The money is the simple stake of p. 21; no match is described. Marks: [D] documented, [R] our reading, [S] sources silent. When the piles run unequal the play simply goes on from the open cards (p. 49); that is the engine's behaviour, not a rule.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 2. *Documented: from the book, p. 47.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, p. 48.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Documented: from the book, p. 16.* <!-- rule: seats.cut_min -->
- The dealers alternate. *Our reading: book, p. 41.* <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, p. 47.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, p. 48.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, p. 13.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 47.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the opponent. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange_to -->
- The Fool is never lost, not even in the last trick. *Documented: from the book, p. 50.* <!-- rule: cards.fool_last_trick -->
- The Fool may be shown at any time. *Our reading: book, p. 50.* Other reading: no. <!-- rule: cards.fool_show_any_time -->
- A player who took no trick gives nothing for the Fool. *Our reading: book, p. 50.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- stake: choices 1, 2, 5, 10; default 1. *Documented: from the book, p. 21.* <!-- rule: options.stake -->

### The deal

- The cards lie in piles: 10, 10, 10, 9. *Documented: from the book, pp. 48-49.* <!-- rule: hand.deal.piles -->
- The top cards of the piles are open. *Documented: from the book, pp. 48-49.* <!-- rule: hand.deal.pile_top -->
- Dealing starts with the dealer's opponent. *Documented: from the book, p. 48.* <!-- rule: hand.deal.order -->
- The cards are dealt face down. *Documented: from the book, p. 48.* <!-- rule: hand.deal.face -->
- The whole pack is dealt, no cards are left over. *Documented: from the book, pp. 48-49.* <!-- rule: hand.deal.dead -->

### The tricks

- The dealer's opponent leads first. *Documented: from the book, p. 48.* <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 50.* <!-- rule: hand.tricks.next_leader -->
- Cards are played from the tops of the piles. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.play_from -->
- You must follow suit if you can. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, p. 49.* <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* <!-- rule: hand.tricks.fool_may_lead -->

### Open piles (during: tricks)

This step: *Documented: from the book, pp. 49-50.*

- The next top card of a pile is turned up after a trick. *Documented: from the book, p. 50.* <!-- rule: hand.piles.reveal -->
- When your own pile is gone, you play from the others. *Our reading: book, pp. 49-50.* <!-- rule: hand.piles.empty_pile -->

### The count

- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Documented: from the book, pp. 51-52.* <!-- rule: hand.count.group -->
- Cards are counted in pairs: a card is worth its value and half a point more. *Documented: from the book, p. 52.* <!-- rule: hand.count.count_unit -->
- A single card without a pair counts as half a point and its value. *Our reading: book, p. 56.* Other reading: A single card without a pair does not count. <!-- rule: hand.count.odd_card -->
- There are no multipliers for tricks. *Our reading: book.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book.* <!-- rule: hand.count.last_trick_bonus -->

### The result of a hand

- Whoever reaches the threshold wins. *Documented: from the book, p. 51.* <!-- rule: hand.result.winner -->
- The threshold is 46 points. *Documented: from the book, p. 51.* <!-- rule: hand.result.target -->
- A hand gives no game points. *Our reading: book, p. 51.* <!-- rule: hand.result.game_points -->
- If the points are equal, nobody gains game points. *Sources silent, our decision.* Open question 14: could be settled by a document in which the rule is printed (equal points, 45½ each); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.result.tie -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 21.* <!-- rule: hand.settle.unit -->
- The loser pays the winner. *Our reading: book, p. 51.* <!-- rule: hand.settle.mode -->
- The amount: the stake: simple. *Documented: from the book, p. 21.* <!-- rule: hand.settle.amount -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->

### Offences

- Offence «revoke»: impossible at the table; penalty: pays: simple game; to: each of the others; while trick open: change card. *Documented: from the book, pp. 33-34.* <!-- rule: penalties.revoke -->
- Offence «open two»: impossible at the table; penalty: first: warning; second: pays: simple game; forfeits winnings: yes. *Documented: from the book, pp. 50-51.* <!-- rule: penalties.open_two -->
- Offence «peek pile»: impossible at the table; penalty: pays: double game; if inadvertent: simple game. *Documented: from the book, pp. 52-53.* <!-- rule: penalties.peek_pile -->
- Offence «wrong deal method»: impossible at the table; penalty: pays: game as agreed. *Documented: from the book, p. 53.* <!-- rule: penalties.deal_card_by_card -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |

Generated from `rulesets/baronetti.json`, rules revision 3. Do not edit: change the game file.
