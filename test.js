var p = require("./src/index.js").parse;

[
    "2d6 + 1",
    "v 2d8 - 3d4 + 5",
    "2d6x3v2",
    "2r4",
    "h"
].forEach(s => {
    const data = p(s);
    console.log("\n === s = " + s);
    if (data.summary) {
        console.log("\n" + data.summary);
    }
    if (data.help) {
        console.log("\n" + data.help);
    }
});