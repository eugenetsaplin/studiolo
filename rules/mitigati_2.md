# Mitigati for two (Mitigati)

2 players. In the book of 1787: pp. 85-87. Status: playable, with decisions of ours where the book is silent. Rules revision 9.

Mitigati for two, «il giuoco di tutte le carte in due persone» of the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787, pp. 85-87), read on the scan: the whole pack is used; because 78 cards in the hand are «una confusa faragine» the dealer discards thirteen cards and his opponent twelve (honours never; read as exact, the other reading, up to thirteen, is in the source text), then the dealer deals again all the cards that remain, half each, keeping three more for the usual dealer's discard (pp. 85-86); honours and ten or more trumps are declared before the first trick is covered and paid in marche, Mitigati (Angel, Bagatto, Fool) separately (p. 86, tariff of pp. 93-95); the rest is as in Venticinque for two; the hand is won with 46 points, the Fool's card deducted, counted in pairs (p. 87); a revoke or a misdeal costs ten marche, «una ficcia» (p. 87). The size of the first deal is not printed; the file follows Dummett's reading (26 and 25); 39 and 39 cannot be, as no cards would be left for the second deal. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 2. *Documented: from the book, p. 85.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- The dealers alternate. *Sources silent, our decision.* Other reading: The loser deals. <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, p. 85.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, p. 85.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, p. 13.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The set «honours»: the kings, Trump 20 — Angel, Fool, Trump 1 — Magician. *Documented: from the book, p. 34.* <!-- rule: cards.sets.honours -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 54.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the opponent. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange_to -->
- The Fool is never lost, not even in the last trick. *Documented: from the book, p. 50.* <!-- rule: cards.fool_last_trick -->
- A player who took no trick gives nothing for the Fool. *Sources silent, our decision.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- stake: choices 1, 2, 5, 10; default 1. *Documented: from the book, p. 21.* <!-- rule: options.stake -->
- marca value: choices 1, 2, 5, 10; default 1. *Documented: from the book, p. 93.* <!-- rule: options.marca_value -->

### The deal

This step: *Sources silent, our decision.*

- Cards dealt to each player: the dealer: 26; the dealer's opponent: 25. *Sources silent, our decision, after Dummett (1980), pp. 262-263.* Open question 5: could be settled by a document in which the rule is printed, a mathematical analysis or statistics of games played by bots (the size of the first deal); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.deal_first.hand_size -->
- The dealer gets as many as the others. *Sources silent, our decision, after Dummett (1980), pp. 262-263.* <!-- rule: hand.deal_first.dealer_extra -->

### The discard

This step: *Documented: from the book, p. 85.*

- Every player puts cards away. *Documented: from the book, p. 85.* <!-- rule: hand.discard_first.who -->
- Cards put away: the dealer: 13; the dealer's opponent: 12. *Documented: from the book, p. 85.* <!-- rule: hand.discard_first.count -->
- Exactly that many are put away. *Our reading: book, p. 85.* Other reading: At most that many are put away. Open question 5: could be settled by a document in which the rule is printed, a mathematical analysis or statistics of games played by bots (the size of the first deal and of the first discard); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard_first.count_mode -->
- Honours may not be put away. *Documented: from the book, p. 85.* <!-- rule: hand.discard_first.discard_honours_barred -->
- The discard counts for the player who put it away. *Our reading: book, p. 21.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard_first.counts_for -->

### The deal

This step: *Documented: from the book, pp. 85-86.*

- Each player gets half of the cards left, the dealer his extra cards on top of that. *Documented: from the book, p. 86.* <!-- rule: hand.deal_second.hand_size -->
- The dealer gets 3 more. *Documented: from the book, p. 86.* <!-- rule: hand.deal_second.dealer_extra -->
- The whole pack is dealt, no cards are left over. *Documented: from the book, p. 85.* <!-- rule: hand.deal_second.dead -->
- The cards come from what is left. *Documented: from the book, pp. 85-86.* <!-- rule: hand.deal_second.from -->

### The discard

This step: *Documented: from the book, p. 86.*

- The dealer puts cards away. *Documented: from the book, p. 86.* <!-- rule: hand.discard_second.who -->
- Cards put away: 3. *Documented: from the book, p. 86.* <!-- rule: hand.discard_second.count -->
- The discard is announced with «ho scartato» and is final. *Our reading: Torino [1846], part I, p. 50.* <!-- rule: hand.discard_second.announce -->
- Honours may not be put away. *Documented: from the book, p. 85.* <!-- rule: hand.discard_second.discard_honours_barred -->
- The discard counts for the player who put it away. *Our reading: book, p. 21.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard_second.counts_for -->

### Declarations

- A declaration may be made before the first trick. *Our reading: book, p. 86.* Open question 30: could be settled by a document in which the rule is printed or a trial with live players (when the declarations of Mitigati for two close); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.declarations.window -->
- The kinds of declaration are listed in the game file. *Our reading: book, p. 86.* <!-- rule: hand.declarations.kinds -->
- Whoever declares late loses the right to declare. *Our reading: book, p. 86.* <!-- rule: hand.declarations.late -->
- The players make the declarations themselves. *Our reading: book, pp. 85-86.* Other reading: The engine makes the declarations for the players. <!-- rule: hand.declarations.mode -->
- Payment is made at once. *Our reading: book, p. 86.* <!-- rule: hand.declarations.paid -->
- Each of the others pays. *Our reading: book, p. 86.* <!-- rule: hand.declarations.paid_by -->

### The tricks

- The dealer's opponent leads first. *Documented: from the book, p. 54.* <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 50.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, p. 49.* <!-- rule: hand.tricks.must_overtrump -->

### The count

- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Documented: from the book, p. 87.* <!-- rule: hand.count.group -->
- Cards are counted in pairs: a pair is worth its two values less one point. So each card is worth its value less half a point. *Documented: from the book, p. 52.* <!-- rule: hand.count.count_unit -->
- A card left without a pair is worth its value less half a point, as in a pair. *Our reading: book, pp. 54-55.* Other reading: A card left over, with no full group, does not count. <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Documented: from the book, p. 87.* <!-- rule: hand.count.fool_card -->
- There are no multipliers for tricks. *Our reading: book.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book.* <!-- rule: hand.count.last_trick_bonus -->

### The result of a hand

- Whoever reaches the threshold wins. *Documented: from the book, p. 87.* <!-- rule: hand.result.winner -->
- The threshold is 46 points. *Documented: from the book, p. 87.* <!-- rule: hand.result.target -->
- A hand gives no game points. *Sources silent, our decision.* <!-- rule: hand.result.game_points -->
- If the points are equal, nobody gains game points. *Our reading: book, p. 87.* Open question 14: could be settled by a document in which the rule is printed (equal points, 45½ each); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.result.tie -->

### Settling

- Settling is in marche. *Documented: from the book, pp. 86-87.* <!-- rule: hand.settle.unit -->
- The loser pays the winner. *Our reading: book, p. 87.* <!-- rule: hand.settle.mode -->
- The amount of the settlement: the stake: simple. *Sources silent, our decision.* <!-- rule: hand.settle.amount -->
- Whoever takes the last trick with Trump 1 — Magician collects 30 from each other player. *Sources silent, our decision.* Other reading: The 30 is paid once in all, and the other players share it. <!-- rule: hand.settle.payments[bagatto_last] -->
- Whoever lets Trump 1 — Magician be taken in the last trick pays 30 to each other player. *Sources silent, our decision.* <!-- rule: hand.settle.payments[bagatto_lost_last] -->
- Whoever lets Trump 1 — Magician be taken before the last trick pays 5 to each other player. *Sources silent, our decision.* <!-- rule: hand.settle.payments[bagatto_lost] -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->
- A match lasts 1 round of dealers: the players deal in turn. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Sources silent, our decision.* Other reading: A match lasts 2 rounds of dealers: the players deal in turn. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. Open question 23: could be settled by a document in which the rule is printed or a trial with live players (the length of a match); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.dealer_rounds -->

### Offences

- Offence «revoke»: impossible at the table; penalty: pays: 10; unit: marca. *Documented: from the book, p. 87.* <!-- rule: penalties.ficcia -->
- Offence «misdeal»: impossible at the table; penalty: pays: 10; unit: marca. *Documented: from the book, p. 87.* <!-- rule: penalties.ficcia_misdeal -->

## Not played yet

- **Bagatto discard.** The engine bars the honours from the discard without this exception in this game. *Documented: Torino 1787, p. 34 (rule 38): the Bagatto may be put away when it stands alone, without the Fool.* <!-- left_out: bagatto_discard -->
- **Dummett payment.** A reconstruction by Dummett, not a source; not written. *Documented: Dummett 1980, p. 263 (his guess, not PE): the winner receives 10 game points, or 20 if the loser has less than 23 card points, plus the amount by which he exceeds 46.* <!-- left_out: dummett_payment -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Dummett (1980) | M. Dummett, The Game of Tarot, London, Duckworth, 1980; chapter XIII, pp. 258-279 (partial scan held, p. 268 missing) | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] (separate issue, cover dated 1846, deposited 27 December 1845; reprinted from the same setting, same pages, as part II of Il giuocatore di tarocchi al tavoliere, Torino, Serra, [1846]) | held |

Generated from `rulesets/mitigati_2.json`, rules revision 9. Do not edit: change the game file.
