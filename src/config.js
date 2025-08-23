module.exports.flags = [
    {
        keys: [">"],
        help: ">`m` - Turns the dice into a success test (type b), returning the number"
            + " of dice that are at least (**not** strictly greater than) `m` (default max).",
        default: "s",
    },
    {
        keys: ["<"],
        help: "<`m` - Turns the dice into a success test (type b), returning the number"
            + " of dice that are at most (**not** strictly less than) `m` (default 1)."
            + " If > is also in use, < will _remove_ successes, so that you can do oWoD botches.",
        default: 1,
    },
    {
        keys: ["="],
        help: "=`m` - Turns the dice into a success test (type b), returning the number"
            + " of dice that are equal to `m` (default max).",
        default: "s",
    },
    {
        nyi: true,
        keys: ["x"],
        help: "x`m` - NYI: Dice explode, adding an extra die for each max score. Limited to `m` bonus per die (default 10k).",
        default: 10000,
    },
    {
        nyi: true,
        keys: ["X"],
        help: "X`m` - NYI: Dice explode, adding an extra die for each score of `m` or more (default max)."
            + " Combine X and x to specify the explosion threshold and a limit, respectively.",
        default: "s",
    },
    {
        keys: ["H"],
        help: "H`m` - NYI: Keep the highest `m` dice (default 1). This is done before counting doubles or other distribution checking.",
        default: 1,
    },
    {
        keys: ["L"],
        help: "L`m` - NYI: Keep the lowest `m` dice (default 1). This is done before counting doubles or other distribution checking.",
        default: 1,
    },
    {
        keys: ["h"],
        help: "h`m` - NYI: Remove the lowest `m` dice (default 1). This is done before counting doubles or other distribution checking.",
        default: 1,
    },
    {
        keys: ["l", "c"],
        help: "l`m` or c`m` - NYI: 'Cut': Remove the highest `m` dice (default 1). This is done before counting doubles or other distribution checking.",
        default: 1,
    },
    {
        nyi: true,
        keys: ["d"],
        help: "d`m` - NYI: Make a fuss if there are doubles (by default).",
        default: 1,
    },
];

module.exports.dietypes = [
    {
        keys: ["d"],
        help: "`n`d`s` - Report the total/sum of `n` normal dice of `s` sides each."
    },
    {
        keys: ["b"],
        help: "`n`b`s` - Report how many of `n`d`s` meed the success condition: use <, > or = flags (default >`s`)."
            + " Note that 'd' also supports those flags for compatibility, so this is almost an alias."
    },
    {
        keys: ["h"],
        help: "`n`h`s` - `n` dice, reporting only the highest score."
            + " Note that 3h6c2 reports highest score after cut2, but 3d6c2H1 might not do the flags in the right order."
    },
    {
        keys: ["l"],
        help: "`n`l`s` - `n` dice, reporting only the lowest score."
    },
];

module.exports.commands = [
    //{
    //    keys: ["v", "verbose"],
    //    run: args => doString(args.join(" "), true),
    //    help: "`v <dicestring>` - verbose: return slightly more result information."
    //},
    {
        keys: ["h", "help"],
        run: args => getHelp(false),
        help: "`h` - this help."
    },
    {
        keys: ['roadmap'],
        run: args => getHelp(true),
        help: "`roadmap` - the help, including things that are not yet implemented (NYI)."
    }
];
