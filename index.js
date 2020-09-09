//Libraries
const SteamUser = require("steam-user");
const SteamTotp = require("steam-totp");
const request = require("request");
const btoa = require("btoa");
const client = new SteamUser();
const dotenv = require("dotenv");
const config = require("./config.json");

dotenv.config();

const colors = {
  red: "\x1b[31m%s\x1b[0m",
  purple: "\x1b[35m%s\x1b[0m",
  green: "\x1b[32m%s\x1b[0m",
};

//Account Credentials
const logOnOptions = {
  accountName: process.env.STEAM_ACCOUNT_NAME || "user",
  password: process.env.STEAM_ACCOUNT_PASS || "pass",
  twoFactorCode: SteamTotp.generateAuthCode(
    process.env.STEAM_ACCOUNT_SHARED_SECRET || "secret"
  ),
};

function renewOAuth() {
  console.log(colors.purple, "Aquireing Access Token...");
  var refreshHeaders = {
    Authorization:
      "Basic " +
      btoa(
        `${process.env.SPOTIFY_CLIENT_ID || "id"}:${
          process.env.SPOTIFY_CLIENT_SECRET || "secret"
        }`
      ),
    "Content-Type": "application/x-www-form-urlencoded",
  };

  var refreshOptions = {
    url: `https://accounts.spotify.com/api/token`,
    method: "POST",
    body: `grant_type=refresh_token&refresh_token=${
      process.env.SPOTIFY_REFRESH_TOKEN || "token"
    }`,
    headers: refreshHeaders,
  };
  request(refreshOptions, function (
    refreshError,
    refreshResponse,
    refreshBody
  ) {
    if (!refreshError && refreshResponse.statusCode == 200) {
      accessToken = JSON.parse(refreshBody).access_token;
      console.log(
        colors.green,
        `Successfully aquired Access Token! (${accessToken})`
      );
      return logOnSteam(accessToken);
    } else {
      return console.log(
        colors.red,
        "An error occured while renewing Access Token. Please aquire a new Refresh Token and try again."
      );
    }
  });
}

function logOnSteam(accessToken) {
  //Login
  client.logOn(logOnOptions);
  console.log(colors.purple, "Attempting to login to Steam...");
  client.on("loggedOn", () => {
    console.log(colors.green, "Successfully logged into Steam!");
  });

  //Login Error
  client.on("error", function (e) {
    return console.log(colors.red, `Failed to login: ${e.toString()}`);
  });

  //Get webSession (sessionID & Cookies) and initiate main function
  client.on("webSession", function (sessionID, cookies) {
    console.log(colors.green, "Successfully acquired sessionID and Cookies!");
    updateSpotify(sessionID, cookies);
    setInterval(() => {
      updateSpotify(sessionID, cookies);
    }, 30000);
  });

  var progressBar = [
    "◯▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬◯▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬◯▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬◯▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬◯▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬◯▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬◯▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬◯▬▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬◯▬▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬◯▬▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬◯▬▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬◯▬▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬◯▬▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬▬◯▬▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬◯▬▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬◯▬▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬◯▬▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬◯▬▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬◯▬",
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬◯",
  ];

  function updateSpotify(sessionID, cookies) {
    try {
      var spotifyHeaders = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
      };

      var spotifyOptions = {
        url: `https://api.spotify.com/v1/me/player/currently-playing`,
        method: "GET",
        headers: spotifyHeaders,
      };
      request(spotifyOptions, function (
        spotifyError,
        spotifyResponse,
        spotifyBody
      ) {
        try {
          data = JSON.parse(spotifyBody);
        } catch (error) {
          //dø
        }
        if (!spotifyError && spotifyResponse.statusCode == 200) {
          try {
            steamBoxString = `[b]Currently listning to Spotify:[/b]\n[url=${
              data.item.external_urls.spotify
            }]${data.item.artists[0].name} - ${data.item.name}[/url]\n${
              data.is_playing ? "▶" : "❚❚"
            } ${secondsToMinutesSeconds(
              (Number(data.progress_ms) / 1000).toFixed(0)
            )} / ${secondsToMinutesSeconds(
              (Number(data.item.duration_ms) / 1000).toFixed(0)
            )} ${
              progressBar[
                Math.floor(
                  ((Number(data.progress_ms) / 1000).toFixed(0) /
                    (Number(data.item.duration_ms) / 1000).toFixed(0)) *
                    20
                )
              ]
            }`;
          } catch (e) {
            steamBoxString = `Currently not listening to Spotify.`;
          }
        } else if (spotifyResponse.statusCode == 401) {
          renewOAuth();
          return console.log(
            colors.red,
            "OAuth token has expired. Renewing..."
          );
        } else {
          steamBoxString = `Currently not listening to Spotify.`;
        }

        var steamHeaders = {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
        };
        var steamOptions = {
          url: `https://steamcommunity.com/profiles/${
            process.env.STEAM_64 || "id"
          }/edit`,
          method: "POST",
          headers: steamHeaders,
          body: config.profileData
            .replace("SESID", sessionID)
            .replace("SPOTIFYSTATUS", steamBoxString.replace(/&/g, "%26")),
          gzip: true,
        };

        function secondsToMinutesSeconds(d) {
          var minutes = Math.floor((d % 3600) / 60);
          var seconds = Math.floor((d % 3600) % 60);
          if (seconds <= 9) seconds = "0" + seconds;
          return minutes + ":" + seconds;
        }
        d = new Date();
        time = d.toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        });
        request(steamOptions, function (steamError, steamResponse, steamBody) {
          if (!steamError && steamResponse.statusCode == 200) {
            if (JSON.parse(steamBody).success == "1") {
              console.log(
                colors.green,
                `[${time}] Showcase updated. [${
                  data.item
                    ? `${data.item.artists[0].name} - ${data.item.name}`
                    : "Ad break"
                }]`
              );
            } else {
              console.log(
                colors.red,
                `[${time}] Failed to update showcase. Please check your profileData.`
              );
            }
          } else {
            console.log(
              colors.red,
              `[${time}] Failed to load showcase status. Status code: ${steamResponse.statusCode}`
            );
          }
        });
      });
    } catch (e) {
      console.log(colors.red, `An error occured: ${e}`);
    }
  }
}

renewOAuth();
