# Format 3: rules that do not fit cleanly

22 November 2026. Companion of `docs/GAME_FILE_FORMAT.md`. Every rule of the games of the book that format 3 cannot write cleanly, with its printed page in the 1787 book and what I propose. «Cleanly» means: one rule leaf or one module setting with a value from a closed list, no code, no prose the engine must interpret.

Three kinds of trouble, marked:

- **gap** — the format has no key or value for it yet; the proposal is a new key, a new value or a new module.
- **fuzzy** — the format can write it, but only by choosing a reading the book does not settle; the choice is a `[R]` or `[S]` leaf, the format is fine.
- **table** — the rule is about the physical table (talk, peeking, misdeals); an online table prevents it; the format keeps it as a penalty with `enforce: "prevent"` for the rules page.

Numbers 1-19 follow the games in the order of `GAME_FILE_FORMAT.md`, section 20; 20 and after are general.

Page numbers and quotations come from the first reading of the games; I did not re-read the scan for this run (it writes no rule, only the format).

---

## Games

### 1. Venticinque for two (pp. 53-56)

- **fuzzy.** The tie, «faremo eguali» (p. 54): the book does not say what follows. `result.tie` can say `redeal_next_dealer` (the Permesso rule, p. 70) or `no_game_points` (the format 2 file). The converted file keeps format 2.
- **fuzzy.** Who owns the dealer's discard at the count : `count.dealer_forfeit` (format 2) or `discard.counts_for` holds any answer.
- **gap.** Rule 38, p. 34: the Fool may be put away «for a sure vola». The format has no notion of a vola announced at the discard, so the exception cannot be conditioned. Proposal: leave it out (as the format 2 file does, `left_out.vola`); if a vola premium is ever played, add a declaration kind `vola` (11.7) and then `allowed_exceptions` with `{"if": {"declared": "vola"}, "any": ["T0"]}`, which the schema already accepts.
- **fuzzy.** Premiums «purchè si voglia» (p. 55) and their thresholds: marcio is «posta doppia» (p. 99) at «a third or a half» of the points; triplice and quadriplice have no printed thresholds (Dummett 1980, p. 261 reads «more than twice», «three times», «four times»). The format writes them as `settle.premiums` with `option`; the numbers are `[S]`.

### 2. Morto (pp. 57-58)

- **fuzzy, important.** The format 2 file (converted word for word) rests on Dummett and McLeod 2004 through a secondary note, not on the scan, and plays the Milanese order (`trump_order: pavia_c`, the World above the Angel, `card_points: honours_4`). The book says Morto «non giuocasi altrimente che a Venticinque carte» (p. 57), so by the book it has the Venticinque order and honours (Angel above World, p. 13; honours p. 34). Proposal: after the format is accepted, rewrite Morto as `"extends": "venticinque"` plus the `prize_stock` phase and the peek penalty, with the sources of the scan check of 2 November 2026. That is a rule change for the Steam game too, so it is the owner's call, not the converter's.
- **gap.** A Fool drawn from the Morto into a player's points was never played, so the Fool's card exchange (p. 52) may or may not apply (check of 2 November 2026). `cards.fool_exchange` speaks only of a Fool played. Proposal: a new setting `prize_stock.fool_drawn` with values `counts_no_exchange` (it is a 5-point card like any other) and `exchange_as_played`; our decision `counts_no_exchange`, `[S]`.
- **fuzzy.** Who draws for a trick in which the Fool was shown (check of 2 November 2026): `prize_stock.fool_trick`, now `trick_winner` `[S]`.

### 3. Baronetti (pp. 47-53)

- **gap, partly closed.** The open Fool «solo mi basterà mostrarlo» (pp. 47, 50): shown when convenient and laid among one's points, never given. I added `cards.fool_show_any_time`, but the book does not say whether showing it inside a trick replaces an answer, nor whether the pile it came from then turns its next card . Proposal: `tricks` treats a shown Fool as the seat's play to that trick and `open_piles.reveal: after_trick` turns the next card of that pile; showing it between tricks lays it aside and turns the next card at once. Both `[S]`; needs one more value `fool_show_any_time: "in_trick_only"` if we prefer the first alone.
- **fuzzy.** Piles running out unequally (pp. 49-50): `open_piles.empty_pile: play_from_others` is our decision.
- **table.** Turning two cards at once (first a warning, then the game, pp. 50-53) and looking at a closed card (double, simple if by accident): the engine turns cards itself; penalties `open_two`, `peek_pile` with `enforce: prevent`.
- **gap.** The deal «di seguito, e non una per ciascuno alternativamente» with a penalty «secondo l'accordo» (p. 53): `deal.piles` plus `order: opponent_first` deals the piles; the penalty is `table`.

### 4. Mitigati for two (pp. 85-87)

- **fuzzy, blocks the game.** The size of the first deal is not printed: the check of 2 November 2026 reads 39/39, discards 13 and 12, then 53 cards 28/25; Dummett 1980, p. 262 reads 25/26, discards 12 and 13, then 12/12 and 3 to the dealer. Both are writable (`deal.hand_size` by role, `discard.count` by role, a second `deal` with `from: rest`, `hand_size: half_rest` or 12, `dealer_extra: 3`); the first reading proposes Dummett's. The `«sino a»` of p. 85 is `count_mode: up_to` under the reading of 2 November 2026.
- **closed.** Two discards in one hand need to say whose points each joins: I added `discard.counts_for`. Values are `[S]` (the book does not say whether the first discards count).
- **fuzzy.** «quarantasei punti, dedotta la carta del Folle» (p. 87, also p. 81): `count.fool_card: deducted` versus `counted`; which reading is the open question of that page.
- **fuzzy.** The honours threshold (three as in Bagatt'ultimo, or any number) and the tariff: the book sends to «pag. 98», the tariff stands on pp. 93-95. Written as a declaration kind with `min` `[R]`.
- **gap.** The penalty «dieci marche, che comunemente dicesi una ficcia» (p. 87) has an amount but the penalty `effect` is a free object (see 20).

### 5. Bagatt'ultimo, Mitigati for three (pp. 91-96)

- **fuzzy.** «da ambi i compagni dieci marche» (p. 94): from each or from both together. `declarations.paid_by` and the payments' `alt` hold both; Dummett 1980, p. 262 and the 1637 phrase «de chacun» support «from each».
- **fuzzy.** «e così vadasi dicendo» (p. 94): 6 and 7 honours → 25 and 30 by `table.beyond`; `[R]`.
- **fuzzy.** «Eccettuazione» (p. 96): somewhere Mitigati pay 30 and the honours «otherwise». The 30 is a variant patch; the «otherwise» has no numbers, so the variant can only carry the 30 and say `[S]` for the rest.
- **gap.** Declarations are compulsory («Chi avrà … accuserà», p. 93), yet a player who does not declare before the first card loses the right (p. 95). At an online table `declarations.mode: auto` makes the loss impossible, `manual` keeps it. Proposal: `manual` with a memo line during the window (fidelity, and a lesson in attention), `[S]`; the owner may prefer `auto`.
- **fuzzy.** The game itself pays nothing in the book (pp. 95-96); Dummett 1980, p. 262 gives 10 from each to whoever reaches 26, and if two reach it the third pays each 10: `payments` on `reached_target`, settle mode `winners_from_losers`.
- **fuzzy.** Counting in threes (p. 96) leaves one or two cards over for a seat whose cards are not a multiple of three: `count.odd_card` `[S]`.
- **gap.** To whom the penalty of 10 marks goes when there are two opponents (p. 87 «L'istesso sarà al Bagatt'ultimo fra tre persone»): see 20.
- **fuzzy.** When the dealer takes his three extra cards with packets 5+10+10 (pp. 91-92): `deal.extra_when: last` `[S]`.

### 6. Venticinque for three (p. 8 only; rules from RI 1830 through Dummett 1980, p. 260)

- **gap.** «Fuora» after two rounds obliges the player to play «da fuori», giving points to the one behind (Dummett 1980, p. 260, after RI). This is an intention, not a checkable rule: no card is illegal because of it. Proposal: no rule leaf; a `bot.play` leaf and a hint, and the rules page tells it as RI's rule. If the project wants it enforced, it needs a new `tricks` value «a seat that is out must play its lowest counter when it cannot win», which is our invention, `[S]`.
- **gap.** A monte by everyone's consent after each round of the deal (5, 10, 10): `a_monte.windows` names phases, not rounds inside a deal. Proposal: allow `"deal.packet"` in `windows` (after each packet round of the deal phase).
- **gap.** The payment depends on the running totals at the end of the three rounds (each with zero or less pays 1; if one has a plus he does not pay and the third pays 2). That is a settle at the end of the match, not of a hand. Proposal: a key `match.payout` holding settle settings evaluated when the match ends (`mode` and `amount` as in 11.14, plus a mode `by_running_total`).
- **fuzzy.** Whether a seat that is out still follows suit: Dummett is not clear either; `[S]`.

### 7. Partita for three (pp. 87-88)

- **fuzzy.** The number of cards (25/25/28, discard 3) and the payment come from Dummett 1980, p. 260 (after PE) and Milan 1794, p. 71, not from the 1787 text («dare secondo le regole sovradette»). Writable as `[D]` leaves with `by`. Nothing else is missing.

### 8. Permesso for three, the auction (pp. 58-66)

- **fuzzy.** The words «Permesso?», «Andate», «Siete padrone», «A due», «A due anch'io», «Io passo» (pp. 60-66). The format models an auction of contracts with `bid` and `pass`; «Andate» is a `pass` that lets the asker go. The words are texts (labels of the actions), not rules. Whether «Andate» could ever be refused other than by a better bid the book does not say.
- **fuzzy.** The dealer's place in the auction (Dummett 1980, p. 266: last, may overcall), all passing (Dummett, p. 265: thrown in), a called card that is in the discard or in the declarer's hand (Dummett, p. 266): `bidding.dealer_speaks`, `bidding.all_pass`, `exchange.card_not_held`, all `[S]` or `[D]` with `by`.
- **table.** Asking for cards without laying one's own (p. 64-65), bidding and then refusing to go (p. 65, double Onoranza to all or «marcia»): the engine asks for the laid cards first and has no «refuse» action; penalties `call_without_laying`, `refuse_bid` with `enforce: prevent`.

### 9. Permesso for three, the result (pp. 66-70)

- **gap.** 45 points: a loss on the Onoranza (pp. 66-67) or a draw (p. 70, «45½ o 45 senza il Folle»). The first reading: a draw when the declarer has no Fool and receives its card; a loss when he holds the Fool and gives the card. `result.bands` sees only the final points, after the Fool's card. Proposal: a key `result.measure` (`after_fool_card` default, `before_fool_card`) and a band condition `fool: held | not_held`, so the two readings of p. 66-70 can be written as two bands each; `[R]`.
- **fuzzy.** Rounding to five (pp. 69-70: 62→60, 57→55, 67½→65, 33→35; 47½ and 42½ are not printed): `per_points.round: nearest_half_down` `[S]`.
- **fuzzy.** «sei soldi» from each opponent (pp. 68-70; Dummett 1980, p. 266): `settle.mode: declarer_vs_each`.
- **fuzzy.** The Gaio example «Vince … cinque soldi» at 33 (p. 70) reads as a misprint for «loses»; no format issue.

### 10. Permesso: the Fool and signals (pp. 34-35, 72-73)

- **gap.** «where Permesso is played» the Fool may be «given», changed for another card (pp. 34-35); the mechanism is not explained (probably the Fool may be laid down in the exchange). The discard bars the Fool, and `exchange` has no bar list of its own. Proposal: a key `exchange.lay_down_barred` (selectors), default `set:honours`; for Permesso `[R]` the honours without the Fool.
- **table.** Knocking on the table and any sign: the simple game to all, then the declarer decides whether to play on (pp. 72-73). Online the signal cannot be seen; a voice call beside the table is beyond us. Proposal: `sides.signals: forbidden` closes the table chat during a hand; the penalty `signal` is `text_only`; the declarer's choice to stop is left out.

### 11. Quadrilio (pp. 71-74)

- **fuzzy.** «non può scartarne più di due» (p. 71): exactly two or up to two; the dealer's 21 cards are not printed (Dummett 1980, p. 267 and Milan 1794, pp. 17-18 have 19/19/19/21). `dealer_extra: 2`, `count_mode` `[R]`.
- **fuzzy.** «non si può mai rifare per eguaglianza di punti» (p. 74) against 45½ possible with 91 points: `result.tie: declarer_loses` `[S]` (he did not make 46), as the first reading proposes.

### 12. Sestilio and «giuoco sciolto» (pp. 76-78)

- **fuzzy.** «Sciolto» is offered as a choice (p. 76), Dummett 1980, p. 267 makes it the outcome of all passing. Both are writable: a variant `sciolto` (chosen before play) and `bidding.all_pass: contract:sciolto` with phases under `when: {"contract": ["sciolto"]}`. Writing two `result` phases with `when` is verbose but clean.
- **fuzzy.** The payment is not printed (Dummett, p. 267 gives one).

### 13. Dottore (pp. 75-76)

- **fuzzy.** «Chi è ultimo a prendere giuoca il primo», «come si è detto del giuoco Trent'uno» (p. 75): the last to take a trick in the previous hand, or the last to receive cards. `tricks.first_leader: previous_last_taker` `[R]`; the first reading proposes `dealer_right` for the first trick.
- **fuzzy.** «purchè tutti contino sull'istesso metodo» (p. 75): counting by one, two or three as agreed: `count.group: "option:group"` with an option; the payment is not printed (Dummett, p. 263: «There is no information about the system of scoring»).

### 14. Meno (pp. 78-79)

- **fuzzy.** One sentence of rules and a list of hand sizes by players (p. 78). The sizes are `by_seats`; what happens to the three or 28 cards left over, who leads and what is paid are `[S]`. Meno with 4 and 8 cards («come al Sedici», «Trent'uno») is the short games played for the fewest points: no `fuora` (nobody goes out), so a `repeat` until `stock_empty` and `result.winner: fewest_points`; all `[R]`/`[S]`.

### 15. Chiamare il Re (pp. 79-84)

- **gap.** A dealer who calls his own king plays alone «unless all unanimously forgive» (p. 83): `call_partner.own_card: plays_alone_unless_forgiven` needs a vote of the other three. The `a_monte` module already has a unanimous vote. Proposal: extract a small core module `consent` (propose / agree / refuse, unanimous or majority) used by `a_monte` and by `call_partner`.
- **table.** A hint to the partner makes the hinter go alone (p. 83; «questi» is the king's holder): undetectable online, `text_only`.
- **fuzzy.** A king in the dealer's discard, all sixteen courts with the dealer, who leads first, and the payment («secondo il convenuto», p. 83; Dummett 1980, p. 268 missing): `call_partner.card_in_discard: forbidden` `[S]`; for the sixteen courts the ladder ends: proposal `step_down` exhausted → the dealer goes alone `ad_una` `[S]` (one more value needed: `ladder_exhausted: plays_alone`).
- **fuzzy.** An equal bid: the challenger goes (p. 82): `bidding.tie: challenger`.

### 16. Partita, two against two (pp. 88-90)

- **fuzzy.** «Dando i posti, si decide chi debb'essere insieme» (p. 88) and «Chi coppa meglio» (p. 89): how pairs and the first dealer are chosen. `seats.seating: draw_high_pairs` and `first_dealer: best_cut` `[R]`, after Dummett 1980, p. 261.
- **fuzzy.** Counting «by four or by two, it does not matter» (p. 89): `count.group` 2 or 4 by option; the payment size is not printed.

### 17. Consiglio (p. 97)

- **gap.** Partners «mostransi il giuoco, e si consultano liberamente»: the view and the chat do it for humans (`partners_share_hands`, `partners_talk`), but the bot cannot consult. Proposal: a bot partner shares its hand and plays the card a human partner suggests if it is legal (a `bot.profile: consiglio`), `[S]`.
- **fuzzy.** Two customs (46, or the most points over four deals): two variants.

### 18. Sedici (pp. 14-18, 35-45)

- **fuzzy.** The pack running out before anyone goes out (p. 39), the next dealer at three or four (p. 41), two going out together: `fuora.stock_empty`, `seats.dealer_rotation`, all `[S]`. (The value of plain cards counted singly, `count.plain_value`, is `[R]` 1 since revision 14: Prammatica [1846], p. 12, Torino [1846], part I, pp. 30, 37; question 9.) Two claims at once need one more key: proposal `fuora.simultaneous: earlier_claim | higher_points`, `[S]`.
- **fuzzy.** When a claim may be made («ti basterà far sedici punti», «fuora» only when sure, pp. 35, 39-41): `fuora.claim_when` `[S]`.
- **gap.** A player who shows his cards loses his payment, which the second player takes (pp. 44-45): the penalty moves a payment to another seat. Proposal: penalty effect `{"pays_to": "second_out"}` (see 20).
- **fuzzy.** Ruinous false claim at exactly 8 points (p. 39): the simple game  `[R]`.

### 19. Trent'uno (pp. 45-46)

- **fuzzy.** Nobody reaching 31, the number of players and the marcio threshold are not printed (Dummett 1980, p. 269: «no hint» in PE or RI): `fuora.stock_empty`, `seats.count`, `settle.premiums` `[S]`.

## General

### 20. Penalty effects are free objects

`penalties[].effect` is a rule leaf whose value is any object (Morto: `{"lose": "double", "win_double": "simple", "win_simple": "nothing"}`). That is enough for the rules page and for `prevent`, but `apply` needs a typed effect. Proposal, once three games with `apply` penalties are written: `{"pays": amount, "to": "each_other" | "event_seat" | "second_out" | "dealer", "stake_change": {…}, "hand": "continues" | "ends" | "redeal", "plays_alone": true}`.

### 21. Onoranza has two definitions (pp. 67, 100)

p. 67: the Onoranza of the contract, 2 to 5, lost or won within 2½ points; p. 100: the «least» win at a difference of 1½-2 points. Penalties speak of «Onoranza come a tre» (2 units). The amount `{"stake": "onoranza"}` would be ambiguous outside Permesso. Proposal: use `{"contract": "onoranza"}` in Permesso and a plain number (2, `[S]`) in penalties; drop `stake: onoranza` if no game needs it.

### 22. Ficcia: one marca or ten (pp. 87, 99)

p. 87 «dieci marche, che comunemente dicesi una ficcia»; p. 99 calls the ficcia a token like the marca. The format writes the amount in marks (10) with `settle.unit: marca`; whether «ficcia» is the token or the sum is a word of the texts, `[R]`.

### 23. Silence and talk (pp. 25-26)

«Nel giuoco non si parla mai», complaints only between two, noise twice: the simple game to all. `table`: `sides.signals: forbidden` closes the table chat during a hand; voice beside the table is not ours to control.

### 24. Revokes and their correction (pp. 33-34, 38)

The revoke costs the simple game to all; while the trick is not covered the card may be changed (at two, only he). The engine refuses an illegal card: `revoke` with `enforce: prevent`. If a «training wheels off» mode ever lets players revoke, the correction window is one more `tricks` setting.

### 25. Misdeals and faced cards (pp. 18-24, 28-29, 92)

An extra or missing card costs the game; a faced card gives the receiver a payment, or a redeal «in any game» (p. 92). The engine deals: `misdeal`, `faced_card`, `deal_out_of_turn` are `prevent`.

### 26. The cut and the announced packets (pp. 16-18, 41-42, 53)

Online the cut changes nothing a shuffle has not; the format keeps `cut_by`, `cut_min`, `packets_announced` because the lesson and the rules page show the ritual. Proposal: the table offers the cut to the cutter with a «cut for me» default.

### 27. A monte: replacing «some» cards (pp. 29-30, 98)

«cambiar le carte … o affatto rifare la data»: which cards are changed, by whom, is not said. `a_monte.what: replace_some` has no settings for it; until a game needs it, only `redeal` is playable (`[S]`).

### 28. Showing bad cards, taking others' points (pp. 28, 32-33)

Showing one's bad cards costs a «marcia» to all; taking an opponent's counters costs double. Both `table`, `prevent`.

### 29. The discard exception for the Bagatto (p. 34)

«the Bagatto alone, without the Fool»: alone = without the Fool (book, literally) or the only trump held (Dummett 1980, p. 259). Both are writable: `{"if": {"hand_lacks": "T0"}, "any": ["T1"]}` or `{"if": {"hand_count": {"of": "trumps", "max": 1}}, "any": ["T1"]}`; `[R]`.

**Decided in rules revision 2 (23 November 2026):** the only trump held, and no Fool: `{"if": {"hand_lacks": "T0", "hand_count": {"of": "trumps", "max": 1}}, "any": ["T1"]}`. Revision 1 played «without the Fool» alone. Still open for the engine: the exception must be judged on the hand as dealt, not at each step of the discard (else putting another trump away first frees the Bagatto).

### 30. Card identity: number or subject

Card ids are the trionfi numbers of the 1787 list (pp. 9-10). The Steam engine names trumps by subject where a historical order differs from the printed number (`trump_order.gd`: «a table copied by number could be wrong without anyone seeing it»). For a Milanese or 1830 source with other numbers, a `trump_order` list of ids is a list of the book's numbers, not of that source's. Proposal: the framework's deck file maps id → subject; a game file from another source writes its order by subject names in a later key `trump_order_subjects`, converted to ids by the loader.

### 31. Texts that may go stale in words

Numbers in texts are placeholders, but a sentence's words can still disagree with a changed rule (a `must_overtrump` turned true while the memo says «no need to beat»). The validator knows each line's rule paths. Proposal: the build stores the values of each line's rule paths beside the texts (a small lock file); when one changes, the line is listed for review.

### 32. Half-points of the engine, book points of the file

The format 2 engine stores card values «less one» in half-points; format 3 writes the book's numbers (a king 5) and the group arithmetic of GAME_FILE_FORMAT 11.12. The presets keep the format 2 names, so both read the same file; the loader must translate when it hands values to the format 2 engine. A test should check that both give 91 for the pack counted in pairs.

### 33. The match around the book's hands

The 1787 book describes hands and stakes. It also knows longer units: a partita «fissata» to a number of points (p. 99, under «Marcio») and Consiglio's «giro» of four deals (p. 97); Torino [1846], part I, p. 36 ends Partita «in quattro scarti». Since rules revision 5 a stake game is `kind: ledger` with `dealer_rounds` (the match ends after that many rounds of dealers; the greatest balance wins, equal balances are a draw). One stake paid at the end of a match waits for point 54.

### 34. New leaves of the converted files

The leaves format 3 added to `venticinque.json` and `morto.json` (seats, sides, discard who/count/announce, prize_stock, the Morto penalty) quote the book as the first reading of the games and the check of 2 November 2026 quote it; I did not re-read those pages on the images in this run. The format 2 leaves are byte for byte.

### 35. «undecided» cannot be written as a value

The first writing of the Permesso, Dottore, Re, Partita and Consiglio files used `null` plus an `[S]` source wherever the book is silent. The schema forbids `null` in every enum, number and amount leaf (only free leaves, as a penalty's `effect`, would take it). Written instead, in the first files: a proposed value marked `[S]`, with `alt` where another reading is playable, and `{"stake": "agreed"}` for a payment the book leaves to the table. The silent rules (all `[S]`, each says what is missing): `bidding.dealer_speaks` (last), `bidding.all_pass`, `exchange.card_not_held` (from_discard), `tricks.first_leader` of Chiamare il Re, `call_partner.card_in_discard`, every `settle.amount` of Dottore, Partita and Re, `result.tie` of Dottore, Partita and Sestilio's giuoco sciolto, `deal` of Partita for three (from p. 59, `[R]`). Proposal: allow `"value": null` with an `[S]` source in these leaves, so that a game can say «undecided» and the table must ask; until then the file carries our value.

### 36. the Fool's card given to the taker of the trick (pp. 77-78)

«la carta poscia del Folle si dovrà … chi ha preso allora la mano»: either one plain card given in place of the Fool (`fool_exchange`, written so, `[R]`), or the Fool itself going to the taker of that trick. The format has `fool_exchange_to: trick_winner` (the receiver) but no key for what is given. Proposal: `cards.fool_exchange_what`: `plain_card` (default) or `the_fool`; the second reading is then the `alt`.

### 37. Permesso for three, the draw at 45 and the Fool (pp. 66-70)

Written as `result.bands` with the draw at 45½ only and `alt` with the draw at 45-45½ (the first reading of p. 70, «e non abbi avuto il Folle»). The condition «Fool owed or not» has no place in a band (as in point 9): proposal as there, `result.measure` and a band condition `fool: held | not_held`.

### 38. Sestilio's giuoco sciolto needs a second set of phases

One game file has one `count` and one `tricks` setting. Giuoco sciolto (pp. 76-77, the rules of Dottore) differs in who leads and in the payment, so `permesso_6` carries `tricks_sciolto`, `result_sciolto`, `settle_sciolto` under `when: {"contract": ["sciolto"]}`; the count stays as in Permesso (pairs), though the Dottore (p. 75) allows one, two or three. Proposal: allow `when` and the `count.group` option per contract, or accept that giuoco sciolto is a separate game file (`permesso_6_sciolto`, extends Dottore).

### 39. Consiglio's second custom is a total of points

«presso altri è chi fa più punti … le carte tutte quattro le volte» (p. 97): the winner is the part with more card points over four deals, not more game points. `match.kind: fixed_hands` counts game points per hand; `tiebreak: card_points` only breaks ties. Written as the variant `sum_of_four_deals` with `fixed_hands` 4 and a note; wrong in kind. Proposal: `match.kind: total_points` with `hands` (the sides add their card points of every hand).

### 40. Partita pairs «dando i posti» and the seating

Pairs are decided «dando i posti» (p. 88), partners then sit «a faccia a faccia» (p. 89). `seats.seating` takes one value, so `partners_opposite` is written and the drawing of pairs (Dummett 1980, p. 261: the two highest cards together) is only in the source. Proposal: a separate key `seats.pair_selection`: `free`, `draw_high`, `agreed`.

### 41. bot advice with several counts, and «de' maggiori»

Quintilio (p. 74: at least four of the «maggiori» trumps) and Chiamare il Re (p. 84: eight trumps, four of them «de' maggiori», and a pair of kings with another court card) are conjunctions of counts, but a condition holds one `hand_count`; and «maggiori» is not defined. Written: Re's `bot.bid` with the eight trumps only, the rest in the source; Quintilio's advice in `bot.play`. Proposal: `hand_count` as a list (all must hold) and a set `cards.sets.high_trumps` `[S]` (which trumps are «maggiori»).

### 42. Chiamare il Re, the ladder runs out

A dealer who holds all kings, queens, knights and jacks (pp. 81-82: «tutte quattro i Re … i Cavalli … un Fante») has nothing to call; the book is silent. `call_partner.step_down` has no value for it. Proposal: `call_partner.ladder_exhausted`: `plays_alone` (our decision, `[S]`) or `redeal`.

### 43. Quadrilio's «at most two» and an unequal hand

`discard.count_mode: up_to` (p. 71, «non può scartarne più di due») lets a dealer keep a 20th card; the tricks would then be unequal. Written `up_to` with `alt: exact` as the format's section 11.2 has it; the engine should refuse a hand that cannot play the tricks to the end, or take `exact`. Same for Partita's two cards (p. 89 sends to p. 71).

### 44. payment figures the book names only by the table

Permesso for four and more against «tre giuocatori in un solo» (pp. 73-74), Chiamare il Re «secondo il convenuto» (p. 83), Partita «del convenuto» (p. 90): the payment is a sum «agreed», written `{"stake": "agreed"}` (option `stake`, choices ours). The Onoranza per contract is documented only for Permesso for three (p. 67) and carried to four and five by «lo stesso» / «come sopra» (`[R]`).

### 45. the lead of the first hand

Nowhere in the Permesso, Re or Partita pages (58-97) is it said who leads the first trick; the general rule of p. 35 («Chi è a destra di chi dà, comincia») was said for Sedici. The files use `dealer_right` (`[R]`/`[S]`) with `alt: declarer`; p. 61 («e sia primo in mano, allor io giuoco») can be read both ways.

### 46. silent rules in typed leaves (the same trouble as point 35)

The first writing of the files (Baronetti, Venticinque for three, Mitigati for two, Bagatt'ultimo, Sedici, Trent'uno, Meno) used `null` plus an `[S]` source where the book is silent; the schema forbids `null` in typed leaves (tested: `count.group` with `null` fails). Written instead, the other way from point 35: the key is **omitted** and a `left_out` entry named `silent_<what>` carries an `[S]` source that says what is missing. Omitted keys (each in its file's `left_out`): `deal.hand_size` of the first deal of `mitigati_2`; `count.plain_value` of `sedici_2/3/4` and `trentuno`; `fuora.stock_empty` of the same; `fuora.false_claim` of `trentuno`; the whole counting, leader, void-trump, Fool and payment settings of `meno`; `deal.extra_when`, `settle.mode`, `count.odd_card` of `bagattultimo`; `count.odd_card`, `seats.dealer_rotation` of `venticinque_3`; `result.tie` of `baronetti` and `mitigati_2`; `seats.dealer_rotation` of every file but `sedici_2`. Games that cannot be played without the omitted rules are `did_not_fit` in the first report: `mitigati_2`, `sedici_2`, `sedici_3`, `sedici_4`, `trentuno`, `meno`. A rule the book prints no duty for (no duty to beat a trump, no trick multiplier, no last-trick bonus) is written `false` / `0` with `[R]`, as `venticinque.json` does. Proposal as in 35: allow `value: null` with an `[S]` source for «undecided»; the validator lists them and refuses to let a game with an undecided `deal.hand_size` or `count` setting out of `draft`.

### 47. Mitigati for two, three things the format cannot say (p. 85)

(a) `discard.count_mode` is one value for both players: the dealer «sino al numero di tredici» (up to, or exactly) and the other «ne scarta dodici» (exactly); written `up_to` `[R]` with `alt: exact`. Proposal: `count_mode` also as a by-role object. (b) The second deal «ritorna a dare tutte le carte, che son rimaste» may mean the hands gathered and dealt again (reading A of 2 November 2026) or the cards left undealt (reading B); `deal.from` has `deck`, `stock`, `rest` and no value for the first. `deal_second.from` is left unwritten. Proposal: a value `hands_regathered` once the project chooses reading A. (c) The size of the first deal is not printed (see the item on the first deal above); the validator cannot check the arithmetic of the two deals, since `hand_size: half_rest` is not a number.

### 48. the validator does not read `deal.piles` (Baronetti, pp. 48-49)

The deal arithmetic of the validator counts `hand_size` and `pile_count` x `pile_size`, not the list `piles` ([10, 10, 10, 9]). With `piles` and `dead: none` a file that wrote `hand_size: 0` would fail («dead none but 78 cards are left»). `baronetti.json` omits `hand_size` (the book has no hand outside the piles), which skips the check. Proposal: the validator sums `piles` per seat.

### 49. `declarations.kinds` carries one mark for a list of different rules

At Bagatt'ultimo (pp. 93-95) the rows 3, 4, 5 honours and the trumps are printed, the rows 6 and 7 are the arithmetic of «e così vadasi dicendo» (`[R]` in the check of 23 November 2026), the threshold of Mitigati for two (p. 86) is a reading, and Mitigati's payment (10) is printed. One leaf `kinds` can have only one mark: written `[R]` with the details in the source, which makes the whole tariff look like our reading on the rules page. Proposal: `kinds` as an object, one rule leaf per kind (onori, trionfi, mitigati).

### 50. Sedici and Trent'uno, structure of `repeat`, `fuora`, `settle`

(a) A variant or a child file merges `hand.phases` by id but says nothing of the `phases` nested in a `repeat`; so the hook `fuora` stands at the top level (`during: tricks`) and not inside the group, which the variant «a scaricare» of `sedici_3` (patching `fuora.after_first_out` and `settle.mode`) needs. Proposal: state in 7.3 that nested phases merge by id too, and that a hook may stand outside its host's group. (b) `fuora.false_claim` is a free list; rows `{below, pays}` / `{from, pays}` are our shape, there is no key for who is paid (the book names none, p. 39). Proposal: typed rows with a payee. (c) `settle.mode` cannot vary by seats, so `trentuno` (two to four players, read after Sedici, `[R]`) uses `losers_pay_winner`, which for two players is the loser paying. (d) `deal.dead: stock` and the repeat do not say whether the cards of the earlier rounds stay out of the pack until the game ends (`[R]`: yes, p. 41) or the pack is shuffled for each round.

### 51. Meno, the short forms and the leftover cards (p. 78)

(a) Meno with four or eight cards «come al Sedici», «come al Trent'uno» is written as the variants `four_cards`, `eight_cards` patching `hand_size`; how many deals are played and when the game ends (no «fuora») has no key: a `repeat` until `stock_empty` would have to be added by a decision of the project. (b) The cards left undealt differ by the seat count (2 players 28, 3 players 3, 4 players 2, 5 players 3, 6 none, 7 one); `deal.dealer_extra` can be by seats but `deal.dead` (an enum) cannot. Proposal: `dead` by seats.

### 52. Venticinque for three, what the format cannot say (Dummett 1980, p. 260, after RI 1830)

Confirms point 6: the payment of the match (1 each, or 2 from the third) and the duty to play «da fuori» are not written (`left_out.match_payment`, `left_out.fuora_declaration`, a `bot.play` leaf); `a_monte.windows` is written `["deal.packet"]` as proposed there. New: (a) `result.winner: threshold` with `target` 26 is written for a game in which a single hand has no winner and each player only enters the difference to 26 into `match.kind: running_total`; proposal: `result.winner: none` (the points go to the match). (b) RI lets the dealer discard trionfi «if all below XVII»: written as `discard.barred` = the trionfi from XVII up (`[R]`, `alt` an empty list for the other reading, a discard of three trionfi only); a condition on the three discarded cards together has no key.

### 53. the effect objects used by the penalties

For the typing of point 20, the shapes written in the first files: `{"pays": "simple_game" | "double_game" | "game" | "game_as_agreed" | 10, "unit": "marca", "to": "each_other"}`; `{"pays": ..., "if_inadvertent": ...}` (Baronetti, looking at a covered card, p. 52); `{"first": "warning", "second": {...}}` (Baronetti, turning two cards, p. 50); `{"redeal_for_all": true, "only_before_cards_seen": true}` (a faced card, p. 92); `{"loses_payment": true, "payment_goes_to": "second_out"}` (Sedici, showing the cards, pp. 44-45); `{"while_trick_open": "change_card"}` (a revoke, rule 35). All are `enforce: prevent`: at an online table none of these offences can be committed.

### 54. a settle mode that pays from running totals at the end of a match

A settle mode that pays from running totals at the end of a match (Venticinque for three; already point 6).

### 55. a declared premium

A declared premium (Bagatto ultimo «quando l'abbia per tale dichiarato», Torino [1846], pp. 48, 51, 53).

### 56. a payee for the false «fuora» (Sedici)

A payee for the false «fuora» (Sedici), if `to` is refused inside `false_claim`. (The validator took `to` on 23 November 2026, so this point is only about the engine reading it.)

### 57. a discard restriction by the number of trumps held

A discard restriction by the number of trumps held (Torino [1846], p. 33: trionfi only when holding three or fewer).

**Closed in rules revision 2 (23 November 2026):** the format already writes it with a condition: `barred: ["trumps"]` and `allowed_exceptions: [{"if": {"hand_count": {"of": {"all": ["trumps", {"not": "T0"}]}, "max": 3}}, "all": ["trumps", {"not": "set:honours"}]}]` (Venticinque for three).

### 58. the source id `ours`

The source id `ours` should be built in, like `torino1787` (section 0).

### 59. a rules revision check

G6: a rules revision check: a game file that changed without a new entry in rulesets/REVISIONS.md must fail validate-rulesets .
