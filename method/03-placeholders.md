# Placeholders

## What a placeholder is

A placeholder is a value that stands in a game file so that the game can be played, and that waits to be replaced. It is either our decision where the sources are silent (mark [S]), or our reading where the sources disagree (mark [R]).

A placeholder is not history. We do not say that anyone played this way. We say that this is the value we play until something better arrives.

## Why we fill a gap

The sources leave gaps. For Venticinque for three, Torino [1846], p. 34 says who wins and who loses the match of three deals, but not how much is paid. For Partita for three, the 1787 book does not say whose points the discard joins (pp. 87-88). A game with a gap in its rules cannot be dealt, played or scored to the end.

We could leave such a game unplayable. We do not. We choose the value that has the best argument behind it, mark it [R] or [S], write down the value we did not take where it can be written, and say what could settle the matter. The robots can then play both values.

## What we record beside it

- **The source string** says what is missing, or what the sources say, and which of them we follow.
- **`alt`** holds the other value, when it can be written as a value. A variant or a test can switch the game to it.
- **`replace`** holds the number of the open question and the ways that could close it.

In revision 2, 58 rules carry `replace`. Of these, 34 also carry `alt`. A script builds from the game files a list of these rules, file by file, and the validator checks that every question number in a file is a row of the list of open questions. Questions 3, 13 and 17 have no marked rule, because their rule is not played yet. They live in the list alone.

## The five ways to close a placeholder

1. **Document.** A source turns up where the rule is printed.
2. **Expert.** A specialist in the reconstruction of rules gives an opinion, with the argument.
3. **Mathematics.** A mathematical analysis.
4. **Bots.** Statistics of games played by robots and of the logs of tables.
5. **People.** A trial with live players.

Replacing a placeholder is a new revision with an entry in the journal. The question is never deleted from the list. It is marked closed and given the number of the revision that closed it.

## How often a disputed case comes up

For each disputed case we counted how often it arises, over 10,000 deals played by random robots, in the engine run on the game files of revision 1. The robots play at random, so a case that depends on skill will be rarer among people.

| question | case | share of deals |
|---|---|---|
| 1 | a player who took no trick has put cards away | three players 0.03 %; four players 0.84-0.94 %; five players 4.9 % |
| 2, 18 | the owner of the Fool has no plain card to give for it | three players, 3 deals in 10,000; four players 1.2 % by player, never by pair; Dottore 6.7 %; Meno for seven 24 % |
| 14 | a tie | 1-2 % of deals in the games scored by points; never in Venticinque for two |

With three players, questions 1 and 2 almost never arise. In the games for five to seven players they arise often, and there the placeholder needs more care.

A count does not decide a question. In question 2 the sources are evenly divided. The value we play rests on our reading of the 1787 book, pp. 50 and 21, and the question waits for an expert or for the bots.

## Three cases from revision 2

**Closed by a document: which trumps may be put away (question 4).** In Venticinque for three, revision 1 followed the rules of 1830 as Dummett reports them: trumps from XVII upward may not be put away. Revision 2 follows Torino [1846], part I, p. 33, the source of the game itself: «Lo scarto dei Tarocchi è solo permesso quando non se ne hanno in mano più di tre». Trumps are not put away, unless the dealer holds three or fewer. The value of 1830 stays in `alt`. A dealer holds three trumps or fewer in 1.32 % of deals: the calculation and the census agree.

**Closed by a document: who deals at the start in Partita for four (question 21).** Page 89 of the 1787 book has «Chi coppa meglio», and we read the passage in part. The same passage stands whole in Torino [1846], part I, p. 35: «Chi coppa meglio degli altri tre compagni è quello che comanda». The leaf changed from [R] to [D]. The other way, to draw a card, is Prammatica [1846], p. 7 and Dummett 1980, p. 261.

**Changed by a calculation: the value of a plain card in Trent'uno (question 9).** Trent'uno is played to 31 points, and the cards are counted one at a time. Torino 1787, pp. 13-14, 51 and Torino [1846], part I, p. 30 give no value to a plain card counted singly. Revision 1 played it as 0.

We used a rough model in which a random player takes each trick. With a plain card at 0, the pack runs out before anyone reaches 31 in 29 % of games for two players, 58 % for three and 87 % for four. With a plain card at 1, it happens in 0 %, 0 % and 5 %. With 0 the whole pack is worth 67 points, and with 1 it is worth 126.

Dummett (1980, p. 269) counts a plain card as 0, adds that 1 is possible, and says that with 0 it is «quite common for no one to reach 31 points». The Savoy twin of the game, «À Fora», in the rules of Annecy published by Depaulis (1984), counts plain cards and the Fool at 1. Revision 2 plays 1 in Trent'uno and keeps 0 in `alt`.

Sedici stays at 0. There, the pack runs out before anyone reaches 16 in 0 % of games for two and three players and 2.5 % for four.

Question 9 stays open. The calculation changed the value for Trent'uno in revision 2. The question can still be closed by a document or by the bots, for Sedici, Trent'uno and Meno alike.
