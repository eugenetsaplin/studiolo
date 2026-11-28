# Problems

Some open questions of this project wait for a program or a calculation, not for a document. Each one is a card in this folder. A card says what we know, what we tried, what would count as an answer, and the command to start.

You do not need to know the old games. You need Node 24 (nothing else to install) and the engine in this repository: [`docs/ENGINE.md`](../docs/ENGINE.md) tells how to run it in ten minutes, [`docs/BOT.md`](../docs/BOT.md) says how the bot works and how to write one of your own, [`docs/CORE_API.md`](../docs/CORE_API.md) says how the engine is called. [`examples/`](../examples/) has three worked examples.

## The cards

| Card | The question in one line | How we measure |
|---|---|---|
| [001 A stronger opponent](001-stronger-opponent/TASK.md) | Can a bot beat our `normal` level clearly at two players? | Share of games won against `normal`, 1,000 deals, and time per move |
| [002 Bidding at Permesso](002-bidding-at-permesso/TASK.md) | Do the bots leave money on the table at the auction? | Money per deal against the other seats, 400 deals, at three and five seats |
| [003 Meno for three](003-meno-short-form-for-three/TASK.md) | Closed by rules revision 14. The many-winner share of the short form came from our reading of the count. | The share fell from 44 % to 21.5 % of 200 hands when a plain card counts 1 |

Cards 001 and 002 are open. Card 003 was closed by rules revision 14, and its answer is in the card.

## How a card is built

1. The problem in one paragraph, and why it matters for the game.
2. What we know: numbers with their conditions (how many deals, how many seats, which rules revision), what we tried, what did not help.
3. Acceptance: which numbers on which deals.
4. How to run it: one command.
5. What to send back, and what not to change.

## How to send a solution

- **With git.** Make a branch in your own copy and open a pull request that adds new files, and no changed ones, in `solutions/NNN-<name>/<your name>/`. Put there: the bot module (a file with `chooseAction`, as `bots/index.js` has) or a level file; a `REPORT.md` with what you did and your numbers on the tuning seeds; the command that checks it. Do not change `core/`, `bots/` or `rulesets/`.
- **Without git.** Open a discussion and attach the file, or write the answer on paper, in a message or in a document. For card 002 a written argument with numbers is a full answer. Code is welcome but not needed.

You may use any name you like, or none.

## How we accept a solution

- We run the acceptance measure on **our own seeds**. They are not in the card. The seeds the card names are there for tuning.
- The card names the number of deals before you start.
- If the measure passes, we merge the pull request, mark the card as solved here and link the solution from the card. If we take your method into our own bot, it comes back to this repository with a later export, and we name you if you ask us to.
- If it does not pass, we write the numbers we got on our seeds in the discussion or the pull request.
- Several people can work on one card. We compare their solutions with the same measure.
- We read a solution before we run it. A bot may use its four arguments and nothing else: no files, no network, no clock, no state of the process. A solution that looks elsewhere is not accepted.
- We do not promise a time of answer.

Questions about a card are welcome in the discussions.
