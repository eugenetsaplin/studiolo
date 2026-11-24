# Rule revisions of «Studiolo»

There is one journal. Every change to the rules of a game goes into it. The numbering runs through.

## How we keep it

- A revision is the state of all the game files `rulesets/*.json` on a date. Each revision has a git tag `rules-rN`.
- In a game file the key `revision` is the number of the last revision that changed that file.
- Reasons for a revision: a new source; a check by bots; a mathematical analysis; a trial with people; a misreading that has been found; an editorial decision.
- An entry about a change gives: the game, what it was, what it is now, why, the source or report, and whether the game itself changes or only a mark.
- Marks in the game files: [D] — printed in the named source; [R] — our reading of a passage that reads two ways; [S] — the sources are silent, the decision is ours.
- A value marked [S], and a disputed [R], is a placeholder: it stands so that the game can be played, and waits to be replaced by a document, the opinion of an expert, a calculation, bot statistics or a trial with people. The placeholders and what will replace them are listed in `OPEN_QUESTIONS.md`.
- The book of 1787 decides for its own games. Other sources fill its silence and are signed with a year and a place.

## Revision 1 — 23 November 2026, tag `rules-r1`

<!-- files r1
bagattultimo.json sha256:df8df84bbe926b1b8ac532fd9c81c106b0d4c4fc1ca5f8ac98c0ba390f3c4eaa
baronetti.json sha256:55ec56a41c32a6f62ad1630ca22a694f0a48581ccddefe6873ad14035455ef97
chiamare_il_re.json sha256:0f2928d1804141f6ce498a4327e81fcc4117589c3f0a43b16359a2c4aa4c9929
consiglio.json sha256:d4ee234c36382a019ef0322f05bd01ed711c9a2ad13ceb2bbb23046dd27c24fe
dottore.json sha256:675b1aa61431d09ddf0ea2b6159cd5383f47f20ab51355b9f2f6825f7ed88605
meno.json sha256:49ad82f2650744b41cd77f12e7cf7826d285b4c7cb2615f26e88a8465cd21051
mitigati_2.json sha256:ecddc0274c79ced4fc121797cddf0d8ac31a7695a14ce2cb98ffab6568d6c038
morto.json sha256:6821361db86f3255bb7b9114fe8cd37578c04eaf857b48d481c687045ce9f4c5
partita_3.json sha256:4087d81afc60f2ee64af87a0b21f719bcdd8fc8fd50517f581fd135a69faef70
partita_4.json sha256:8fc5be09d725e9969a96c6860bd5a2a240c86cd34363a05477c7cc053960dbd2
permesso_3.json sha256:74cec48db0bdc9d8cba6b00e16cf6b6c2010769c2943de7fe58ce01eb4828cf8
permesso_4.json sha256:943cc8e5c38cbfa1ab2763934f2a84f8e5a70ea00e00b5e91f0a99c5ee13536b
permesso_5.json sha256:d8cdf72d824821da787897cb791bd0cae0e6f265bb8d7fc8cc2da1e71c5adb1f
permesso_6.json sha256:7b8b679aeb047db245bb474e7668701c5a40e5dd5939fbc569845de836c6fca0
permesso_7.json sha256:3a9de21fe82b08845c325ca1a075b97626803d0d229e6895ffbbadc1409b782c
sedici_2.json sha256:fc978644f5f9e2e787fcbad380e43ba358ccaefd20bf6e7faa3239ec91705af4
sedici_3.json sha256:8eaa131c9f421ef96704f7a516116fc7c2aeb5ed17f632bf03ac76e693b6082a
sedici_4.json sha256:6b0c2fae8815f78f3509db7ed17fd47b36c0c6f4f79073dce0678f0b0526d5ff
trentuno.json sha256:92480019fd1c9b8a489177a8b983f51f589d66f536504ac53099ee0f17d0186b
venticinque.json sha256:f7d8ae5a07bce222f77f144db4d42fc06b9cc0bd794d6ffb426cbbb819df807d
venticinque_3.json sha256:bf8870781a7cc03370bce2ab462826a1c6aa39a551002181774a7084eb24e5f8
-->

First release: 21 game files. They cover the 19 games of the Turin book of 1787 («Primi elementi e regole del giuoco de' tarocchi»); Sedici has three files, for two, three and four players. The book of 1787 only names Venticinque for three players; its rules are taken from the Turin book of 1846.

**Where the rules come from.**
- The book of 1787, read from a scan (our first reading pass, 22 November 2026), with two independent checks.
- Torino [1846]: L. B., «Il giuocatore di tarocchi al tavoliere», part I, and «Prammatica».
- Dummett, «The Game of Tarot», 1980; Nice 1930; Piedicavallo 2008.
- Kept for comparison, not used in the game files: a Berlin description of 1800 and a Paris one of 1781 (they confirm the deal of Venticinque).

**Count of marks** (not counting the lists of «not played»): 543 [D], 233 [R], 122 [S] — 898 rules in all.

**State of the files.** All 21 pass the check `node tools/validate-rulesets.mjs`. Every rule needed for the deal has a value. Whether each game can actually be played will be shown by the rules core; it does not exist yet.

**Decisions of this revision worth knowing.**
1. In the games of the book of 1787, the Fool of a player with no tricks stays with him (p. 50; p. 21, rule 10). In Venticinque for three he gives the Fool up: that is how his source has it (Prammatica, p. 6).
2. In all the games of the book of 1787, the discard of a player with no tricks stays with him (p. 21, rule 10; p. 55). Later sources take the discard away — question 1 in `OPEN_QUESTIONS.md`.
3. Morto is brought into line with the book and with Venticinque: the Angel ranks above the World, the honour is the Angel; the discard goes to the dealer; the match is four hands, one point per hand. The announcements that the book of 1846 adds are not played.
4. The duty to trump when one cannot follow suit: printed in Torino [1846], p. 36, for Partita and the games after it — there the mark is [D]; for the games described earlier in that book (Sedici, Trent'uno, Meno, Venticinque for three) it is [R].
5. The call of a King in Chiamare il Re: the dealer calls a King that he does not hold; calling his own is a mistake (p. 83).
6. Partita and Permesso for four: the discard is exactly two cards (Torino [1846], pp. 36, 40-41).

**What the format cannot do yet:** points 54-59 in `docs/FORMAT_OPEN_POINTS.md` (payment by the result of the match, a declared bonus, a ban on discarding by the number of trumps, an embedded source «our decision», a check of revisions).

## Revision 2 — 23 November 2026, tag `rules-r2`

<!-- files r2
bagattultimo.json sha256:74e725f16fef18f650ad303f2c895c83fcfb8d900923d45174685b1430cc9843
baronetti.json sha256:ce130330a3b6932efa48c52541368ef05711c17d40aa41aa44855b283265c5c7
chiamare_il_re.json sha256:a6899d05fd67fb264386522ae5db57c926f8d6d090a396b3e9c52b1e67fd2811
consiglio.json sha256:1f0c6080efcf75e17d5da853552d357c7179a322713396c4163f4ce4c2374442
dottore.json sha256:2cc372a39df96fe652bbe8ce8140bd4a8afca901a888ce9104e2c785c2c4e2f6
meno.json sha256:9f4f68c603fdd5752e11206adac6b4ca50e855a6fc0d049c0734b0abf813d7e3
mitigati_2.json sha256:d4cd8b742830cc16f0c750aab01d4af06a1f8043c7743ade9f35d3b91860ffa9
morto.json sha256:21465530d4a1e0fce0de1eecf79231ad9e4fab91097ac5fee5806bf39351340c
partita_3.json sha256:877b05878d86fb7a1ae0617d32a55b1676289317c766d4452bbb6fff3c0fdc78
partita_4.json sha256:2086fccd600e3672e56dfddea8dfac9663b97518ca22199d9861c9ce357110b4
permesso_3.json sha256:3e6567c885e8bbcd66ae8c552c21a7f570ea00bdd0b331b23a9a62b2d25df815
permesso_4.json sha256:81995d239710b4e9d355dab96c92e19bb71bb4d0398aed8e76b732bae5413166
permesso_5.json sha256:79812430b1348dd1a3b544bd70225d94fbd561ff2b070e657c871fc70678d298
permesso_6.json sha256:5f182b5a01eff017488f60da9918ece29cfec1c0c3c0507e3b9eed6cf8c5ebea
permesso_7.json sha256:92f2a4ac28deafe341c6721e1ef327e3c3659ca7401d719d3194e07da47ef458
sedici_2.json sha256:4271c0d59617966fe8ee5862453bf97730798ad818e085b45cb1ba4d3a931bfd
sedici_3.json sha256:0d7dbcaf75f42319152a4e1da297b838ac0b48359f4239d11f2f805ee9567816
sedici_4.json sha256:f3f95467d614c6ec100a1afef4c6fe2153ddedefc32f6ee8139fbc102b5ca069
trentuno.json sha256:ca8678da8bad1d01a57f46a1f1ecce02919a82d7e3210457140dfe64329c0500
venticinque.json sha256:cf1e84393fc22ca6e06db2d2ff5d0b866c8724c6cd7bfe0450124d9d9309da71
venticinque_3.json sha256:a363246e8654bb185e2969818f6bfae6fcaa0d6d8e17d16126af742a5432c306
-->

Reasons: a review of the literature on the 22 open questions, in which every claim we used was checked against the scans; new sources (a manuscript from Annecy, an article in Intemelion, Gelli); an engine run with a census of rare cases; misreadings that were found. All 21 files are changed: in most of them only the placeholder fields are added.

**The game itself changes.**
1. **Discarding the Bagatto** — Partita for three and for four, Consiglio, Dottore, Chiamare il Re, Permesso. Before: the Bagatto may be discarded if the hand holds no Fool. Now: only if the Bagatto is the only trump in the hand and there is no Fool. Why: rule 38 of the book of 1787, p. 34: «eccetto che Bagatto sia solo, senza il Folle»; Dummett 1980, p. 259, reads the rule this way («neither the Folle nor any other trump»). In revision 1 the word «solo» was read as «without the Fool» — a misreading. The other version: no exception (rules of 1830).
2. **Discarding trumps in Venticinque for three.** Before: trumps from XVII upward may not be discarded — the rules of 1830 as reported by Dummett. Now: trumps are not discarded; the exception is a dealer who holds three or fewer (Torino [1846], part I, p. 33: «Lo scarto dei Tarocchi è solo permesso quando non se ne hanno in mano più di tre»). This is the source of the game itself. The format can write this as a `hand_count` condition: gap G4 is closed. The other version: that of the rules of 1830. Question 4 is closed by a document.
3. **Trent'uno: the plain card is worth 1.** Before it was 0. A calculation on a rough model (a random player takes each trick): at a value of 0 the pack runs out before anyone has reached 31 in 29 % of games for two, 58 % for three and 87 % for four; at a value of 1, in 0 %, 0 % and 5 %. Dummett 1980, p. 269, himself writes that at zero often nobody reaches 31 and that a value of 1 is possible. The Savoyard «À Fora» — a twin of the game — counts plain cards and the Fool at 1 each (rules of Annecy, in Depaulis 1984). Sedici stays at 0: there the pack almost never runs out (0-2.5 %). The second value is recorded in both games.
4. **Sedici and Trent'uno: the pack has run out and nobody has said «fuora».** Now: the hand is closed with no payment — the first of Dummett's two guesses, 1980, p. 269. Before: «gather the cards not taken and deal again»; this cannot be played — there are not enough cards for a round.
5. **Bagatt'ultimo: the payment for a game is 10 marche** from each player who did not reach 26, to each who did (Dummett 1980, p. 262, the section on Mitigati for three, after the rules of 1830). Before: a simple stake.

Changes 1 and 2 touch games that the core already plays. Changes 3-5 touch games that the core does not play yet.

**Only marks and sources change.**
6. Partita for four, the first dealer: [R] → [D]. The words of the book of 1787 (p. 89), read in part, stand in full in Torino [1846], part I, p. 35: «Chi coppa meglio degli altri tre compagni è quello che comanda». Question 21 is closed by a document.
7. Venticinque for three, the winner of the match: the mark now gives the rule that is played — more points over three deals (Torino [1846], part I, p. 34). The early end under the rules of 1830 stays in the list of «not played».
8. Chiamare il Re, a called King in the discard: [S] → [R]. By rule 38 a King is not discarded, so the case does not arise.
9. Permesso for four, a tie: Dummett 1980, p. 267, is added — exactly 45½ occurs only when there is nothing to pay for the Fool with.
10. «Ficcia»: the definition of Torino [1846], part I, p. 57, is added. The thresholds of «marcio» (same page: a third or a half of the points played to) are recorded in question 13 of the list; the file of Venticinque was not changed for them.
11. Consiglio: the partner's hand is shown face up (`view.partners_hands: shown`), as the rule in the file demands («mostransi il giuoco»). Before, the view was inherited from Partita and contradicted the rule.
12. Partita for three, the payment: Dummett 1980, p. 260, is added.

**Placeholders.** The placeholder leaves now carry a field `replace`: the number of the question in `OPEN_QUESTIONS.md` and how it will be closed. Where the other version can be written as a value, it stands in `alt`: the discard and the Fool of a player with no tricks, the choice of card for the Fool, the value of the plain card, a false «fuora». The list built from the files is made by `npm run open-questions`. Questions 3, 13 and 17 have no leaves (the rule is not played) and are kept only in the list.

**Count of marks** (not counting the lists of «not played»): 545 [D], 232 [R], 122 [S] — 899 rules in all.

**Settled in the core together with this revision.** The core used to check the exception to the discard against the hand at every step of the discard. By the book one looks at the hand as dealt: otherwise, by discarding another trump, one could «free» the Bagatto. The core now judges the exception on the hand as dealt.

## Revision 3 — 23 November 2026, tag `rules-r3`

<!-- files r3
bagattultimo.json sha256:8f94b70ca813a51e997cab04dbc7caa271ce0e507646d62268d8584eecf9050b
baronetti.json sha256:5de211b7fdcff8d92296c157446bcacd110ab12d53762f9ab0697caa053271a0
chiamare_il_re.json sha256:16edb6155addf208449b561fa012ee1024f83a7c22bc220e87c7e8d32b8a609f
consiglio.json sha256:3210ed6b40f71251c287ab28a05775340ad128733da2d431108fe88240776ec4
dottore.json sha256:c09144a24e875e6c694861f49f3f502cede8311fa27ce9d7e4590b74ef9e9083
meno.json sha256:9974f9a24a3660f2674b219bc5162c31fae216d4411e703516ead55eeb114bb3
mitigati_2.json sha256:ed6672668360ac38c59f3eb1c2bf1b25f8bfacc7f52f9a19a6ac0f5ddd0f6bc8
morto.json sha256:d96cbba0864cba77b4d63baec5a1b231462e9f2a17be56ea508859943b066362
partita_3.json sha256:1e05cc3a690648960492ea7225eb7279c55815832740441cbe1261ddda3da806
partita_4.json sha256:dc625bd88d436131b6422dec10515cfcc9d0f1cf0c7aed2167961893c69d2f46
permesso_3.json sha256:e552b3aba74e451bea1b106761f522db4d8efb61fb7ae686ce8281b547c4d408
permesso_4.json sha256:c9596040661c807db4d746191f72e3171717fc581fa6dab57960653092c7c8cb
permesso_5.json sha256:3b8e2162306195941da8e3b2052c93c76979b2b9fc531e787c21e6ce94f3739b
permesso_6.json sha256:798f5dca01e70e3a9d2fca4d79f10a97e211984100c0a03a175922c470dc0010
permesso_7.json sha256:9e8324c5af5c24345bb8dcefb1778eb2e33d1b8d1788dd505137022ce8343c3b
sedici_2.json sha256:902e235fb073a2f15370e1981a88c657e4a667b858928803c172968b6e4dee4d
sedici_3.json sha256:f1616230abdb79d103cd63d9dfef125f8fc43e3aa16587172b59b85cc43e7299
sedici_4.json sha256:470e914337ae6438f0a919e34f783b74d937823dd9f919a94a9ebeee375dc5c5
trentuno.json sha256:dd0e98665d18178707f5a50dbbf528ae86d0fb536e66ed273edaefc48674f1ca
venticinque.json sha256:a768bc85a925437055e888704a5e29985f21278ed010d59cf9664eb5ac01ca16
venticinque_3.json sha256:b35924cd069e7b4d593ea163574a02530fc9c70079803abc499bfea6bc7eeba9
-->

Reason: an editorial decision. The files, this journal and the list of open questions are prepared for publication. **No rule changes: the game plays exactly as in revision 2.** All 21 files are changed.

**What changed in the files.**
1. The marks are written in Latin letters: [D] documented, [R] our reading, [S] sources silent. Before, they were Cyrillic letters.
2. References to our working documents are replaced by plain words («second reading», «check of 2 November 2026»), and dates are written out.
3. The unit of payment keeps its Italian name, «marca» (plural «marche»), so that «mark» means only [D], [R], [S].
4. One legend of the marks stands at the end of every description.
5. Descriptions that still told the rules of revision 1 are corrected: Trent'uno (the plain card is worth 1; an empty pack ends the hand with no payment), Sedici for two, three and four (an empty pack ends the hand with no payment), Bagatt'ultimo (the payment of the hand), Venticinque for three (which rules follow Torino [1846] and which follow Dummett's report of the rules of 1830). The rule values were already those of revision 2.
6. Permesso for four: the entry «Codice del tarocco, Milano, 1794», used by no rule, is removed from the table of sources.
7. Partita for three, the cut of the pack: the page is 16, not 17 (Torino 1787, p. 16: «Una carta sola non si può coppare»; checked on the scan).
8. Venticinque for three: the share of deals in which the dealer holds three trumps or fewer is written as 1.32 %, as in the list of open questions.

**Corrections to the entry of revision 2.**
- The sentence that the rule about the Bagatto «is also played this way in Piedmont today» is withdrawn: the journal gave no source for it.
- The last paragraph said that the exception to the discard «waits for the core». The core was corrected together with revision 2, and the entry now says so.

**The journal and the list of open questions** are kept in English from this revision on.

**Count of marks** (not counting the lists of «not played»): unchanged — 545 [D], 232 [R], 122 [S], 899 rules in all.

## Revision 4 — 23 November 2026, tag `rules-r4`

<!-- files r4
bagattultimo.json sha256:8f94b70ca813a51e997cab04dbc7caa271ce0e507646d62268d8584eecf9050b
baronetti.json sha256:5de211b7fdcff8d92296c157446bcacd110ab12d53762f9ab0697caa053271a0
chiamare_il_re.json sha256:16edb6155addf208449b561fa012ee1024f83a7c22bc220e87c7e8d32b8a609f
consiglio.json sha256:3210ed6b40f71251c287ab28a05775340ad128733da2d431108fe88240776ec4
dottore.json sha256:c09144a24e875e6c694861f49f3f502cede8311fa27ce9d7e4590b74ef9e9083
meno.json sha256:9974f9a24a3660f2674b219bc5162c31fae216d4411e703516ead55eeb114bb3
mitigati_2.json sha256:ed6672668360ac38c59f3eb1c2bf1b25f8bfacc7f52f9a19a6ac0f5ddd0f6bc8
morto.json sha256:efadc6227af5ca874dc4a7eead13079723e621b0434bf6297e1218b2ca221817
partita_3.json sha256:1e05cc3a690648960492ea7225eb7279c55815832740441cbe1261ddda3da806
partita_4.json sha256:dc625bd88d436131b6422dec10515cfcc9d0f1cf0c7aed2167961893c69d2f46
permesso_3.json sha256:e552b3aba74e451bea1b106761f522db4d8efb61fb7ae686ce8281b547c4d408
permesso_4.json sha256:c9596040661c807db4d746191f72e3171717fc581fa6dab57960653092c7c8cb
permesso_5.json sha256:3b8e2162306195941da8e3b2052c93c76979b2b9fc531e787c21e6ce94f3739b
permesso_6.json sha256:798f5dca01e70e3a9d2fca4d79f10a97e211984100c0a03a175922c470dc0010
permesso_7.json sha256:9e8324c5af5c24345bb8dcefb1778eb2e33d1b8d1788dd505137022ce8343c3b
sedici_2.json sha256:902e235fb073a2f15370e1981a88c657e4a667b858928803c172968b6e4dee4d
sedici_3.json sha256:f1616230abdb79d103cd63d9dfef125f8fc43e3aa16587172b59b85cc43e7299
sedici_4.json sha256:470e914337ae6438f0a919e34f783b74d937823dd9f919a94a9ebeee375dc5c5
trentuno.json sha256:dd0e98665d18178707f5a50dbbf528ae86d0fb536e66ed273edaefc48674f1ca
venticinque.json sha256:d4db4754f735b175d7a4ee055ae8caa20b349e685854d625d4b06f59a1bf8245
venticinque_3.json sha256:b35924cd069e7b4d593ea163574a02530fc9c70079803abc499bfea6bc7eeba9
-->

Reason: an editorial decision. **No rule changes: the game plays exactly as in revision 3.** Two files are changed: Venticinque for two and Morto.

**What changed.**
1. Settings that these two games do not use are marked `"unused": true`. The two files were converted from the rule files of our game on Steam and list every setting of that program; the rules pages showed them as rules, next to the rules that are played. The marked settings are, in each of the two files: in the match, `target`, `tie_replay`, `max_hands`, `crawford` and `double_window_cards` (a match is a fixed number of hands, there is no doubling); in the deal, `pile_size` (there are no piles); in the result, `shut_num` and `shut_den` (a won hand is one game point, there is no dry hand). That is eight settings in each file. `max_stake` stays a shown rule: it says that there is no doubling.
2. An internal code of ours is removed from two source lines of Venticinque for two.

**Count of marks** (not counting the lists of «not played»): unchanged — 545 [D], 232 [R], 122 [S], 899 rules in all.

## Revision 5 — 23 November 2026, tag `rules-r5`

<!-- files r5
bagattultimo.json sha256:8f94b70ca813a51e997cab04dbc7caa271ce0e507646d62268d8584eecf9050b
baronetti.json sha256:5de211b7fdcff8d92296c157446bcacd110ab12d53762f9ab0697caa053271a0
chiamare_il_re.json sha256:16edb6155addf208449b561fa012ee1024f83a7c22bc220e87c7e8d32b8a609f
consiglio.json sha256:3b6e85e1c48bff858d113e8b753dc9eea01345f8188b44a47f0542c93f01dd4d
dottore.json sha256:6fc28bd07ae8582e9e42bce59f41c35dde58b330147ae44a70c585991efb33fb
meno.json sha256:4b420624235a1bfea52fc0ea651c750fd1fa10505cf41219a49f425c603a3fc3
mitigati_2.json sha256:ed6672668360ac38c59f3eb1c2bf1b25f8bfacc7f52f9a19a6ac0f5ddd0f6bc8
morto.json sha256:efadc6227af5ca874dc4a7eead13079723e621b0434bf6297e1218b2ca221817
partita_3.json sha256:bfc0dedc5d26ee5c73970dad6b248520e82f8e4adc1c53f876b782e2701c03f1
partita_4.json sha256:df1c7092e7c3ae3ae090e3c32db6c06b4e77004b8cc8b168903b6b02faacaa90
permesso_3.json sha256:e552b3aba74e451bea1b106761f522db4d8efb61fb7ae686ce8281b547c4d408
permesso_4.json sha256:c9596040661c807db4d746191f72e3171717fc581fa6dab57960653092c7c8cb
permesso_5.json sha256:3b8e2162306195941da8e3b2052c93c76979b2b9fc531e787c21e6ce94f3739b
permesso_6.json sha256:798f5dca01e70e3a9d2fca4d79f10a97e211984100c0a03a175922c470dc0010
permesso_7.json sha256:9e8324c5af5c24345bb8dcefb1778eb2e33d1b8d1788dd505137022ce8343c3b
sedici_2.json sha256:902e235fb073a2f15370e1981a88c657e4a667b858928803c172968b6e4dee4d
sedici_3.json sha256:f1616230abdb79d103cd63d9dfef125f8fc43e3aa16587172b59b85cc43e7299
sedici_4.json sha256:470e914337ae6438f0a919e34f783b74d937823dd9f919a94a9ebeee375dc5c5
trentuno.json sha256:dd0e98665d18178707f5a50dbbf528ae86d0fb536e66ed273edaefc48674f1ca
venticinque.json sha256:d4db4754f735b175d7a4ee055ae8caa20b349e685854d625d4b06f59a1bf8245
venticinque_3.json sha256:c44ca901817546f45667b7dc827215393336437d242f0c4714847cfa6d66cdd9
-->

Reason: five stake games had no end of a match. Partita for three and for four, Consiglio, Dottore and Meno kept their accounts «until the players leave»; the table showed no final result and could not offer a new match. The sources were read again for the length of a match and its payment. Torino [1846], part I, p. 36 ends Partita for four «in quattro scarti», so that each player discards in turn. The book of 1787, p. 97 counts Consiglio's second custom over a «giro» of four deals. For Partita for three, Dottore and Meno no source names a length. **The game changes: a match now ends.** Settlement does not change.

**What changes for the player.**
1. A stake match ends after one round of dealers: every player deals once. Partita for four and Consiglio: four deals. Partita for three: three. Dottore: five. Meno: as many deals as players.
2. The marche are settled after every deal, as before. The result of the match is the balance of the marche: the greatest balance wins, equal balances are a draw («pace»).
3. Recorded as other versions, not played: Partita for four and Consiglio decided by the sum of the points of the four deals with one stake at the end (Torino [1846], part I, pp. 35-36; Prammatica [1846], p. 15; 1787, p. 97) — it waits for the format to pay at the end of a match (point 54 in `docs/FORMAT_OPEN_POINTS.md`). For Meno, a race to a set number of points, not less than five (by analogy with Sedici and Trent'uno, Prammatica [1846], pp. 11-13). For all five, two or three rounds by agreement.

**What changed in the files.**
1. The format: a new key `match.dealer_rounds` (`docs/GAME_FILE_FORMAT.md`, section 12).
2. Partita for four: `match.dealer_rounds` 1 [D] (Torino [1846], part I, p. 36); `match.kind` now [R]. Variant «four deals»: the tie-break source no longer cites the Consiglio page and says that the marche are still paid after every deal.
3. Consiglio: `match.dealer_rounds` 1 [R] (1787, p. 97). Variant «sum of four deals»: the number of deals stays [D], the order of dealers is marked as our reading, the tie-break source is rewritten as for Partita, a wrong cross-reference is corrected.
4. Partita for three, Dottore, Meno: `match.dealer_rounds` 1 [S], with questions 23 and 24 in the list of open questions; `match.kind` sources rewritten.
5. Dottore: the words quoted from Dummett 1980, p. 263 are corrected to what the page prints, «There is no information about the system of scoring».
6. Venticinque for three, no change of play: the «da fuori» duty is credited to Torino [1846], part I, p. 34 and Prammatica [1846], p. 14 as well as Dummett; the penalty for failing it is paid to each opponent, not received from each; the running total of differences from 26 is credited to Dummett's account, not to Prammatica, p. 14. Dummett's quotation of the rules of 1830 (p. 260, note 2) is word for word Prammatica, p. 14.
7. The format documents: section 12 of `GAME_FILE_FORMAT.md` now says that the greatest positive total wins at Venticinque for three, as the core plays it (Torino [1846], part I, p. 34); points 13 and 33 of `FORMAT_OPEN_POINTS.md` are corrected.

**Count of marks** (not counting the lists of «not played»): 546 [D], 236 [R], 122 [S] — 904 rules in all.

## Revision 6 — 24 November 2026, tag `rules-r6`

<!-- files r6
bagattultimo.json sha256:8f94b70ca813a51e997cab04dbc7caa271ce0e507646d62268d8584eecf9050b
baronetti.json sha256:7383b512edea995bb3a1b3bc34622b09172705b27aad26e146edd079aa13b12f
chiamare_il_re.json sha256:16edb6155addf208449b561fa012ee1024f83a7c22bc220e87c7e8d32b8a609f
consiglio.json sha256:3b6e85e1c48bff858d113e8b753dc9eea01345f8188b44a47f0542c93f01dd4d
dottore.json sha256:6fc28bd07ae8582e9e42bce59f41c35dde58b330147ae44a70c585991efb33fb
meno.json sha256:4b420624235a1bfea52fc0ea651c750fd1fa10505cf41219a49f425c603a3fc3
mitigati_2.json sha256:ed6672668360ac38c59f3eb1c2bf1b25f8bfacc7f52f9a19a6ac0f5ddd0f6bc8
morto.json sha256:efadc6227af5ca874dc4a7eead13079723e621b0434bf6297e1218b2ca221817
partita_3.json sha256:bfc0dedc5d26ee5c73970dad6b248520e82f8e4adc1c53f876b782e2701c03f1
partita_4.json sha256:df1c7092e7c3ae3ae090e3c32db6c06b4e77004b8cc8b168903b6b02faacaa90
permesso_3.json sha256:e552b3aba74e451bea1b106761f522db4d8efb61fb7ae686ce8281b547c4d408
permesso_4.json sha256:c9596040661c807db4d746191f72e3171717fc581fa6dab57960653092c7c8cb
permesso_5.json sha256:3b8e2162306195941da8e3b2052c93c76979b2b9fc531e787c21e6ce94f3739b
permesso_6.json sha256:798f5dca01e70e3a9d2fca4d79f10a97e211984100c0a03a175922c470dc0010
permesso_7.json sha256:9e8324c5af5c24345bb8dcefb1778eb2e33d1b8d1788dd505137022ce8343c3b
sedici_2.json sha256:95153889fdc4835c8788f53c66691ac6396a8ec31746c0368d252c30f905ad48
sedici_3.json sha256:f1616230abdb79d103cd63d9dfef125f8fc43e3aa16587172b59b85cc43e7299
sedici_4.json sha256:470e914337ae6438f0a919e34f783b74d937823dd9f919a94a9ebeee375dc5c5
trentuno.json sha256:acecf5696ff14a78935f92a337b4e0732818807dcbdb0b37f63c9fbd760536b1
venticinque.json sha256:d4db4754f735b175d7a4ee055ae8caa20b349e685854d625d4b06f59a1bf8245
venticinque_3.json sha256:c44ca901817546f45667b7dc827215393336437d242f0c4714847cfa6d66cdd9
-->

Reason: Sedici for two, Trent'uno and Baronetti become playable (run C3a). Sedici and Trent'uno had no match: each game was settled alone and the table kept the ledger «until the players leave». Baronetti had no end of a match either. Prammatica [1846], pp. 11-13 was read again: at Sedici a match seldom ends «nel primo punto» (p. 11), it is played to several points, and Trent'uno differs from Sedici only in the number (p. 12). The words «a più punti non meno di cinque» stand on p. 13, in the article on Trent'uno al meno. **The game changes: Sedici and Trent'uno are now a race; a false «fuora» no longer ends the game.**

**What changes for the player.**
1. Sedici and Trent'uno: a match is a race to five points. A game won is one point. A false «fuora» that pays double gives each other player two points («vada doppio»), a simple one one point. A game that nobody wins (the pack ran out) gives no point. When the leaders are level at five or more, another game is played, until one leads alone. The table shows the race, not the ledger; the stake of each game is still paid.
2. Sedici and Trent'uno: a false «fuora» is paid and the game goes on. The claim is made right after a trick, by the player who took it; after the last trick of a round, before the next deal.
3. Sedici and Trent'uno: the winner hands the pack to his companion; for two the loser deals the next game.
4. Baronetti: a match is one round of dealers, two games. An open Fool may be shown on one's own turn and laid with one's won cards; the owner still plays a card. It may instead be played into a trick as an excuse.
5. Recorded as other versions, not played: the match «al primo vada», every game paid at once (Prammatica [1846], pp. 11, 13); a race to more than five; a match drawn when the leaders are level; a false claim that loses the game (the Savoyard «À Fora», Annecy); at Trent'uno the deal passing to the right after every game (Torino [1846], part I, p. 18); the Fool of Baronetti played only as an excuse.

**What changed in the files.**
1. Sedici for two and Trent'uno: `match.kind` race [D] (Prammatica [1846], pp. 11-12), `match.target` 5 [R] (p. 13, question 26), `hand.result.game_points` one [D] (p. 11), `hand.fuora.after_false_claim` play_on [S] (question 25), `view.score_panel.ledger` false. The sources of `hand.fuora.claim_when` and `hand.fuora.false_claim` say when the claim is made and what a false claim gives in a race. The source of `match.target` says what is done when the leaders are level [S]. The source `prammatica1846` is added to both files.
2. Sedici for two: the source of `seats.dealer_rotation` quotes p. 41 and says who deals for two, three and four players and when nobody has won.
3. Trent'uno: `seats.dealer_rotation` winner_passes_to_companion [R]: the book of 1787, p. 45 sends Trent'uno to the rules of Sedici; it stood as `right` [S]. `cards.card_points` cited p. 46 for the Fool's one point; the words are on p. 38 and are quoted now.
4. Baronetti: `match.dealer_rounds` 1 [S] (question 23); the source of `cards.fool_show_any_time` gives the reading of p. 50; the source of `match.kind` is rewritten.
5. Open questions: 25 (a false «fuora») and 26 (the form and the length of the match of Sedici and Trent'uno, and level leaders) are new; Baronetti is added to question 23.
6. The texts of the three games are now full texts of playable games.

**Count of marks** (not counting the lists of «not played»): 550 [D], 237 [R], 122 [S] — 909 rules in all.

## Revision 7 — 24 November 2026, tag `rules-r7`

<!-- files r7
bagattultimo.json sha256:f52bb2e639fc271aa0d7d44f8b5604b16b872f128170bd5f13126dbdbf03d3fe
baronetti.json sha256:7383b512edea995bb3a1b3bc34622b09172705b27aad26e146edd079aa13b12f
chiamare_il_re.json sha256:479a2481fa38e0e6e3a82c75367591d5110ca28a306137e208e5a5c3a510188e
consiglio.json sha256:3b6e85e1c48bff858d113e8b753dc9eea01345f8188b44a47f0542c93f01dd4d
dottore.json sha256:6fc28bd07ae8582e9e42bce59f41c35dde58b330147ae44a70c585991efb33fb
meno.json sha256:4b420624235a1bfea52fc0ea651c750fd1fa10505cf41219a49f425c603a3fc3
mitigati_2.json sha256:7d5bba2aafaf86643c07a31b4d5887aca86d82e07d394acff84bafa90fb0e5b8
morto.json sha256:efadc6227af5ca874dc4a7eead13079723e621b0434bf6297e1218b2ca221817
partita_3.json sha256:bfc0dedc5d26ee5c73970dad6b248520e82f8e4adc1c53f876b782e2701c03f1
partita_4.json sha256:df1c7092e7c3ae3ae090e3c32db6c06b4e77004b8cc8b168903b6b02faacaa90
permesso_3.json sha256:d47b46d394f719124f796b9a8dd1df53736b1e1ad34c5656396eee33d436871c
permesso_4.json sha256:c9596040661c807db4d746191f72e3171717fc581fa6dab57960653092c7c8cb
permesso_5.json sha256:3b8e2162306195941da8e3b2052c93c76979b2b9fc531e787c21e6ce94f3739b
permesso_6.json sha256:798f5dca01e70e3a9d2fca4d79f10a97e211984100c0a03a175922c470dc0010
permesso_7.json sha256:9e8324c5af5c24345bb8dcefb1778eb2e33d1b8d1788dd505137022ce8343c3b
sedici_2.json sha256:95153889fdc4835c8788f53c66691ac6396a8ec31746c0368d252c30f905ad48
sedici_3.json sha256:48a61f7c6bc75f75bc8d652083d30b2bcaa1ca6022d2f27652eb6d2a989ee44e
sedici_4.json sha256:072663c730c47c32c68bb3a58d6859e0231ee36055f94bdf03c4e555ff914e0e
trentuno.json sha256:acecf5696ff14a78935f92a337b4e0732818807dcbdb0b37f63c9fbd760536b1
venticinque.json sha256:d4db4754f735b175d7a4ee055ae8caa20b349e685854d625d4b06f59a1bf8245
venticinque_3.json sha256:c44ca901817546f45667b7dc827215393336437d242f0c4714847cfa6d66cdd9
-->

Reason: the last ten game files become playable (run C3b): Sedici for three and four, Mitigati for two, Bagatt'ultimo, Chiamare il Re and Permesso for three to seven. They had no end of a match, and the core now plays sides that live in the hand, the auction, the called exchange, the call of a King and the declarations. The pages of the book were read again for every rule that is now played: pp. 34-35 (rule 38), 61-66 (the exchange and the auction of Permesso), 80-84 (Chiamare il Re), 85-86 (Mitigati for two). **The game changes: Sedici for three and four are a race; the eight other games end after one round of dealers; several rules that stood unplayed are played.**

**What changes for the player.**
1. Sedici for three and four: a match is a race to five points, as for two since revision 6. A false «fuora» is paid and the game goes on; a double row gives each other player two points, a simple one one point.
2. Permesso for three to seven, Chiamare il Re, Bagatt'ultimo, Mitigati for two: a match is one round of dealers, each player dealing once; the payments are made after every hand, the greatest balance wins.
3. A hand thrown in (everybody passed) or dealt again after equal points counts as a dealt hand: nobody pays and the next player deals.
4. Permesso: the auction runs in the order of speech. An earlier seat may match the bid of a later one («A due anch'io», p. 62); a later seat must bid fewer cards; a pass is final.
5. Permesso: a declarer may stop laying down after one card and plays at the contract of the cards laid (p. 65). Each holder of called cards takes, unseen, as many of the laid cards as he gave; which ones is drawn at random. Kings, the Angel and the Bagatto may not be laid down; the Fool may (pp. 34-35).
6. Chiamare il Re: the dealer speaks first; his pass ends the auction and he calls a King. A King of his own may be called; he then plays alone against three, and the table does not offer forgiveness. With all sixteen courts in hand he plays alone, as at sans prendre.
7. Mitigati for two: the first discard is exactly thirteen and twelve. Declarations, here and in Bagatt'ultimo, are made in one turn for each player before the first card, and paid at once.
8. Recorded as other versions, not played: a match of two or three rounds; a thrown-in hand that does not count; the declarer handing out the laid cards; no bar on the laid cards; the others bidding after the dealer's pass; forgiveness asked of the three, or a card of one's own not offered; declarations open until the first trick is complete; a first discard «up to» the number named.

**What changed in the files.**
1. Sedici for three and four: `match.kind` race [D], `match.target` 5 [R] (question 26), `hand.result.game_points` one [D], `hand.fuora.after_false_claim` play_on [S] (question 25), `view.score_panel.ledger` false; the sources of `hand.fuora.claim_when` and `hand.fuora.false_claim` as for two; the source `prammatica1846` is added.
2. Permesso for three, Chiamare il Re, Bagatt'ultimo, Mitigati for two: `match.dealer_rounds` 1 [S] (question 23); the source of `match.kind` is rewritten. Permesso for four to seven inherit it.
3. Permesso for three and Chiamare il Re: `hand.exchange.give` random [S] (question 27), `hand.exchange.discard_honours_barred` true [R] and `hand.exchange.allowed_exceptions` the Fool [R] (question 31). Permesso for three: the item `fool_given_in_exchange` leaves `left_out`; the sources of `hand.bidding.tie`, `hand.bidding.all_pass`, `hand.bidding.lay_down_fewer` (p. 65, not 65-66) and `hand.result.tie` say how they are played.
4. Chiamare il Re: `hand.bidding.after_dealer_pass` call [R] (question 29); `hand.call_partner.own_card` and the penalty `call_own_card` are marked [R] (question 28); the source of `hand.call_partner.ladder` says what is done with all sixteen courts [S], and `all_sixteen_courts` leaves `left_out`; the source of `hand.settle_pair.mode` says how unequal sides pay [S].
5. Mitigati for two: `hand.discard_first.count_mode` exact [R] (question 5); `hand.declarations.window` marked [R] (question 30).
6. Open questions: 27-31 are new; 5, 22, 23 and 26 are extended.
7. The texts of the ten games are now full texts of playable games.

**Count of marks** (not counting the lists of «not played»): 551 [D], 245 [R], 128 [S] — 924 rules in all.
