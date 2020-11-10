const express = require('express');
const bodyParser = require('body-parser');

let app = express();

app.use(bodyParser.json());

app.listen(8080, () => {
    console.log("Server started!");
});