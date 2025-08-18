const express = require("express");
const app = express();

const dice = require("./src/index.js");

app.get("/", (req, res) => {
    if (req.query.str) {
        res.type("text").send(dice.parse(req.query.str));
    }
    else {
        res.type("text").status(400).send("Please provide a query string with 'str' set to your dice query.");
    }
});

const listener = app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${listener.address().port}`)
})