const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const redis = require('redis');
const client = redis.createClient();
const uuid = require('uuid');

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
                const token = uuid.v4();
                
                // will act as other user if existing uuid token, however that is unlikely
                client.set(token, row.email, (err) => {
                    if (err) {
                        return res.json({"error": err});
                    }
                });
                res.json({"token": token});
            } else {
                res.json({"error": "Incorrect password."});
            }
        } else {
            res.json({"error": "Email not found."});
        }
    });

    db.close();
});


app.post('/verify_token', (req, res, next) => {
    // token + email
    client.get(req.body.token, (err, email) => {
        if (err) {
            res.json({"error": "A general Redis error occured!"});
        } else if (email && req.body.email == email) {
            res.json({"success": true});
        } else {
            res.json({"success": false});
        }
    })
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