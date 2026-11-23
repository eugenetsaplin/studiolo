# Who does what

## The division of work

Petri Games is a small studio. The work on these rules is done with AI systems, chiefly Claude, by Anthropic, directed by a person who makes the decisions.

The AI systems do these things:

- read the scans of the sources;
- write the game files, with the source, page and mark of each rule;
- build the rules engine and the test robots;
- draft most of the texts in this repository, including the pages of this folder.

The person is Evgeny Tsaplin, the founder of Petri Games, who directs the work, makes the decisions, and set the rules by which we keep the revisions and the placeholders.

We say this plainly because you ought to know it. Our readings are readings of the page made with a machine and checked against the scans. They are not the verdict of a scholar of these games.

## Where this fails

It fails. Here is a real case.

In revision 1 the book was read on the scan, with two independent checks. The reading of rule 38 still went wrong. The book says the Bagatto may be put away when it is alone, «eccetto che Bagatto sia solo, senza il Folle» (p. 34). We read «solo» as «without the Fool». The misreading was found during the work on revision 2, when the passage was read again on the scan and compared with Dummett 1980, p. 259. Two earlier checks had not caught it. Revision 2 changed the rule in Partita, Consiglio, Dottore, Chiamare il Re and Permesso. See [revisions](04-revisions.md).

Two other errors of ours, found and corrected in revision 2:

- In revision 1 the rule for an empty pack in Sedici and Trent'uno could not be played, because too few cards remained for another round.
- In revision 1 the rule for trumps put away in Venticinque for three followed Dummett's report of the rules of 1830. We had thought the format could not write the rule of the source of the game itself, Torino [1846], part I, p. 33.

A machine can read a page fluently and still get it wrong, as rule 38 shows. The checks of [testing](05-testing.md) cannot catch a wrong reading. That is why every rule gives its page.

## What is checked by program, and what is not

- Checked by program: that a file is well formed, that no rule changed without an entry, that a hand can be replayed from its log, that the cards are never lost.
- Not checked by program: that a reading of a page is right. In the review of the literature for revision 2, every claim we used was checked against the scans.
- A source we do not hold, the rules of 1830, we know through Dummett 1980, and the leaf says so.
- A passage we could read in part was not marked [D]. In Partita for four the leaf became [D] when the same passage was found whole in Torino [1846], part I, p. 35.

## How the page numbers let you check us

You do not have to trust us, or the machine.

- Every rule gives a source and a printed page. Open the page.
- A short quotation is given in Italian, as the game file has it. Compare it with the line.
- The mark says how far we claim to have read the page: [D] printed, [R] our reading, [S] silent.
- A leaf marked [R] gives the other reading. Where a dispute matters for play, the leaf also records the value we did not take, when it can be written as a value, and what could settle the question.
- The journal says what changed and why. It keeps our errors.

If a page says something other than the leaf says, tell us, and give the page. A rule changes by a new revision, with an entry in the journal.

## What we do not claim

- That the machine understands these games.
- That a rule is true because it runs, or because two programs agree on it.
- That our readings are final. Revision 2 corrected readings of revision 1.
- That a placeholder is history.
