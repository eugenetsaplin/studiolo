# Testing

We test the rule files in several ways. Each way can tell us something and cannot tell us something else. This page sets out both. Each number is given with the revision of the rules it was taken at.

One line holds for all of them. A game that runs is not thereby correct. A robot shows that a reading can be played. It does not show that the reading is true.

## Which games are played

At revision 2 the rules engine plays 8 of the 21 game files. Counted as pairs of game and number of players, it plays 13 of 28.

- Played: Venticinque for two, Morto, Venticinque for three, Partita for three, Partita for four, Consiglio, Dottore, and Meno from two to seven players.
- Not yet played: Bagatt'ultimo, Baronetti, Chiamare il Re, Mitigati for two, Permesso for three to seven players, Sedici for two to four, Trent'uno for two to four.

A check can test a game when the engine plays it, and not otherwise. The other games are covered by the validator and the revision check. No robot has played them.

## The checks

**The validator of the game files.** It reads every file against a schema. Then it checks what a schema cannot: that every value has a source, that every source string begins with a mark, that the phases refer to each other correctly, that every `by` names an entry of the table of sources, and that the deal fits the pack for every number of players the file allows. It tells us that a file is well formed. It does not tell us that a rule is right.

**The revision check.** It compares the hash of each file with the hash block of the journal. It tells us that no rule changed without an entry. It does not look at the rule.

**The unit tests.** At revision 1 there were 376 tests, and 375 passed; the one that failed was a question about the rules. At revision 2 there are 396, and all pass. At revision 4 there are 707, and none fails. They tell us that the engine does what we meant. They do not tell us that what we meant is what the book says.

**Random-play robots through the engine.** A robot picks a legal move at random. After each move the checks look at the cards: none lost, none doubled. The robots also try forbidden moves, and the engine must refuse them.

| revision | what | result |
|---|---|---|
| 1 | 130,002 deals, 9.4 million moves, 2 to 7 seats | 0 failures |
| 1 | 109,739 attempts at forbidden moves | all refused |
| 1 | 20,000 deals played with the second value (`alt`) of 20 rules | 0 failures |
| 2 | 65,001 deals | 0 failures |

They tell us that the files can be dealt and played to the end, and that the second value of a placeholder can be played too. They cannot tell us which value is right. They play at random, so they say nothing about what a skilled player would do.

**Robots through the table server.** The same robots sit at a table on a test server and play over a network connection, on one machine. Some of them drop the connection and come back.

- Revision 1: 4,000 deals at 2, 3, 4 and 7 seats, 0 failures, 366 dropped connections after which the player returned to the seat.
- Revision 2: 4,000 deals, 0 failures.

This tells us that the server keeps seats and hands straight. It does not test the rules.

**Replay of recorded hands.** Every table keeps a log. Replaying the log through the engine must give the same hand, down to a checksum. At revision 1, of 4,000 logged deals, every checksum matched. This tells us that a hand can be reproduced from its log. It does not tell us that the hand was played by the right rules.

## Comparison with a second implementation

TRIONFI, our game on Steam, has its own rules core, written separately, in another engine (Godot). For two games for two players, Venticinque and Morto, we compare the two.

How it works:

- The Steam core plays the hands: it deals, and each player plays a random legal card. Each hand is recorded step by step.
- Our engine is given the same deal and replays the same moves.
- At every step the comparison checks whose turn it is and that both programs allow the same set of cards. At the end of the hand it checks the tricks and who took each, the points, the winner and the game points, and the exchange for the Fool.

Which rules each side plays:

- Our engine plays our game files for Venticinque and Morto.
- For Venticinque the Steam core plays its own rule file. Our game file for Venticinque was carried over from it word for word.
- For Morto the Steam core plays its own rule file with its settings set from our game file. Our Morto follows the 1787 book and differs from the Steam Morto. Settings of our file that the Steam core cannot set are played its own fixed way.

So the comparison uses the Steam game's own rules, not our published game files alone.

At revision 2: Venticinque, 10,000 of 10,000 hands agree; Morto, 2,000 of 2,000 hands agree. Revisions 3 and 4 changed no rule, and the comparison gave the same numbers after each.

This tells us that two programs, written apart, play the same hands the same way. It does not test the deal, and it does not tell us that the rules are those of the book.

## The rough model for the short games

For Sedici and Trent'uno we asked a different question: does the pack run out before anyone reaches the target? The model lets a random player take each trick and counts the games in which the pack runs out before anyone reaches the target. Its numbers, for a plain card at 0 and at 1, are on the page about [placeholders](03-placeholders.md). The model is rough. It shows whether the game reaches its target with each value, and it does not say which value people played.

## A count of rare cases

We counted, over 10,000 deals of random robots, how often each disputed case arises. The page about [placeholders](03-placeholders.md) gives the figures. Robots play at random, so a case that depends on skill will arise less often among people.

## What none of this replaces

People at a table. Robots do not tell us whether a rule is pleasant, or whether a table of players would have kept it. Neither can they say what the book meant. For those, we need sources, readers who know these games, and players.

Logs of tables carry no names and no addresses. At revision 1, a check of 608 logs found none.
