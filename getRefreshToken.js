//Libraries
const request = require('request');
const btoa = require('btoa');
const config = require('./config.json');

const colors = {
    red: "\x1b[31m%s\x1b[0m",
    purple: "\x1b[35m%s\x1b[0m",
    green: "\x1b[32m%s\x1b[0m"
}

console.log(colors.purple, "Aquireing Refresh Token...");
var headers = {
    'Authorization': 'Basic ' + btoa(`${config.spotify.client_id}:${config.spotify.client_secret}`),
    "Content-Type": "application/x-www-form-urlencoded",
};
    
var options = {
    url: `https://accounts.spotify.com/api/token`,
    method: "POST",
    body: `grant_type=authorization_code&code=${config.spotify.authorizationCode}&redirect_uri=https://spotify.com`,
    headers: headers,
};

request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        refreshToken = JSON.parse(body).refresh_token;
        console.log(colors.green, `Successfully aquired Refresh Token!\n${refreshToken}`);
    } else {
        return console.log(colors.red, `An error occured while renewing Access Token.\n${body}`);
    }
});
