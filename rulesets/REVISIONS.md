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
