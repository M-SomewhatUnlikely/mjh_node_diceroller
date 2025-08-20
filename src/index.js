const flags = [
    {
        nyi: true,
        keys: [">"],
        help: ">`m` - NYI: Turns the dice into a success test, returning the number"
            + " of dice that are at least (**not** strictly greater than) `m` (default max)."
    },
    {
        nyi: true,
        keys: ["<"],
        help: "<`m` - NYI: Turns the dice into a success test, returning the number"
            + " of dice that are at most (**not** strictly less than) `m` (default 1)."
    },
    {
        nyi: true,
        keys: ["="],
        help: "=`m` - NYI: Turns the dice into a success test, returning the number"
            + " of dice that are equal to `m` (default max)."
    },
    {
        nyi: true,
        keys: ["x"],
        help: "x`m` - NYI: Dice explode, adding an extra die for each max score. Limited to `m` bonus per die (default 0 = no limit)."
    },
    {
        nyi: true,
        keys: ["X"],
        help: "X`m` - NYI: Dice explode, adding an extra die for each score of `m` or more (default max)."
            + " Combine X and x to specify the explosion threshold and a limit, respectively."
    },
    {
        nyi: true,
        keys: ["H"],
        help: "H`m` - NYI: Keep the highest `m` dice (default 1). This is done before counting doubles or other distribution checking."
    },
    {
        nyi: true,
        keys: ["L"],
        help: "L`m` - NYI: Keep the lowest `m` dice (default 1). This is done before counting doubles or other distribution checking."
    },
    {
        nyi: true,
        keys: ["h"],
        help: "h`m` - NYI: Remove the lowest `m` dice (default 1). This is done before counting doubles or other distribution checking."
    },
    {
        nyi: true,
        keys: ["l", "c"],
        help: "l`m` or c`m` - NYI: 'Cut': Remove the highest `m` dice (default 1). This is done before counting doubles or other distribution checking."
    },
    {
        nyi: true,
        keys: ["d"],
        help: "d`m` - NYI: Make a fuss if there are doubles (by default)."
    },
];

const dietypes = [
    {
        keys: ["d"],
        help: "`n`d`s` - Report the total/sum of `n` normal dice of `s` sides each."
    },
    {
        nyi: true,
        keys: ["b"],
        help: "`n`b`s` - Report how many of `n`d`s` meed the success condition: use <, > or = flags (default >`s`)."
            + " Note that 'd' also supports those flags for compatibility, so this is almost an alias."
    },
    {
        nyi: true,
        keys: ["h"],
        help: "`n`h`s` - `n` dice, reporting only the highest score."
            + " Note that 3h6c2 reports highest score after cut2, but 3d6c2H1 might not do the flags in the right order."
    },
    {
        nyi: true,
        keys: ["l"],
        help: "`n`l`s` - `n` dice, reporting only the lowest score."
    },
];

const commands = [
    {
        keys: ["v", "verbose"],
        run: args => doString(args.join(" "), true),
        help: "`v <dicestring>` - verbose: return slightly more result information."
    },
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

const re_constant = /^\d$/g;
const re_diceterm = /^(?<dicecount>\d*)d(?<dicesides>\d+)(?<flags>(\w\d*)*)$/g;

function randInt(inclusiveMax) {
    return Math.floor(Math.random() * inclusiveMax) + 1;
}
function signedInt(i) {
    return i < 0 ? i : "+" + i;
}

function doString(input, verbose) {
    // Strip whitespace
    var str = input.replace(/\s/g, "");

    if (!"+-".includes(str[0])) {
        // First character is not + or -
        str = "+" + str
    }

    // insert a space before each +
    str = str.split("+").join(" +");
    // or -
    str = str.split("-").join(" -");
    str = str.trim();

    // Finally split on space
    var terms = str.split(" ");

    var out = {
        summary: "",
        input: input,
        total: 0,
        errors: [],
        warnings: [],
        //       term_split: terms,
        terms: []
    }

    terms.forEach(t => {
        var sign = t[0];
        var core = t.substring(1);

        var matches = [...core.matchAll(re_diceterm)];

        if (re_constant.exec(core)) {
            // Constant
            out.terms.push(sign + core);
            if (sign == "+") {
                out.total += parseInt(core);
            } else {
                out.total -= parseInt(core);
            }
        } else if (matches.length > 0) {
            var count = matches[0].groups["dicecount"];
            var sides = matches[0].groups["dicesides"];
            var flag_chararray = matches[0].groups["flags"].split();

            var rolls = [];

            // Process flags:
            var flags = {}
            var current_flag = "";
            flag_chararray.forEach(c => {
                // TODO: Flags
            });

            var subtotal = 0;
            for (var i = 0; i < count; i++) {
                var roll = randInt(sides);
                rolls.push(roll);

                if (sign == "+") {
                    subtotal += roll;
                } else {
                    subtotal -= roll;
                }
            }
            out.terms.push(
                sign + count + "d" + sides
                + " (" + signedInt(subtotal)
                + (verbose
                    ? ": [" + rolls.join(",") + "]"
                    : "")
                + ")"

            );
            out.total += subtotal;
        } else {
            // No regex match
            out.errors.push("Ignoring term " + t
                + ", which did not match the pattern for a constant or dice term");
        }
    });

    out.summary = `Rolled ${out.total} on ${out.terms.join(" ")}.`;

    return out;
}

function getHelp(roadmap) {
    var help = [];
    var s = "Usage: `!roll` or `!r`, normally a dice string (like '2d6 + 3d3 - 12')."
    s += "\n\nOptionally, one of the command arguments, which might change the arguments needed:"
    commands.forEach(c => {
        if (c.help && (!c.nyi || roadmap)) {
            s += "\n- " + c.help;
        }
    });
    help.push(s);
    var s = "Dice string terms can be constant numbers, or `n`[d]`s` for one of the following letters:"
    dietypes.forEach(c => {
        if (c.help && (!c.nyi || roadmap)) {
            s += "\n- " + c.help;
        }
    });
    help.push(s);
    var s = "Dice terms may be followed by one or more flags, like `n`d`s`f2, with or without the number:"
    flags.forEach(c => {
        if (c.help && (!c.nyi || roadmap)) {
            s += "\n- " + c.help;
        }
    });
    help.push(s);
    return { help: help };
}

function parse(input) {
    var args = input.trim().split(" ");

    // Check the first argument against the flags of all the commands
    for (const t of commands) {
        if (t.keys.includes(args[0])) {
            if (t.run) {
                return t.run(args.slice(1));
            }
            else {
                return {
                    summary: `Command ${args[0]} not yet implemented. Tell Matthew.`,
                    error: `Command ${args[0]} not yet implemented. Tell Matthew.`,
                };
            }
        }
    }
    // None of the types matched the first argument: try the whole string
    return doString(args.join(" "), false);
}

module.exports = {
    parse: parse
};