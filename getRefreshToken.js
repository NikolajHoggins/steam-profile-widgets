const request = require('request');
const btoa = require('btoa');
const express = require('express');
const app = express();
const fs = require('fs');
const open = require('open');
const config = require("./config.json");

const colors = {
  red: "\x1b[31m%s\x1b[0m",
  green: "\x1b[32m%s\x1b[0m",
  yellow: "\x1b[33m%s\x1b[0m"
}

if(!config.spotify.client_id || !config.spotify.client_secret){open("https://developer.spotify.com/dashboard/");return console.log(colors.red,"client_id or client_secret is missing. Please create an application on the Spotify Developers page and enter the values in the config.json file.");}

app.get("/", (req, res) => {
  var headers = {
      'Authorization': 'Basic ' + btoa(`${config.spotify.client_id}:${config.spotify.client_secret}`),
      "Content-Type": "application/x-www-form-urlencoded",
  };

  var options = {
      url: `https://accounts.spotify.com/api/token`,
      method: "POST",
      body: `grant_type=authorization_code&code=${req.query.code}&redirect_uri=http://localhost:1337`,
      headers: headers,
  };

  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          refreshToken = JSON.parse(body).refresh_token;
          res.send(`<body bgcolor="#130f40"><div style="color:#4bcffa;font-family:system-ui;line-height:25px;"><h1>Successfully aquired Refresh Token and updated config.json</h1>You can now close this window and run index.js<br>Automatically closing page in <span id="countdown">10</span>...</div><script>var cd=document.getElementById("countdown");var count=10;setInterval(()=>{if (count<1) return;count--; cd.innerHTML=count;if(count==0){window.open('','_parent','');window.close();}},1000);</script></body>`);
          config.spotify.refreshToken = refreshToken;
          fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
          console.log(colors.green, "Successfully aquired Refresh Token and updated config.json\nYou can now close this window and run index.js\nAutomatically closing window in 10 seconds");
          setTimeout(() => {
            process.exit();
          }, 10000);
      } else {
          res.send(`An error occured while acquiring Refresh Token.\n${body}`);
          return console.log(colors.red, `An error occured while acquiring Refresh Token.\n${body}`);
      }
  });
});

app.listen(1337, () =>  {
  console.log(colors.yellow, "Grant access to the application in your browser to get your Refresh Token");
  open(`https://accounts.spotify.com/authorize?client_id=${config.spotify.client_id}&response_type=code&redirect_uri=http://localhost:1337&scope=user-read-playback-state`);
})