
// const re = /(?<plusminus>[+-]?)((?<diecount>\d*)d(?<diesize>\d+)|(?<constant>\d+)[$^\d])/g

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

const commands = [
    {
        keys: ["v", "verbose"],
        run: args => { return doString(args.join(" "), true); },
        help: "v <dicestring> - verbose: return slightly more result information."
    },
    {
        keys: ["h", "help"],
        run: args => {
            var help = "Usage: normally a dice string (like '2d6 + 3d3 - 12' or whatever."
            help += "\nOptionally, one of the command arguments, which might change the arguments needed:"
            commands.forEach(c => {
                if (c.help) {
                    help += "\n- " + c.help;
                }
            });
            return { summary: help };
        },
        help: "h - this help."
    }
];

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
                    summary: `Dice type ${args[0]} not yet implemented. Tell Matthew.`,
                    error: `Dice type ${args[0]} not yet implemented. Tell Matthew.`,
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