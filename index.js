const Discord = require("discord.js");
const config = require("./data/config.json");
const axios = require("axios");
const admin = require('firebase-admin');
const firebase = require("./data/firebase.json");
const intents = new Discord.Intents(32767);

const client = new Discord.Client({ intents });

admin.initializeApp({
    credential: admin.credential.cert(firebase)
});

//firebase
const db = admin.firestore();
const users = db.collection("users");

//lastfm api url
const LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/?method=';
const LASTFM_API_KEY = config.API_KEY;

//json data
const otherData = require("./data/otherData.json");

client.on("ready", () => {
    console.log("Chaeryeong is up and running!");
    setInterval(() => {
        let randomListening = Math.floor(Math.random() * Math.floor(otherData.listeningToSongs.length));
        client.user.setActivity(otherData.listeningToSongs[randomListening], {type: 2});
    }, 180000);
});

client.on("messageCreate", msg => {

    db.collection("servers").doc(msg.guild.id).get().then((doc) => {
        if (doc.exists) {
            prefix = doc.data().prefix;
        }
    })
    .then (() => {
        if (msg.author.bot) return;
    if (msg.content.indexOf(prefix) !== 0) return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "ping") { 
        msg.reply("pong!");
    }

    else if (command === "help") {
        const helpEmbed = new Discord.MessageEmbed()
        .setTitle("Commands:")
        .setColor("#FFFFFF")
        .setDescription(`**__BASIC__**
                        **ping**: _replies with pong_
                         **help**: _replies with all commands_

                         **__LAST.FM__**
                         **set**: _set your last.fm username_
                         **toptracks**: _view your top 10 tracks_
                         **topartists**: _view your top 10 artists_
                         
                         **__CONFIGURATION__**
                         **prefix**: _set prefix_ 
                         
                         **__OTHERS__**
                         **stream**: _sends an ITZY MV to stream_
                         `)
        msg.channel.send({embeds: [helpEmbed]});
    }

    else if (command === "stream") {
        let rndMV = Math.floor(Math.random() * Math.floor(otherData.musicVideos.length));
        msg.channel.send(otherData.musicVideos[rndMV]);
    }

    else if (command === "setprefix") {
        if(args.length === 0) {
            msg.channel.send("No prefix was provided! Please try again!")
        }
        else if (args.length === 1) {
            let newPrefix = args[0];

            db.collection("servers").doc(msg.guild.id).update({
                prefix: newPrefix
            }).then(() => {
                msg.channel.send(`Prefix has been changed to ${newPrefix}!`)
            })
        }
    }

    else if (command === "sendgif") {
        switch(args[0].toLowerCase()) {
            case "chaeryeong":
                let rndGif = Math.floor(Math.random() * Math.floor(otherData.chaeryeongGifs.length));
                const gifEmbed = new Discord.MessageEmbed()
                    .setColor('#FFFFFF')
                    .setTitle("A Chaeryeong gif for you!")
                    .setImage(otherData.chaeryeongGifs[rndGif])
                msg.channel.send({embeds: [gifEmbed]});
            break;

            default:
                msg.channel.send("Please provide an ITZY member!");
        }
    }

    else if (command === "set") {
        users.doc(msg.author.id).get().then((doc) => {
            if (doc.exists) {
                users.doc(msg.author.id).set({
                    lastfmUser: args[0],
                    discordId: msg.author.id
                  }).then(() => {
                    msg.channel.send("Last.fm username has been set to " + args[0] + "!");
                    console.log("Document successfully written!");
                  })
            }
            else {
              users.doc(msg.author.id).set({
                lastfmUser: args[0],
                discordId: msg.author.id
              })
              .then(() => {
                msg.channel.send("Last.fm username has been set to " + args[0] + "!");
                console.log("Document successfully written!");
              })
              .catch((error) => {
                msg.channel.send("An error occured while setting your username!");
                console.error("Error writing document: ", error);
                });
                } 
            }) 
        }
    else if (command === "np") {
        users.doc(msg.author.id).get().then((doc) => {
            if (doc.exists) {
                nowPlaying(doc.data().lastfmUser, msg);
            }
            else {
                msg.channel.send("This user doesn't exist! Use $set [username] to set your Lastfm username");
            }
        })
    }
    else if (command === "toptracks" || command === "tt") {
        users.doc(msg.author.id).get().then((doc) => {
            if (doc.exists) {
                getTopTracks(doc.data().lastfmUser, msg);
            }
            else {
                msg.channel.send("This user doesn't exist! Use $set [username] to set your Lastfm username");
            }
        })
    }
    else if (command === "topartists" || command === "ta") {
        users.doc(msg.author.id).get().then((doc) => {
            if (doc.exists) {
                getTopArtists(doc.data().lastfmUser, msg);
            }
            else {
                msg.channel.send("This user doesn't exist! Use $set [username] to set your Lastfm username");
            }
        })
    }
    })

    
}) 

client.on('guildCreate', serverData => {
    console.log("Joined a new server called " + serverData.name)
    db.collection("servers").doc(serverData.id).set({
        serverID: serverData.id,
        serverName: serverData.name,
        serverMemberCount: serverData.memberCount,
        prefix: '$'
    })
})

function nowPlaying(user, msg) {
    const METHOD = 'user.getRecentTracks';
    const QUERY_STRING = `&user=${user}&api_key=${LASTFM_API_KEY}&limit=2&format=json`;

    const request_url = `${LASTFM_API_URL}${METHOD}${QUERY_STRING}`;
    console.log(request_url);

    axios
        .get(request_url)
        .then(res => {
            if (res.data.msg) {
                msg.channel.send('User not found');
                return;
            }

            const latest_track = res.data.recenttracks.track[0];
            const previous_track = res.data.recenttracks.track[1];


            if (!latest_track) {
                e.msg.channel.send('User not found');
                return;
            }

            const trarray = res.data.recenttracks.track[0];
            if (trarray['@attr'] && trarray['@attr']['nowplaying']) {            
            const npEmbed = new Discord.MessageEmbed()
                .setThumbnail(latest_track.image[3]['#text'])
                .setAuthor(`${user} is now listening to:`, msg.author.avatarURL())
                .setColor('#fb83ed')
                .setDescription(`**[${latest_track.name}](${latest_track.url})** by **${latest_track.artist['#text']}** \n on **${latest_track.album['#text']}** \n \n **Previous**
                **[${previous_track.name}](${previous_track.url})** by ${previous_track.artist['#text']}` )
                .setFooter(``)
                msg.channel.send({ embeds: [npEmbed] })
            } else {
                const npEmbed = new Discord.MessageEmbed()
                .setThumbnail(latest_track.image[3]['#text'])
                .setAuthor(`${user} last listened to:`, msg.author.avatarURL())
                .setColor('#fb83ed')
                .setDescription(`**[${latest_track.name}](${latest_track.url})** by **${latest_track.artist['#text']}** \n on **${latest_track.album['#text']}**`)
                .setFooter(``)
                msg.channel.send({ embeds: [npEmbed] })
            }

        })
        .catch(err => {
            console.log('Got an error:', err);
        });
}

function getTopTracks(user, msg) {
    const METHOD = 'user.getTopTracks';
    const QUERY_STRING = `&user=${user}&api_key=${LASTFM_API_KEY}&limit=10&format=json`;

    const request_url = `${LASTFM_API_URL}${METHOD}${QUERY_STRING}`;
    console.log(request_url);

    axios
        .get(request_url)
        .then(res => {
            const toptrack1 = res.data.toptracks.track[0];
            const toptrack2 = res.data.toptracks.track[1];
            const toptrack3 = res.data.toptracks.track[2];
            const toptrack4 = res.data.toptracks.track[3];
            const toptrack5 = res.data.toptracks.track[4];
            const toptrack6 = res.data.toptracks.track[5];
            const toptrack7 = res.data.toptracks.track[6];
            const toptrack8 = res.data.toptracks.track[7];
            const toptrack9 = res.data.toptracks.track[8];
            const toptrack10 = res.data.toptracks.track[9];

            const ttEmbed = new Discord.MessageEmbed()
                .setAuthor(`${user}'s top tracks:`, msg.author.avatarURL())
                .setColor('#fb83ed')
                .setDescription(`**#1** - **[${toptrack1.name}](${toptrack1.url})** by ${toptrack1.artist['name']} - _(${toptrack1.playcount} plays)_ 
                                 **#2** - **[${toptrack2.name}](${toptrack2.url})** by ${toptrack2.artist['name']} - _(${toptrack2.playcount} plays)_
                                 **#3** - **[${toptrack3.name}](${toptrack3.url})** by ${toptrack3.artist['name']} - _(${toptrack3.playcount} plays)_
                                 **#4** - **[${toptrack4.name}](${toptrack4.url})** by ${toptrack4.artist['name']} - _(${toptrack4.playcount} plays)_
                                 **#5** - **[${toptrack5.name}](${toptrack5.url})** by ${toptrack5.artist['name']} - _(${toptrack5.playcount} plays)_
                                 **#6** - **[${toptrack6.name}](${toptrack6.url})** by ${toptrack6.artist['name']} - _(${toptrack6.playcount} plays)_
                                 **#7** - **[${toptrack7.name}](${toptrack7.url})** by ${toptrack7.artist['name']} - _(${toptrack7.playcount} plays)_
                                 **#8** - **[${toptrack8.name}](${toptrack8.url})** by ${toptrack8.artist['name']} - _(${toptrack8.playcount} plays)_
                                 **#9** - **[${toptrack9.name}](${toptrack9.url})** by ${toptrack9.artist['name']} - _(${toptrack9.playcount} plays)_
                                 **#10** - **[${toptrack10.name}](${toptrack10.url})** by ${toptrack10.artist['name']} - _(${toptrack10.playcount} plays)_`)
                .setFooter(``)
            msg.channel.send({ embeds: [ttEmbed] })

        })  
        .catch(err => {
            console.log('Got an error:', err);
        });
}

function getTopArtists(user, msg) {
    const METHOD = 'user.getTopArtists';
    const QUERY_STRING = `&user=${user}&api_key=${LASTFM_API_KEY}&limit=10&format=json`;

    const request_url = `${LASTFM_API_URL}${METHOD}${QUERY_STRING}`;
    console.log(request_url);

    axios
        .get(request_url)
        .then(res => {
            const topartist1 = res.data.topartists.artist[0];
            const topartist2 = res.data.topartists.artist[1];
            const topartist3 = res.data.topartists.artist[2];
            const topartist4 = res.data.topartists.artist[3];
            const topartist5 = res.data.topartists.artist[4];
            const topartist6 = res.data.topartists.artist[5];
            const topartist7 = res.data.topartists.artist[6];
            const topartist8 = res.data.topartists.artist[7];
            const topartist9 = res.data.topartists.artist[8];
            const topartist10 = res.data.topartists.artist[9];

            const taEmbed = new Discord.MessageEmbed()
                .setAuthor(`${user}'s top artists:`, msg.author.avatarURL())
                .setColor('#fb83ed')
                .setDescription(`**#1** - **[${topartist1.name}](${topartist1.url})** - _(${topartist1.playcount} plays)_ 
                                 **#2** - **[${topartist2.name}](${topartist2.url})** - _(${topartist2.playcount} plays)_
                                 **#3** - **[${topartist3.name}](${topartist3.url})** - _(${topartist3.playcount} plays)_
                                 **#4** - **[${topartist4.name}](${topartist4.url})** - _(${topartist4.playcount} plays)_
                                 **#5** - **[${topartist5.name}](${topartist5.url})** - _(${topartist5.playcount} plays)_
                                 **#6** - **[${topartist6.name}](${topartist6.url})** - _(${topartist6.playcount} plays)_
                                 **#7** - **[${topartist7.name}](${topartist7.url})** - _(${topartist7.playcount} plays)_
                                 **#8** - **[${topartist8.name}](${topartist8.url})** - _(${topartist8.playcount} plays)_
                                 **#9** - **[${topartist9.name}](${topartist9.url})** - _(${topartist9.playcount} plays)_
                                 **#10** - **[${topartist10.name}](${topartist10.url})** - _(${topartist10.playcount} plays)_`)
                .setFooter(``)
            msg.channel.send({ embeds: [taEmbed] })

        })  
        .catch(err => {
            console.log('Got an error:', err);
        }); 
}

client.login(config.token);
