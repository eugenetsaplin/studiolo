# Twenty-five cards (Venticinque)

2 players. In the book of 1787: pp. 53-56. Status: playable, with decisions of ours where the book is silent. Rules revision 9.

Venticinque is a family of Piedmontese games (Dummett 1980: for three players p. 260, for two players p. 261); this file is the game for two as the Turin rulebook «Primi elementi e regole del giuoco de' tarocchi» (Torino, Soffietti, 1787, «Del giuoco di venticinque carte in due persone», pp. 53-56) gives it, read on its scan, on the 78-card deck: 25 cards to the dealer's opponent, 28 to the dealer who discards 3 (p. 53), the other 25 cards out of play, covered on the table (p. 57), 25 tricks, the cards counted in pairs (p. 52). The rules are the book's: the trionfi rank by their printed numbers with the Angel XX above the World XXI (pp. 9-10, 13), the Angel is the honour that may not be discarded (pp. 14, 34, 54), the Fool is never taken and its owner gives one plain card at the end of the hand (pp. 50, 52, 54), the discard counts for the dealer (p. 55), the hand is won by more points (p. 54) and has no dry premium, the premiums are agreed before the deal (pp. 21, 55, 99). Ours, where the book is silent: the Fool may be led, the engine chooses the card the Fool's owner gives, and the match of four hands around the hand. Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 2. *Documented: from the book, p. 53.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-18.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- The dealers alternate. *Sources silent, our decision.* Other reading: The loser deals. <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, pp. 53-54.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, pp. 9-10.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 54.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange -->
- The cheapest of the cards he has won is given for the Fool. *Sources silent, our decision.* Other reading: The owner of the Fool picks the card he gives. Open question 18: could be settled by statistics of games played by bots or a trial with live players (who chooses the card given for the Fool); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_exchange_card -->
- The Fool is never lost, not even in the last trick. *Documented: from the book, p. 50.* <!-- rule: cards.fool_last_trick -->

### The deal

- Cards dealt to each player: 25. *Documented: from the book, p. 53.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 3 more. *Documented: from the book, p. 53.* <!-- rule: hand.deal.dealer_extra -->
- There are no piles. *Our reading: book, p. 53.* <!-- rule: hand.deal.pile_count -->
- The other cards lie face down out of play. *Documented: from the book, p. 57.* <!-- rule: hand.deal.dead -->

### The discard

This step: *Documented: from the book, p. 53.*

- The dealer puts cards away. *Documented: from the book, p. 53.* <!-- rule: hand.discard.who -->
- Cards put away: 3. *Documented: from the book, pp. 53-54.* <!-- rule: hand.discard.count -->
- The discard is announced with «ho scartato» and is final. *Documented: from the book, p. 54.* <!-- rule: hand.discard.announce -->
- Honours may not be put away. *Documented: from the book, p. 54.* <!-- rule: hand.discard.discard_honours_barred -->

### The tricks

- The dealer's opponent leads first. *Documented: from the book, p. 54.* <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 50.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, p. 49.* <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* <!-- rule: hand.tricks.fool_may_lead -->

### The count

- Cards are counted in pairs: a pair is worth its two values less one point. So each card is worth its value less half a point. *Documented: from the book, p. 52.* <!-- rule: hand.count.count_unit -->
- A card left without a pair is worth its value less half a point, as in a pair. *Our reading: book, pp. 54-55.* Open question 32: could be settled by a document in which the rule is printed or a mathematical analysis (how the book counted the cards left over); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.count.odd_card -->
- There are no multipliers for tricks. *Our reading: book, p. 52.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book, p. 54.* <!-- rule: hand.count.last_trick_bonus -->
- The dealer keeps his discard. *Our reading: book, p. 55.* Other reading: A dealer who takes no trick loses his discard. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.count.dealer_forfeit -->

### The result of a hand

- More points wins the hand. *Documented: from the book, p. 54.* <!-- rule: hand.result.winner -->
- If the points are equal, nobody gains game points. *Documented: from the book, p. 54.* <!-- rule: hand.result.tie -->
- The winner of a hand gains one game point. *Our reading: book, p. 54.* <!-- rule: hand.result.game_points -->

### The match

- The stake is never doubled. *Sources silent, our decision.* <!-- rule: match.max_stake -->
- A match is 4 hands. *Sources silent, our decision.* Open question 6: could be settled by statistics of games played by bots or a trial with live players (the length of a match); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.hands -->
- If the hands are tied, whoever has more card points over all the hands wins. *Sources silent, our decision.* Open question 6: could be settled by statistics of games played by bots or a trial with live players (the length of a match); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.tiebreak -->

## Not played yet

- **Vola.** A premium agreed in advance for all the tricks is a stake of the table, not a bid or a rule of the hand: the engine plays no premium. *Documented: Torino 1787, pp. 21, 55, 100: «Vola, dicesi del fare tutte le basi»: a premium for taking every trick, played «purchè si voglia, e dicasi avanti in termini chiari», that is by agreement before the deal; and the Fool may be put away for a sure vola (rule 38, p. 34).* <!-- left_out: vola -->
- **Bagatto discard.** The Venticinque section says the honours are never put away (p. 54): the engine bars them without exception (discard_honours_barred). *Documented: Torino 1787, p. 34 (rule 38): the Bagatto may be put away when it stands alone, without the Fool.* <!-- left_out: bagatto_discard -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |

Generated from `rulesets/venticinque.json`, rules revision 9. Do not edit: change the game file.
