const Discord = require('discord.js');
const bot = new Discord.Client();
let commands = require('./modules/commands.js')
let chans = require('./consts/channels.js')
let roles = require('./consts/roles.js')
let admin = require('./modules/admin.js');
let stocks = require('./modules/stocks.js');
let functions = require('./modules/general.js');
let prefix = '!';

bot.login('ODE1MzI2ODIxMTc5NTg4NjE4.YDqyRg.PRCQ3q8BUIwb_EEngT52TGwSVgQ');

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);

    botChannels = bot.channels.cache;
    botUsers = bot.users.cache;

    // function to interval, how often (minutes), name
    // functions.runInterval(stocks.stockWatcher,1,"Stock watcher");

});

bot.on('message', async msg => {
    if (msg.content.indexOf(prefix) !== 0) return;
    let args = msg.content.slice(prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    commands.commands(msg, args, command)

});

bot.on('guildMemberAdd', async member => {

    botChannels = bot.channels.cache
    // admin.verifyUser(member,botChannels)

    /*
    let joinEmbed = new Discord.MessageEmbed()
    .setTitle(`A new member of <faction> just arrived!`)
    .setDescription(`Welcome ${member}. You have been given the roles:`)
    .setColor(roles.MINKS_PINK)

    bot.channels.cache.get(chans.TEST_CHANNEL_ID).send(joinEmbed)

    member.send("Hi,testing verification DM.")
    */

});
