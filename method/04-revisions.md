# Revisions

The rules change. We keep one journal for every change, so that you can see what a rule said, when it changed, and why.

## How the journal works

- The journal is one file, `REVISIONS.md`. Revisions are numbered in a single run: 1, 2, and on.
- A revision is the state of all the game files on a date. It has a tag in the repository: `rules-r1`, `rules-r2`, and so on.
- Each game file has a field `revision`. It holds the number of the last revision that changed that file.

The journal names six reasons for a revision:

1. a new source;
2. a check by bots;
3. a mathematical analysis;
4. a trial with people;
5. a misreading that has been found;
6. an editorial decision.

## What an entry holds

For every change, the entry says:

- which game;
- what the rule was, and what it is now;
- why;
- the source, or the report that gave the reason;
- whether the game itself changes or just the mark on the rule.

That last line matters. A change of mark ([R] to [D], for instance) does not change how the game plays. A change of value does. Revision 2 lists the two kinds apart.

## The hash block

Each revision carries a block of file hashes, written as a comment in the journal. It lists every game file with its SHA-256 hash as it stands in that revision.

A check reads the latest block and compares it with the files. A game file that changed without a new entry fails the check, and so does a file whose field `revision` does not match the last block in which its hash changed. We tested it by changing one letter in a game file. The check caught it.

## A question is never deleted

When a placeholder is replaced, the question stays in the list of open questions. It is marked closed and given the number of the revision that closed it. In revision 2, two of 22 questions are closed, so 20 are open.

The same holds for our own errors. The journal keeps the old reading and the new one, with the reason for the change.

## The revisions so far

**Revision 1.** The opening release of 21 game files, which cover the 19 games of the 1787 book. Sedici has three files, for two, three and four players. The files hold 898 rules: 543 [D], 233 [R], 122 [S]. The book was read on the scan, with two independent checks.

**Revision 2.** All 21 files changed; in most of them, the fields of placeholders were added and nothing else. The files hold 899 rules: 545 [D], 232 [R], 122 [S]. Five changes alter the game itself. Seven change marks and sources, not the game. Two questions are closed by a document. One value, the plain card of Trent'uno, was changed on the strength of a calculation, and its question stays open (see [placeholders](03-placeholders.md)).

**Revision 3.** No rule changed. The files were prepared for publication: the marks are written in Latin letters, references to our working documents were replaced by plain words, the unit of payment keeps its Italian name, and descriptions that still told the rules of revision 1 were corrected. One page number was corrected against the scan: the rule on the cut of the pack stands on p. 16. From this revision on the journal and the list of open questions are kept in English.

**Revision 4.** No rule changed. The files of Venticinque for two and Morto were converted from the rule files of our game on Steam and listed every setting of that program. The settings these two games do not use are now marked `unused`, and the rules pages no longer show them as rules.

## Our misreading in revision 1, corrected in revision 2

Rule 38 of the book (p. 34) says which cards may not be put away at the discard: no honour, that is no king, no Angel, no Fool, no Bagatto. It adds an exception: «eccetto che Bagatto sia solo, senza il Folle».

In revision 1 we read «solo» as «without the Fool». The Bagatto could then be put away whenever the hand held no Fool.

That reading is wrong. The word «solo» means alone: the Bagatto may be put away when it is the single trump in the hand and the hand has no Fool. Michael Dummett reads the rule this way (*The Game of Tarot*, 1980, p. 259: «neither the Folle nor any other trump»).

The misreading was found during the work on revision 2, when the passage was read again on the scan and compared with Dummett 1980, p. 259. Two earlier checks had not caught it.

Revision 2 corrects it. It touches Partita for three and for four, Consiglio, Dottore, Chiamare il Re and Permesso. Page 90 of the book says of Partita for four, flatly, «Bagatto non iscartasi».

The leaf in the game file now says all this in its source string. It names the other reading too: no exception at all, as the rules of 1830 have it, according to Dummett (p. 259). That reading stands in `alt`.

The engine was corrected together with this revision. It used to check the exception against the hand at every step of the discard. It now judges the exception on the hand as dealt: otherwise, by putting away another trump beforehand, a player could free the Bagatto.

## Two other corrections in revision 2

- **Venticinque for three, trumps put away.** In revision 1 we followed the rules of 1830 as Dummett reports them, because we thought the format could not write the rule of the 1846 book. It can. Revision 2 uses the rule of Torino [1846], part I, p. 33.
- **Sedici and Trent'uno, an empty pack.** In revision 1 we wrote: gather the cards not yet taken and deal again. This cannot be played, because too few cards remain for another round. Revision 2 closes the hand without payment, one of the two guesses of Dummett (1980, p. 269); the other is to deal all the cards again.
