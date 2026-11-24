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

## Revision 8 — 24 November 2026, tag `rules-r8`

<!-- files r8
bagattultimo.json sha256:75dab9f8ef1fbd285956567365f9a265f85629e3f00b9a3ead140e5bc753ac8e
baronetti.json sha256:8b86fa80e7e60c3c6170ed1973373ab434d9774c3ccbc804bead2076371c1747
chiamare_il_re.json sha256:e6cb65d5d6b551bacd85d697761a5a4013174a89fb31fdc52bafe29f21397ce3
consiglio.json sha256:9b44e03c4b41d23cc66f75ca8d1455746abdc3bc05213add861c3d755da5b98a
dottore.json sha256:adf3b44d946869cb6902e1af0251785957273ddd132b5f97dd7cd082b8666e20
meno.json sha256:96018c07e12b69fe801b2372007be7c63cfabfd69c11e5f402e879dafd7e5025
mitigati_2.json sha256:814fb7eac983d49a7dbe51806ab9b6372c17fca5f85e38b5dbe59420b7da59d2
morto.json sha256:ac2ee0ee8712a729844c929b3d20e42f41ce1e99a773021ce8344038bfb9fec2
partita_3.json sha256:7ef943921c6133717c5f7aa15af651a75277046a61bdd56348447ee23ac2045f
partita_4.json sha256:bc2b0e418c188812265808e9dc1f8796e8aa4c0648a60b0010baddde0ae568d6
permesso_3.json sha256:d7d6729f528a994bf131e7053346bb418eb8b7ab19e390d089791c82fbe2016f
permesso_4.json sha256:7787edfde51393825b4a97826f7b3eded998d74c7639cc9cbc67a03ac36c4a54
permesso_5.json sha256:c3edeb070ede1a88dfc10346c8f6003c31e2f09d4fa249c50388a2b627f8af8a
permesso_6.json sha256:0c951fd9e88336bd79f062584f60655baf21bec9e5ec2bebdf7d8f99e5cdca31
permesso_7.json sha256:a9a587d2a27368062ab05903d47b866937cd06e8701985d07fd0c5d59a688c33
sedici_2.json sha256:c54aec58458488a9230fc7a575eb912c148ab83cd5923b09889e9f7f2ca86bb6
sedici_3.json sha256:46042c8d5a22a765c59f9ff111b0b4ff55994eb5c66385e51b319299d41d353c
sedici_4.json sha256:1d5286e542290752d9658e278b78a746fe8887d4205390d1085499c7702028a6
trentuno.json sha256:b752a1daa21651102fc66c90ec35132a88f5916fb22cd1b7747331c57add6023
venticinque.json sha256:d4db4754f735b175d7a4ee055ae8caa20b349e685854d625d4b06f59a1bf8245
venticinque_3.json sha256:75bb956848363a1edb6b94b4e901d3068c23cad3cbb3b2fd9c9b8f0f0ba5d8d5
-->

Reason: a full second reading of the rules of all 21 game files against the pages (run R8): seven readers, a summary of their 116 remarks into 63 points, a look at the doubtful pages on their images. Three new scans came from the Academy of Sciences of Turin: the pages 44-45 missing from our copy of Torino [1846], part I («pagine mancanti»); the separate booklet «Prammatica del giuocatore» (cover dated 1846, deposited 27 December 1845), printed from the same setting as part II of the same book, with the same pages; and «La partia a taroch an quatr», Turin, 1880, a later booklet on Partita for four. Two late sources were found in our archive and are now written in the files: Nice 1930 (F. Cason, «Les jeux de cartes à Nice») and Piedicavallo 2008. Nobody found an error that breaks a game: almost all of it is references, marks and second sources. This is a revision of the records. **The game changes in two places: in Baronetti the loser of a game deals the next; in Trent'uno for three and four the deal goes round to the right.**

**What changes for the player.**
1. Baronetti: the loser of a game deals the next one; when nobody has won (45½ each) the other player deals. Until now the deal alternated. The match is still two games; one player may now deal both.
2. Trent'uno for three and four: the deal now goes round to the right whoever won the game, as in Sedici for three and four (1787, pp. 19, 42); until now the player on the winner's right dealt. For two nothing changes: the loser deals. The value is written by the number of seats.
3. Trent'uno: a new variant «Prammatica [1846]», where the Fool is an ordinary trionfo just above the Bagatto and takes it (Prammatica, p. 12). The core plays it; the table does not offer variants yet.
4. Mitigati for two: the card given for the Fool goes to the opponent side, after the book of 1787 (pp. 52, 54, 87); with two players the trick with the Fool is always taken by the opponent, so the play is the same. The dealer's second discard now carries the words «Ho scartato» in the file, as in the other games; the engine already played them.
5. Recorded, not played: the Bagatto declared last of Torino [1846] (Permesso for three to five, Bagatt'ultimo; question 17); Permesso castrato (Torino [1846], pp. 43-44; not in the book of 1787); the Fool discarded for a «vola» (Chiamare il Re, Partita for four); the customs of Turin 1880 for Partita for four (signals by knocking, the count by fours); the race reading of the faults of Sedici and Trent'uno (Prammatica, pp. 11-12; question 26).

**What changed in the files.**
1. Common rules of the book, one mark for one norm: `seats.first_dealer` and `seats.cut_by` are [D] (pp. 16-17) in every file that follows the general rules; `seats.cut_min` is [R] (p. 16 forbids only a cut of one card), cited p. 16, not 17; `tricks.first_leader` is [R] (p. 35; Chiamare il Re had [S]); `next_leader` of Meno and `follow_suit` of Bagatt'ultimo are [D]; `card_points` of Dottore, Partita for three and Meno are [D] (pp. 13-14), the reading stays on `count.group`; `result.game_points: none` is [S] everywhere; the tie of Mitigati for two is [R]. The order of the courts (`cards.suit_order`) is [D] by pp. 11-12 in Sedici, Trent'uno and Baronetti.
2. Sources: the record `prammatica1846` now describes the booklet as the separate issue of part II of Torino [1846], same setting, same pages, and is added to Bagatt'ultimo, Chiamare il Re, Consiglio, Dottore, Partita for three and four, and Permesso for three to five. New records: `tarocaire1880` (Partita for four), `nice1930` (Bagatt'ultimo, Baronetti), `piedicavallo2008` (Baronetti). Every page of the book of 1846 is written «Torino [1846], part I, p. …»: the two parts are paged separately. Torino [1846], p. 18 is marked «(Undici e mezzo)» where it is used for another game.
3. Permesso: p. 16 for `cut_min`. Permesso for four: `deal.dealer_extra` rests on 1787, p. 71 and Torino [1846], pp. 40-41 (Prammatica, p. 28 is said of Consiglio); `discard.count_mode` cites pp. 40-41, not p. 36. Permesso for three: the half point of `settle.amount` is [D] (pp. 68-69: «Sessantasette punti, e mezzo vagliono per sessantacinque»), and the other reading of the «sei soldi» is dropped (the example of p. 69 contradicts it); the revoke penalty is [D] pp. 33-34 (rule 35); `bidding.dealer_speaks` last [S] → [R] by Torino [1846], pp. 41-42 (Dummett 1980, pp. 265-266); Dummett 1980, p. 259 is named as the support of the other readings of questions 1 and 2 and of the card given for the Fool; Torino [1846], pp. 44-45 is the second support of `bidding.tie` and `bidding.opens`. Permesso for five to seven: `cards.deck` [R] (the sum 78 is not printed). Permesso for seven: the discard phase [D] p. 77, `who: dealer` [R] by Dummett 1980, p. 267. Permesso for three to five: two lines in `left_out`, the Bagatto declared last ([D] Torino [1846], pp. 44-45; Prammatica, pp. 20-21) and Permesso castrato ([D] Torino [1846], pp. 43-44; Prammatica, p. 20; Dummett 1980, p. 267: «mentioned only in RI»). The draw at 45½ of `result.bands` is unchanged: Dummett 1980, p. 266 reads it the same («makes 45½ points, there is a draw»).
4. Chiamare il Re: `deal.hand_size` [D] by Torino [1846], p. 38; `exchange.give` random [S] → [R] by Torino [1846], p. 39 («ritirata da chi ti avrà dato la carta chiamata»): the format has no value «the giver of the called card takes it», and with one card exchanged the random draw gives the same; the other reading `up_to` of the discard cites p. 38; `call_partner.own_card` adds p. 40; `fool_exchange_to` trick_winner [D] → [R] (the page is of another game); `count.count_unit` «46 (p. 81); 91 is our sum»; `settle_alone.amount` and `left_out[onoranza_of_ad_una]`: only the payment for calling a King is Dummett's conjecture, and «a due» does not exist in this game (p. 84); the discard is cited pp. 79-80; a line in `left_out` for the Fool discarded for a «vola».
5. Bagatt'ultimo: `seats.dealer_rotation` [R] by 1787, p. 70; `discard.count` [D] p. 91; the declarations cite 1787, p. 94 first; the Fool counts among the ten trumps [R] (1787, p. 9; Torino [1846], p. 7); the second sentence of the «ficcia» (p. 87); `deal.extra_when` cites Dummett 1980, p. 260 (said of Venticinque for three) and p. 262, and Nice 1930, p. 284; the `why` of `left_out[bagatto_ultimo_declaration]`: the declaration is in Torino [1846], pp. 44-45, not played because 1787, p. 96 pays without it; the payment `bagatto_last` adds Torino [1846], p. 45, «per caduno», as the support of the reading «from each»; `alt: together` stays.
6. Mitigati for two: `cards.fool_exchange_to` trick_winner [D] → opponent_side [D] (1787, pp. 52, 54, 87); `fool_exchange` and `count.fool_card` cite 1787 first; `must_trump` [D] pp. 49, 87; the source of the first deal is [S] (p. 85 is silent on it), its bracket moves to `declarations.window`; `deal_second.from` rest [S] → [D] pp. 85-86; `discard_second.announce` ho_scartato [R] (Torino [1846], p. 50) is added; `dealer_rotation` alternate [R] → [S], p. 41 given as the other reading, `alt: loser_deals`, as in Venticinque; the three Bagatto payments stay, marked [S] (the book of 1787 is silent; Torino [1846], pp. 51, 53 pays only a declared Bagatto; question 17, named in the text: a payment line takes no `replace`), and both other readings are written; `about` says the first discard is thirteen and twelve; `fool_no_tricks` names Prammatica, p. 6 as not followed.
7. Partita for four: the record `tarocaire1880`; `result.tie` and `count.fool_card` [S] → [R] by Turin 1880, p. 11 and p. 8; `fool_may_lead` stays [S] and names 1880; second supports and third customs of 1880 for `first_dealer`, `cut_by`, `card_points`, `discard.allowed_exceptions`, `discard.announce`, `deal.packets` and the signals; `first_dealer` rests on 1787, p. 89, printed whole (the words «read in part» are dropped); `result.winner` cites pp. 89-90; `deal.dealer_extra` says «said of Consiglio»; the variant `four_deals` adds 1787, p. 97 (Consiglio); a line in `left_out` for the Fool discarded for a «vola». The option `group` keeps 2 as default, now [R]: the book, p. 89, gives the fours as what «some» require and lets either stand. Turin 1880, pp. 7, 11 and Dummett 1980, p. 261 count by fours (Dummett turns the book round, giving the twos as what «some prefer»); they are written as the other reading. Counted by fours the engine totals 71½, not 72 (the two odd cards of the discard count ½ instead of 1), so 36 against 35½ would be a win where Turin 1880, p. 11 makes 36 each a tie.
8. Sedici and Trent'uno: `result.game_points` [R] with Prammatica, p. 11; `deal.dead` adds Dummett 1980, p. 269; the count cites pp. 51-52 with its brackets; the revoke adds the race reading of Prammatica, pp. 11-12; the misdeal of Sedici pays each other player, the redeal is [R] and the deal passes to the right (1787, p. 19). Sedici for three and four: `seats.dealer_rotation` right [S] → [R] by 1787, pp. 19, 42; the false «fuora» pays each other player [R] by Dummett 1980, p. 269; the penalty `show_cards` (rule 47) moves into the variant `a_scaricare` of Sedici for three and leaves the main game of Sedici for three and four (it needs a second player out). Sedici for two: the tail about three and four players is dropped. `about` of Sedici: it follows «quasi tutte le regole» of Trent'uno al più (Prammatica, p. 12); the Fool of Prammatica, p. 12 is named in `trump_order`. Trent'uno: `sides.mode` [R] pp. 40, 45; `fuora.after_first_out` for three and four [R]; `must_trump` adds pp. 36-37; `seats.count` p. 31; the misdeal penalty of Sedici is added; for three and four the deal now goes round to the right whoever won, [R] by 1787, pp. 19, 42, as in Sedici for three and four: `dealer_rotation` is written by seats (`winner_passes_to_companion` for two, `right` for three and four; the schema now allows `by_seats` for this key); the false «fuora» stays [S]: Dummett, p. 269 names the receiver only for Sedici; the variant `prammatica_1846`.
9. Baronetti: `seats.dealer_rotation` alternate [R] → winner_passes_to_companion [R] (1787, p. 47 sends the game to the general rules; p. 41), `alt: alternate`; the match stays two games (the core counts deals, not dealers); six sources made exact (`count_unit` «less a half», `cut_by`, `follow_suit` [D] and [R] of the covered cards, `card_points`, `piles` p. 50, `fool_show_any_time`); `game_points` [S]; `fool_may_lead` [S] names Nice 1930, p. 279 and Piedicavallo 2008, p. 13: both let the Fool go «at any moment», of other games, and neither names the first lead; a line in `left_out` for the general penalties (the engine deals and counts).
10. Morto: `left_out[declarations_1846]` says «under the rules of N° XII, pp. 44-46». Venticinque for three: the new description of `prammatica1846`.
11. Open questions: 27 is closed for Chiamare il Re by Torino [1846], p. 39, and stays open for Permesso. 17: the document is found (Torino [1846], pp. 44-46; also pp. 48, 51, 53); it stays open until the core plays a declaration by one player. Extended: 7 (Nice 1930, p. 284), 8 (what in Dummett is a conjecture), 10 (Dummett's guesses are said of Trent'uno), 11 and 13 (Dummett, p. 269 on the losers' thresholds), 15 (the third use of «Onoranza»), 20 (the Trent'uno section has nothing on the first lead; p. 37 is said of the next trick), 21 (closed; a third custom, Turin 1880, p. 9), 26 (the race reading of faults), 28 (Torino [1846], p. 40), 30 (Torino [1846], pp. 48-49).
12. The texts of Trent'uno name the new variant.

**Count of marks.** The rule of the count, written now and kept by `node tools/count-marks.mjs`: a leaf is an object with `value` and `source` outside `left_out`; leaves marked `unused` are not counted, leaves in `variants` are counted; a leaf a child file inherits through `extends` is counted once. The sixteen `unused` leaves of Morto and Venticinque (eight each) stay in the files for the comparison with the old format, but are not rules. The six Bagatto payments of Mitigati for two and Bagatt'ultimo are rules with a mark, but they are not in the count: their sum stands in `amount`, not in `value`. By this rule revision 7 has 551 [D], 245 [R], 112 [S] — 908 rules (the 924 written above counted the sixteen `unused` leaves). Revision 8: 556 [D], 249 [R], 108 [S] — 913 rules in all.

## Revision 9 — 24 November 2026, tag `rules-r9`

<!-- files r9
bagattultimo.json sha256:05b990f949424622ab44ab05532341174d47096e7639cccbfedf863413905554
baronetti.json sha256:2f8592ce63be1cf660c46b85d7aa34df96b3e4ac7f7b076b4cacc7aebf7f1147
chiamare_il_re.json sha256:dd535ea1922351dd605ca237f0083e03415c3c03bc147d1b743c6e073bbc77e5
consiglio.json sha256:2e0646f17bc1ac220b5dfc8b457f28aae2cc02e6421d922d12c5e6b1a80603f7
dottore.json sha256:b371baf3bba101021129075a5b266eef8f5ed8054ad6aa8b4e65f6dcc6c6a57a
meno.json sha256:c644e46790ec4d985406e36b142f5fbb5c1110746b253e0b95d2d93446f42b49
mitigati_2.json sha256:fbba2ff103104df0a72e8da2e160ced259042b52a8b0a2ad41b4dcb33db2583b
morto.json sha256:9dbfb365711dfa31cfb78e6e50fb44b239a9ecea490d3c45f26fc1df687397a7
partita_3.json sha256:31650afa8b426a3bf99f87d25775b6521bbfa5354ce62fc0af6dae6ca58cf611
partita_4.json sha256:45b71421598cc0f4f58524a94fe11644b87e02a81c3b502b35fd676fbf0e9f5c
permesso_3.json sha256:f778275db5f0917f6a6c5ea62774bbe44d630676d351fdd9a52719d3fdb2c806
permesso_4.json sha256:a860f01dd30034fa85df12e2b5af96bd65709a7016b9b8542cfd89c3ed2f1bca
permesso_5.json sha256:8c8ebe835541c2c14f257094325592b51d55bf20867e2dfa102217afadc3f705
permesso_6.json sha256:da6195c43d12220dce52e58ccb9e216de0623967de12a4d8f8d6d35bae55eaed
permesso_7.json sha256:56d0f1a35be83ca0f1e0c098639b7a66e8a2f8c9de07d3010b11298005612b92
sedici_2.json sha256:ada4c969926f5b3a8554baccdaf52db1dabf6a5b9233663b0cf952a703c18e5a
sedici_3.json sha256:db9fce4b293056a3c9958af55df283ab6e86f7cfac8320e923bdb279f135938e
sedici_4.json sha256:21c1cd785a82f8c1743f9eb58295fbce2247f622a270c95f1cec2e500ee3b51b
trentuno.json sha256:56d9da884b4c34c9c1f55eb000157e54d1379a58d553c95c1a13672247ebc50a
venticinque.json sha256:89f277aa3f41e1da71abcfff41b0cd4414cd3006194bd65e8423e151c8c1a01b
venticinque_3.json sha256:fdf12d51a3540d97bfe556bceee9a68eac44822642be5476a6f9da73c8cc4cf0
-->

Reason: two independent outside checks of revision 8. Each of their remarks was checked against the page images or reproduced on the engine, and the pages that decide a point were read a second time by a reader who had not seen the first reading. A value changed only where two readers read the page independently or the fault was reproduced; where the book is silent or disagrees with itself the value stays, the mark is made honest and the dispute is written down.

**What changes for the player.**
1. Sedici for two, Trent'uno for two, Baronetti: the deal alternates (1787, pp. 42-43, rule 44: the player whose turn it is to shuffle may happen to be the winner; p. 70: «tocca al compagno appresso a mischiare»; Baronetti through p. 53). The reading of revision 8, that the loser deals, is withdrawn: it stood only on the example of p. 41, where the winner had also dealt. It stays as the other reading. For three and four the deal goes round to the right, as before.
2. Sedici for two to four, Trent'uno: «fuora» may be said on any turn of one's own, in the middle of a trick too (`claim_when: own_turn` [R]; 1787, p. 40; Dummett 1980, p. 269). Until now it could be said only straight after one's own trick; that reading, and the literal «at any moment», are the other readings. A right claim ends the game at once and the cards of an unfinished trick count for nobody.
3. Sedici for two to four, Trent'uno: after each new deal of the same game the taker of the last trick leads; the first trick of every game is led by the player on the dealer's right (`first_leader: round_last_taker` [R]; 1787, pp. 35, 37). The book does not say it in so many words; the dealer's right for every round is the other reading.
4. Baronetti: the Fool is played into a trick in place of a card (1787, pp. 50, 54: «solamente si mostra, come nel giuoco de' Baronetti»); it stays with its owner, who gives a plain card of his choice (p. 52). There is no separate action to show it, and every deal has 39 tricks.
5. Partita for three and four, Consiglio, Permesso for three and four, Meno: the plain card for the Fool goes to the player who took the trick (Torino [1846], part I, p. 33; 1787, pp. 77-78, said of Permesso for five to seven), [R]. Until now it went to the opposing side or to the right-hand neighbour, which now and then turned a win into a tie.
6. Dottore, Permesso for six and seven: the first lead of a hand is the player on the dealer's right (p. 35); p. 75 («Chi è ultimo a prendere giuoca il primo») is the lead after each trick.
7. Partita for four, counted by four: the two cards of the discard count as one short group, 72 points in all, and 36 each is a tie (`odd_card: as_group` [R]; Dummett 1980, pp. 261, 263; Nice 1930, p. 279; Turin 1880, p. 11, where 36 each is «pata»). Until now the engine totalled 71½. Counted in pairs the total is 91, as before.
8. Consiglio: the count is always in pairs and the target 46 (p. 97); the option to count by four is removed, since 46 of 72 is out of reach. The second custom of p. 97, the most points over the round, stays the variant «sum_of_four_deals».
9. Meno: the two short variants (four and eight cards) are recorded but not played. The tie rule is not printed [S], and with four or more players equal zeros are almost certain (open question 34).
10. Partita for four: the ban on going alone (p. 89) is no longer printed as a penalty «call own card», and the signal no longer says «the lone player may stop».

**What changed in the files without a change of play.**
1. Sedici and Trent'uno: `after_false_claim` play_on [S] → [R] by rule 9, p. 20; the Prammatica is no longer its ground. Sedici for two: a false claim is paid to «the opponent»; the empty pack no longer gives Dummett's guesses for Trent'uno as said of Sedici. `result.game_points` of Sedici [R] → [D] (Prammatica, pp. 11-12, as at Trent'uno). Trent'uno: the variant «Prammatica [1846]» says that by p. 12 the winner is the first to have made the points, which the engine does not play; `bot.play[1]` translated anew (p. 46).
2. `seats.cut_min` [D] → [R], p. 16, in the eleven files that still had [D] (and p. 17 or pp. 16-18 → p. 16).
3. The card for the Fool: Permesso for five to seven [D] by pp. 77-78 with its words; Dottore `fool` and `fool_exchange_to` [D] → [R] (carried over). Venticinque and Morto: the owner's choice is the other reading [R]. Permesso for four: `result.tie` no longer says a tie arises when a Fool was not paid for.
4. Permesso: the step at 48 is [R], not [D] (rule 10, p. 68); rule 12 and its examples put the steps at 50, 55, 60 (other reading, open question 33); the engine is unchanged. `lay_down_fewer` quotes p. 65, rule 4; `exchange.give` [S] → [R] by p. 61.
5. Venticinque for two: brought to the present form (`next_leader` p. 50, `first_leader` p. 54); `count.odd_card` [D] → [R], value unchanged; `result.tie` records that the example of p. 54 (27 against 28 made equal by the card for the Fool) does not agree with our count, where a tie cannot happen (open question 32).
6. Morto: `next_leader` added (p. 50); `fool_trick` [S] → [R] by p. 57; `left_out` gains the Fool drawn from the Morto ([S]: pp. 57-58 are silent) and the lone Bagatto in the discard.
7. `fool_no_tricks` give_none [R] → [S] (p. 50; p. 55 is no ground) in nine files.
8. Mitigati for two: the other reading with one honour declared is removed (p. 93: three at least); «39 and 39» is written as impossible in `about` and in the first deal; `settle.amount` [D] → [S] (Dummett, p. 263, is the other reading).
9. Venticinque for three: `bot.play[0]` by Torino [1846], part I, p. 34 (the player who is out leads his trionfi, then the kings and the sure cards); Dummett's reading is the other reading.
10. Partita for three, Dottore, Meno, Permesso for six: a tie is a hand played out and nobody pays; the sources no longer say «replayed». Partita for four (four deals) and Venticinque for three: «paid after each deal» [S].
11. Pages: every leaf that cites another book through `by` now has `pages`, the pages of that book (163 leaves). Until this revision the rules pages took the first page number in the source line, and 43 printed links named a page of the book of 1787 under the name of another book.
12. Smaller records: revoke pages «pp. 33-34 (rule 35); p. 38 sends to it»; `must_trump` cites 1787, p. 49 (Baronetti) beside Torino [1846], p. 36; Ficcia cites 1787, p. 99; the signals of Turin 1880, p. 10; `dottore count.odd_card` names threes; «its points and a half» → «its points less a half»; the lone Bagatto in the discard is a `left_out` line in Bagatt'ultimo and Mitigati for two; quotations in the sources are fourteen words at most.
13. Open questions: 5 and 20 closed; new questions 32 (the count of the rest at Venticinque), 33 (the steps of the payment at Permesso) and 34 (the tie at Meno).

**The engine and the texts.** Two new values of the format, `claim_when: own_turn` and `first_leader: round_last_taker`. Five corrections: the discard is kept by the side, not the seat; `drop` throws away the cheapest cards whatever their order; a called rank is judged on the hand after the discard (p. 81); a false «fuora» that ends the game is paid; a deal that cannot be played out is refused. General checks now run over every game, number of seats, variant and option: the card for the Fool, the sum of the points, every variant playing to a winner, the tables of declarations, the words of the rules pages. The rules pages said «half a point more» where the engine takes half a point off, said that Sedici and Trent'uno are won by getting rid of one's cards, and printed the Onoranza of the contract in games without one; all three are corrected.

Not in this revision, separate tasks: the payment at the end of a match (`match.payout`); the window of declarations before the first trick is covered; the winner «first to have made the points» for the Prammatica variant; a refusal to play against a double Onoranza (Permesso, p. 66); the blocks `sources`, `penalties` and `settle` of Venticinque for two; the bands of Permesso.

**Count of marks** (by the rule written under revision 8): 541 [D], 260 [R], 110 [S] — 911 rules in all. The two short variants of Meno, now recorded and not played, are no longer in the count.
