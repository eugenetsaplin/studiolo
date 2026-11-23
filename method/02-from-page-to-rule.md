# From page to rule

A game file is a list of rules. Each rule is a small record, a leaf, that holds what the engine plays and where it comes from.

## The rule leaf

| field | required | what it holds |
|---|---|---|
| `value` | yes | what the engine plays |
| `source` | yes | a mark, a space, then the source in words: book, page, a short quotation |
| `alt` | no | the other value of a disputed rule, when it can be written as a value; a variant or a test can switch to it |
| `pages` | no | printed pages, when they should not be read out of `source` |
| `by` | no | which entry of the table of sources the rule follows; `ours` means our own decision with no source behind it |
| `note` | no | a remark for developers, never shown to players |
| `replace` | no | on an [R] or [S] leaf: the number of the open question, what it is about, and what could close it (see [placeholders](03-placeholders.md)) |
| `unused` | no | `true` on a setting that the file keeps but this game does not use; such a leaf is never shown as a rule |

A rule leaf is never merged with another. When a game is written as another game plus differences, a changed rule replaces the whole leaf, so a value never travels without its source.

## The three marks

**[D] documented.** The named source prints the rule. The leaf gives the page and a short quotation in Italian. From Meno:

```json
"cut_min": {"value": 2, "source": "[D] Torino 1787, p. 16: «Una carta sola non si può coppare»: a cut leaves at least two cards in each part."}
```

**[R] our reading.** The passage reads more than one way, or two sources disagree. The leaf gives the words, the reading we play, and the other reading. From Partita for three:

```json
"fool_no_tricks": {"value": "give_none", "source": "[R] Torino 1787, p. 50: «non sarò io obbligato a dartelo mai»; Prammatica [1846], p. 6 disagrees («cederlo»), not followed.", "by": "ours", "alt": "give_fool", "replace": {"with": ["expert", "bots"], "what": "the Fool of a player who won no trick: kept or given up", "q": 2}}
```

**[S] sources silent.** No source we hold says anything. The decision is ours, made so that the game can be played. The leaf says what is missing, and, where we follow a source, which one. From Venticinque for three:

```json
"dealer_rotation": {"value": "right", "source": "[S] Torino [1846], part I, p. 34 does not say who deals next; ours after Torino [1846], part I, p. 18: «si rimette il mazzo a chi vien dopo a destra».", "by": "torino1846"}
```

A leaf marked [R] or [S] is a placeholder, not history.

## What counts as documented

A rule is [D] when the named source prints it, and we can give the page. Three points follow.

- [D] means printed in the source the leaf names. A leaf can be [D] on a later source. For example, in Venticinque for three the leaf for the sides begins «[D] Dummett 1980, p. 260 (after RI)». It says what Dummett prints. It does not say that the 1787 book prints it.
- A passage we can read in part is not enough for [D]. In Partita for four, the 1787 book (p. 89) gives the words «Chi coppa meglio» for who deals at the start, and we read the passage in part. The leaf stood as [R] until revision 2, when the same passage, whole in Torino [1846], part I, p. 35, turned it into [D].
- A number in a source string always carries its page.

## One file per game, and per number of players where the deal differs

Sedici has three files, for two, three and four players. Permesso has a file for each number from three to seven.

A file may also serve several numbers. Trent'uno has one file for two to four players. Meno, pp. 78-79, has one file for two to seven players, because the book gives a table of hands. The hand size is a value that depends on the seats:

```json
"hand_size": {"value": {"by_seats": {"2": 25, "3": 25, "4": 19, "5": 15, "6": 13, "7": 11}}, "source": "[D] Torino 1787, p. 78: «con venticinque carte in … con venticinque carte … carte in sette persone»."}
```

The engine picks the entry for the number of seats at the table.

A game the book writes as the same as another can be a file that names its parent and holds just what differs. The book does this itself. Consiglio: «tutto è simile al giuoco di Partita in quattro» (p. 97); its file names Partita for four as its parent.

## Statuses

Each game file may carry a status. The format allows four: `documented`, `playable_with_decisions`, `from_later_source` and `draft`. Two are in use.

- `playable_with_decisions`: the game can be played, and some of its rules are our readings or decisions. Twenty of the 21 files carry this status.
- `from_later_source`: the 1787 book does not describe the game. The one file with this status is Venticinque for three.

The status is a summary. The marks on the leaves say which rules are which.

## What is not a rule leaf

Structure (which module runs at which step), presentation and texts are not rules and carry no source. The engine and the plain-language rules page read the same game file, so there is no second copy of a number.
