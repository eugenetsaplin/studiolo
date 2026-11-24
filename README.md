![Studiolo: restoring the tarot games of the 1787 Turin rulebook](assets/banner.png)

# Studiolo

**An open notebook on restoring the tarot card games of the 1787 Turin rulebook.**

[![DOI](https://zenodo.org/badge/1469096534.svg)](https://doi.org/10.5281/zenodo.24476760)

Tarot cards were made for play. In 1787 the Turin printer Soffietti published *Primi elementi e regole del giuoco de' tarocchi*: a hundred pages of rules for the tarot games then played in Piedmont, for two to seven players. The pages do not say everything.

Studiolo is our attempt to make every game of that book playable again, and to show our working while we do it.

## How to read our rules

Every rule we write down carries its source, its page, and one of three marks.

| Mark | Meaning |
|---|---|
| **[D] documented** | The rule is printed in the named source. |
| **[R] our reading** | The source is ambiguous, or two sources disagree. This is how we read it. |
| **[S] sources silent** | No source we hold says anything. This is our decision, made so that the game can be played. |

A rule marked [R] or [S] is a placeholder, not history. Where a dispute matters for play, the rule also records the alternative we did not take and what could settle the question: a document, an expert, mathematics, statistics from bots, or people at a table.

It is the restorer's rule applied to games: what we add must be recognisable as ours, and the original must stay at hand.

## Where we stand

Rules revision 7, November 2026 (release 1, with its DOI, holds revision 4):

- 21 game files: one per game, and one per number of players where the deal differs.
- 924 rules: 551 documented, 245 our readings, 128 where the sources are silent.
- 31 open questions, 29 of them still open.
- The rules engine plays all 21 game files today.

## What is here

| Part | What it is |
|---|---|
| [`rules/`](rules/) | The rules of every game in plain English. Start here. The pages are generated from the rule files by the code that draws the rules pages of our site; where that code has no sentence yet, a value is printed as the file has it. |
| [`rulesets/`](rulesets/) | The rule files themselves, machine-readable, with their schema. |
| [`rulesets/REVISIONS.md`](rulesets/REVISIONS.md) | The journal: every change to every rule, numbered, with its reason. |
| [`rulesets/OPEN_QUESTIONS.md`](rulesets/OPEN_QUESTIONS.md) | The placeholders, each with its alternatives and with how often the disputed case comes up in play. |
| [`method/`](method/) | How we look for sources, read them, turn them into rules, and test the result with robots. |
| [`docs/`](docs/) | The format of a rule file, and the rules it cannot express yet. |

The rules engine and simple robots will follow, so that anyone can repeat our numbers. Until then the journal and the documents name some commands and tools that are not in this repository.

## Our mistakes stay in the record

In revision 1 we misread rule 38 of the book (p. 34). No honour may be discarded, *«eccetto che Bagatto sia solo, senza il Folle»*. We took this to mean "unless the hand holds no Fool". It means: unless the Bagatto is the only trump in the hand and there is no Fool. That is how Michael Dummett reads the rule (*The Game of Tarot*, 1980, p. 259). Revision 2 corrects it. The journal keeps both readings and the reason for the change.

Revision 5 corrects nine wrong or doubtful attributions of sources that a second reading of the pages found. One of them was a penalty written the wrong way round: at Venticinque for three the offender pays each opponent, he does not receive from them (Prammatica [1846], p. 14). The journal lists them.

Revisions 6 and 7 make the rest of the book playable. Sedici and Trent'uno become a race to five points, after Prammatica [1846], pp. 11-13. Permesso gets its auction and its exchange of called cards, Chiamare il Re its secret partner, Bagatt'ultimo and Mitigati their declarations. Where the pages are silent — who receives which laid card, what the dealer's pass means, how long a match lasts — the file carries a placeholder with its mark and the other reading, and the question stands in the list.

## How you can help

- **You know a source we lack.** We list what we are looking for.
- **You read a passage differently.** Tell us, with the page.
- **You play these games.** Tell us how your table rules the cases the book leaves open.
- **You are a mathematician.** Some open questions wait for a calculation, not for a document.

The Discussions tab is the place; [`CONTRIBUTING.md`](CONTRIBUTING.md) says what helps us most. We answer.

## What we do not claim

- The book describes Piedmont in 1787. It is not evidence of how tarot was played in Milan in the 1440s.
- We are not the first to study these games. Before us: Michael Dummett, *The Game of Tarot* (1980); Michael Dummett and John McLeod, *A History of Games Played with the Tarot Pack* (2004); John McLeod's pagat.com.
- A game that runs is not thereby correct. Robots tell us whether a reading can be played, not whether it is true.

## Sources

- *Primi elementi e regole del giuoco de' tarocchi*, Torino, Soffietti, 1787. We work from a study copy that the Biblioteca Sormani (Milan) supplied free of charge through the IHR Library, University of London. We may not pass the scan on. Ask the library: that is how we got ours.
- L. B., *Il giuocatore di tarocchi al tavoliere*, Torino, Serra, [1846].
- Michael Dummett, *The Game of Tarot*, London: Duckworth, 1980, chapter XIII, «Tarocco in Piedmont and Lombardy».

We quote short passages with their page numbers. We do not publish scans that we have no right to publish.

## How we work, and where the AI is

Petri Games is a small studio. Reading the scans, writing the rule files, building the test robots and drafting most of these texts is done with an AI system (Claude, by Anthropic), directed by Evgeny Tsaplin, the founder of the studio, who makes the decisions. That is the reason every rule carries a page number: you do not have to trust us, or the machine. Open the page.

## Play the games

- **Studiolo, the site**: play in the browser, with friends by a link or against bots. An early build: 8 of the 21 games can be played so far. <https://studiolo.petrigames.com/?from=github>
- **TRIONFI** on Steam: our card game played with the Cary-Yale Visconti deck. <https://store.steampowered.com/app/5504420/?utm_source=github&utm_campaign=studiolo>

## Licence and citation

Our own texts and rule files are under [CC BY 4.0](LICENSE): use them freely, name us, and link here.

Two things are not ours to license. The quotations from the sources belong to their authors and publishers. The cards in the banner are «Cary-Yale Visconti tarocchi, Milan, 1440s. Beinecke Library, Yale University (open access)».

Suggested citation: Tsaplin, E. (2026). *Studiolo: the tarot games of the 1787 Turin rulebook* (release 1, rules revision 4). Zenodo. <https://doi.org/10.5281/zenodo.24476761>. See [`CITATION.cff`](CITATION.cff).

Each release is archived at Zenodo under its own DOI: name the release and the rules revision you used. One permanent DOI always leads to the latest release: <https://doi.org/10.5281/zenodo.24476760>. The engine, when it is published, will carry its own licence.
