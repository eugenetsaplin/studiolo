# Partita for four (Partita)

4 players. In the book of 1787: pp. 88-90. Status: playable, with decisions of ours where the book is silent. Rules revision 11.

Partita, two against two (Torino 1787, «Del giuocare in Partita», pp. 88-90), the game the book calls the proper one of four players: two fixed pairs, partners sit face to face, the cards are cut, dealt and discarded as in Permesso for four (19 cards to each, the dealer puts two away), no one may ever go alone («andar a solo mai e poi mai»), the two partners' points are one heap and the part with more points wins, even by a single unpaired card (pp. 88-90). The Bagatto and the kings may not be put away, the Fool is shown (p. 90). Each winner collects the agreed sum from one of the opponents (p. 90). The sum, the count by four or by two, the lead and who deals first («Chi coppa meglio») are our readings. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 4. *Documented: from the book, p. 88.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever cuts the highest card. *Documented: from the book, p. 89.* Other reading: First dealer: by drawing the high card. <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Our reading: book, p. 58.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* Other reading: Change of dealer: to the left. <!-- rule: seats.dealer_rotation -->
- Partners sit opposite each other. *Documented: from the book, p. 89.* <!-- rule: seats.seating -->
- The players play in fixed pairs. *Documented: from the book, p. 88.* <!-- rule: sides.mode -->
- Points are counted for the side, not for each player. *Documented: from the book, p. 89.* <!-- rule: sides.pool -->
- Signals between partners are forbidden. *Documented: from the book, p. 73.* <!-- rule: sides.signals -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Our reading: book, p. 89.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 90.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Our reading: book, p. 52.* Other reading: Nothing is given for the Fool. <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Our reading: book, p. 52.* <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the winner of the trick. *Our reading: Torino [1846], part I, p. 33.* Other reading: The card for the Fool goes to the opponent. <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives nothing for the Fool. *Sources silent, our decision.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- counting, cards in a group: a choice of 2 or 4; by default 2. *Our reading: book, p. 89.* <!-- rule: options.group -->
- Stake: a choice of 1, 2, 5 or 10 units; by default 1 unit. *Documented: from the book, p. 90.* <!-- rule: options.stake -->
- variant: Four deals: one payment at the end, to the pair with the larger total. *Documented: from Torino [1846], part I, p. 36.* <!-- rule: variants.four_deals -->

### The deal

- Cards dealt to each player: 19. *Documented: from the book, p. 89.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 2 more. *Documented: from Torino [1846], part I, pp. 40-41.* <!-- rule: hand.deal.dealer_extra -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets_announced -->
- Dealing starts with the player on the dealer's right. *Our reading: book, p. 59.* <!-- rule: hand.deal.order -->
- The whole pack is dealt, no cards are left over. *Our reading: book, p. 71.* <!-- rule: hand.deal.dead -->

### The discard

This step: *Documented: from the book, p. 89.*

- The dealer puts cards away. *Documented: from the book, p. 89.* <!-- rule: hand.discard.who -->
- Cards put away: 2. *Documented: from the book, p. 71.* <!-- rule: hand.discard.count -->
- Exactly that many are put away. *Documented: from Torino [1846], part I, pp. 36, 40-41.* <!-- rule: hand.discard.count_mode -->
- Honours may not be put away. *Our reading: book, p. 90.* Other reading: Any card may be put away. <!-- rule: hand.discard.discard_honours_barred -->
- These may not be put away: Trump 1 — Magician, the kings. *Documented: from the book, p. 90.* <!-- rule: hand.discard.barred -->
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

### Counting in pairs (when chosen: counting, cards in a group = 2)

- Cards are counted in pairs: a pair is worth its two values less one point. So each card is worth its value less half a point. *Our reading: book, pp. 88-90.* <!-- rule: hand.count.count_unit -->
- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Documented: from the book, p. 89.* <!-- rule: hand.count.group -->
- A card left without a pair is worth its value less half a point, as in a pair. *Documented: from the book, p. 90.* <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Our reading: Turin 1880, p. 8.* <!-- rule: hand.count.fool_card -->

### Counting in fours (when chosen: counting, cards in a group = 4)

- Cards are counted by fours, as the next rules say. *Our reading: book, pp. 88-90.* <!-- rule: hand.count_fours.count_unit -->
- Cards are counted in groups of 4: a group is worth the sum of its values less one point for each extra card. *Documented: from the book, p. 89.* <!-- rule: hand.count_fours.group -->
- A single card counts as a short group. *Our reading: Dummett (1980), p. 261.* Other reading: A card left without its four is worth its value less three quarters of a point, as in a four. <!-- rule: hand.count_fours.odd_card -->
- The card given for the Fool is part of the count. *Our reading: Turin 1880, p. 8.* <!-- rule: hand.count_fours.fool_card -->

### The result of a hand

- More points wins the hand. *Documented: from the book, pp. 89-90.* <!-- rule: hand.result.winner -->
- If the points are equal, nobody gains game points. *Our reading: Turin 1880, p. 11.* <!-- rule: hand.result.tie -->
- A hand gives no game points. *Sources silent, our decision.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 90.* <!-- rule: hand.settle.unit -->
- The pair shares the win; with unequal sides (one against three) the declarer settles with each opponent. *Documented: from the book, p. 90.* <!-- rule: hand.settle.mode -->
- The amount of the settlement: the stake as agreed. *Documented: from the book, p. 90.* <!-- rule: hand.settle.amount -->

### The match

- The match is kept as a ledger of hands. *Our reading: book, p. 90.* Open question 24: could be settled by a document in which the rule is printed or a trial with live players (one stake at the end of the partita, or the marche after every deal); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Documented: from Torino [1846], part I, pp. 35-36.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. <!-- rule: match.dealer_rounds -->

### Offences

- The offence «revoke» cannot happen at this table. By the book, the offender pays the simple stake to each of the others. *Documented: from the book, p. 90.* <!-- rule: penalties.revoke -->
- This table does not charge the offence «a signal to the partner»: the penalty stands in the text of the rules only. By the book, the offender pays the simple stake to each of the others. *Documented: from the book, p. 73.* <!-- rule: penalties.signal -->

## Not played yet

- **Go alone.** The table has no lone contract at Partita, so nobody can go alone; no penalty is needed. *Documented: Torino 1787, p. 89: «non sarà lecito poi, giuocando in Partita, di andar a solo mai».* <!-- left_out: go_alone -->
- **Marcio vola premiums.** Not in the 1787 book; the stake is the agreed simple sum. *Our reading: Dummett 1980, p. 261 (his guesses, not printed in the book): a double payment when the loser has fewer than 18 points, a triple for a vola, an extra for each five points.* <!-- left_out: marcio_vola_premiums -->
- **Fool discard for vola.** Vola is not played (open question 13); the exception is not offered. *Documented: Torino 1787, p. 34 (rule 38): the Fool may be put away «in un sol caso … guadagnar la partita vola»; Turin 1880, p. 9: «as peul dcò scartesse quand ch'a iè la certëssa d'fè la vola»; Dummett 1980, p. 259 reads the same.* <!-- left_out: fool_discard_for_vola -->
- **Milan 1794.** Customs of Milan, not of Turin: the book of 1787 decides for its own games (a revoke pays the simple game to all, p. 33; kings may not be discarded, p. 90; the pairs are fixed, p. 88). Recorded so that the difference is seen; not played. *Documented: Per chi tarocca, Milan, 1794 (the neighbours of the Turin game): a revoke costs ten points of the count, «ordinariamente porta la penale di soli dieci punti» (p. 21); no trump may be discarded, «Se chi scarta scartasse un onore, od un tarocco perderà dieci punti» (pp. 23-24), while a king in the discard is ordinary play (p. 36); the partners change in the course of an evening (pp. 13, 31); one card turned by accident in the deal is no misdeal, «si volta per accidente una carta, non si va a monte» (p. 17).* <!-- left_out: milan_1794 -->
- **Best cut names dealer.** Not played: the table has no choice for the winner of the cut; the first dealer is the one the table gives (seats.first_dealer best_cut says only that he is the one who cut best). Revision 11. *Documented: Torino 1787, p. 89: whoever cuts best of the other three «comanda agli altri di fare»: he deals himself («o fa, mischia, e scarta egli stesso») or tells whom he likes to deal; Torino [1846], part I, p. 35, says the same.* <!-- left_out: best_cut_names_dealer -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] | held |
| Milan 1794 | Per chi tarocca. Almanacco critico-istruttivo per l'anno 1794, Milano, Luigi Veladini [1793/94]; Biblioteca Trivulziana, Triv M 1542 | held |
| Turin 1880 | C. C. Tarocaire, La partia a taroch an quatr. Regolament e caprissi, Turin, Stamperia Leteraria, 1880 | held |

Generated from `rulesets/partita_4.json`, rules revision 11. Do not edit: change the game file.
