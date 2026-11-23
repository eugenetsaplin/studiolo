# Sources

Every rule in a game file names the source it comes from. This page says which sources we use, which of them decides, and what the main one cannot show.

## The book that decides

*Primi elementi e regole del giuoco de' tarocchi*, Torino, Soffietti, 1787. In the game files it is called «Torino 1787». It is the main source for every game it describes.

The rule of the journal is short: the book of 1787 decides for its own games. Other sources fill its silence, and each is signed with its year and place.

## Other sources we cite

- **Torino [1846], part I.** L. B., *Il giuocatore di tarocchi al tavoliere*, part I (*Grammatica del giuocatore*), Torino, Serra, [1846]. The brackets around the year are as the game files write it.
- **Prammatica [1846].** L. B., *Prammatica ossia regole indispensabili per gli amatori di simile passatempo*, part II of the same book.
- **Dummett 1980.** Michael Dummett, *The Game of Tarot*, London: Duckworth, 1980, chapter XIII, «Tarocco in Piedmont and Lombardy», pp. 258-279.
- **The rules of 1830.** *Regole inalterabili per tutti i giuochi di Tarocco detti di commercio*, Torino, 1830. Cited as «RI» or «the rules of 1830». A copy is in Oxford (Jessel f.937); we do not hold it. We know it through Dummett 1980.
- **Other books.** Single leaves also cite Nice 1930, Piedicavallo 2008, the rules of Annecy as published by Depaulis (1984), and Dummett and McLeod, 2004.

The book of 1787 names Venticinque for three (p. 8) and does not describe it. Most of its rules in our file come from the book of 1846 (see the third case below). That book also prints, on p. 36, the duty to play a trump when you cannot follow suit, for Partita and the games after it.

## How we cite

- A leaf names the source by its short name and gives the printed page: «Torino 1787, p. 16».
- A number in a source string always carries its page.
- A short quotation is given in Italian, in «», as the game file gives it, and is not translated inside the quotation.
- When a leaf rests on a source other than the 1787 book, the leaf says so in its text and may name the source in its field `by`.

## Held and not held

Each game file has a table of sources. Each entry has a field `held`.

- **Held** (`true`): for example Torino [1846], part I; Prammatica [1846]; Dummett 1980.
- **Not held** (`false`): the rules of 1830. A rule taken from them is cited as «after RI» or «after the rules of 1830», and the page is Dummett's.

Held is not the same as whole. Our scan of Dummett's chapter is partial: printed page 268 is missing. The list of open questions names that page among the documents that could close question 8.

## Lawful copies

We work from lawful copies. The study copy of the 1787 book was supplied free of charge to us by the Biblioteca Sormani (Milan) through the IHR Library, University of London. We may not pass the scan on, and we do not.

In this repository we quote short passages, each with its page. We do not publish scans that we have no right to publish. Anyone who wants to check a page can ask the library, as we did, or open any other copy at the page we name.

## How a later source is used

Three cases.

1. **The 1787 book speaks.** We follow it, and a later source that disagrees is named in the leaf and not followed. Example: in the games of the 1787 book, a player who wins no trick keeps the Fool (Torino 1787, p. 50). Prammatica [1846], p. 6 says the opposite. The sources divide on this point, so the leaf is marked [R] and records the other value as the alternative (question 2).
2. **The 1787 book is silent.** We mark the leaf [S] and may follow a later source. Example: for Meno the book does not say who deals next (pp. 78-79). We follow Torino [1846], part I, p. 18.
3. **The game is not described in the 1787 book.** Venticinque for three is merely named there. Its file carries the status `from_later_source`. Most of its rules come from Torino [1846], Prammatica [1846] and Dummett's report of the rules of 1830; the general rules of the 1787 book fill what those do not say. Revision 2 changed one rule of this game from the rules of 1830, as Dummett reports them, to the text of Torino [1846], part I, p. 33, the source of the game itself.

Later sources also disagree with each other and with the book. Where they split, the question goes into the list of open questions. See [placeholders](03-placeholders.md).

## What the 1787 book can prove

- What a Turin printer set down in 1787 as the rules of the tarot games then played in Piedmont.
- The list of games, the 78-card pack (pp. 9-10: «Settant'otto Tarocchi si richiedono»), the order and the points of the cards (pp. 11-14).
- That some customs varied. For Consiglio the book gives two ways of winning; the second is introduced with «presso altri» (p. 97).

## What it cannot prove

- It is not evidence of how tarot was played in Milan in the 1440s, or anywhere else, or at any other time.
- It does not say everything. For Partita for three it prints no payment (pp. 87-88). The book also leaves many stakes and premiums to the players: «Tutto questo si dee concludere chiaramente prima di dare le carte» (p. 21).
- It can be read in more than one way. Where it can, our leaf is marked [R] and gives the other reading.
- It does not tell us how often a disputed case arises, or whether a table liked a rule. Robots and people at a table can tell us that. Neither can tell us what the book meant.
