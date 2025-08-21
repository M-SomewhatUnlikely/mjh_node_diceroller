var p = require("./src/index.js").parse;

[
    "v 2d6 + 1",
    "v 2d8 - 3d4 + 5",
    "v 2d6x3>5",
    "2r4",
    "v 2h4>2",
    "v 2d6 + 2h6"
 //   "h",
 //   "roadmap"
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