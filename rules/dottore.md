# Doctor (Dottore)

5 players. In the book of 1787: pp. 75-76. Status: playable, with decisions of ours where the book is silent. Rules revision 5.

Dottore (Torino 1787, «Del giuoco del Dottore», pp. 75-76), the game for five that the book describes in passing: dealt as Permesso for five (15 cards, 18 to the dealer who puts away three), but «non si chiamano, nè si cambiano carte» and «ognuno giuoca il suo giuoco»: each for himself, and the most points wins. The cards are counted one by one, two by two or three by three as the players agree (p. 75). The payment, the value of each card, the lead of the first hand and the count of the Fool are not printed; those are ours, marked. Giuoco sciolto of Sestilio uses these rules.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 5. *Documented: from the book, p. 76.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Our reading: book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Our reading: book, p. 58.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Documented: from the book, p. 17.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* Other reading: Change of dealer: to the left. <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, p. 75.* <!-- rule: sides.mode -->
- Signals between partners are forbidden. *Documented: from the book, p. 73.* <!-- rule: sides.signals -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Our reading: book, p. 75.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Our reading: book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 77.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Our reading: book, pp. 75-78.* Other reading: Nothing is given for the Fool. <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Our reading: book, p. 52.* <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the winner of the trick. *Documented: from the book, pp. 77-78.* <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives nothing for the Fool. *Our reading: book, p. 50.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- How to count: by one, two or three cards: choices 1, 2, 3; default 2. *Documented: from the book, p. 75.* <!-- rule: options.group -->
- Stake: choices 1, 2, 5, 10; default 1. *Sources silent, our decision.* <!-- rule: options.stake -->

### The deal

- Cards dealt to each player: 15. *Documented: from Torino [1846], part I, p. 46.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 3 more. *Documented: from the book, p. 75.* <!-- rule: hand.deal.dealer_extra -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets_announced -->
- The whole pack is dealt, no cards are left over. *Our reading: book, p. 74.* <!-- rule: hand.deal.dead -->

### The discard

This step: *Documented: from the book, p. 75.*

- The dealer puts cards away. *Documented: from the book, p. 75.* <!-- rule: hand.discard.who -->
- Cards put away: 3. *Documented: from the book, p. 75.* <!-- rule: hand.discard.count -->
- Exactly that many are put away. *Documented: from the book, p. 75.* <!-- rule: hand.discard.count_mode -->
- Honours may not be put away. *Our reading: book, p. 75.* Other reading: Any card may be put away. <!-- rule: hand.discard.discard_honours_barred -->
- There are exceptions to the ban, they depend on the hand. *Our reading: book, p. 34.* Other reading: . <!-- rule: hand.discard.allowed_exceptions -->
- The discard counts for the player who put it away. *Sources silent, our decision.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard.counts_for -->
- The discard is announced with «ho scartato» and is final. *Our reading: book, p. 60.* <!-- rule: hand.discard.announce -->

### The tricks

- The taker of the last trick of the previous hand leads first. *Our reading: book, p. 75.* Other reading: The player on the dealer's right leads first. Open question 20: could be settled by the opinion of an expert (who leads first: «Chi è ultimo a prendere giuoca il primo»); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* <!-- rule: hand.tricks.fool_may_lead -->

### The count

- Cards are counted in pairs: a card is worth its value and half a point more. *Our reading: book, p. 75.* <!-- rule: hand.count.count_unit -->
- Cards are counted in groups of option:group: a group is worth the sum of its values less one point for each extra card. *Documented: from the book, p. 75.* <!-- rule: hand.count.group -->
- A single card without a pair counts as half a point and its value. *Sources silent, our decision.* <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Sources silent, our decision.* <!-- rule: hand.count.fool_card -->
- A plain card is worth 1. *Our reading: Dummett (1980), p. 75.* <!-- rule: hand.count.plain_value -->

### The result of a hand

- More points wins the hand. *Documented: from the book, p. 75.* <!-- rule: hand.result.winner -->
- If the points are equal, nobody gains game points. *Sources silent, our decision.* <!-- rule: hand.result.tie -->
- A hand gives no game points. *Sources silent, our decision.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in stakes. *Sources silent, our decision, after Dummett (1980), pp. 75-76.* <!-- rule: hand.settle.unit -->
- The losers pay the winner. *Sources silent, our decision.* <!-- rule: hand.settle.mode -->
- The amount: the stake: as agreed. *Sources silent, our decision.* <!-- rule: hand.settle.amount -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn. The marche are settled after every deal; at the end the greatest balance wins, and equal greatest balances are a draw. *Sources silent, our decision.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn. The marche are settled after every deal; at the end the greatest balance wins, and equal greatest balances are a draw. Open question 23: could be settled by a document in which the rule is printed or a trial with live players (the length of a match in Partita for three, Dottore and Meno); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.dealer_rounds -->

### Offences

- Offence «revoke»: impossible at the table; penalty: pays: simple game; to: each of the others. *Documented: from the book, p. 38.* <!-- rule: penalties.revoke -->
- Offence «signal»: text only; penalty: pays: simple game; to: each of the others; then: lone player may stop. *Documented: from the book, p. 73.* <!-- rule: penalties.signal -->

## Not played yet

- **Dottore other numbers.** The book names only five players; other numbers are not offered. *Documented: Torino 1787, p. 76: «al Dottore si giuoca pure tra cinque persone».* <!-- left_out: dottore_other_numbers -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 (our scan is partial: printed page 268 is missing) | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |

Generated from `rulesets/dottore.json`, rules revision 5. Do not edit: change the game file.
