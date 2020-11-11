const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const redis = require('redis');
const client = redis.createClient();
const uuid = require('uuid');
const argon2 = require('argon2');

let app = express();

// middleware //

app.use(bodyParser.json());

var checkSecrets = (req, res, next) => {
    if (req.body.secret == process.env.SECRET) {
        next();
    } else {
        return res.status(401).json({"error": "Secret is incorrect."});
    }
};

// routes //

app.post('/create_identity', checkSecrets, (req, res, next) => {
    // email, password
    let db = new sqlite3.Database('./id.db');
    const sql = 'insert into Users(email, password) values (?, ?)';

	// use default hashing parameters
	const password = await argon2.hash(req.body.password);

    db.run(sql, [req.body.email, password] (err) => {
        if (err) {
            let error = "A general SQL error occured!";
            if (err.code == 'SQLITE_CONSTRAINT') {
                error = "Email already exists!";
            }
            return res.status(409).json({"error": error});
        } else {
            res.json({success: true});
        }
    });

    db.close()
});

app.post('/create_token', checkSecrets, (req, res, next) => {
    // email, password
    let db = new sqlite3.Database('./id.db');
    const sql = `select email, password
                from Users
                where email = ?`;
    
    db.get(sql, [req.body.email], (err, row) => {
        if (err) {
            res.status(503).json({"error": "A general SQL error occured!"});
        } else if (row) {
            if (await argon2.verify(row.password, req.body.password)) {
                const token = uuid.v4();
                
                // will act as other user if existing uuid token, however that is unlikely
                client.set(token, row.email, (err) => {
                    if (err) {
                        return res.status(503).json({"error": err});
                    }
                });
                res.json({"token": token});
            } else {
                res.status(401).json({"error": "Incorrect password."});
            }
        } else {
            res.status(401).json({"error": "Email not found."});
        }
    });

    db.close();
});


app.post('/verify_token', (req, res, next) => {
    // token
    client.get(req.body.token, (err, email) => {
        if (err) {
            res.status(503).json({"error": "A general Redis error occured!"});
            // hmm should i also pass in email in API to check if the email associated with is correct
        } else if (email) {
            res.json({"success": true});
        } else {
            res.status(401).json({"success": false});
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
