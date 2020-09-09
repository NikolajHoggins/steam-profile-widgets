//Libraries
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const request = require('request');
const btoa = require('btoa');
const client = new SteamUser();
const config = require('./config.json');

const colors = {
    red: "\x1b[31m%s\x1b[0m",
    purple: "\x1b[35m%s\x1b[0m",
    green: "\x1b[32m%s\x1b[0m",
    cyan: "\x1b[36m%s\x1b[0m",
    yellow: "\x1b[33m%s\x1b[0m"
}

//Account Credentials
const logOnOptions = {
  accountName: config.steamAccount.username,
  password: config.steamAccount.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.steamAccount.sharedSecret)
};


console.log("\x1b[36m%s\x1b[0m", "Spotify Widget for Steam Community Profiles\nMade by Tsukani/zyN & Hoggins\nMake sure to read through the documentation first to ensure everything is set up correctly!\n");
console.log("\x1b[33m%s\x1b[0m", `Updating showcase every ${config.updateDelay} second${config.updateDelay == 1 ? "" : "s"}.`);
if (!config.steamAccount.sharedSecret) console.log("\x1b[31m%s\x1b[0m", "Including your sharedSecret is recommended to avoid unexpected problems regarding Steam sessions and the script stopping unexpectedly.");

function renewAccessToken() {
    console.log(colors.purple, "Aquireing Access Token...");
    var refreshHeaders = {
        'Authorization': 'Basic ' + btoa(`${config.spotify.client_id}:${config.spotify.client_secret}`),
        "Content-Type": "application/x-www-form-urlencoded",
    };
    
    var refreshOptions = {
        url: `https://accounts.spotify.com/api/token`,
        method: "POST",
        body: `grant_type=refresh_token&refresh_token=${config.spotify.refreshToken}`,
        headers: refreshHeaders,
    };
    request(refreshOptions, function (refreshError, refreshResponse, refreshBody) {
        if (!refreshError && refreshResponse.statusCode == 200) {
            accessToken = JSON.parse(refreshBody).access_token;
            console.log(colors.green, `Successfully aquired Access Token! (${accessToken})`);
            if (!client._sessionID) logOnSteam();
            return;
        } else {
            return console.log(colors.red, "An error occured while renewing Access Token. Please aquire a new Refresh Token and try again.");
        }
    });
}

function logOnSteam() {
    //Login
    client.logOn(logOnOptions);
    console.log(colors.purple, "Attempting to login to Steam...");
    client.on("loggedOn", () => {
        console.log(colors.green, "Successfully logged into Steam!");
    });

    //Login Error
    client.on('error', function(e) {
        return console.log(colors.red, `Failed to login: ${e.toString()}`);
    });

    //Get webSession (sessionID & Cookies) and initiate main function
    client.on("webSession", function(sessionID, cookies) {
        console.log(colors.green, "Successfully acquired sessionID and Cookies!");
        updateSpotify(sessionID, cookies);
        setInterval(() => {
            updateSpotify(sessionID, cookies);
        }, Number(config.updateDelay*1000));  
    });
}

function updateSpotify(sessionID, cookies) {
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
        "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬◯"
    ];

    try {
        var spotifyHeaders = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${accessToken}` 
        };

        var spotifyOptions = {
            url: `https://api.spotify.com/v1/me/player/currently-playing`,
            method: "GET",
            headers: spotifyHeaders
        };
        request(spotifyOptions, function (spotifyError, spotifyResponse, spotifyBody) {
            if (!spotifyBody) {
                config.displayNotPlaying ? steamBoxString = 'Currently not listening to Spotify.' : steamBoxString = '';
            } else {
                data = JSON.parse(spotifyBody);
                if (!spotifyError && spotifyResponse.statusCode == 200) {
                    try {
                        steamBoxString = `[b]Currently listning to Spotify:[/b]\n[url=${data.item.external_urls.spotify}]${data.item.artists[0].name} - ${data.item.name}[/url]\n${data.is_playing ? "▶" : "❚❚"} ${secondsToMinutesSeconds((Number(data.progress_ms)/1000).toFixed(0))} / ${secondsToMinutesSeconds((Number(data.item.duration_ms)/1000).toFixed(0))} ${progressBar[Math.floor(((Number(data.progress_ms)/1000).toFixed(0)/(Number(data.item.duration_ms)/1000).toFixed(0))*20)]}${config.displayUpdateInformation ? `\n(Updating every ${config.updateDelay} seconds)` : ""}`;
                    } catch(e){
                        config.displayNotPlaying ? steamBoxString = 'Currently not listening to Spotify.' : steamBoxString = '';
                    }        
                } else if (spotifyResponse.statusCode == 401) {
                    console.log(colors.red, "Access Token has expired. Renewing...");
                    return renewAccessToken();
                } else {
                    config.displayNotPlaying ? steamBoxString = 'Currently not listening to Spotify.' : steamBoxString = '';
                }
            }

            var steamHeaders = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cookie": cookies
            };

            var steamOptions = {
                url: `https://steamcommunity.com/profiles/${config.steamAccount.steamID64}/edit`,
                method: "POST",
                headers: steamHeaders,
                body: config.steamAccount.profileData.replace("SESID", sessionID).replace("SPOTIFYSTATUS", steamBoxString.replace(/&/g, '%26')),
                gzip: true
            };
                
            function secondsToMinutesSeconds(d) {
                var minutes = Math.floor(d % 3600 / 60);
                var seconds = Math.floor(d % 3600 % 60);
                if (seconds <= 9) seconds = "0" + seconds;
                return minutes + ":" + seconds;
            }
            d = new Date();
            time = d.toLocaleString("en-US", {hour: "numeric", minute: "numeric", second: "numeric"});
            request(steamOptions, function (steamError, steamResponse, steamBody) {
                if (!steamError && steamResponse.statusCode == 200) {
                    if (JSON.parse(steamBody).success == "1") {
                        if (spotifyBody) {console.log(colors.green, `[${time}] Showcase updated. [${data.item ? `${data.item.artists[0].name} - ${data.item.name}` : "Ad break"}]`);}
                        else {console.log(colors.green, `[${time}] Showcase updated. [Not playing]`);}
                    } else {
                        console.log(colors.red, `[${time}] Failed to update showcase. Please check your profileData.`);
                    }
                } else {
                    console.log(colors.red, `[${time}] Failed to load showcase status. Status code: ${steamResponse.statusCode}`);
                }
            });
        });
    } catch(e){console.log(colors.red, `An error occured: ${e}`);}
}

renewAccessToken();
