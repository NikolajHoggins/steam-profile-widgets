# A (WIP) Spotify Widget for Steam Community Profiles
### Based on https://github.com/Tsukani/Steam-Profile-Clock
(WIP)
## profileData Script
`function profileData() {$J("input[name='rgShowcaseConfig[8][0][title]']").val("Spotify");$J("textarea[name='rgShowcaseConfig[8][0][notes]']").val("SPOTIFYSTATUS");formData = new FormData(document.querySelector('form'));var arr = [];for (var pair of formData.entries()) {arr.push(pair[0]+ '=' + pair[1]);}arr.push('type=showcases', 'sessionID=SESID', 'json=1');window.prompt("Replace profileData with the following data:\n(CTRL + A & CTRL + C)", arr.join("&"));}$J(".profileedit_SaveCancelButtons_2KJ8a").append('<button type="button" class="DialogButton _DialogLayout Primary" onclick="profileData()">Copy profileData</button>');`
