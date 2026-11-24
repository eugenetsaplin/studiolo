# Permesso for seven (Permesso)

7 players. In the book of 1787: p. 77. Status: playable, with decisions of ours where the book is silent. Rules revision 9.

This game is written as [Permesso for six](permesso_6.md) with differences.

Settilio, Permesso for seven (Torino 1787, «Del giuoco di Permesso in sette persone, o sia Settilio», p. 77, and the Fool of pp. 77-78), «giuoco bizzarro»: 11 cards to each of the seven players and one card over «per lo scarto»; the rest is said to be as in Quintilio and Sestilio. The book does not say who takes the card over; ours, as the dealer, who then puts one card away. Giuoco sciolto is inherited from Sestilio because «come sopra è stato detto di Quintilio, e Sestilio» (p. 77); that it applies with seven is our reading.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 7. *Documented: from the book, p. 77.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* Same as in [Permesso for six](permesso_6.md). <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Documented: from the book, p. 16.* Same as in [Permesso for six](permesso_6.md). <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Documented: from the book, p. 17.* Same as in [Permesso for six](permesso_6.md). <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Our reading: book, p. 16.* Same as in [Permesso for six](permesso_6.md). <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* Other reading: Change of dealer: to the left. Same as in [Permesso for six](permesso_6.md). <!-- rule: seats.dealer_rotation -->
- The sides form by the bid: the one who takes the bid plays against the others. *Documented: from the book, p. 77.* Same as in [Permesso for six](permesso_6.md). <!-- rule: sides.mode -->
- Points are counted for the side, not for each player. *Documented: from the book, p. 62.* Same as in [Permesso for six](permesso_6.md). <!-- rule: sides.pool -->
- Signals between partners are forbidden. *Documented: from the book, pp. 61-62.* Same as in [Permesso for six](permesso_6.md). <!-- rule: sides.signals -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Our reading: book, p. 77.* Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Documented: from the book, p. 77.* Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Our reading: book, pp. 77-78.* Other reading: Nothing is given for the Fool. Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Our reading: book, p. 52.* Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the winner of the trick. *Documented: from the book, pp. 77-78.* Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives nothing for the Fool. *Sources silent, our decision.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Permesso for six](permesso_6.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- stake: choices 1, 2, 5, 10; default 1. *Sources silent, our decision.* <!-- rule: options.stake -->
- variant: Free game by choice. *Documented: from the book, p. 76.* <!-- rule: variants.sciolto_chosen -->
- variant: Free game when everyone passes. *Our reading: Dummett (1980), p. 267.* <!-- rule: variants.all_pass_sciolto -->

### Bids

- «three»: rank 1, exchange 3, onoranza 2, sides declarer vs rest. *Documented: from the book, p. 60.* <!-- rule: contracts.three -->
- «two»: rank 2, exchange 2, onoranza 3, sides declarer vs rest. *Documented: from the book, p. 62.* <!-- rule: contracts.two -->
- «one»: rank 3, exchange 1, onoranza 4, sides declarer vs rest. *Documented: from the book, p. 63.* <!-- rule: contracts.one -->
- «sans prendre»: rank 4, exchange 0, onoranza 5, sides declarer vs rest. *Documented: from the book, p. 64.* <!-- rule: contracts.sans_prendre -->
- «sciolto»: rank 0, exchange 0, sides each for himself. *Documented: from the book, pp. 76-77.* <!-- rule: contracts.sciolto -->

### The deal

- Cards dealt to each player: 11. *Documented: from the book, p. 77.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 1 more. *Our reading: Dummett (1980), p. 267.* <!-- rule: hand.deal.dealer_extra -->
- The extra cards go to the dealer. *Documented: from the book, p. 59.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.deal.extra_to -->
- The dealer gets his extra cards last. *Documented: from the book, p. 59.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.deal.extra_when -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 59.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Documented: from the book, p. 59.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.deal.packets_announced -->
- Dealing starts with the player on the dealer's right. *Documented: from the book, p. 59.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.deal.order -->
- The whole pack is dealt, no cards are left over. *Our reading: book, p. 77.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.deal.dead -->
- The cards are dealt face down. *Documented: from the book, p. 59.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.deal.face -->

### Bidding

This step: *Documented: from the book, pp. 60-66.*

- The bids are: three, two, one, sans prendre. *Documented: from the book, p. 66.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.contracts -->
- The player on the dealer's right opens the bidding. *Documented: from the book, p. 60.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.opens -->
- The dealer speaks last. *Our reading: Torino [1846], part I, pp. 41-42.* Other reading: The dealer speaks in his turn. Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.dealer_speaks -->
- With equal bids the seat that speaks earlier wins. An earlier seat may match the bid of a later one; a later seat must bid higher. A pass is final. *Documented: from the book, pp. 63-64.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.tie -->
- Whoever passes may not come back into the bidding. *Documented: from the book, p. 66.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.pass_is_final -->
- If everyone passes, the next dealer deals again. *Sources silent, our decision, after Dummett (1980), p. 267.* Other reading: If everyone passes: contract:sciolto. Open question 22: could be settled by a document in which the rule is printed (the bidding of the dealer and a general pass); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.all_pass -->
- A bid binds: whoever takes it must play it. *Documented: from the book, p. 66.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.bid_binds -->
- Whoever lays down fewer cards than he bid plays the bid of the cards laid. *Documented: from the book, p. 65.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.bidding.lay_down_fewer -->

### The exchange

This step: *Documented: from the book, pp. 60-61.*

- The bid says how many cards are exchanged. *Documented: from the book, pp. 60-66.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.count -->
- You lay down your cards first, then take the new ones. *Documented: from the book, pp. 64-66.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.lay_down_first -->
- The exchange is made face down. *Documented: from the book, p. 61.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.face -->
- Cards that may be asked for: all. *Documented: from the book, p. 61.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.callable -->
- If nobody else holds the wanted card, it is taken from the discard. *Sources silent, our decision, after Dummett (1980), p. 266.* Other reading: If nobody else holds the wanted card, it may not be asked for. Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.card_not_held -->
- The laid cards go to the holders unseen, drawn by lot. *Our reading: book, p. 61.* Other reading: Who gets which laid card: declarer assigns. Open question 27: could be settled by a document in which the rule is printed or a trial with live players (who takes which of the laid cards in the exchange); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.give -->
- Honours may not be laid down. *Our reading: book, pp. 34-35.* Other reading: Any card may be laid down. Open question 31: could be settled by a document in which the rule is printed or the opinion of an expert (which cards may be laid down in the exchange); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.discard_honours_barred -->
- Some cards are still allowed to be laid down (for example the Fool). *Our reading: book, pp. 34-35.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.exchange.allowed_exceptions -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, p. 61.* Other reading: First lead: declarer. Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks.fool_may_lead -->

### The count

- Cards are counted in pairs: a pair is worth its two values less one point. So each card is worth its value less half a point. *Documented: from the book, pp. 51-52.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.count.count_unit -->
- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Our reading: Dummett (1980), p. 266.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.count.group -->
- A card left without a pair is worth its value less half a point, as in a pair. *Our reading: book, p. 54.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Our reading: book, p. 68.* Other reading: The card for the Fool in the count: deducted. Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.count.fool_card -->

### The result of a hand

- The declarer wins if he reaches the threshold of his bid. *Documented: from the book, p. 68.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result.winner -->
- The threshold is 46 points. *Documented: from the book, p. 68.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result.target -->
- If the points are equal, the cards are dealt again by the next dealer. *Documented: from the book, p. 70.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result.tie -->
- The result follows bands of the declarer's points: a win, a draw or a loss; he pays all, the Onoranza alone, or nothing. *Our reading: book, pp. 66-70.* Other reading: min: 46; outcome: win; pays: full, min: 45; max: 45.5; outcome: draw; pays: nothing, min: 43.5; max: 44.5; outcome: loss; pays: onoranza only, max: 43; outcome: loss; pays: full. Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result.bands -->
- A hand gives no game points. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result.game_points -->

### Settling

- Settling is in soldi. *Documented: from the book, pp. 67-69.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.settle.unit -->
- The declarer settles with each player on his own. *Our reading: book, p. 74.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.settle.mode -->
- The amount of the settlement: sum: by the bid: onoranza, per points: of: declarer side; from: 45; every: 5; unit: 1; round: nearest half down; direction: both. The Onoranza of the contract and the points beyond the line are counted apart. *Our reading: book, pp. 67-70.* Open question 33: could be settled by a document in which the rule is printed or the opinion of an expert (the steps of the payment); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.settle.amount -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, p. 35.* Other reading: The taker of the last trick of the previous hand leads first. Open question 20: could be settled by the opinion of an expert (who leads first: «Chi è ultimo a prendere giuoca il primo»); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks_sciolto.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 75.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks_sciolto.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks_sciolto.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks_sciolto.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks_sciolto.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.tricks_sciolto.fool_may_lead -->

### The result of a hand

- More points wins the hand. *Documented: from the book, pp. 76-77.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result_sciolto.winner -->
- If the points are equal, nobody gains game points. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result_sciolto.tie -->
- A hand gives no game points. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.result_sciolto.game_points -->

### Settling

- Settling is in stakes. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.settle_sciolto.unit -->
- The losers pay the winner. *Sources silent, our decision, after Dummett (1980), p. 267.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.settle_sciolto.mode -->
- The amount of the settlement: the stake: as agreed. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: hand.settle_sciolto.amount -->

### The discard

This step: *Documented: from the book, p. 77.*

- The dealer puts cards away. *Our reading: Dummett (1980), p. 267.* <!-- rule: hand.discard.who -->
- Cards put away: 1. *Documented: from the book, p. 77.* <!-- rule: hand.discard.count -->
- Exactly that many are put away. *Our reading: book, p. 77.* <!-- rule: hand.discard.count_mode -->
- Honours may not be put away. *Our reading: book, p. 34.* Other reading: Any card may be put away. <!-- rule: hand.discard.discard_honours_barred -->
- There are exceptions to the ban, they depend on the hand. *Our reading: book, p. 34.* Other reading: . <!-- rule: hand.discard.allowed_exceptions -->
- The discard counts for the player who put it away. *Sources silent, our decision.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard.counts_for -->
- The discard is announced with «ho scartato» and is final. *Documented: from the book, p. 60.* <!-- rule: hand.discard.announce -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* Same as in [Permesso for six](permesso_6.md). <!-- rule: match.kind -->
- A match lasts 1 round of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. *Sources silent, our decision.* Other reading: A match lasts 2 rounds of dealers: every player deals in turn, going to the right. Every deal is settled as soon as it ends; at the end the greatest balance wins, and equal greatest balances are a draw. A hand thrown in or drawn counts as dealt: nobody pays and the next player deals. Open question 23: could be settled by a document in which the rule is printed or a trial with live players (the length of a match); see [the open questions](../rulesets/OPEN_QUESTIONS.md). Same as in [Permesso for six](permesso_6.md). <!-- rule: match.dealer_rounds -->

### Offences

- Offence «wrong discard count»: impossible at the table; penalty: pays: simple game; to: each of the others; if lost: double. *Documented: from the book, pp. 59-60.* <!-- rule: penalties.wrong_discard_count -->
- Offence «change discard»: impossible at the table; penalty: allowed: no. *Documented: from the book, p. 60.* <!-- rule: penalties.change_discard -->
- Offence «call without laying»: impossible at the table; penalty: pays: onoranza; to: each of the others; then: hand is played. *Documented: from the book, pp. 64-65.* <!-- rule: penalties.call_without_laying -->
- Offence «refuse bid»: impossible at the table; penalty: pays: double onoranza; to: each of the others; marcio alt: marcia game. *Documented: from the book, p. 66.* <!-- rule: penalties.refuse_bid -->
- Offence «signal»: text only; penalty: pays: simple game; to: each of the others; then: lone player may stop. *Documented: from the book, p. 73.* <!-- rule: penalties.signal -->
- Offence «revoke»: impossible at the table; penalty: pays: simple game; to: each of the others. *Documented: from the book, pp. 33-34.* <!-- rule: penalties.revoke -->

## Not played yet

- **Vola.** The book gives no figure and no rule of a vola inside Permesso; a premium of the table, not played. *Documented: Torino 1787, p. 100: «Vola, dicesi del fare tutte le basi»; the stake of a vola is agreed before the deal (p. 21 rule 10).* <!-- left_out: vola -->
- **Marcio.** Two ways of playing (in coins or only for the game with marcio) are named but the book gives neither a line for the marcio at Permesso nor its payment; only the coin game is played. *Documented: Torino 1787, pp. 66, 99: the game may be played «unicamente a guadagnar la partita col marcio»; «Marcio, vale posta doppia … facendo o … a cui la partita è fissata».* <!-- left_out: marcio -->
- **Draw money.** A drawn hand pays nothing in the ledger. *Documented: Torino 1787, p. 70: after a draw nothing is said of the stakes on the table.* <!-- left_out: draw_money -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 (our scan is partial: printed page 268 is missing) | held |
| RI 1830 (after Dummett) | [Carlo O…], Regole inalterabili per tutti i giuochi di Tarocco detti di commercio, Torino, 1830 (known to us only through Dummett 1980) | not held: known to us only through another source |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |
| Prammatica [1846] | L. B., Prammatica del giuocatore di tarocchi ossia regole indispensabili per gli amatori di simile passatempo, Torino, Serra, [1846] (separate issue, cover dated 1846, deposited 27 December 1845; reprinted from the same setting, same pages, as part II of Il giuocatore di tarocchi al tavoliere, Torino, Serra, [1846]) | held |

Generated from `rulesets/permesso_7.json`, rules revision 9. Do not edit: change the game file.
