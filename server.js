const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

let app = express();

// middleware //

app.use(bodyParser.json());

// routes //

app.post('/create_identity', (req, res, next) => {
    // email, password
    let db = new sqlite3.Database('./id.db');
    // store plaintext pw for now lol
    const sql = 'insert into Users(email, password) values (?, ?)';

    db.run(sql, [req.body.email, req.body.password], (err) => {
        if (err) {
            let error = "A general SQL error occured!";
            if (err.code == 'SQLITE_CONSTRAINT') {
                error = "Email already exists!";
            }
            return res.json({"error": error});
        } else {
            res.json({success: true});
        }
    });

    db.close()
});

app.post('/create_token', (req, res, next) => {
    // email, password
    let db = new sqlite3.Database('./id.db');
    const sql = `select email, password
                from Users
                where email = ?`;
    
    db.get(sql, [req.body.email], (err, row) => {
        if (err) {
            res.json({"error": "A general SQL error occured!"});
        } else if (row) {
            if (row.password == req.body.password) {
                res.json({"token": "abc123"});
            } else {
                res.json({"error": "Incorrect password."});
            }
        } else {
            res.json({"error": "Email not found."});
        }
    });

    db.close();
});

// sqlite3 db table setup //

let db = new sqlite3.Database('./id.db');
const sql = `
CREATE TABLE IF NOT EXISTS Users (
    email       text,
    password    text,
    primary key (email)
)`;
db.run(sql);
db.close

// server start //

app.listen(8080, () => {
    console.log("Server started!");
});

//USE UUID FOR THE TOKEN, store info (user id, claims, etc) in the redis document