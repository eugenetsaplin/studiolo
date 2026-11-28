# Bagatto last (Bagatt’ultimo)

3 players. In the book of 1787: pp. 91-96. Status: playable, with decisions of ours where the book is silent. Rules revision 14.

Bagatt'ultimo, «ossia Mitigati» (the game is played «comunemente in tre persone»), pp. 91-96 of the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787), read on the scan and checked again on 23 November 2026 (every page 87-100 compared with the image): three players each for himself, 25 cards each and 28 for the dealer, who discards three; dealt in three rounds, by custom 5, 10, 10 (pp. 91-92); before the first card the players declare honours (three or more, without naming them), ten or more trumps (laid on the table) and Mitigati (Angel, Bagatto and Fool), the dealer having said «Ho scartato» (pp. 93, 95); declarations are paid at once in marche (pp. 94-95); a hand is won with 26 points, the cards counted in threes (pp. 95-96); Bagatto taken in the last trick pays or is paid thirty marche, in the course of the game five (p. 96). Silent in the section: how the dealer's three extra cards are dealt, the order of play and the rules of the trick (taken from the general rules), who pays the game and how much, the odd card of a count in threes. Those are left_out or [R]. Dummett's payments (10 from each for 26, ghinghetta, Bagatto ultimo as a declaration) belong to the rules of 1830, not to the book; since revision 2 the payment of the hand is played as he gives it: 10 marche from each player short of 26 to each who reached it. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 3. *Documented: from the book, p. 91.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, pp. 94-96.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, p. 91.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, p. 13.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Partly printed (pp. 11-13), partly our reading.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The set «honours»: the kings, Trump 20 — Angel, Fool, Trump 1 — Magician. *Documented: from the book, p. 34.* <!-- rule: cards.sets.honours -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Our reading: book, pp. 91-96.* Other reading: The Fool plays as the lowest trump. <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Our reading: book, p. 52.* <!-- rule: cards.fool_exchange -->
- The card for the Fool goes to the winner of the trick. *Our reading: Torino [1846], part I, p. 33.* <!-- rule: cards.fool_exchange_to -->
- The owner of the Fool picks the card he gives. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: cards.fool_exchange_card -->
- A player who took no trick gives nothing for the Fool. *Our reading: book, p. 21.* Other reading: A player who took no trick gives up the Fool itself. Question 2 of the list: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- Worth of a marca: a choice of 1, 2, 5 or 10 units; by default 1 unit. *Partly printed (p. 93), partly our decision.* <!-- rule: options.marca_value -->
- Variant: Dealing in packets of ten, five and ten cards. *Documented: from the book, p. 92.* <!-- rule: variants.packets_10_5_10 -->
- In this variant: The cards are dealt in packets of: 10, 5, 10. *Documented: from the book, p. 92.* <!-- rule: variants.packets_10_5_10.hand.deal.packets -->
- Variant: Mitigati paid at thirty marche. *Partly printed (p. 96), partly our decision.* <!-- rule: variants.mitigati_thirty -->
- In this variant: The kinds of declaration: Onori (at least 3 of the honours; announced with the count): pays 10 marche for 3 cards, 15 marche for 4 cards, 20 marche for 5 cards, and 5 more for each further card; Trionfi (at least 10 of the trumps; laid open): pays as many as there are cards; Mitigati (all of Trump 20 — Angel, Trump 1 — Magician, Fool; announced): pays 30 marche, it carries the payment of “Onori”. *Partly printed (p. 96), partly our reading.* <!-- rule: variants.mitigati_thirty.hand.declarations.kinds -->

### The deal

- Cards dealt to each player: 25. *Documented: from the book, p. 91.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 3 more. *Documented: from the book, p. 91.* <!-- rule: hand.deal.dealer_extra -->
- The cards are dealt in packets of: 5, 10, 10. *Documented: from the book, pp. 91-92.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Documented: from the book, p. 92.* <!-- rule: hand.deal.packets_announced -->
- Dealing starts with the player on the dealer's right. *Documented: from the book, pp. 91-92.* <!-- rule: hand.deal.order -->
- The whole pack is dealt, no cards are left over. *Documented: from the book, p. 91.* <!-- rule: hand.deal.dead -->
- The dealer gets his extra cards last. *Sources silent, our decision, after Dummett (1980), pp. 260, 262.* <!-- rule: hand.deal.extra_when -->

### The discard

- The dealer puts cards away. *Documented: from the book, p. 91.* <!-- rule: hand.discard.who -->
- Cards put away: 3. *Documented: from the book, p. 91.* <!-- rule: hand.discard.count -->
- Honours may not be put away. *Our reading: book, p. 34.* <!-- rule: hand.discard.discard_honours_barred -->
- The discard is announced with «ho scartato» and is final. *Documented: from the book, p. 95.* <!-- rule: hand.discard.announce -->
- The discard counts for the player who put it away. *Our reading: book, p. 21.* Other reading: The discard counts for its owner if he took at least one trick. Question 1 of the list: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard.counts_for -->

### Declarations

- A declaration may be made after the discard and before the first card. *Documented: from the book, p. 95.* <!-- rule: hand.declarations.window -->
- The kinds of declaration: Onori (at least 3 of the honours; announced with the count): pays 10 marche for 3 cards, 15 marche for 4 cards, 20 marche for 5 cards, and 5 more for each further card; Trionfi (at least 10 of the trumps; laid open): pays as many as there are cards; Mitigati (all of Trump 20 — Angel, Trump 1 — Magician, Fool; announced): pays 10 marche, it carries the payment of “Onori”. *Partly printed (pp. 93-95), partly our reading.* Other reading: The kinds of declaration: Onori (at least 3 of the honours; announced with the count): pays 10 marche for 3 cards, 15 marche for 4 cards, 20 marche for 5 cards, and 5 more for each further card; Trionfi (at least 10 of the trumps; laid open): pays as many as there are cards; Mitigati (all of Trump 20 — Angel, Trump 1 — Magician, Fool; announced): pays 10 marche. <!-- rule: hand.declarations.kinds -->
- Whoever declares late loses the right to declare. *Documented: from the book, p. 95.* <!-- rule: hand.declarations.late -->
- The players make the declarations themselves. *Our reading: book, p. 93.* Other reading: The engine makes the declarations for the players. <!-- rule: hand.declarations.mode -->
- Payment is made at once. *Documented: from the book, p. 94.* <!-- rule: hand.declarations.paid -->
- Each of the others pays. *Documented: from Torino [1846], part I, p. 52.* <!-- rule: hand.declarations.paid_by -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, pp. 91-96.* <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 50.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, p. 49.* <!-- rule: hand.tricks.must_overtrump -->

### The count

- Cards are counted in groups of 3: a group is worth the sum of its values less one point for each extra card. *Documented: from the book, p. 96.* <!-- rule: hand.count.group -->
- There are no multipliers for tricks. *Our reading: book.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book.* <!-- rule: hand.count.last_trick_bonus -->
- A single card counts as a short group. *Our reading: book, p. 96.* <!-- rule: hand.count.odd_card -->
- The Fool's card is part of the count. *Our reading: Torino [1846], part I, p. 33.* <!-- rule: hand.count.fool_card -->

### The result of a hand

- Whoever reaches the threshold wins. *Documented: from the book, pp. 95-96.* <!-- rule: hand.result.winner -->
- The threshold is 26 points. *Documented: from the book, pp. 95-96.* <!-- rule: hand.result.target -->
- A hand gives no game points. *Sources silent, our decision.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in marche. *Documented: from the book, p. 93.* <!-- rule: hand.settle.unit -->
- The amount of the settlement: 10 marche. *Sources silent, our decision, after Dummett (1980), p. 262.* Other reading: The amount of the settlement: the simple stake. Question 7 of the list: could be settled by a document in which the rule is printed (the payment for the game at 26 points); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.settle.amount -->
- The winners collect from the losers. *Sources silent, our decision, after Dummett (1980), p. 262.* Question 7 of the list: could be settled by a document in which the rule is printed (the payment for the game at 26 points); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.settle.mode -->
- Whoever takes the last trick with Trump 1 — Magician collects 30 marche from each other player. *Partly printed (p. 96), partly our reading.* Other reading: The 30 marche is paid once in all, and the other players share it. <!-- rule: hand.settle.payments[bagatto_last] -->
- Whoever lets Trump 1 — Magician be taken in the last trick pays 30 marche to each other player. *Documented: from the book, p. 96.* <!-- rule: hand.settle.payments[bagatto_lost_last] -->
- Whoever lets Trump 1 — Magician be taken before the last trick pays 5 marche to each other player. *Documented: from the book, p. 96.* <!-- rule: hand.settle.payments[bagatto_lost] -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Sources silent, our decision.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. <!-- rule: match.dealer_rounds -->

### Offences

- The offence «revoke» cannot happen at this table. By the book, the offender pays 10 marche. *Documented: from the book, p. 87.* <!-- rule: penalties.ficcia -->
- The offence «misdeal» cannot happen at this table. By the book, the offender pays 10 marche. *Documented: from the book, p. 87.* <!-- rule: penalties.ficcia_misdeal -->
- The offence «a card turned face up in the deal» cannot happen at this table. By the book: a redeal for all; only before the cards are seen. *Documented: from the book, p. 92.* <!-- rule: penalties.faced_card -->

## Not played yet

- **Bagatto discard.** Not played in this game: the file bars the honours from the discard without exception (discard_honours_barred); the engine could play the exception (discard.allowed_exceptions), but the file does not list it. *Documented: Torino 1787, p. 34 (rule 38): «eccetto che Bagatto sia solo, senza il Folle»: the Bagatto may be put away when it is the only trump of the hand («solo» is so read since revision 2, as Dummett 1980, p. 259 reads it).* <!-- left_out: bagatto_discard -->
- **Bagatto ultimo declaration.** The declaration is printed in Torino [1846], but Torino 1787, p. 96 pays Bagatto last without one, and the book of 1787 decides; not played (open question 17). *Documented: Torino [1846], part I, pp. 44-45 (read on the Academy's separate image of the missing pages): Bagatto last is declared, «ponendolo a tal uopo in tavola avanti di sè»; p. 53, Mitigati for three: «quando l'abbia per tale dichiarato». Dummett 1980, p. 262 (after RI 1830, «not allowed for in PE»): also ghinghetta, a pool for it, and a counter-announcement to take Bagatto, 60 marche.* <!-- left_out: bagatto_ultimo_declaration -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] | held |
| Nice 1930 (Cason) | F. Cason, «Les jeux de cartes à Nice», Armanac Nissart, Nice, 1930, pp. 277-290 | held |
| Dummett (1980) | M. Dummett, The Game of Tarot, London, Duckworth, 1980; chapter XIII, pp. 258-279 | held |

Generated from `rulesets/bagattultimo.json`, rules revision 14. Do not edit: change the game file.
