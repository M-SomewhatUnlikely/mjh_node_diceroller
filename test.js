var p = require("./src/index.js").parse;

[
    "2d6 + 1",
    "2d8 - 3d4 + 5",
    "2d6x3v2",
    "2r4"
].forEach(s => {
    console.log(p(s));
});