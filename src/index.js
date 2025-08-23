const flags = [
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
        nyi: true,
        keys: ["H"],
        help: "H`m` - NYI: Keep the highest `m` dice (default 1). This is done before counting doubles or other distribution checking.",
        default: 1,
    },
    {
        nyi: true,
        keys: ["L"],
        help: "L`m` - NYI: Keep the lowest `m` dice (default 1). This is done before counting doubles or other distribution checking.",
        default: 1,
    },
    {
        nyi: true,
        keys: ["h"],
        help: "h`m` - NYI: Remove the lowest `m` dice (default 1). This is done before counting doubles or other distribution checking.",
        default: 1,
    },
    {
        nyi: true,
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

const flag_by_key = {};
flags.forEach(f => {
    f.keys.forEach(k => {
        flag_by_key[k] = f;
    });
});

const dietypes = [
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

var pattern_dicetypes = "";
dietypes.forEach(t => {
    t.keys.forEach(k => {
        pattern_dicetypes += k;
    });
});
var pattern_flags = "";
flags.forEach(f => {
    f.keys.forEach(k => {
        pattern_flags += k;
    });
});

const re_constant = new RegExp("^\\d$", "g");
const re_diceterm = new RegExp("^(?<dicecount>\\d*)(?<dietype>[" + pattern_dicetypes + "])(?<dicesides>\\d+)(?<flags>([><=\\w]\\d*)*)$", "g");

function randInt(inclusiveMax) {
    return Math.floor(Math.random() * inclusiveMax) + 1;
}
function signedInt(i) {
    return i < 0 ? i : "+" + i;
}
function plurals(i) {
    return i != 1 ? "s" : "";
}
function plurales(i) {
    return i != 1 ? "es" : "";
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
        terms: [],
    }

    var allTypes = [];

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
            var type = matches[0].groups["dietype"];
            var sides = matches[0].groups["dicesides"];
            var flag_chararray = [...matches[0].groups["flags"]];

            if (!allTypes.includes(type)) {
                allTypes.push(type);
            }

            var rolls = [];

            // Make flag dict:
            var flag_dict = {}
            var current_flag = "";
            var hasTest = false;
            flag_chararray.forEach(c => {
                if (current_flag) {
                    // There is a flag being considered already
                    var thisInt = parseInt(c);
                    if (String(thisInt) == c) {
                        // c is an int digit
                        // To respect an existing digit, t = 10t + c
                        flag_dict[current_flag] *= 10;
                        flag_dict[current_flag] += thisInt;

                        // This character is done and we're in an anonymous function
                        return;
                    }
                }
                // No current flag, or current flag and not an int
                if (c && pattern_flags.includes(c)) {
                    // This character is a new flag
                    if ("<>=".includes(c)) {
                        // Binomial test flags
                        if (type == "d") { type = "b"; }
                        if (type != "b") {
                            out.errors.push("Ignoring " + c + " on "
                                + sign + core + " because it's incompatible with " + type);
                            // Exit the anonymous function early to ignore this character
                            return;
                        }
                        hasTest = true;
                    }
                    current_flag = c;
                    flag_dict[c] = 0;
                }
            });

            if (type == "b" && !hasTest) {
                // If it's a binomial test but we don't have a condition, set default
                flag_dict[">"] = size;
            }

            // Set defaults for flags with 0 value
            for (const [k, v] of Object.entries(flag_dict)) {
                if (v == 0) {
                    if (flag_by_key[k].default == "s") {
                        flag_dict[k] = size;
                    } else {
                        flag_dict[k] = flag_by_key[k].default;
                    }
                }
                if ("HLhldx".includes(k)) {
                    out.warnings.push("Ignoring not yet implemented flag " + k + ". Tell Matthew you need it.");
                }
            }

            var subtotal = 0;
            for (var i = 0; i < count; i++) {
                rolls.push({
                    roll: randInt(sides),
                    format: "",
                });
            }

            switch (type) {
                case "d":
                    rolls.forEach(r => {
                        if (sign == "+") {
                            subtotal += parseInt(r.roll);
                        } else {
                            subtotal -= r.roll;
                        }
                    });
                    break;
                case "b":
                    out.result
                    rolls.forEach(r => {
                        if (">" in flag_dict) {
                            // If we're checking at least
                            if (r.roll >= flag_dict[">"]) {
                                r.format = "**";
                                subtotal++;
                            }
                            if ("<" in flag_dict && r.roll <= flag_dict["<"]) {
                                // If we're _also_ checking at most, penalise
                                r.format = "~~";
                                subtotal--;
                            }
                        } else {
                            // not checking >
                            if ("<" in flag_dict && r.roll <= flag_dict["<"]) {
                                // So credit < positively
                                r.format = "**";
                                subtotal++;
                            }
                        }
                        // In either case, credit =
                        if ("=" in flag_dict && r.roll == flag_dict["="]) {
                            r.format = "**";
                            subtotal++;
                        }
                    });
                    break;
                case "h":
                    // TODO: Make h and l respect sign
                    rolls.forEach(r => {
                        if (r.roll > subtotal) { subtotal = r.roll; }
                    });
                    rolls.forEach(r => {
                        if (r.roll == subtotal) {
                            r.format = "**";
                        }
                    });
                    break;
                case "l":
                    rolls.forEach(r => {
                        if (r.roll < subtotal) { subtotal = r.roll; }
                    });
                    rolls.forEach(r => {
                        if (r.roll == subtotal) {
                            r.format = "**";
                        }
                    });
                    break;
                default:
                    out.warnings.push("Ignoring " + type + " term, because it's not yet implemented. Tell Matthew you need it.");
            }

            tmp_flags = "";
            for (const [k, v] of Object.entries(flag_dict)) {
                tmp_flags += k + v;
            }

            out.terms.push(
                signedInt(subtotal) + (type == "b" ? " success" + plurales(subtotal) : "")
                + " (" + sign + count + type + sides + tmp_flags
                + (verbose
                    ? ": [" + rolls.map(r => r.format + r.roll + r.format).join(",") + "]"
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

    if (allTypes.length > 1) {
        out.warnings.push(`You have a mixture of die types (${allTypes.join("")}). This is unusual, because they don't normally add.`);
    }

    out.summary = `**${out.total}**: ${out.terms.join(" ")}`;
    out.errors.forEach(e => {
        out.summary += "\nError: " + e;
    })
    out.warnings.forEach(w => {
        out.summary += "\nWarning: " + w;
    })

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