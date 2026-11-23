# Thirty-one (Trent’uno)

2 to 4 players. In the book of 1787: pp. 45-46. Status: playable, with decisions of ours where the book is silent. Rules revision 3.

Trent'uno («Trent'uno»), pp. 45-46 of the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787): Sedici with eight covered cards to each player and thirty-one points to win (pp. 45-46: «Premesse tutte le sopradette regole»). Everything of Sedici applies unless said otherwise: the Fool is the lowest trionfo and counts one point, Bagatto takes it, the cards are counted singly, the dealer goes on dealing until somebody says «fuora» (pp. 36-41, 51). The section does not say how many play; it is read after Sedici, for two, three or four. A plain card is worth 1 (since revision 2, by calculation; Dummett 1980, p. 269, allows it), a false claim is paid double under 16 points, and when the pack runs out before anybody has said «fuora» the hand ends with no payment: our decisions, each leaf says whose reading. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 2, 3, 4. *Our reading: Torino [1846], part I, p. 28.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Documented: from the book, p. 16.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Sources silent, our decision, after Torino [1846], part I, p. 41.* <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, pp. 45-46.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, pp. 9-10.* <!-- rule: cards.deck -->
- Rank of the trumps: Trump 20 — Angel, Trump 21 — World, Trump 19 — Sun, Trump 18 — Moon, Trump 17 — Star, Trump 16 — Tower, Trump 15 — Devil, Trump 14 — Temperance, Trump 13 — Death, Trump 12 — Traitor, Trump 11 — Strength, Trump 10 — Wheel of Fortune, Trump 9 — Hermit, Trump 8 — Justice, Trump 7 — Chariot, Trump 6 — Love, Trump 5 — Pope, Trump 4 — Emperor, Trump 3 — Empress, Trump 2 — Papess, Trump 1 — Magician, Fool. *Documented: from the book, p. 13.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Card values: rank:K: 5; rank:Q: 4; rank:N: 3; rank:J: 2; T20: 5; T1: 5; T0: 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool plays as the lowest trump. *Documented: from the book, p. 36.* <!-- rule: cards.fool -->

### By agreement / Variants

- stake: choices 1, 2, 5, 10; default 1. *Documented: from the book, p. 21.* <!-- rule: options.stake -->

### The deal

- Cards dealt to each player: 8. *Documented: from the book, pp. 45-46.* <!-- rule: hand.deal.hand_size -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 18.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Our reading: book, pp. 17-18.* <!-- rule: hand.deal.packets_announced -->
- The cards are dealt face down. *Documented: from the book, pp. 45-46.* <!-- rule: hand.deal.face -->
- The other cards: stock. *Our reading: book, p. 39.* <!-- rule: hand.deal.dead -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, p. 35.* Other reading: The taker of the last trick of the previous hand leads first. <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, pp. 35-36.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Our reading: Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* <!-- rule: hand.tricks.must_overtrump -->

### Fuora (during: tricks)

This step: *Documented: from the book, pp. 45-46.*

- Fuora is played to 31 points. *Documented: from the book, p. 46.* <!-- rule: hand.fuora.target -->
- A claim of points is made after a trick. *Our reading: book, pp. 39-40.* Other reading: When a claim is made: any time. <!-- rule: hand.fuora.claim_when -->
- When the first player is out, the hand ends. *Documented: from the book, pp. 40-41.* <!-- rule: hand.fuora.after_first_out -->
- A false claim is paid for; the size of the penalty is in the game file. *Sources silent, our decision.* Other reading: from: 0; pays: the stake: simple. Open question 11: could be settled by a document in which the rule is printed or a mathematical analysis (a false «fuora»); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.fuora.false_claim -->
- If the stock runs out, the hand ends with no winner. *Sources silent, our decision, after Dummett (1980), p. 39.* Open question 10: could be settled by a document in which the rule is printed or statistics of games played by bots (the pack runs out and nobody has said «fuora»); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.fuora.stock_empty -->

### The count

- Each card is counted alone. *Documented: from the book, p. 51.* <!-- rule: hand.count.group -->
- There are no multipliers for tricks. *Our reading: book.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book.* <!-- rule: hand.count.last_trick_bonus -->
- A plain card is worth 1. *Sources silent, our decision.* Other reading: A plain card is worth 0. Open question 9: could be settled by a document in which the rule is printed or statistics of games played by bots (the value of a plain card counted singly); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.count.plain_value -->

### The result of a hand

- Whoever gets rid of his cards first wins. *Documented: from the book, p. 46.* <!-- rule: hand.result.winner -->
- A hand gives no game points. *Our reading: book, p. 41.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 21.* <!-- rule: hand.settle.unit -->
- The losers pay the winner. *Our reading: book, p. 41.* <!-- rule: hand.settle.mode -->
- The amount: the stake: simple. *Documented: from the book, p. 21.* <!-- rule: hand.settle.amount -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->

### Offences

- Offence «revoke»: impossible at the table; penalty: pays: simple game; to: each of the others; while trick open: change card. *Documented: from the book, pp. 33-34.* <!-- rule: penalties.revoke -->
- Offence «wrong deal method»: impossible at the table; penalty: pays: simple game; to: each of the others. *Documented: from the book, p. 42.* <!-- rule: penalties.deal_other_way -->

## Not played yet

- **Passo exchange.** A custom by agreement, not in Torino 1787; not played. *Documented: Torino [1846], part I, p. 30: «passar o gettar via carte», replaced from the pack, by general consent.* <!-- left_out: passo_exchange -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Dummett (1980) | M. Dummett, The Game of Tarot, London, Duckworth, 1980; chapter XIII, pp. 258-279 (partial scan held, p. 268 missing) | held |

Generated from `rulesets/trentuno.json`, rules revision 3. Do not edit: change the game file.
