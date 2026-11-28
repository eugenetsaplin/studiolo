# Less (Meno)

2 to 7 players. In the book of 1787: pp. 78-79. Status: playable, with decisions of ours where the book is silent. Rules revision 14.

Meno, «Del giuoco del Meno» (pp. 78-79) of the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787; the page seen again on the image for this file): the reverse game, in which the winner is «chi fa meno punti» (p. 78). It is described in one paragraph: it is played with four cards as at Sedici, eight as at Trent'uno, or with 25 cards for two players, 25 for three, 19 for four, 15 for five, 13 for six and 11 for seven; the answers are in the suit asked, a trionfo on a trionfo, and never a revoke; the penalties of the other rules hold for Meno too (pp. 78-79). The section says nothing of how the cards are counted, what is done with the cards that are not dealt, who leads, whether a void player must trump, the Fool, or what is paid. Where the section is silent the file follows Dummett 1980, p. 269, or our decision; each leaf says which. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 2, 3, 4, 5, 6, 7. *Documented: from the book, p. 78.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Sources silent, our decision, after Torino [1846], part I, p. 18.* <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, p. 78.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Our reading: book, p. 78.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, p. 13.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Sources silent, our decision.* <!-- rule: cards.fool -->
- The card for the Fool goes to the winner of the trick. *Our reading: Torino [1846], part I, p. 33.* Other reading: The card for the Fool goes to the opponent. <!-- rule: cards.fool_exchange_to -->
- The owner of the Fool picks the card he gives. *Our reading: book, p. 52.* Other reading: The cheapest of the cards he has won is given for the Fool. Question 18 of the list: could be settled by statistics of games played by bots or a trial with live players (who chooses the card given for the Fool); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_exchange_card -->
- A player who took no trick gives nothing for the Fool. *Our reading: book, p. 21.* Other reading: A player who took no trick gives up the Fool itself. Question 2 of the list: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- Stake: a choice of 1, 2, 5 or 10 units; by default 1 unit. *Documented: from the book, p. 21.* <!-- rule: options.stake -->
- With 2 or 3 players only: Variant: Short deal: four cards (two or three players). *Partly printed (p. 78), partly our reading.* <!-- rule: variants.four_cards -->
- In this variant: Players at the table: 2, 3. *Sources silent, our decision.* <!-- rule: variants.four_cards.seats.count -->
- In this variant: Cards dealt to each player: 4. *Documented: from the book, p. 78.* <!-- rule: variants.four_cards.hand.deal.hand_size -->
- In this variant: Each card is counted alone. *Our reading: book, p. 78.* <!-- rule: variants.four_cards.hand.count.group -->
- In this variant: A plain card is worth 1. *Our reading: Prammatica [1846], p. 12.* Other reading: A plain card is worth 0. <!-- rule: variants.four_cards.hand.count.plain_value -->
- In this variant: Rank of the trumps: Trump 20 — Angel, Trump 21 — World, Trump 19 — Sun, Trump 18 — Moon, Trump 17 — Star, Trump 16 — Tower, Trump 15 — Devil, Trump 14 — Temperance, Trump 13 — Death, Trump 12 — Traitor, Trump 11 — Strength, Trump 10 — Wheel of Fortune, Trump 9 — Hermit, Trump 8 — Justice, Trump 7 — Chariot, Trump 6 — Love, Trump 5 — Pope, Trump 4 — Emperor, Trump 3 — Empress, Trump 2 — Papess, Trump 1 — Magician, Fool. *Our reading: p. 78.* <!-- rule: variants.four_cards.cards.trump_order -->
- In this variant: Kings, the Angel and the Bagatto are worth 5, queens 4, knights 3, jacks 2 and the Fool 1. *Our reading: p. 78.* <!-- rule: variants.four_cards.cards.card_points -->
- In this variant: The Fool plays as the lowest trump. *Our reading: p. 78.* <!-- rule: variants.four_cards.cards.fool -->
- With 2, 3, 4 or 5 players only: Variant: Short deal: eight cards (two to five players). *Partly printed (p. 78), partly our reading.* <!-- rule: variants.eight_cards -->
- In this variant: Players at the table: 2, 3, 4, 5. *Sources silent, our decision.* <!-- rule: variants.eight_cards.seats.count -->
- In this variant: Cards dealt to each player: 8. *Documented: from the book, p. 78.* <!-- rule: variants.eight_cards.hand.deal.hand_size -->
- In this variant: Each card is counted alone. *Documented: from Torino [1846], part I, pp. 30-31.* <!-- rule: variants.eight_cards.hand.count.group -->
- In this variant: A plain card is worth 1. *Our reading: Torino [1846], part I, pp. 30-31, 37.* Other reading: A plain card is worth 0. <!-- rule: variants.eight_cards.hand.count.plain_value -->
- In this variant: A player who takes every trick (a vola) wins alone and all the others pay him. *Partly printed (Torino [1846], part I, p. 32), partly our decision.* Other reading: If one player takes every trick, the ordinary points decide. <!-- rule: variants.eight_cards.hand.result.vola -->
- In this variant: Rank of the trumps: Trump 20 — Angel, Trump 21 — World, Trump 19 — Sun, Trump 18 — Moon, Trump 17 — Star, Trump 16 — Tower, Trump 15 — Devil, Trump 14 — Temperance, Trump 13 — Death, Trump 12 — Traitor, Trump 11 — Strength, Trump 10 — Wheel of Fortune, Trump 9 — Hermit, Trump 8 — Justice, Trump 7 — Chariot, Trump 6 — Love, Trump 5 — Pope, Trump 4 — Emperor, Trump 3 — Empress, Trump 2 — Papess, Trump 1 — Magician, Fool. *Our reading: p. 78.* <!-- rule: variants.eight_cards.cards.trump_order -->
- In this variant: Kings, the Angel and the Bagatto are worth 5, queens 4, knights 3, jacks 2 and the Fool 1. *Documented: from Torino [1846], part I, p. 31.* <!-- rule: variants.eight_cards.cards.card_points -->
- In this variant: The Fool plays as the lowest trump. *Documented: from Prammatica [1846], p. 6.* <!-- rule: variants.eight_cards.cards.fool -->

### The deal

- Cards dealt to each player: 25 for 2 and 3 players; 19 for 4 players; 15 for 5 players; 13 for 6 players; 11 for 7 players. *Documented: from the book, p. 78.* <!-- rule: hand.deal.hand_size -->
- The cards are dealt face down. *Our reading: book, p. 78.* <!-- rule: hand.deal.face -->
- The dealer gets as many as the others. *Sources silent, our decision, after Dummett (1980), p. 269.* <!-- rule: hand.deal.dealer_extra -->
- The other cards lie face down out of play. *Sources silent, our decision, after Dummett (1980), p. 269.* <!-- rule: hand.deal.dead -->

### The tricks

- You must follow suit if you can. *Documented: from the book, pp. 78-79.* <!-- rule: hand.tricks.follow_suit -->
- The player on the dealer's right leads first. *Our reading: book, p. 35.* Question 19 of the list: could be settled by the opinion of an expert or statistics of games played by bots (the count and the first lead of Meno); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* <!-- rule: hand.tricks.next_leader -->
- With no card of the suit you must trump. *Our reading: Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Sources silent, our decision.* <!-- rule: hand.tricks.must_overtrump -->

### The count

- A card left without a pair is worth its value less half a point, as in a pair. *Sources silent, our decision.* <!-- rule: hand.count.odd_card -->
- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Sources silent, our decision, after Dummett (1980), p. 269.* Question 19 of the list: could be settled by the opinion of an expert or statistics of games played by bots (the count and the first lead of Meno); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.count.group -->

### The result of a hand

- If one player takes every trick, the ordinary points decide. *Sources silent, our decision.* <!-- rule: hand.result.vola -->
- Fewer points wins the hand. *Documented: from the book, p. 78.* <!-- rule: hand.result.winner -->
- A hand gives no game points. *Sources silent, our decision.* Question 34 of the list: could be settled by a document in which the rule is printed or the opinion of an expert (who wins and who pays in Meno, and what happens when the fewest points are equal); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.result.game_points -->
- If several players tie for the best result, they all win; if all tie, the hand is a tie. *Sources silent, our decision.* Other reading: If the points are equal, nobody gains game points. Question 34 of the list: could be settled by a document in which the rule is printed or the opinion of an expert (who wins and who pays in Meno, and what happens when the fewest points are equal); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.result.tie -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 21.* <!-- rule: hand.settle.unit -->
- The amount of the settlement: the simple stake. *Documented: from the book, p. 21.* <!-- rule: hand.settle.amount -->
- One player pays: the loser, the one with the worst result. If several tie for the worst, all of them pay. *Our reading: Torino [1846], part I, p. 32.* Other reading: The losers pay the winner. Question 34 of the list: could be settled by a document in which the rule is printed or the opinion of an expert (who wins and who pays in Meno, and what happens when the fewest points are equal); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.settle.mode -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Sources silent, our decision.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. <!-- rule: match.dealer_rounds -->

### Offences

- The offence «revoke» cannot happen at this table. By the book, the offender pays the simple stake to each of the others; while the trick is open, the card may be changed. *Documented: from the book, p. 79.* <!-- rule: penalties.revoke -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Dummett (1980) | M. Dummett, The Game of Tarot, London, Duckworth, 1980; chapter XIII, pp. 258-279 | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] | held |

Generated from `rulesets/meno.json`, rules revision 14. Do not edit: change the game file.
