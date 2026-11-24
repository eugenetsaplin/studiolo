# Call the King (Chiamare il Re)

4 players. In the book of 1787: pp. 79-84. Status: playable, with decisions of ours where the book is silent. Rules revision 8.

Chiamare il Re (Torino 1787, «Del giuoco, che dicesi volgarmente chiamare il Re», pp. 79-84), a game for four that the book describes in passing: dealt as Permesso for four (19 cards, the dealer puts two away), the dealer, who has «un doppio vantaggio», calls any king and its secret holder is his partner, two against two, who count together to 46 points «dedotta la carta del Folle» (pp. 80-81). If he holds all four kings he may call a queen, with all kings and queens a knight, with all of those a jack (pp. 81-82). The dealer may instead go alone, changing one card («ad una») or none («sans prendre»), against the other three; another player may take the «ad una» first (p. 82). The payments are «secondo il convenuto» (p. 83): the book names no figure. A king that lies in the dealer's discard, the lead and the first hand's rules are not printed; ours, marked [S] (the lead [R], by the general rule of p. 35).

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 4. *Documented: from the book, p. 79.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, pp. 16-17.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Documented: from the book, p. 16.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* Other reading: Change of dealer: to the left. <!-- rule: seats.dealer_rotation -->
- The sides form by the bid: the one who takes the bid plays against the others. *Documented: from the book, pp. 80-83.* <!-- rule: sides.mode -->
- Points are counted for the side, not for each player. *Documented: from the book, pp. 81-83.* <!-- rule: sides.pool -->
- Signals between partners are forbidden. *Documented: from the book, p. 73.* <!-- rule: sides.signals -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Our reading: book, p. 79.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Sources silent, our decision.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Documented: from the book, p. 81.* <!-- rule: cards.fool_exchange -->
- The card for the Fool goes to the winner of the trick. *Our reading: Torino [1846], part I, p. 33.* <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives nothing for the Fool. *Our reading: book, p. 50.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- stake: choices 1, 2, 5, 10; default 1. *Documented: from the book, p. 83.* <!-- rule: options.stake -->

### Bids

- «call king»: rank 1, exchange 0, sides called partner. *Documented: from the book, pp. 80-81.* <!-- rule: contracts.call_king -->
- «one»: rank 2, exchange 1, sides declarer vs rest. *Documented: from the book, p. 82.* <!-- rule: contracts.one -->
- «sans prendre»: rank 3, exchange 0, sides declarer vs rest. *Documented: from the book, p. 82.* <!-- rule: contracts.sans_prendre -->

### The deal

- Cards dealt to each player: 19. *Documented: from Torino [1846], part I, p. 38.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 2 more. *Our reading: book, p. 71.* <!-- rule: hand.deal.dealer_extra -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets_announced -->
- The whole pack is dealt, no cards are left over. *Our reading: book, p. 71.* <!-- rule: hand.deal.dead -->

### The discard

This step: *Documented: from the book, pp. 79-80.*

- The dealer puts cards away. *Documented: from the book, p. 80.* <!-- rule: hand.discard.who -->
- Cards put away: 2. *Documented: from the book, pp. 79-80.* <!-- rule: hand.discard.count -->
- Exactly that many are put away. *Our reading: book, pp. 79-80.* Other reading: At most that many are put away. <!-- rule: hand.discard.count_mode -->
- Honours may not be put away. *Our reading: book, p. 34.* Other reading: Any card may be put away. <!-- rule: hand.discard.discard_honours_barred -->
- There are exceptions to the ban, they depend on the hand. *Our reading: book, p. 34.* Other reading: . <!-- rule: hand.discard.allowed_exceptions -->
- The discard counts for the player who put it away. *Sources silent, our decision.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard.counts_for -->
- The discard is announced with «ho scartato» and is final. *Our reading: book, p. 60.* <!-- rule: hand.discard.announce -->

### Bidding

This step: *Documented: from the book, pp. 80-82.*

- The bids are: one, sans prendre. *Documented: from the book, p. 84.* <!-- rule: hand.bidding.contracts -->
- The dealer opens the bidding. *Documented: from the book, p. 80.* <!-- rule: hand.bidding.opens -->
- The dealer speaks first. *Documented: from the book, pp. 80-82.* <!-- rule: hand.bidding.dealer_speaks -->
- With equal bids the later bidder wins the bidding. *Our reading: book, p. 82.* Other reading: With equal bids the dealer wins the bidding. <!-- rule: hand.bidding.tie -->
- If the dealer passes, the bidding ends: he calls a king. The others may only overcall a bid of the dealer. *Our reading: book, p. 80.* Other reading: If the dealer passes, the others bid. Open question 29: could be settled by a document in which the rule is printed (the auction after the dealer passes); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.bidding.after_dealer_pass -->
- If everyone passes, the bid «call the king» is played. *Documented: from the book, p. 80.* <!-- rule: hand.bidding.all_pass -->

### Calling a partner

This step: *Documented: from the book, pp. 80-83.*

- The dealer calls the partner. *Documented: from the book, p. 80.* <!-- rule: hand.call_partner.caller -->
- The call goes by rank: K, Q, N, J. *Documented: from the book, pp. 81-82.* <!-- rule: hand.call_partner.ladder -->
- If the caller holds every card of that rank, he calls the next rank. *Documented: from the book, pp. 81-82.* <!-- rule: hand.call_partner.step_down -->
- The others do not know who is whose partner. *Documented: from the book, p. 80.* <!-- rule: hand.call_partner.secret -->
- If the caller holds the called card himself, he plays alone against the rest; nobody knows it until that card is played. *Our reading: book, p. 83.* Open question 28: could be settled by a document in which the rule is printed or a trial with live players (calling a card of one's own hand); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.call_partner.own_card -->
- A card of the caller's own discard may not be called. *Our reading: book, pp. 80-81.* Other reading: The called card in the discard: plays alone. Open question 8: could be settled by a document in which the rule is printed (the payment when a King is called; a called King in the discard); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.call_partner.card_in_discard -->

### The exchange

This step: *Documented: from the book, p. 82.*

- The bid says how many cards are exchanged. *Documented: from the book, p. 82.* <!-- rule: hand.exchange.count -->
- You lay down your cards first, then take the new ones. *Our reading: book, p. 82.* <!-- rule: hand.exchange.lay_down_first -->
- The exchange is made face down. *Documented: from the book, p. 82.* <!-- rule: hand.exchange.face -->
- Cards that may be asked for: all. *Our reading: book, p. 82.* <!-- rule: hand.exchange.callable -->
- If nobody else holds the wanted card, it is taken from the discard. *Sources silent, our decision.* Other reading: If nobody else holds the wanted card, it may not be asked for. <!-- rule: hand.exchange.card_not_held -->
- The laid cards go to the holders unseen, drawn by lot. *Our reading: Torino [1846], part I, p. 39.* Other reading: Who gets which laid card: declarer assigns. <!-- rule: hand.exchange.give -->
- Honours may not be laid down. *Our reading: book, pp. 34-35.* Other reading: Any card may be laid down. Open question 31: could be settled by a document in which the rule is printed or the opinion of an expert (which cards may be laid down in the exchange); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.exchange.discard_honours_barred -->
- Some cards are still allowed to be laid down (for example the Fool). *Our reading: book, pp. 34-35.* <!-- rule: hand.exchange.allowed_exceptions -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, p. 35.* Other reading: First lead: declarer. <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* <!-- rule: hand.tricks.fool_may_lead -->

### The count

- Cards are counted in pairs: a card is worth its value and half a point more. *Documented: from the book, pp. 51-52.* <!-- rule: hand.count.count_unit -->
- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Our reading: book, p. 81.* <!-- rule: hand.count.group -->
- A single card without a pair counts as half a point and its value. *Our reading: book, p. 54.* <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Documented: from the book, p. 81.* <!-- rule: hand.count.fool_card -->

### The result of a hand

- Whoever reaches the threshold wins. *Documented: from the book, p. 81.* <!-- rule: hand.result.winner -->
- The threshold is 46 points. *Documented: from the book, p. 81.* <!-- rule: hand.result.target -->
- If the points are equal, the declarer loses. *Our reading: book, p. 74.* <!-- rule: hand.result.tie -->
- A hand gives no game points. *Sources silent, our decision.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 83.* <!-- rule: hand.settle_pair.unit -->
- The pair shares the win; with unequal sides (one against three) the declarer settles with each opponent. *Our reading: book, p. 90.* <!-- rule: hand.settle_pair.mode -->
- The amount of the settlement: the stake: as agreed. The Onoranza of the contract and the points beyond the line are counted apart. *Sources silent, our decision.* Open question 8: could be settled by a document in which the rule is printed (the payment when a King is called; a called King in the discard); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.settle_pair.amount -->

### Settling

- Settling is in stakes. *Documented: from the book, p. 83.* <!-- rule: hand.settle_alone.unit -->
- The declarer settles with each player on his own. *Documented: from the book, pp. 82-83.* <!-- rule: hand.settle_alone.mode -->
- The amount of the settlement: the stake: as agreed. The Onoranza of the contract and the points beyond the line are counted apart. *Documented: from Dummett (1980), p. 83.* <!-- rule: hand.settle_alone.amount -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn. The marche are settled after every deal; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Sources silent, our decision.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn. The marche are settled after every deal; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. Open question 23: could be settled by a document in which the rule is printed or a trial with live players (the length of a match); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: match.dealer_rounds -->

### Offences

- Offence «call own card»: apply; penalty: plays alone: yes; unless: all others forgive unanimously. *Our reading: book, p. 83.* <!-- rule: penalties.call_own_card -->
- Offence «hint partner»: text only; penalty: hinter plays alone: yes; unless: hint was in the plain way of play. *Our reading: book, p. 83.* <!-- rule: penalties.hint_partner -->
- Offence «signal»: text only; penalty: pays: simple game; to: each of the others; then: lone player may stop. *Documented: from the book, p. 73.* <!-- rule: penalties.signal -->
- Offence «revoke»: impossible at the table; penalty: pays: simple game; to: each of the others. *Documented: from the book, p. 38.* <!-- rule: penalties.revoke -->

## Not played yet

- **Onoranza of ad una.** Not printed in the 1787 book; the payment is the agreed stake. *Our reading: Dummett 1980, p. 269 (our scan lacks page 268): a basic payment of 2 for «ad una»; only the 1 for calling a king is his conjecture. His 1 for «a due» belongs to Permesso: this game has none (Torino 1787, p. 84: «col chiamare due, o tre carte, non potrà mai»).* <!-- left_out: onoranza_of_ad_una -->
- **Fool discard for vola.** Vola is not played (open question 13); the exception is not offered. *Documented: Torino 1787, p. 34 (rule 38): the Fool may be put away «in un sol caso … guadagnar la partita vola».* <!-- left_out: fool_discard_for_vola -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 (our scan is partial: printed page 268 is missing) | held |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] (separate issue, cover dated 1846, deposited 27 December 1845; reprinted from the same setting, same pages, as part II of Il giuocatore di tarocchi al tavoliere, Torino, Serra, [1846]) | held |

Generated from `rulesets/chiamare_il_re.json`, rules revision 8. Do not edit: change the game file.
