# How to help

We restore the rules of old tarot games from the books that describe them. Where a book is unclear or silent we say so, write down our best-argued reading, and wait for something better. You can be that something.

## Five ways

**You know a source we lack.** A book, an article, a manuscript, a library copy. Tell us what it is and where it can be read lawfully. We do not use copies that someone had no right to share.

**You read a passage differently.** Name the game, the rule and the page. Quote the line as the book has it, in the original language, and say how you read it and why. One passage per message is easiest to follow.

**You play these games.** Tell us how your table rules the cases the book leaves open: where you play, with how many players, and what you do. A living custom is not proof of what was done in 1787, and we will not present it as one, but it is evidence, and it may be the only evidence there is.

**You are a mathematician.** Some open questions wait for a calculation, not for a document: how often a case arises, whether a rule lets the game reach its end, which of two values makes a fair match. The list of open questions says which.

**You can program.** The rules engine, the bots and the bot lab are in this repository, and they run on Node 24 with nothing to install. [`problems/`](problems/) lists questions that a program can help to answer, each with the commands to start. Send a solution as a pull request that adds a folder under `solutions/`, or open a discussion and attach the file.

## Where

- Open a discussion for a question, a reading or a custom.
- Open an issue for an error in a file: a wrong page number, a quotation that does not match the book, a broken link.
- The list of open questions is in [`rulesets/OPEN_QUESTIONS.md`](rulesets/OPEN_QUESTIONS.md). Each has a number: use it.

## What happens next

- We answer. The work here is done with AI systems directed by a person who makes the decisions; an answer may be drafted by a machine and is read by that person before it is posted.
- If you are right, the rule changes in the next revision, and the journal says why and names the source. We name you only if you ask us to.
- If we disagree, we say why and the question stays in the list, open.
- A rule never changes silently: every change is an entry in [`rulesets/REVISIONS.md`](rulesets/REVISIONS.md).

## What we cannot take

- Scans or copies of books that may not be shared.
- Rules with no source and no table behind them.
- Changes to the rule files or to the engine (`core/`, `bots/`, `tools/`, `test/`) by pull request: these files are produced from our working repository, and a change made here would be overwritten. Tell us what should change and why.
- Solutions to the problems in [`problems/`](problems/) are the exception: a pull request that adds files under `solutions/` is welcome.
