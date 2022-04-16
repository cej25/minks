const roles = require('../consts/roles.js');
const channels = require('../consts/channels.js')
const functions = require('./general.js')
const keys = require('../consts/keys.js')
const structures = require('../consts/structures.js')
const Discord = require('discord.js')
const fetch = require('node-fetch');

exports.getResponseChannel = async function getResponseChannel(msg, channelID) {
    let fname = "Get response channel";

    let fchannel, fmessage;
    let discordID = msg.author.id;
    if (msg.channel.id != channelID && msg.channel.type != "dm") {
        fmessage = "<@!" + discordID + "> ";
        msg.delete();
        fchannel = botChannels.get(channelID);
    } else {
        fmessage = "";
        fchannel = msg.channel;
    }

    return [fchannel,fmessage];

}

exports.checkRolePerms = async function checkRolePerms(user, roleToAdd) {

    if (roleToAdd.perm == "admin") {
        if (user.roles.cache.has(roles.ADMIN_ROLE_ID.id)) {
            return 1;
        } else {
            return 0;
        }
    } else if (roleToAdd.perm == "leader") {
        if (user.roles.cache.has(roles.ADMIN_ROLE_ID.id) || user.has(roles.CR_LEADER_ID.id) || user.has(roles.CATA_LEADER_ID.id)) {
            return 1;
        } else {
            return 0;
        }
    } else {
        return 1;
    }
}

exports.addUserRole = async function addUserRole(msg, args) {

    let fname = "Add roles";
    let fresponse = await this.getResponseChannel(msg, channels.BOT_COMMANDS_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    if (msg.channel.type == "dm") {
        msg.channel.send("You cannot use this command in a DM. Please go to #bot-spam.")
        return;
    }

    let user = msg.member;

    if (!args[0]) {
        embedMessage += "Usage: `!ar role1 [role 2]...`\nPlease specify at least one role to add.";
    } else {

        embedMessage += "```diff\n"
        for (let i=0;i<args.length;i++) {
            try {

                let roleToAdd;
                if (args[i] == '1') {
                    roleToAdd = roles.ONE_PCT_ROLE_ID;
                } else if (args[i] == '5') {
                    roleToAdd = roles.FIVE_PCT_ROLE_ID;
                } else if (args[i] == '10') {
                    roleToAdd = roles.TEN_PCT_ROLE_ID;
                } else if (args[i].toLowerCase() == 'p5') {
                    roleToAdd = roles.POINT5_PCT_ROLE_ID;
                } else if (args[i].toLowerCase() == 'cayman' || args[i].toLowerCase() == 'caymans') {
                    roleToAdd = roles.CAYMAN_ROLE_ID;
                } else if (args[i].toLowerCase() == 'swiss' || args[i].toLowerCase() == 'switz' || args[i].toLowerCase() == 'switzerland') {
                    roleToAdd = roles.SWITZ_ROLE_ID;
                } else if (args[i].toLowerCase() == 'mug') {
                    roleToAdd = roles.MUGGER_ROLE_ID;
                } else {
                    roleToAdd = roles[args[i].toUpperCase()+'_ROLE_ID'];
                }

                let check = await this.checkRolePerms(user, roleToAdd);
                if (check == 0) {
                    embedMessage += "- Error! You do not have permission to add role: " + args[i].toUpperCase() + "\n";
                    cmessage += user.user.username + " tried to add the role: " + args[i].toUpperCase() + " but does not have permisson.\n"
                    continue;
                } else {
                    if(user.roles.cache.has(roleToAdd.id)) {
                        embedMessage += "- You already have the role: " + args[i].toUpperCase() + "\n";
                        cmessage += user.user.username + " tried to add the role: " + args[i].toUpperCase() + " but already has it.\n";
                    } else {
                        await(user.roles.add(roleToAdd.id))
                        embedMessage += "+ Role successfully added: " + args[i].toUpperCase() + "\n";
                        cmessage += user.user.username + " successfully added the role: " + args[i].toUpperCase() + "\n";
                    }
                }
            } catch (e) {
                embedMessage += "- Could not add the role: " + args[i].toUpperCase() + "\n";
                cmessage += user.user.username + " tried adding the role: " + args[i].toUpperCase() + " and received the error: " + e + "\n";
            }
        }
        embedMessage += "```"

    }

    const embed = new Discord.MessageEmbed()
        .setColor(roles.MINKS_PINK)
        .addFields(
                { name: fname, value: embedMessage, inline: true },
        )

    if (fmessage != ""){
        fchannel.send(fmessage)
    }
    fchannel.send(embed)
    console.log(cmessage)

}

exports.deleteUserRole = async function deleteUserRole(msg, args) {
    let fname = "Delete roles";
    let fresponse = await this.getResponseChannel(msg, channels.BOT_COMMANDS_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    if (msg.channel.type == "dm") {
        msg.channel.send("You cannot use this command in a DM. Please go to #bot-spam.")
        return;
    }

    let user = msg.member;

    if (!args[0]) {
        embedMessage += "Usage: `!dr role1 [role 2]...`\nPlease specify at least one role to delete.";
    } else {

        embedMessage += "```diff\n"

        for (let i=0;i<args.length;i++) {
            try {

                let roleToDelete;
                if (args[i] == '1') {
                    roleToDelete = roles.ONE_PCT_ROLE_ID;
                } else if (args[i] == '5') {
                    roleToDelete = roles.FIVE_PCT_ROLE_ID;
                } else if (args[i] == '10') {
                    roleToDelete = roles.TEN_PCT_ROLE_ID;
                } else if (args[i].toLowerCase() == 'p5') {
                    roleToDelete = roles.POINT5_PCT_ROLE_ID;
                } else if (args[i].toLowerCase() == 'cayman' || args[i].toLowerCase() == 'caymans') {
                    roleToDelete = roles.CAYMAN_ROLE_ID;
                } else if (args[i].toLowerCase() == 'swiss' || args[i].toLowerCase() == 'switz' || args[i].toLowerCase() == 'switzerland') {
                    roleToDelete = roles.SWITZ_ROLE_ID;
                } else if (args[i].toLowerCase() == 'mug') {
                    roleToDelete = roles.MUGGER_ROLE_ID;
                } else {
                    roleToDelete = roles[args[i].toUpperCase()+'_ROLE_ID'];
                }

                let check = await this.checkRolePerms(user, roleToDelete);
                if (check == 0) {
                    embedMessage += "- Error! You do not have permission to delete role: " + args[i].toUpperCase() + "\n";
                    cmessage += user.user.username + " tried to delete the role: " + args[i].toUpperCase() + " but does not have permisson.\n"
                    continue;
                } else {
                    if(user.roles.cache.has(roleToDelete.id)) {
                        await(user.roles.remove(roleToDelete.id))
                        embedMessage += "+ Role successfully deleted: " + args[i].toUpperCase() + "\n";
                        cmessage += user.user.username + " successfully deleted the role: " + args[i].toUpperCase() + "\n";
                    } else {
                        embedMessage += "- You do not have the role: " + args[i].toUpperCase() + "\n";
                        cmessage += user.user.username + " tried to delete the role: " + args[i].toUpperCase() + " but does not have it.\n";
                    }
                }
            } catch (e) {
                embedMessage += "- Could not delete the role: " + args[i].toUpperCase() + "\n";
                cmessage += user.user.username + " tried deleting the role: " + args[i].toUpperCase() + " and received the error: " + e + "\n";
            }
        }
        embedMessage += "```"

    }

    const embed = new Discord.MessageEmbed()
        .setColor(roles.MINKS_PINK)
        .addFields(
                { name: fname, value: embedMessage, inline: true },
        )

    if (fmessage != "") {
        fchannel.send(fmessage)
    }
    fchannel.send(embed)
    console.log(cmessage)

}

let quoteStore;
try {
    quoteStore = require("../JSON/quotes.json")
} catch (e) {
    console.log("quotes.json is missing!");
    quoteStore = {};
}
exports.addQuote = async function addQuote(msg, args) {
    let fname = "Add quote";
    let cmessage = "", embedMessage = "";

    let discordID = msg.member.id;
    const currentTime = Math.round((new Date()).getTime() / 1000);

    let quoteLength = Object.keys(quoteStore).length;
    let quoteNumber = quoteLength + 1
    fname += " (#" + quoteNumber + ")";

    try {
        if (msg.reference != null) {
            msg.channel.messages.fetch(msg.reference.messageID)
                .then(quote => {
                    if (!quoteStore[quoteLength]) {
                        quoteStore[quoteLength] = Object.assign({}, structures.QUOTES_STRUCTURE)
                    }
                    quoteStore[quoteLength]['quote'] = quote.author.username + ": " + quote.content;
                    quoteStore[quoteLength]['savedby'] = discordID;
                    quoteStore[quoteLength]['timestamp'] = currentTime;
                    functions.updateJsonFile("/JSON/quotes",quoteStore)

                    embedMessage += quote.author.username + ": " + quote.content;
                    const embed = new Discord.MessageEmbed()
                        .setColor(roles.MINKS_PINK)
                        .addFields(
                                { name: fname, value: embedMessage, inline: true },
                        )
                    msg.channel.send(embed)
                })

        } else {

            if (args.length != 0) {

                let quoteContent = "";
                for (let i in args) {
                    if (i == args.length - 1) {
                        quoteContent += args[i];
                    } else {
                        quoteContent += args[i] + " ";
                    }
                }

                if (!quoteStore[quoteLength]) {
                    quoteStore[quoteLength] = Object.assign({}, structures.QUOTES_STRUCTURE)
                }
                quoteStore[quoteLength]['quote'] = quoteContent;
                quoteStore[quoteLength]['savedby'] = discordID;
                quoteStore[quoteLength]['timestamp'] = currentTime;

                functions.updateJsonFile("/JSON/quotes",quoteStore)
                embedMessage += quoteContent;
                const embed = new Discord.MessageEmbed()
                    .setColor(roles.MINKS_PINK)
                    .addFields(
                            { name: fname, value: embedMessage, inline: true },
                    )
                msg.channel.send(embed)

            }
        }
    } catch (e) {
        console.log (e)
    }

}

exports.findQuote = async function findQuote(msg, args) {
    let fname = "Quote";
    let cmessage = "", embedMessage = "";

    let quote, quoteNumber;

    if (args.length == 0) {
        quoteNumber = functions.rng(1,Object.keys(quoteStore).length-1)
        fname += " (random)";
    } else {
        quoteNumber = args[0]-1;
        fname += " (#" + args[0] + ")";
    }

    quote = quoteStore[quoteNumber];

    embedMessage += quote['quote'];

    const embed = new Discord.MessageEmbed()
        .setColor(roles.MINKS_PINK)
        .addFields(
                { name: fname, value: embedMessage, inline: false },
                { name: "\u200b", value: "Saved by: <@!" +  quote['savedby'] + "> - " + functions.timeConverter(quote['timestamp']), inline: false },
        )
    msg.channel.send(embed)

}


let userAccounts;
try {
    userAccounts = require("../JSON/userAccounts.json");
} catch (e) {
    console.log("userAccounts.json is missing!");
    userAccounts = {};
}
// auto verify function
exports.verifyUser = async function verifyUser(member,botChannels) {
    let fname = "Verify user";
    let fchannel = botChannels.get(channels.ARRIVALS_ID), embedMessage = "";
    let cmessage = "";

    let discordID = member.id;
    let discordTag = member.user.tag;

    // test ID
    let api = 'https://api.torn.com/user/'+discordID+'?selections=discord&key='+keys.API_KEY_ONE;
    let discordResponse = await functions.retrieveApiData(api)
    let userid = discordResponse['discord']['userID'];


    if (userid != "") {

        let api = 'https://api.torn.com/user/'+userid+'?selections=profile&key='+keys.API_KEY_ONE;
        let userResponse = await functions.retrieveApiData(api)
        let faction = userResponse['faction']['faction_name'];
        let factionID = userResponse['faction']['faction_id'];
        let username = userResponse['name'];

        embedMessage += discordTag + " has been verified as Torn user " + username + " [" + userid + "] \n \n";

        if (factionID == 13502) {

            // add user to json file
            if (!userAccounts[discordID]) {
                userAccounts[discordID] = Object.assign({}, structures.USER_ACCOUNTS_STRUCTURE)
            }
            userAccounts[discordID]['userid'] = userid;
            functions.updateJsonFile("/JSON/userAccounts",userAccounts);

            member.send("Thanks for joining the Chain Reaction server! \nIf you'd like access to some personalised features, please reply to this private message with your API key in the form: `!api <apikey>`")

            embedMessage += "They have been given role(s):```diff\n"
            embedMessage += "+ CR: Member\n";
            member.roles.add(roles.CHAIN_REACTION_ROLE_ID.id);

            let position = userResponse['faction']['position'];

            if (position == "Capo" || position == "Consigliere" || position == "Warlord" || position == "Co-leader" || position == "Leader") {

                embedMessage += "- <CR: Leadership>\n";
                member.roles.add(roles.LEADERSHIP_ROLE_ID.id);

            }

            embedMessage += "```"


        } else if (faction == "Catalysis") {

            // add user to json file
            if (!userAccounts[discordID]) {
                userAccounts[discordID] = Object.assign({}, structures.USER_ACCOUNTS_STRUCTURE)
            }
            userAccounts[discordID]['userid'] = userid;
            functions.updateJsonFile("/JSON/userAccounts",userAccounts);

            member.send("Thanks for joining the Chain Reaction server! \nIf you'd like access to some personalised features, please reply to this private message with your API key in the form: `!api <apikey>`")

            embedMessage += "They have been given role(s):```diff\n"
            embedMessage += "+ Cata: Member\n";
            member.roles.add(roles.CATALYSIS_ROLE_ID.id);

            let position = userResponse['faction']['position'];

            if (position == "Wheatley" || position == "Co-leader" || position == "Leader") {

                embedMessage += "+ Cata: Leadership\n";
                member.roles.add(roles.SUB_LEADERSHIP_ROLE_ID.id);

            }

            embedMessage += "```"

        }

    } else {

        embedMessage += discordTag + " has not verified with the Torn discord server.";

    }

    cmessage += "Console message should go here"

    const embed = new Discord.MessageEmbed()
        .setColor(roles.MINKS_PINK)
        .addFields(
                { name: "User verification", value: embedMessage, inline: true },
        )
    fchannel.send(embed)
    console.log(cmessage)

}

exports.storeApiKey = async function storeApiKey(msg,args) {

    discordID = msg.author.id;

    if (args.length > 0) {
        if (!userAccounts[discordID]) {
            msg.author.send("You have not verified yet!")
        } else {

            let apikey = args[0]
            let api = 'https://api.torn.com/user/'+userAccounts[discordID]['userid']+'?selections=bars&key='+apikey;
            const testResponse = await fetch(api)
              .then(response => response.json())

            let correctApi = this.testForApiError(testResponse)

            if (correctApi == 'false') {
                userAccounts[discordID]['apikey'] = args[0]
                functions.updateJsonFile("/JSON/userAccounts",userAccounts)
                msg.author.send("API key confirmed!")
            } else {
                msg.author.send("API key not recognised.")
            }
        }
    } else {
        msg.author.send("Please type `!api` followed by your API key.")
    }

}

exports.testForApiError = function testForApiError(response) {

    if (!response['error']) {
        return 'false';
    } else {
        return 'true';
    }
}
