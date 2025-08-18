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

Each flag is one character or symbol, optionally followed by one or more digit of integer (which has a default per the table). In the descriptions below, the optional parameter integer is called 'm': 'n' is the number of dice and 's' is the size of dice.

Because there's competition for sensible characters to use, they're case sensitive (and versions of the same letter do related things). The script won't accept unused cases as equivalent.

| Char | Number? | Effect |
| ---- | ------- | ------ |
| > | Default s | Rather than adding the dice, it counts how many are at least equal to this target number (note: not strictly exceed as the notation might suggest; the non-strict inequality is the more common use case). Note that the total of the term is the number of successes, meaning that you'll often want this to be the only term. |
| < | Default 1 | As '>', but successes are those that are less than or equal to the number |
| = | Default s | As '=', but successes are those that are exactly equal to the number. Not at all useful (doesn't matter what 'm' is; same success probabilities as '>' with 's'), but I could implement it while I'm there. |
| x | Default no limit | Each die that rolls maximum explodes, adding another die of the same kind. The optional number is the maximum additional dice, default unlimited. |
| H | Default 1 | Keep the highest 'm' dice (like mid-old D&D character gen). m=1 returns max(roll), which may be useful in some systems. |
| L | Default 1 | Keep the lowest 'm' dice. m=1 returns min(roll). |
| l | Default 1 | [Lower case L]: Lose the highest 'm' dice. |
| h | Default 1 | Lose the lowest 'm' dice; 4d6h1 = 4d6H3 |
| d | Default 2 | Make a fuss if there are at least 'm' matching rolls. (The default of 'm=2' is 'doubles') |
| c | Default 1 | Felix's Cut: Alias for 'l' (might need to remove this if I need the letters back). |

### Alternative Dice Types

Even further off, but useful design doc.

Specify die types in the basic die formula: [n]d[s] becomes [n][d][s] for some 'd' in the table below:

| Char | Effect |
| ---- | ------ |
| d | Normal dice. The subtotal from each term is the sum of the dice, unless you include the '>' or '<' flag, in which case you get the number of successes. |
| b | Binomial test, intended for '>' flags . Alias for 'd' (which is allowed for compatibility), but you'll be warned if you forget the '>' or '<' flag. |
| f | Fudge/Fate dice: +1, +1, 0, 0, -1, -1. I suppose I could support 'Fudge notation' ([n]dF) but this is much easier for pattern matching. |
| h | The total is just the highest die. This is equal to K1, but I don't want to have to promise the order of flags in 4d6c2K1; cleaner to do 4h6c2. |
| l | The total is just the lowest die, on the same basis. |
