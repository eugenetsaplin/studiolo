# Morto

2 players. In the book of 1787: pp. 57-58. Status: playable, with decisions of ours where the book is silent. Rules revision 14.

Morto, «Del giuoco del Morto» (Torino 1787, pp. 57-58, read on the scan; Torino [1846], part I, pp. 47-49): two players, played as Venticinque for two (p. 57), but the 25 cards left over are a closed stock and the winner of every trick takes its top card, shows it and adds it to his points (pp. 57-58). All 78 cards count (91 points). Trumps, card values, Fool, deal, discard, play and count are those of venticinque.json. The match around the hand is ours [S]; who draws for a trick won with the Fool shown is our reading [R] of p. 57 («Chi pertanto prende il punto piglia volta per volta»): pp. 57-58 are silent on the Fool shown in a trick. The 1846 book adds declarations and Bagatto ultimo to this game; Torino 1787 has none, so they are not played. Marks: [D] documented, [R] our reading, [S] sources silent. A Fool drawn from the stock goes to the drawer's points like any card: Torino 1787, p. 57, «o buona, o cattiva, che capiti ad essere».

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 2. *Documented: from the book, p. 57.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-18.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* <!-- rule: seats.cut_min -->
- The dealers alternate. *Sources silent, our decision.* <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from the book, p. 57.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from the book, pp. 9-10.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 54.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Documented: from the book, p. 52.* <!-- rule: cards.fool_exchange -->
- The cheapest of the cards he has won is given for the Fool. *Sources silent, our decision.* Other reading: The owner of the Fool picks the card he gives. Question 18 of the list: could be settled by statistics of games played by bots or a trial with live players (who chooses the card given for the Fool); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_exchange_card -->
- A player who took no trick gives nothing for the Fool. *Our reading: p. 57.* Other reading: A player who took no trick gives up the Fool itself. Question 2 of the list: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->
- The Fool is never lost, not even in the last trick. *Documented: from the book, p. 50.* <!-- rule: cards.fool_last_trick -->

### The deal

- Cards dealt to each player: 25. *Documented: from the book, p. 53.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 3 more. *Documented: from the book, p. 53.* <!-- rule: hand.deal.dealer_extra -->
- There are no piles. *Our reading: book, p. 53.* <!-- rule: hand.deal.pile_count -->
- The other cards lie face down as a prize stock: one is taken for each trick. *Documented: from the book, p. 57.* <!-- rule: hand.deal.dead -->

### The discard

This step: *Documented: from the book, p. 57.*

- The dealer puts cards away. *Documented: from the book, p. 53.* <!-- rule: hand.discard.who -->
- Cards put away: 3. *Documented: from the book, pp. 53-54.* <!-- rule: hand.discard.count -->
- Honours may not be put away. *Documented: from the book, p. 54.* <!-- rule: hand.discard.discard_honours_barred -->
- The discard is announced with «ho scartato» and is final. *Documented: from the book, p. 54.* <!-- rule: hand.discard.announce -->
- The discard counts for the player who put it away. *Our reading: book, p. 21.* Other reading: The discard counts for its owner if he took at least one trick. Question 1 of the list: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard.counts_for -->

### The tricks

- The dealer's opponent leads first. *Documented: from the book, p. 54.* <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 50.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from the book, p. 49.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, p. 49.* <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* <!-- rule: hand.tricks.fool_may_lead -->

### The prize stock (while the tricks are played)

This step: *Documented: from the book, p. 57.*

- The prize stock is the cards left over. *Documented: from the book, p. 57.* <!-- rule: hand.morto.stock -->
- For each trick 1 card is taken from the stock. *Documented: from the book, pp. 57-58.* <!-- rule: hand.morto.per_trick -->
- The top card is taken. *Documented: from the book, p. 57.* <!-- rule: hand.morto.take -->
- The card taken is shown to the opponents. *Documented: from the book, p. 57.* <!-- rule: hand.morto.show_to -->
- The card goes to the won cards. *Documented: from the book, p. 57.* <!-- rule: hand.morto.goes_to -->
- If a trick holds the Fool, the winner of the trick takes the stock card. *Our reading: book, p. 57.* <!-- rule: hand.morto.fool_trick -->

### The count

- Cards are counted in pairs: a pair is worth its two values less one point. So each card is worth its value less half a point. *Documented: from the book, p. 52.* <!-- rule: hand.count.count_unit -->
- A card left without a pair is worth its value less half a point, as in a pair. *Partly printed (pp. 54-55), partly our reading.* <!-- rule: hand.count.odd_card -->
- There are no multipliers for tricks. *Our reading: book, p. 52.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book, p. 54.* <!-- rule: hand.count.last_trick_bonus -->
- The dealer keeps his discard. *Our reading: book, p. 21.* Other reading: A dealer who takes no trick loses his discard. Question 1 of the list: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.count.dealer_forfeit -->

### The result of a hand

- More points wins the hand. *Documented: from the book, p. 54.* <!-- rule: hand.result.winner -->
- If the points are equal, nobody gains game points. *Documented: from the book, p. 54.* <!-- rule: hand.result.tie -->
- The winner of a hand gains one game point. *Our reading: book, p. 57.* <!-- rule: hand.result.game_points -->

### The match

- The stake is never doubled. *Sources silent, our decision.* <!-- rule: match.max_stake -->
- A match is 4 hands. *Sources silent, our decision.* Question 6 of the list: could be settled by statistics of games played by bots or a trial with live players (the length of a match); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.hands -->
- If the hands are tied, whoever has more card points over all the hands wins. *Sources silent, our decision.* Question 6 of the list: could be settled by statistics of games played by bots or a trial with live players (the length of a match); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.tiebreak -->

### Offences

- The offence «revoke» cannot happen at this table. By the book, the offender pays the simple stake to each of the others; while the trick is open, the card may be changed. *Documented: from the book, pp. 33-34.* <!-- rule: penalties.revoke -->
- The offence «looking at a card of the covered stock» cannot happen at this table. By the book: on a loss, doubled; on a double win, simple; on a simple win, nothing. *Documented: from the book, p. 58.* <!-- rule: penalties.peek_morto -->

## Not played yet

- **Bagatto discard.** The Venticinque section, which Morto follows, says the honours are never put away (p. 54): the engine bars them without exception (discard_honours_barred). *Documented: Torino 1787, p. 34 (rule 38): «eccetto che Bagatto sia solo, senza il Folle»: the Bagatto may be put away when it is the only trump of the hand («solo» is so read since revision 2, as Dummett 1980, p. 259 reads it).* <!-- left_out: bagatto_discard -->
- **Premium scale.** Premiums by agreement are not played: a won hand is one game point, as in Venticinque. *Documented: Dummett and McLeod 2004, pp. 156-157: premiums beyond the single game point are agreed by the players; the authors suggest a scale of 1, 2, 3, 4 and 6.* <!-- left_out: premium_scale -->
- **Vola.** A bid to take all the tricks is a contract the engine has no place for. *Documented: Dummett 1980, p. 259: the Fool may be discarded by a dealer who means to win every trick (vola).* <!-- left_out: vola -->
- **Declarations 1846.** Torino 1787, p. 57 plays Morto as Venticinque, without declarations; the 1846 variant is not played. *Documented: Torino [1846], part I, pp. 48-49: honours, Mitigati, ten trionfi and Bagatto ultimo are declared in Morto, under the rules of N° XII, pp. 44-46.* <!-- left_out: declarations_1846 -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |

Generated from `rulesets/morto.json`, rules revision 14. Do not edit: change the game file.
