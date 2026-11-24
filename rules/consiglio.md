# Council (Consiglio)

4 players. In the book of 1787: p. 97. Status: playable, with decisions of ours where the book is silent. Rules revision 8.

This game is written as [Partita for four](partita_4.md) with differences.

Consiglio (Torino 1787, «Del giuoco del Consiglio», p. 97): four players as in Partita, with the one difference that the two partners sit side by side, show each other their cards and talk freely; «tutto è simile al giuoco di Partita in quattro». To win some players need 46 points, others the most points over a round in which the cards are dealt four times; the table agrees which before the deal (p. 97). The base file plays the first custom; the second is the variant «sum_of_four_deals». Everything not written here is as in Partita, two against two.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 4. *Documented: from the book, p. 97.* Same as in [Partita for four](partita_4.md). <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* Same as in [Partita for four](partita_4.md). <!-- rule: seats.direction -->
- The first dealer is whoever cuts the highest card. *Documented: from the book, p. 89.* Other reading: First dealer: draw high. Same as in [Partita for four](partita_4.md). <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Our reading: book, p. 58.* Same as in [Partita for four](partita_4.md). <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Documented: from the book, p. 17.* Same as in [Partita for four](partita_4.md). <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* Other reading: Change of dealer: to the left. Same as in [Partita for four](partita_4.md). <!-- rule: seats.dealer_rotation -->
- Partners sit side by side. *Documented: from the book, p. 97.* <!-- rule: seats.seating -->
- The players play in fixed pairs. *Documented: from the book, p. 97.* Same as in [Partita for four](partita_4.md). <!-- rule: sides.mode -->
- Points are counted for the side, not for each player. *Documented: from the book, p. 89.* Same as in [Partita for four](partita_4.md). <!-- rule: sides.pool -->
- Signals between partners are forbidden. *Documented: from the book, p. 73.* Same as in [Partita for four](partita_4.md). <!-- rule: sides.signals -->
- Partners see each other's cards. *Documented: from the book, p. 97.* <!-- rule: sides.partners_share_hands -->
- Partners may talk to each other. *Documented: from the book, p. 97.* <!-- rule: sides.partners_talk -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, p. 97.* Same as in [Partita for four](partita_4.md). <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* Same as in [Partita for four](partita_4.md). <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* Same as in [Partita for four](partita_4.md). <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* Same as in [Partita for four](partita_4.md). <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 90.* Same as in [Partita for four](partita_4.md). <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Our reading: book, p. 52.* Other reading: Nothing is given for the Fool. Same as in [Partita for four](partita_4.md). <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Our reading: book, p. 52.* Same as in [Partita for four](partita_4.md). <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the opponent. *Our reading: book, p. 52.* Same as in [Partita for four](partita_4.md). <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives nothing for the Fool. *Our reading: book, p. 50.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Partita for four](partita_4.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- Count in pairs or in fours: choices 2, 4; default 2. *Our reading: book, p. 89.* <!-- rule: options.group -->
- Stake: choices 1, 2, 5, 10; default 1. *Documented: from the book, p. 90.* <!-- rule: options.stake -->
- variant: Sum of four deals: the pair with the larger total wins. *Documented: from the book, p. 97.* <!-- rule: variants.sum_of_four_deals -->

### The deal

- Cards dealt to each player: 19. *Documented: from the book, p. 89.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.deal.hand_size -->
- The dealer gets 2 more. *Documented: from Torino [1846], part I, pp. 40-41.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.deal.dealer_extra -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 59.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Our reading: book, p. 59.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.deal.packets_announced -->
- Dealing starts with the player on the dealer's right. *Our reading: book, p. 59.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.deal.order -->
- The whole pack is dealt, no cards are left over. *Our reading: book, p. 71.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.deal.dead -->

### The discard

This step: *Documented: from the book, p. 89.*

- The dealer puts cards away. *Documented: from the book, p. 89.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.who -->
- Cards put away: 2. *Documented: from the book, p. 71.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.count -->
- Exactly that many are put away. *Documented: from Torino [1846], part I, p. 36.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.count_mode -->
- Honours may not be put away. *Our reading: book, p. 90.* Other reading: Any card may be put away. Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.discard_honours_barred -->
- These may not be put away: Trump 1 — Magician, rank:K. *Documented: from the book, p. 90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.barred -->
- There are exceptions to the ban, they depend on the hand. *Our reading: book, p. 34.* Other reading: . Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.allowed_exceptions -->
- The discard counts for the player who put it away. *Sources silent, our decision.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.counts_for -->
- The discard is announced with «ho scartato» and is final. *Our reading: book, p. 60.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.discard.announce -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, p. 61.* Other reading: First lead: declarer. Same as in [Partita for four](partita_4.md). <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.tricks.fool_may_lead -->

### The count

- Cards are counted in pairs: a card is worth its value and half a point more. *Our reading: book, pp. 88-90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.count.count_unit -->
- Cards are counted in groups of option:group: a group is worth the sum of its values less one point for each extra card. *Documented: from the book, p. 89.* <!-- rule: hand.count.group -->
- A single card without a pair counts as half a point and its value. *Documented: from the book, p. 90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Our reading: Turin 1880, pp. 88-90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.count.fool_card -->

### The result of a hand

- Whoever reaches the threshold wins. *Our reading: book, p. 97.* Other reading: More points wins the hand. <!-- rule: hand.result.winner -->
- If the points are equal, nobody gains game points. *Our reading: Turin 1880, pp. 89-90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.result.tie -->
- A hand gives no game points. *Sources silent, our decision.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.result.game_points -->
- The threshold is 46 points. *Documented: from the book, p. 97.* <!-- rule: hand.result.target -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.settle.unit -->
- The pair shares the win; with unequal sides (one against three) the declarer settles with each opponent. *Documented: from the book, p. 90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.settle.mode -->
- The amount of the settlement: the stake: as agreed. The Onoranza of the contract and the points beyond the line are counted apart. *Documented: from the book, p. 90.* Same as in [Partita for four](partita_4.md). <!-- rule: hand.settle.amount -->

### The match

- The match is kept as a ledger of hands. *Our reading: book, p. 90.* Open question 24: could be settled by a document in which the rule is printed or a trial with live players (one stake at the end of the partita, or the marche after every deal); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Partita for four](partita_4.md). <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn. The marche are settled after every deal; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Our reading: book, p. 97.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn. The marche are settled after every deal; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. Open question 24: could be settled by a document in which the rule is printed or a trial with live players (one stake at the end of the partita, or the marche after every deal); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Partita for four](partita_4.md). <!-- rule: match.dealer_rounds -->

### Offences

- Offence «revoke»: impossible at the table; penalty: pays: simple game; to: each of the others. *Documented: from the book, p. 90.* <!-- rule: penalties.revoke -->
- Offence «signal»: text only; penalty: pays: simple game; to: each of the others; then: lone player may stop. *Documented: from the book, p. 73.* <!-- rule: penalties.signal -->
- Offence «call own card»: impossible at the table; penalty: allowed: no. *Documented: from the book, p. 89.* <!-- rule: penalties.go_alone -->

## Not played yet

- **Marcio vola premiums.** Not in the 1787 book; the stake is the agreed simple sum. *Our reading: Dummett 1980, p. 261 (his guesses, not printed in the book): a double payment when the loser has fewer than 18 points, a triple for a vola, an extra for each five points.* <!-- left_out: marcio_vola_premiums -->
- **Fool discard for vola.** Vola is not played (open question 13); the exception is not offered. *Documented: Torino 1787, p. 34 (rule 38): the Fool may be put away «in un sol caso … guadagnar la partita vola»; Turin 1880, p. 9: «as peul dcò scartesse quand ch'a iè la certëssa d'fè la vola»; Dummett 1980, p. 259 reads the same.* <!-- left_out: fool_discard_for_vola -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 (our scan is partial: printed page 268 is missing) | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] (separate issue, cover dated 1846, deposited 27 December 1845; reprinted from the same setting, same pages, as part II of Il giuocatore di tarocchi al tavoliere, Torino, Serra, [1846]) | held |
| Turin 1880 | C. C. Tarocaire, La partia a taroch an quatr. Regolament e caprissi, Turin, Stamperia Leteraria, 1880 | held |

Generated from `rulesets/consiglio.json`, rules revision 8. Do not edit: change the game file.
