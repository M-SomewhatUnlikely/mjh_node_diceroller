var p = require("./src/index.js").parse;

[
    "2d6 + 1",
    "2d8 - 3d4 + 5",
    "2d6x3>5",
    "2r4",
    "5h6c2",
    "2d6 + 2h6",
    "4d6H3",
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
    console.log("\n");
});