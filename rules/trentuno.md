# Thirty-one (Trent’uno)

2 to 4 players. In the book of 1787: pp. 45-46. Status: playable, with decisions of ours where the book is silent. Rules revision 13.

Trent'uno («Trent'uno»), pp. 45-46 of the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787): Sedici with eight covered cards to each player and thirty-one points to win (pp. 45-46: «Premesse tutte le sopradette regole»). Everything of Sedici applies unless said otherwise: the Fool is the lowest trionfo and counts one point, Bagatto takes it, the cards are counted singly, the dealer goes on dealing until somebody says «fuora» (pp. 36-41, 51). The section does not say how many play; it is read after Sedici, for two, three or four. A plain card is worth 1 (since revision 2, by calculation; Dummett 1980, p. 269, allows it), a false claim is paid double under 16 points, and when the pack runs out before anybody has said «fuora» the hand ends with no payment: our decisions, each leaf says whose reading. A match is a race to five points, each game won being one: Prammatica [1846], pp. 11-12 says it of Sedici, and Trent'uno «non differisce dal Sedici che nel numero»; the number five is our reading of p. 13. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 2, 3, 4. *Our reading: Torino [1846], part I, p. 28.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- This rule depends on the number of players. *Our reading: p. 45.* <!-- rule: seats.dealer_rotation -->
 - With 2 players: The dealers alternate. Other reading: The winner hands the pack to his companion, who shuffles and deals.
 - With 3 or 4 players: The deal passes to the right. Other reading: to the right.
- Each player plays for himself. *Our reading: book, p. 40.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, pp. 9-10.* <!-- rule: cards.deck -->
- Rank of the trumps: Trump 20 — Angel, Trump 21 — World, Trump 19 — Sun, Trump 18 — Moon, Trump 17 — Star, Trump 16 — Tower, Trump 15 — Devil, Trump 14 — Temperance, Trump 13 — Death, Trump 12 — Traitor, Trump 11 — Strength, Trump 10 — Wheel of Fortune, Trump 9 — Hermit, Trump 8 — Justice, Trump 7 — Chariot, Trump 6 — Love, Trump 5 — Pope, Trump 4 — Emperor, Trump 3 — Empress, Trump 2 — Papess, Trump 1 — Magician, Fool. *Documented: from the book, p. 13.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Card values: the kings: 5; the queens: 4; the knights: 3; the jacks: 2; Trump 20 — Angel: 5; Trump 1 — Magician: 5; Fool: 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool plays as the lowest trump. *Documented: from the book, p. 36.* <!-- rule: cards.fool -->

### By agreement / Variants

- Stake: a choice of 1, 2, 5 or 10 units; by default 1 unit. *Documented: from the book, p. 21.* <!-- rule: options.stake -->
- variant: Prammatica: the Fool takes Bagatto, the first to make the points wins. *Documented: from Prammatica [1846], p. 12.* <!-- rule: variants.prammatica_1846 -->

### The deal

- Cards dealt to each player: 8. *Documented: from the book, pp. 45-46.* <!-- rule: hand.deal.hand_size -->
- In the book the dealer may deal one, two or more cards at a time; here all are dealt at once: with a fair shuffle the way of dealing does not change the hands. *Our reading: book, p. 18.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Our reading: book, pp. 17-18.* <!-- rule: hand.deal.packets_announced -->
- The cards are dealt face down. *Documented: from the book, pp. 45-46.* <!-- rule: hand.deal.face -->
- The other cards stay face down as a stock, in order; the next round of the same game is dealt from it. *Our reading: book, p. 39.* <!-- rule: hand.deal.dead -->

### The tricks

- The next round of the same game starts with the taker of the last trick; the first round of each game starts with the player on the dealer's right. *Our reading: book, p. 37.* Other reading: The player on the dealer's right leads first. <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, pp. 35-36.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Our reading: Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* <!-- rule: hand.tricks.must_overtrump -->

### Fuora (while the tricks are played)

This step: *Documented: from the book, pp. 45-46.*

- Fuora is played to 31 points. *Documented: from the book, p. 46.* <!-- rule: hand.fuora.target -->
- You may say «fuora» at any turn of your own, even in the middle of a trick. *Our reading: book, p. 40.* Other reading: A claim of points is made after a trick. <!-- rule: hand.fuora.claim_when -->
- Nothing forces you to say «fuora» at the end of a packet: the next one is dealt. Only when the pack is spent does a last window ask each player in turn, from the taker of the last trick, to say «fuora» or not. *Documented: from the book, pp. 39-40.* Other reading: The taker of the last trick of a packet who has the points must say «fuora» before the next deal. <!-- rule: hand.fuora.at_round_end -->
- The game goes to the player who says «fuora» rightly. *Documented: from the book, pp. 45-46.* Other reading: The game goes to the first player to have made the points, whoever says «fuora». <!-- rule: hand.fuora.winner_is -->
- When the first player is out, the hand ends. *Documented: from the book, pp. 40-41.* <!-- rule: hand.fuora.after_first_out -->
- A false claim is paid for; the size of the penalty is in the game file. *Sources silent, our decision.* Other reading: from: 0; pays: stake: simple. Open question 11: could be settled by a document in which the rule is printed or a mathematical analysis (a false «fuora»); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.fuora.false_claim -->
- A player who claims wrongly pays for it and the play goes on. *Our reading: book, p. 20.* Other reading: A player who claims wrongly loses the partita. Open question 25: could be settled by a document in which the rule is printed or statistics of games played by bots (a false «fuora»: does the game go on or end); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.fuora.after_false_claim -->
- If the stock runs out, the hand ends with no winner. *Sources silent, our decision, after Dummett (1980), p. 269.* Open question 10: could be settled by a document in which the rule is printed or statistics of games played by bots (the pack runs out and nobody has said «fuora»); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.fuora.stock_empty -->

### The count

- Each card is counted alone. *Documented: from the book, pp. 51-52.* <!-- rule: hand.count.group -->
- There are no multipliers for tricks. *Our reading: book.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book.* <!-- rule: hand.count.last_trick_bonus -->
- A plain card is worth 1. *Sources silent, our decision.* Other reading: A plain card is worth 0. Open question 9: could be settled by a document in which the rule is printed or statistics of games played by bots (the value of a plain card counted singly); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.count.plain_value -->

### The result of a hand

- Whoever first rightly says «fuora» wins: he has reached the points needed and says so. He may still hold cards. *Documented: from the book, p. 46.* <!-- rule: hand.result.winner -->
- The winner of a hand gains one game point. *Our reading: Prammatica [1846], pp. 11-12.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 21.* <!-- rule: hand.settle.unit -->
- The losers pay the winner. *Our reading: book, p. 41.* <!-- rule: hand.settle.mode -->
- The amount of the settlement: the simple stake. *Documented: from the book, p. 21.* <!-- rule: hand.settle.amount -->

### The match

- The match is a race: each partita won gives points, and whoever reaches the target first wins. When the leaders are level at the target or above, another game is played, until one leads alone. *Documented: from Prammatica [1846], pp. 11-12.* Other reading: The match is kept as a ledger of hands. <!-- rule: match.kind -->
- A match is played to 5 points. *Our reading: Prammatica [1846], p. 13.* Open question 26: could be settled by a document in which the rule is printed or a trial with live players (which custom was played, a race or «al primo vada», to how many points, and what is done when the leaders are level); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.target -->

### Offences

- The offence «revoke» cannot happen at this table. By the book, the offender pays the simple stake to each of the others; while the trick is open, the card may be changed. *Documented: from the book, pp. 33-34.* <!-- rule: penalties.revoke -->
- The offence «a wrong way of dealing» cannot happen at this table. By the book, the offender pays the simple stake to each of the others. *Documented: from the book, p. 42.* <!-- rule: penalties.deal_other_way -->
- The offence «misdeal» cannot happen at this table. By the book, the offender pays the stake of the game to each of the others; then the deal passes to the right. *Documented: from the book, pp. 18-19.* <!-- rule: penalties.misdeal -->

## Not played yet

- **Passo exchange.** A custom by agreement, not in Torino 1787; not played. *Documented: Torino [1846], part I, p. 30: «passar o gettar via carte», replaced from the pack, by general consent.* <!-- left_out: passo_exchange -->
- **Revoke check.** The engine bars an illegal card, so no claim arises. *Our reading: Torino 1787, p. 44 (rule 46), a rule of Sedici kept for Trent'uno by p. 45 («Premesse tutte le sopradette regole»): a revoke claimed is looked at only when the game is over; nobody may mix the covered cards on the table, even his own, on pain of paying «la partita dell'Onoranza».* <!-- left_out: revoke_check -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Dummett (1980) | M. Dummett, The Game of Tarot, London, Duckworth, 1980; chapter XIII, pp. 258-279 | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] | held |

Generated from `rulesets/trentuno.json`, rules revision 13. Do not edit: change the game file.
