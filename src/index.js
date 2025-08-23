const config = require("./config.js");

const flag_by_key = {};
config.flags.forEach(f => {
    f.keys.forEach(k => {
        flag_by_key[k] = f;
    });
});

var pattern_dicetypes = "";
config.dietypes.forEach(t => {
    t.keys.forEach(k => {
        pattern_dicetypes += k;
    });
});
var pattern_flags = "";
config.flags.forEach(f => {
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
        freq_fuss: "",
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
            var count = parseInt(matches[0].groups["dicecount"]);
            if (!count) {
                count = 1;
            }
            var type = matches[0].groups["dietype"];
            var sides = parseInt(matches[0].groups["dicesides"]);
            var flag_chararray = [...matches[0].groups["flags"]];

            if (!allTypes.includes(type)) {
                allTypes.push(type);
            }

            var rolls = [];

            // Make flag dict:
            var flag_dict = {}
            var current_flag = "";
            var hasTest = false;
            var explosions = false;
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
                    if ("xX".includes(c)) {
                        // Explosion flags
                        explosions = true;
                    }
                    current_flag = c;
                    flag_dict[c] = 0;
                }
            });

            if (type == "b" && !hasTest) {
                // If it's a binomial test but we don't have a condition, set default
                flag_dict[">"] = sides;
            }

            if (explosions) {
                // If explosions are on, set zeros for missing X and x (not s):
                ["x", "X"].forEach(c => {
                    if (!(c in flag_dict)) {
                        flag_dict[c] = 0;
                    }
                });
            }

            // Set defaults for flags with 0 value
            for (const [k, v] of Object.entries(flag_dict)) {
                if (v == 0) {
                    if (flag_by_key[k].default == "s") {
                        flag_dict[k] = sides;
                    } else if (flag_by_key[k].default == "s/2") {
                        flag_dict[k] = math.floor(sides / 2);
                    } else {
                        flag_dict[k] = flag_by_key[k].default;
                    }
                }
                if ("s".includes(k)) {
                    out.warnings.push("Ignoring not yet implemented flag " + k + ". Tell Matthew you need it.");
                }
            }

            var subtotal = 0;
            var i = 0;
            var bonuses = 0;
            var max_bonuses = 0;
            var next_is_bonus = false;
            if (explosions) {
                max_bonuses = flag_dict["X"];
            }
            while (i < count + bonuses && bonuses <= max_bonuses) {
                var r = {
                    roll: randInt(sides),
                    format: "",
                    ignore: false,
                }
                if (next_is_bonus) {
                    r.bonus = true;
                    r.format = "_";
                    next_is_bonus = false;
                }
                if (explosions) {
                    if (r.roll >= flag_dict["x"]) {
/*                        console.log(`Bonus! ${r.roll} >= ${flag_dict["x"]}`);*/
                        // Explosion!
                        bonuses++;
                        next_is_bonus = true;
                    }
                }
                rolls.push(r);
                //console.log(`${i}: r.roll = ${r.roll}, count = ${count}, bonuses = ${bonuses}, c+b = ${count + bonuses}`);
                i++;
            }

            // Keeping and dropping
            var sorted = rolls.map(r => r.roll);
            sorted.sort();
            var ignored = [];

            var toRemove = 0;
            // H - remove lowest n-m
            if ("H" in flag_dict) {
                toRemove = count - flag_dict["H"];
                if (toRemove >= sorted.length) {
                    out.warnings.push("Ignoring flag H" + flag_dict["H"] + " because it would remove all the dice.");
                } else {
                    ignored = sorted.slice(0, toRemove);
                    sorted = sorted.slice(toRemove);
                }
            }
            // h - remove lowest m
            if ("h" in flag_dict) {
                toRemove = flag_dict["h"];
                if (toRemove >= sorted.length) {
                    out.warnings.push("Ignoring flag h" + flag_dict["h"] + " because it would remove all the dice.");
                } else {
                    ignored = sorted.slice(0, toRemove);
                    sorted = sorted.slice(toRemove);
                }
            }
            // L - remove highest n-m
            if ("L" in flag_dict) {
                toRemove = count - flag_dict["L"];
                if (toRemove >= sorted.length) {
                    out.warnings.push("Ignoring flag L" + flag_dict["L"] + " because it would remove all the dice.");
                } else {
                    ignored = sorted.slice(-toRemove);
                    sorted = sorted.slice(0, -toRemove);
                }
            }
            // l, c - remove highest m
            if ("l" in flag_dict) {
                toRemove = flag_dict["l"];
                if (toRemove >= sorted.length) {
                    out.warnings.push("Ignoring flag l" + flag_dict["l"] + " because it would remove all the dice.");
                } else {
                    ignored = sorted.slice(-toRemove);
                    sorted = sorted.slice(0, -toRemove);
                }
            }
            // l, c - remove highest m
            if ("c" in flag_dict) {
                toRemove = flag_dict["c"];
                if ("l" in flag_dict) {
                    out.warnings.push("Ignoring flag c because you've also used l and they're aliases. Please use one or the other.");
                } else if (toRemove >= sorted.length) {
                    out.warnings.push("Ignoring flag c" + flag_dict["c"] + " because it would remove all the dice.");
                } else {
                    ignored = sorted.slice(-toRemove);
                    sorted = sorted.slice(0, -toRemove);
                }
            }

            if (ignored.length > 0) {
                rolls.forEach(r => {
                    if (ignored.includes(r.roll)) {
                        r.ignore = true;
                        r.format = "~~";
                        ignored.splice(ignored.indexOf(r.roll), 1);
                    }
                });
            }


            // Counting frequency
            if ("d" in flag_dict) {
                var freq = {};
                var max_freq = 0;
                rolls.forEach(r => {
                    if (!r.ignore) {
                        if (!(r.roll in freq)) {
                            freq[r.roll] = 0;
                        }
                        freq[r.roll]++;
                        if (freq[r.roll] > max_freq) {
                            max_freq = freq[r.roll];
                        }
                    }
                });
                console.log(freq);
                switch (max_freq) {
                    case 1:
                        break;
                    case 2:
                        out.freq_fuss = "with a double";
                        break;
                    case 3:
                        out.freq_fuss = "with a triple";
                        break;
                    default:
                        out.freq_fuss = "with a set of " + max_freq;
                        break;
                }
            }


            // Big switch for dice types
            switch (type) {
                case "d":
                    rolls.forEach(r => {
                        if (!r.ignore) {
                            if (sign == "+") {
                                subtotal += parseInt(r.roll);
                            } else {
                                subtotal -= r.roll;
                            }
                        }
                    });
                    break;
                case "b":
                    out.result
                    rolls.forEach(r => {
                        if (!r.ignore) {
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
                        }
                    });
                    break;
                case "h":
                    // TODO: Make h and l respect sign
                    rolls.forEach(r => {
                        if (!r.ignore && r.roll > subtotal) { subtotal = r.roll; }
                    });
                    rolls.forEach(r => {
                        if (!r.ignore && r.roll == subtotal) {
                            r.format = "**";
                        }
                    });
                    break;
                case "l":
                    rolls.forEach(r => {
                        if (!r.ignore && r.roll < subtotal) { subtotal = r.roll; }
                    });
                    rolls.forEach(r => {
                        if (!r.ignore && r.roll == subtotal) {
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
                signedInt(subtotal)
                + (type == "b" ? " success" + plurales(subtotal) : "")
                + (out.freq_fuss ? " " + out.freq_fuss : "")
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
    for (const t of config.commands) {
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
    return doString(args.join(" "), true);
}

module.exports = {
    parse: parse
};