const express = require('express');
const redis = require('redis');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github repos</h2>`;
}

async function getRepos(req, res, next) {
    try {
        console.log('Fetching data...');
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        const repos = data.public_repos;
        client.setex(username, 3600, repos);
        res.send(setResponse(username, repos));
    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

function cache(req, res, next) {
    const { username } = req.params;
    client.get(username, (err, data) => {
        if (err) {
            throw err;
        } else {
            if (data !== null) {
                res.send(setResponse(username, data));
            } else {
                next();
            }
        }
    });
}

app.get('/repos/:username', cache, getRepos);

app.listen(PORT, (err) => {
    if (err) {
        throw err;
    } else {
        console.error(`App running on port ${PORT}`);
    }
});