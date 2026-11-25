# Partita for three (Partita)

3 players. In the book of 1787: pp. 87-88. Status: playable, with decisions of ours where the book is silent. Rules revision 9.

Partita for three (Torino 1787, «Del giuoco di Partita in tre persone», pp. 87-88): the game of four, played by three: «non altro hassi a fare, che mischiare, … regole sovradette; poi scartare, e giuocare». No calling, no exchange, no partner; whoever can count more points alone wins, «e si può guadagnare benissimo per una carta sola, e scompagnata». The book gives neither the number of cards nor the count nor the payment; the deal is taken from the three-player deal of p. 59 (25, 25, 28; the dealer puts three away), as Dummett (1980, p. 260) does; the payment is the agreed stake. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 3. *Documented: from the book, p. 87.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* Other reading: Change of dealer: to the left. <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, p. 88.* <!-- rule: sides.mode -->
- Signals between partners are forbidden. *Documented: from the book, p. 73.* <!-- rule: sides.signals -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Our reading: book, p. 88.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Our reading: book, p. 90.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Our reading: book, p. 52.* Other reading: Nothing is given for the Fool. <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Our reading: book, p. 52.* <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the winner of the trick. *Our reading: Torino [1846], part I, p. 33.* Other reading: The card for the Fool goes to the opponent. <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives nothing for the Fool. *Sources silent, our decision.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- Stake: a choice of 1, 2, 5 or 10 units; by default 1 unit. *Sources silent, our decision.* <!-- rule: options.stake -->

### The deal

- Cards dealt to each player: 25. *Our reading: Dummett (1980), p. 260.* Open question 12: could be settled by a document in which the rule is printed (the deal, the discard and the payment of Partita for three); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.deal.hand_size -->
- The dealer gets 3 more. *Our reading: Dummett (1980), p. 260.* Open question 12: could be settled by a document in which the rule is printed (the deal, the discard and the payment of Partita for three); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.deal.dealer_extra -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets_announced -->
- Dealing starts with the player on the dealer's right. *Our reading: book, p. 59.* <!-- rule: hand.deal.order -->
- The whole pack is dealt, no cards are left over. *Our reading: book, p. 59.* <!-- rule: hand.deal.dead -->

### The discard

This step: *Documented: from the book, p. 88.*

- The dealer puts cards away. *Our reading: book, p. 88.* <!-- rule: hand.discard.who -->
- Cards put away: 3. *Our reading: book, p. 88.* <!-- rule: hand.discard.count -->
- Exactly that many are put away. *Our reading: book, p. 59.* <!-- rule: hand.discard.count_mode -->
- Honours may not be put away. *Our reading: book, p. 90.* Other reading: Any card may be put away. <!-- rule: hand.discard.discard_honours_barred -->
- There are exceptions to the ban, they depend on the hand. *Our reading: book, p. 34.* Other reading: . <!-- rule: hand.discard.allowed_exceptions -->
- The discard counts for the player who put it away. *Sources silent, our decision.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard.counts_for -->
- The discard is announced with «ho scartato» and is final. *Our reading: book, p. 60.* <!-- rule: hand.discard.announce -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, p. 35.* <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* <!-- rule: hand.tricks.fool_may_lead -->

### The count

- Cards are counted in pairs: a pair is worth its two values less one point. So each card is worth its value less half a point. *Our reading: book, p. 88.* <!-- rule: hand.count.count_unit -->
- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Our reading: Dummett (1980), p. 260.* <!-- rule: hand.count.group -->
- A card left without a pair is worth its value less half a point, as in a pair. *Documented: from the book, p. 88.* <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Sources silent, our decision.* <!-- rule: hand.count.fool_card -->

### The result of a hand

- More points wins the hand. *Documented: from the book, p. 88.* <!-- rule: hand.result.winner -->
- If the points are equal, nobody gains game points. *Sources silent, our decision.* <!-- rule: hand.result.tie -->
- A hand gives no game points. *Sources silent, our decision.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in stakes. *Sources silent, our decision.* <!-- rule: hand.settle.unit -->
- The losers pay the winner. *Our reading: Dummett (1980), p. 260.* Open question 12: could be settled by a document in which the rule is printed (the deal, the discard and the payment of Partita for three); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.settle.mode -->
- The amount of the settlement: the stake as agreed. *Sources silent, our decision.* Open question 12: could be settled by a document in which the rule is printed (the deal, the discard and the payment of Partita for three); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.settle.amount -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Sources silent, our decision.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. Open question 23: could be settled by a document in which the rule is printed or a trial with live players (the length of a match in Partita for three, Dottore and Meno); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.dealer_rounds -->

### Offences

- Offence «revoke»: impossible at the table; penalty: pays the simple stake to each of the others. *Documented: from the book, pp. 33-34.* <!-- rule: penalties.revoke -->
- Offence «a signal to the partner»: in the text of the rules only; penalty: pays the simple stake to each of the others. *Documented: from the book, p. 73.* <!-- rule: penalties.signal -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 (our scan is partial: printed page 268 is missing) | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] (separate issue, cover dated 1846, deposited 27 December 1845; reprinted from the same setting, same pages, as part II of Il giuocatore di tarocchi al tavoliere, Torino, Serra, [1846]) | held |

Generated from `rulesets/partita_3.json`, rules revision 9. Do not edit: change the game file.
