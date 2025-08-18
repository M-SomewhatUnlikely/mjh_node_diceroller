
// const re = /(?<plusminus>[+-]?)((?<diecount>\d*)d(?<diesize>\d+)|(?<constant>\d+)[$^\d])/g

const re_constant = /^\d$/g;
const re_diceterm = /^(?<dicecount>\d*)d(?<dicesides>\d+)(?<flags>(\w\d*)*)$/g;

function randInt(inclusiveMax) {
    return Math.floor(Math.random() * inclusiveMax) + 1;
}
function signedInt(i) {
    return i < 0 ? i : "+" + i;
}

function parse(input) {
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

    //    terms = terms.filter(s => s.length > 0);

    // console.log(terms);

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
            // console.log(matches[0]);

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
            //                out.terms.push(sign + core);
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
                + " [" + rolls.join(",") + "]: "
                + signedInt(subtotal)
            );
            out.total += subtotal;
        } else {
            // No regex match
            out.errors.push("Ignoring term " + t
                + ", which did not match the pattern for a constant or dice term");
        }
    });

    out.summary = `Got {total} on {input}`;

    return out;
}

module.exports = {
    parse: parse
};