# Permesso for three (Permesso)

3 players. In the book of 1787: pp. 58-70. Status: playable, with decisions of ours where the book is silent. Rules revision 3.

Permesso for three («Trilio»), the first of the Turin rulebook's games of one against two (Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787, «Del giuoco del Permesso in tre persone», pp. 58-70), on the whole 78-card pack: 25 cards to each of the two players and 28 to the dealer, who puts three away (p. 59); after «Ho scartato» the player first in hand asks «Permesso?», the players bid how few cards they will change (three, two, one or none: «sans prendre»), the winner of the bidding lays his worst cards face down, calls the same number by name from the other hands and plays alone against the other two, who count their points together (pp. 60-66). He wins with 46 of the 91 points counted in pairs; the stake is the Onoranza of his contract (2, 3, 4 or 5 coins) and one coin for each five points beyond 45 (pp. 66-70). The book is silent on the dealer's place in the auction, on a general pass and on a called card that lies in the discard; those are our decisions, marked [S]. Played in coins agreed before the deal (p. 67). Marks: [D] documented, [R] our reading, [S] sources silent.

## How to read the marks

Each rule is marked by where it comes from. **Documented** [D]: printed in the named source, with its pages. **Our reading** [R]: the source is ambiguous or the sources disagree; the other reading is shown under the rule.

**Sources silent** [S]: the sources say nothing, so the decision is ours, made so that the game can be played. Where the question is open, the rule names the open question.

## The rules

### Who plays

- Players at the table: 3. *Documented: from the book, p. 58.* <!-- rule: seats.count -->
- Play passes to the right. *Documented: from the book, p. 35.* <!-- rule: seats.direction -->
- The first dealer is whoever first draws a trump from the cards turned up. *Our reading: book, p. 16.* <!-- rule: seats.first_dealer -->
- The player on the dealer's left cuts the pack. *Our reading: book, p. 58.* <!-- rule: seats.cut_by -->
- A cut leaves at least 2 cards in each part. *Documented: from the book, p. 17.* <!-- rule: seats.cut_min -->
- The deal passes to the right. *Our reading: book, p. 70.* Other reading: Change of dealer: to the left. <!-- rule: seats.dealer_rotation -->
- The sides form by the bid: the one who takes the bid plays against the others. *Documented: from the book, p. 61.* <!-- rule: sides.mode -->
- Points are counted for the side, not for each player. *Documented: from the book, p. 62.* <!-- rule: sides.pool -->
- Signals between partners are forbidden. *Documented: from the book, pp. 61-62.* <!-- rule: sides.signals -->

### The cards

- The whole pack of 78 is used: 22 trumps (the Fool is among them as number 0) and 14 cards in each of four suits. *Our reading: book, p. 59.* <!-- rule: cards.deck -->
- Trumps rank by their numbers, but the Angel (XX) takes the World (XXI). *Documented: from the book, pp. 9-10.* <!-- rule: cards.trump_order -->
- In swords and batons the larger number is higher; in cups and coins it is the other way: the ace takes the two, up to the ten, and the king takes the queen, the knight and the jack. *Documented: from the book, pp. 11-13.* <!-- rule: cards.suit_order -->
- Kings, the Angel, the Bagatto and the Fool are worth 5, queens 4, knights 3, jacks 2, every other card 1. *Documented: from the book, pp. 13-14.* <!-- rule: cards.card_points -->
- The Fool takes nothing and is taken by nothing: it is shown in place of a card. *Our reading: book, p. 38.* <!-- rule: cards.fool -->
- Whoever plays the Fool keeps it and gives another card in its place. *Our reading: book, p. 52.* <!-- rule: cards.fool_exchange -->
- The owner of the Fool picks the card he gives. *Our reading: book, p. 52.* <!-- rule: cards.fool_exchange_card -->
- The card for the Fool goes to the opponent. *Our reading: book, p. 68.* <!-- rule: cards.fool_exchange_to -->
- A player who took no trick gives nothing for the Fool. *Our reading: book, p. 50.* Other reading: A player who took no trick gives up the Fool itself. Open question 2: could be settled by the opinion of an expert or statistics of games played by bots (the Fool of a player who won no trick: kept or given up); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: cards.fool_no_tricks -->

### By agreement / Variants

- coin: choices soldo, due mezzo, lira, testone; default soldo. *Documented: from the book, p. 67.* <!-- rule: options.coin -->

### Bids

- «three»: rank 1, exchange 3, onoranza 2, sides declarer vs rest. *Documented: from the book, p. 60.* <!-- rule: contracts.three -->
- «two»: rank 2, exchange 2, onoranza 3, sides declarer vs rest. *Documented: from the book, p. 62.* <!-- rule: contracts.two -->
- «one»: rank 3, exchange 1, onoranza 4, sides declarer vs rest. *Documented: from the book, p. 63.* <!-- rule: contracts.one -->
- «sans prendre»: rank 4, exchange 0, onoranza 5, sides declarer vs rest. *Documented: from the book, p. 64.* <!-- rule: contracts.sans_prendre -->

### The deal

- Cards dealt to each player: 25. *Documented: from the book, p. 59.* <!-- rule: hand.deal.hand_size -->
- The dealer gets 3 more. *Documented: from the book, p. 59.* <!-- rule: hand.deal.dealer_extra -->
- The extra cards go to the dealer. *Documented: from the book, p. 59.* <!-- rule: hand.deal.extra_to -->
- The dealer gets his extra cards last. *Documented: from the book, p. 59.* <!-- rule: hand.deal.extra_when -->
- The cards are dealt in packets as the dealer chooses. *Our reading: book, p. 59.* <!-- rule: hand.deal.packets -->
- The dealer names the packets before dealing. *Documented: from the book, p. 59.* <!-- rule: hand.deal.packets_announced -->
- Dealing starts with the player on the dealer's right. *Documented: from the book, p. 59.* <!-- rule: hand.deal.order -->
- The whole pack is dealt, no cards are left over. *Our reading: book, p. 59.* <!-- rule: hand.deal.dead -->
- The cards are dealt face down. *Documented: from the book, p. 59.* <!-- rule: hand.deal.face -->

### The discard

This step: *Documented: from the book, p. 59.*

- The dealer puts cards away. *Documented: from the book, p. 59.* <!-- rule: hand.discard.who -->
- Cards put away: 3. *Documented: from the book, p. 59.* <!-- rule: hand.discard.count -->
- Exactly that many are put away. *Documented: from the book, pp. 59-60.* <!-- rule: hand.discard.count_mode -->
- Honours may not be put away. *Our reading: book, p. 34.* Other reading: Any card may be put away. <!-- rule: hand.discard.discard_honours_barred -->
- There are exceptions to the ban, they depend on the hand. *Our reading: book, p. 34.* Other reading: . <!-- rule: hand.discard.allowed_exceptions -->
- The discard counts for the player who put it away. *Sources silent, our decision.* Other reading: The discard counts for its owner if he took at least one trick. Open question 1: could be settled by the opinion of an expert, a document in which the rule is printed or statistics of games played by bots (the discard of a player who won no trick: kept or lost); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.discard.counts_for -->
- The discard is announced with «ho scartato» and is final. *Documented: from the book, p. 60.* <!-- rule: hand.discard.announce -->

### Bidding

This step: *Documented: from the book, pp. 60-66.*

- The bids are: three, two, one, sans prendre. *Documented: from the book, p. 66.* <!-- rule: hand.bidding.contracts -->
- The player on the dealer's right opens the bidding. *Documented: from the book, p. 60.* <!-- rule: hand.bidding.opens -->
- The dealer speaks last. *Sources silent, our decision, after Dummett (1980), pp. 60-64.* Other reading: When the dealer speaks: in turn. <!-- rule: hand.bidding.dealer_speaks -->
- With equal bids the earlier seat in turn wins the bidding. *Documented: from the book, pp. 63-64.* <!-- rule: hand.bidding.tie -->
- Whoever passes may not come back into the bidding. *Documented: from the book, p. 66.* <!-- rule: hand.bidding.pass_is_final -->
- If everyone passes, the next dealer deals again. *Sources silent, our decision, after Dummett (1980), pp. 65-66.* Other reading: If everyone passes: a redeal. Open question 22: could be settled by a document in which the rule is printed (the bidding of the dealer and a general pass); see [the open questions](../rulesets/OPEN_QUESTIONS.md). <!-- rule: hand.bidding.all_pass -->
- A bid binds: whoever takes it must play it. *Documented: from the book, p. 66.* <!-- rule: hand.bidding.bid_binds -->
- Whoever lays down fewer cards than he bid plays the bid of the cards laid. *Documented: from the book, p. 65.* <!-- rule: hand.bidding.lay_down_fewer -->

### The exchange

This step: *Documented: from the book, pp. 60-61.*

- The bid says how many cards are exchanged. *Documented: from the book, pp. 60-66.* <!-- rule: hand.exchange.count -->
- You lay down your cards first, then take the new ones. *Documented: from the book, pp. 64-66.* <!-- rule: hand.exchange.lay_down_first -->
- The exchange is made face down. *Documented: from the book, p. 61.* <!-- rule: hand.exchange.face -->
- Cards that may be asked for: all. *Documented: from the book, p. 61.* <!-- rule: hand.exchange.callable -->
- If nobody else holds the wanted card, it is taken from the discard. *Sources silent, our decision, after Dummett (1980), p. 61.* Other reading: If nobody else holds the wanted card, it may not be asked for. <!-- rule: hand.exchange.card_not_held -->

### The tricks

- The player on the dealer's right leads first. *Our reading: book, p. 61.* Other reading: First lead: declarer. <!-- rule: hand.tricks.first_leader -->
- Whoever takes a trick leads next. *Documented: from the book, p. 37.* <!-- rule: hand.tricks.next_leader -->
- You must follow suit if you can. *Documented: from the book, p. 35.* <!-- rule: hand.tricks.follow_suit -->
- With no card of the suit you must trump. *Documented: from Torino [1846], part I, p. 36.* <!-- rule: hand.tricks.must_trump -->
- A trump must be answered with a trump, but you need not beat it. *Our reading: book, pp. 36-37.* <!-- rule: hand.tricks.must_overtrump -->
- The Fool may be led. *Sources silent, our decision.* <!-- rule: hand.tricks.fool_may_lead -->

### The count

- Cards are counted in pairs: a card is worth its value and half a point more. *Documented: from the book, pp. 51-52.* <!-- rule: hand.count.count_unit -->
- Cards are counted in groups of 2: a group is worth the sum of its values less one point for each extra card. *Our reading: Dummett (1980), pp. 66-68.* <!-- rule: hand.count.group -->
- A single card without a pair counts as half a point and its value. *Our reading: book, p. 54.* <!-- rule: hand.count.odd_card -->
- The card given for the Fool is part of the count. *Our reading: book, p. 68.* Other reading: The card for the Fool in the count: deducted. <!-- rule: hand.count.fool_card -->

### The result of a hand

- The declarer wins if he reaches the threshold of his bid. *Documented: from the book, p. 68.* <!-- rule: hand.result.winner -->
- The threshold is 46 points. *Documented: from the book, p. 68.* <!-- rule: hand.result.target -->
- If the points are equal, the cards are dealt again by the next dealer. *Documented: from the book, p. 70.* <!-- rule: hand.result.tie -->
- The result depends on bands of points, set in the game file. *Our reading: book, pp. 66-70.* Other reading: min: 46; outcome: win; pays: full, min: 45; max: 45.5; outcome: draw; pays: nothing, min: 43.5; max: 44.5; outcome: loss; pays: onoranza only, max: 43; outcome: loss; pays: full. <!-- rule: hand.result.bands -->
- A hand gives no game points. *Our reading: book, p. 64.* <!-- rule: hand.result.game_points -->

### Settling

- Settling is in soldi. *Documented: from the book, pp. 67-69.* <!-- rule: hand.settle.unit -->
- The declarer settles with each player on his own. *Documented: from the book, p. 64.* <!-- rule: hand.settle.mode -->
- The amount: sum: by the bid: onoranza, per points: of: declarer side; from: 45; every: 5; unit: 1; round: nearest half down; direction: both. *Our reading: book, pp. 67-70.* <!-- rule: hand.settle.amount -->

### The match

- The match is kept as a ledger of hands. *Sources silent, our decision.* <!-- rule: match.kind -->

### Offences

- Offence «wrong discard count»: impossible at the table; penalty: pays: simple game; to: each of the others; if lost: double. *Documented: from the book, pp. 59-60.* <!-- rule: penalties.wrong_discard_count -->
- Offence «change discard»: impossible at the table; penalty: allowed: no. *Documented: from the book, p. 60.* <!-- rule: penalties.change_discard -->
- Offence «call without laying»: impossible at the table; penalty: pays: onoranza; to: each of the others; then: hand is played. *Documented: from the book, pp. 64-65.* <!-- rule: penalties.call_without_laying -->
- Offence «refuse bid»: impossible at the table; penalty: pays: double onoranza; to: each of the others; marcio alt: marcia game. *Documented: from the book, p. 66.* <!-- rule: penalties.refuse_bid -->
- Offence «signal»: text only; penalty: pays: simple game; to: each of the others; then: lone player may stop. *Documented: from the book, p. 73.* <!-- rule: penalties.signal -->
- Offence «revoke»: impossible at the table; penalty: pays: simple game; to: each of the others. *Documented: from the book, p. 38.* <!-- rule: penalties.revoke -->

## Not played yet

- **Vola.** The book gives no figure and no rule of a vola inside Permesso; a premium of the table, not played. *Documented: Torino 1787, p. 100: «Vola, dicesi del fare tutte le basi»; the stake of a vola is agreed before the deal (p. 21 rule 10).* <!-- left_out: vola -->
- **Marcio.** Two ways of playing (in coins or only for the game with marcio) are named but the book gives neither a line for the marcio at Permesso nor its payment; only the coin game is played (see FORMAT_OPEN_POINTS, F2). *Documented: Torino 1787, pp. 66, 99: the game may be played «unicamente a guadagnar la partita col marcio»; «Marcio, vale posta doppia … facendo o … a cui la partita è fissata».* <!-- left_out: marcio -->
- **Fool given in exchange.** The mechanism is not explained (probably the Fool may be laid down in the exchange); the exchange has no key for it (FORMAT_OPEN_POINTS, 10). *Documented: Torino 1787, pp. 34-35 (rule 38): «Si potrà però il Folle dar via, … carta, ove si giuochi a Permesso».* <!-- left_out: fool_given_in_exchange -->
- **Draw money.** A drawn hand pays nothing in the ledger. *Documented: Torino 1787, p. 70: after a draw nothing is said of the stakes on the table.* <!-- left_out: draw_money -->

## Sources

| Source | Full citation | Held |
|---|---|---|
| Torino 1787 | Primi elementi e regole del giuoco de' tarocchi, Torino, Soffietti, 1787 | held |
| Dummett (1980) | Michael Dummett, The Game of Tarot, London: Duckworth, 1980, chapter XIII «Tarocco in Piedmont and Lombardy», pp. 258-279 (our scan is partial: printed page 268 is missing) | held |
| RI 1830 (after Dummett) | [Carlo O…], Regole inalterabili per tutti i giuochi di Tarocco detti di commercio, Torino, 1830 (known to us only through Dummett 1980) | not held: known to us only through another source |
| Torino [1846], part I | L. B., Il giuocatore di tarocchi al tavoliere, part I (Grammatica del giuocatore), Torino, Serra, [1846] | held |

Generated from `rulesets/permesso_3.json`, rules revision 3. Do not edit: change the game file.
