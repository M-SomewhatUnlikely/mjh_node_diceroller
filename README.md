# mjh_node_diceroller

A dice string is either a general one, specifying the set of dice to use, or request for a roll in a specific ruleset (not yet implemented).

## Roadmap

Three main stages:

- Basic dice and constants. I think this is working, but I need to hook it up to something.
- Flags, far enough to get '>' working, since that's a major use case for me. That's next.
- Keywords for particular systems dice mechanics.

Around or after the above, some smaller milestones:

- More Flags
- Dice types (Fate or Fudge?) using letters other than 'd'.

## General Dice

A general dice string is a sequence of terms, each preceded by + or -; the first term can be missing its sign, in which case it gets an implicit +. Whitespace is ignored.

Each term is either:

- A term representing some dice: [n]d[s][flags], e.g. 3d6, where _n_ is optional (default 1) and _n_ and _s_ must be integers. _flags_ is an optional set of modifiers as described below.
- A constant term, just [c], a non-optional integer.

### Flags

The flags aren't yet implemented; this is design doc so far.

Each flag is one character or symbol, optionally followed by one or more digit of integer.

| Char | Number? | Effect |
| > | Required | Rather than adding the dice, it counts how many are at least equal to this target number (note: not strictly exceed as the notation might suggest; the non-strict inequality is the more common use case). Note that the total of the term is the number of successes, meaning that you'll often want this to be the only term. |
| < | Required | As '>', but successes are those that are less than or equal to the number |
| x | Optional | Each die that rolls maximum explodes, adding another die of the same kind. |
| 
