# Twenty-five cards for three (Venticinque)

3 players. In the book of 1787: no chapter of its own. Status: taken from a later source: the 1787 book has no chapter on this game. Rules revision 5.

Venticinque for three persons. The Turin rulebook of 1787 names it in its list of games (p. 8: «A Venticinque carte in tre persone») but has no chapter on it. Torino [1846], part I, pp. 33-34, gives the discard (the trumps that may be put away), the count in threes, the three deals and the winner of the match (the greater total); Prammatica [1846], pp. 13-14, the line of 26. Dummett 1980, p. 260 (partial scan held), after the rules of 1830 (not held), gives the deal in rounds of 5, 10 and 10 with an a monte by consent, the running total less 26, and the «fuora» play. The general rules of the 1787 book fill the rest: the trionfi, the suits, the Fool, how to answer. Not played by the engine for lack of a format key: the payment of the match and the «fuora» play (FORMAT_OPEN_POINTS point 6). Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 3. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Documented: from the book, p. 16.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Sources silent, our decision, after Torino [1846], part I, p. 34.* <!-- rule: seats.dealer_rotation -->
- Each player plays for himself. *Documented: from Dummett (1980), p. 260.* <!-- rule: sides.mode -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Documented: from Dummett (1980), p. 260.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from Dummett (1980), pp. 259-260.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from Dummett (1980), p. 259.* <!-- rule: cards.card_points -->
- The set «honours»: the kings, Trump 20 — Angel, Fool, Trump 1 — Magician. *Documented: from Dummett (1980), p. 259.* <!-- rule: cards.sets.honours -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the winner of the trick. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives up the Fool itself. *Documented: from Prammatica [1846], p. 6.* <!-- rule: cards.fool_no_tricks -->

### The deal

- Cards dealt to each player: 25. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 3 more. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: hand.deal.dealer_extra -->
- The dealer gets his extra cards last. *Documented: from Dummett (1980), p. 260.* <!-- rule: hand.deal.extra_when -->
- The cards are dealt in packets of: 5, 10, 10. *Documented: from Dummett (1980), p. 260.* <!-- rule: hand.deal.packets -->
- The whole pack is dealt, no cards are left over. *Documented: from Dummett (1980), p. 260.* <!-- rule: hand.deal.dead -->
- Dealing starts with the player on the dealer's right. *Our reading: Torino [1846], part I, p. 51.* <!-- rule: hand.deal.order -->

### A monte

This step: *Documented: from Dummett (1980), p. 260.*

- The deal may be given up only if everybody agrees. *Documented: from Dummett (1980), p. 260.* <!-- rule: hand.a_monte.consent -->
- The cards are then dealt again. *Documented: from Dummett (1980), p. 259.* <!-- rule: hand.a_monte.what -->
- It may be asked at these moments: deal.packet. *Documented: from Dummett (1980), p. 260.* <!-- rule: hand.a_monte.windows -->

### The discard

- The dealer puts cards away. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: hand.discard.who -->
- Cards put away: 3. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: hand.discard.count -->
- Honours may not be put away. *Documented: from Torino [1846], part I, p. 33.* <!-- rule: hand.discard.discard_honours_barred -->
- These may not be put away: trumps. *Documented: from Torino [1846], part I, p. 33.* Other reading: These may not be put away: Trump 17 — Star, Trump 18 — Moon, Trump 19 — Sun, Trump 21 — World. <!-- rule: hand.discard.barred -->
- There are exceptions to the ban, they depend on the hand. *Documented: from Torino [1846], part I, p. 33.* Other reading: . <!-- rule: hand.discard.allowed_exceptions -->
- The discard is announced with «ho scartato» and is final. *Documented: from Dummett (1980), p. 259.* <!-- rule: hand.discard.announce -->

### The tricks

- The player on the dealer's right leads first. *Documented: from Dummett (1980), p. 259.* <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 50.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Our reading: Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Our reading: Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, p. 49.* <!-- rule: hand.tricks.must_overtrump -->

### The count

- Cards are counted in groups of 3: a group is worth the sum of its values less one point for each extra card. *Documented: from Torino [1846], part I, p. 34.* <!-- rule: hand.count.group -->
- Cards are counted in pairs: a card is worth its value and half a point more. *Our reading: Dummett (1980), p. 260.* <!-- rule: hand.count.count_unit -->
- There are no multipliers for tricks. *Our reading: book.* <!-- rule: hand.count.trick_multipliers -->
- The last trick earns nothing extra. *Our reading: book.* <!-- rule: hand.count.last_trick_bonus -->
- A single card counts as a short group. *Sources silent, our decision, after Torino [1846], part I, p. 34.* <!-- rule: hand.count.odd_card -->

### The result of a hand

- Whoever reaches the threshold wins. *Our reading: Dummett (1980), p. 260.* <!-- rule: hand.result.winner -->
- The threshold is 26 points. *Documented: from Prammatica [1846], p. 14.* <!-- rule: hand.result.target -->
- A hand gives no game points. *Documented: from Dummett (1980), p. 260.* <!-- rule: hand.result.game_points -->

### The match

- Match points add up in a running total. *Documented: from Torino [1846], part I, p. 34.* <!-- rule: match.kind -->
- A round is played to 26 points. *Documented: from Prammatica [1846], p. 14.* <!-- rule: match.round_target -->
- A match is 3 rounds. *Documented: from Torino [1846], part I, p. 34.* <!-- rule: match.rounds -->

## Not played yet

- **Match payment.** Format gap, not silence: The format has no settle mode that reads running totals at the end of a match (FORMAT_OPEN_POINTS point 6, proposal match.payout); the payment is not played until it has. *Documented: Dummett 1980, p. 260 (after RI): if both others have zero or less each pays the winner 1 game point; if one of them has a plus he neither pays nor receives and the third pays the winner 2. Torino [1846], part I, p. 34 says only who wins and who loses: «come perde chi ne ha fatto un numero minore».* <!-- left_out: match_payment -->
- **Fuora declaration.** Format gap, not silence: An intention, not a checkable rule of the cards (FORMAT_OPEN_POINTS point 6): no card becomes illegal; a bot.play leaf and a hint carry it. *Documented: Torino [1846], part I, p. 34: «Chi è fuori, ossia non può più perdere» must play «da fuori» without harming the other two; if he still holds trumps «è obbligato a trionfare». Prammatica [1846], p. 14 prints the same duty for the last deal and its penalty, an onoranza of five points to each opponent. Dummett 1980, p. 260 (after RI): after two rounds a player whose total is above 26 cannot lose and says «Fuora» at the end of the deal; he also wins when in the last round a player has reached a sure positive total. Dummett's quotation of RI (p. 260, note 2) is word for word Prammatica [1846], p. 14.* <!-- left_out: fuora_declaration -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | M. Dummett, The Game of Tarot, London, Duckworth, 1980; chapter XIII, pp. 258-279 (partial scan held, p. 268 missing) | held |
| Regole inalterabili (1830) | Carlo O..., Regole inalterabili per tutti i giuochi di Tarocco detti di commercio, Torino, 1830 (RI), known only through Dummett 1980 | not held: known to us only through another source |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Prammatica [1846] | L. B., Prammatica ossia regole indispensabili per gli amatori di simile passatempo, part II of the same book, Torino, [1846] | held |

Generated from `rulesets/venticinque_3.json`, rules revision 5. Do not edit: change the game file.
