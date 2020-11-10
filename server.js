const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

let app = express();

app.use(bodyParser.json());

app.post('/create_identity', (req, res, next) => {
    // email, password
    let db = new sqlite3.Database('./id.db', (err) => {
        if (err) {
            console.log(err.message);
        }
        console.log("connected to sqlite db!");
    });

    db.close()
});

app.listen(8080, () => {
    console.log("Server started!");
});

//USE UUID FOR THE TOKEN, store info (user id, claims, etc) in the redis document