let channels = require('../consts/channels.js')
let functions = require('./general.js')
let enumerations = require('../consts/enumerations.js')
let roles = require('../consts/roles.js')
let admin = require('./admin.js')
let keys = require('../consts/keys.js')
const fetch = require('node-fetch');
const Discord = require('discord.js');


try {
    stocksLive = require("../JSON/stocksLive.json");
} catch (e) {
    console.log("MISSING stocksLive! Please check for stocksLive.json");
    stocksLive = {};
}
try {
    stocksPrices = require("../JSON/stocksPrices.json");
} catch (e) {
    console.log("MISSING stocksPrices! Please check for stocksPrices.json");
    stocksPrices = {};
}
try {
    personalAlerts = require("../JSON/personalAlerts.json");
} catch (e) {
    console.log("MISSING personalAlerts! Please check for personalAlerts.json");
    personalAlerts = {};
}
try {
    dm = require("../JSON/dm.json");
} catch (e) {
    console.log("MISSING directional movement! Please check for dm.json");
    dm = {};
}
try {
    adx = require("../JSON/adx.json");
} catch (e) {
    console.log("MISSING adx! Please check for adx.json");
    adx = {};
}
try {
    invest = require("../JSON/invest.json");
} catch (e) {
    console.log("MISSING investment tracker! Please check for invest.json");
    invest = {};
}
exports.stockWatcher = async function stockWatcher(args) {

    let fname = "Stock watcher";
    let fchannel = botChannels.get(channels.STOCK_NOTIFICATIONS_ID);

    let now = new Date()
    let currentTime = Math.round(now.getTime() / 1000)

    let key = keys.API_KEY_ONE

    let api = 'https://api.torn.com/torn/?selections=stocks&key='+key;
    let stocksResponse
    try {
        stocksResponse = await functions.retrieveApiData(api)
    } catch (e) {
        console.log(fname + " has an error. Aborting run.")
        return
    }
    if (stocksResponse == 'error') {
        console.log(fname + " has an error. Aborting run.")
        return;
    }

    let stocksHistory = Object.assign({},stocksPrices)
    let stocksCurrent = Object.assign({},stocksLive)

    for (let stock in stocksResponse.stocks) {

        let acronym = stocksResponse.stocks[stock].acronym;
        let name = stocksResponse.stocks[stock].name;

        let price_current = stocksResponse.stocks[stock].current_price;
        //console.log(acronym + " $" + current_price + " - " + currentTime)
        let price_previous;
        try {
            price_previous = stocksCurrent[acronym].price;
        } catch (e) { price_previous = 0 }

        let price_diff = price_current - price_previous;
        let price_ratio = price_current / price_previous;

        // mc = market cap, ts = total_shares
        let mc_current = stocksResponse.stocks[stock].market_cap;
        let ts_current = stocksResponse.stocks[stock].total_shares;

        // 1min
        let mc_previous;
        try {
            mc_previous = stocksCurrent[acronym].market_cap;
        } catch (e) { mc_previous = 0 }

        let ts_previous;
        try {
            ts_previous = stocksCurrent[acronym].total_shares;
        } catch (e) { ts_previous = 0 }

        let mc_diff = mc_current - mc_previous;
        let ts_diff = ts_current - ts_previous;

        // 15min
        let mc_previous_15m;
        try {
            mc_previous_15m = stocksCurrent[acronym]['15min_market_cap'];
        } catch (e) { mc_previous_15m = 0 }

        let ts_previous_15m;
        try {
            ts_previous_15m = stocksCurrent[acronym]['15min_total_shares'];
        } catch (e) { ts_previous_15min = 0 }

        let mc_diff_15m = mc_current - mc_previous_15m;
        let mc_ratio_15m = mc_current / mc_previous_15m;
        let ts_diff_15m = ts_current - ts_previous_15m;
        let ts_ratio_15m = ts_current / ts_previous_15m;

        // alerts
        // 1. price dip
        try {
            if (stocksCurrent[acronym]['time'] > currentTime - 90) {
                if (price_ratio < 0.9) {
                    // alert channel for 10% dip
                    fchannel.send(" <@&" + roles[acronym + '_ROLE_ID'].id + "> has dropped <@&" + roles.TEN_PCT_ROLE_ID.id + "> in the last minute!")
                } else if (price_ratio < 0.95) {
                    // alert channel for 5% dip
                    fchannel.send(" <@&" + roles[acronym + '_ROLE_ID'].id + "> has dropped <@&" + roles.FIVE_PCT_ROLE_ID.id + "> in the last minute!")
                } else if (price_ratio < 0.99) {
                    // alert channel for 1% dip
                    fchannel.send(" <@&" + roles[acronym + '_ROLE_ID'].id + "> has dropped <@&" + roles.ONE_PCT_ROLE_ID.id + "> in the last minute!")
                } else if (price_ratio < 0.995) {
                    // alert channel for .5% dip
                    fchannel.send(" <@&" + roles[acronym + '_ROLE_ID'].id + "> has dropped <@&" + roles.POINT5_PCT_ROLE_ID.id + "> in the last minute!")
                }
            }
        } catch (e) {}

        // 2. user alerts -- deal with non-existent stock alerts soon pls
        for (let userID in personalAlerts) {
            user = botUsers.get(userID)
            try {
                if (price_current <= personalAlerts[userID][acronym]['lower'] && price_previous > personalAlerts[userID][acronym]['lower']) {
                    user.send("**" + acronym + "** is now below $" + personalAlerts[userID][acronym]['lower'])
                }
            } catch (e) {}

            try {
                if (price_current >= personalAlerts[userID][acronym]['upper'] && price_previous < personalAlerts[userID][acronym]['upper']) {
                    user.send("**" + acronym + "** is now above $" + personalAlerts[userID][acronym]['upper'])
                }
            } catch (e) {}
        }

        if (!stocksPrices[acronym]) {
            stocksPrices[acronym] = {}
        }

        if (!stocksPrices[acronym][currentTime]) {
            stocksPrices[acronym][currentTime] = price_previous;
        }
        functions.updateJsonFile("/JSON/stocksPrices",stocksPrices)

        if (!stocksLive[acronym]) {
            stocksLive[acronym] = {
                'price': 0,
                'latesttick': 0,
                'market_cap': 0,
                'market_cap_change': 0,
                '15min_market_cap': 0,
                '15min_market_cap_change': 0,
                'total_shares': 0,
                'total_shares_change': 0,
                '15min_total_shares': 0,
                '15min_total_shares_change': 0,
                'time': 0
            }
        }

        if (!stocksLive[acronym]['15min_market_cap_change']) {
            stocksLive[acronym]['15min_market_cap_change'] = 0
        }
        if (!stocksLive[acronym]['15min_total_shares_change']) {
            stocksLive[acronym]['15min_total_shares_change'] = 0
        }
        if (!stocksLive[acronym]['15min_market_cap']) {
            stocksLive[acronym]['15min_market_cap'] = 0
        }
        if (!stocksLive[acronym]['15min_total_shares']) {
            stocksLive[acronym]['15min_total_shares'] = 0
        }


        stocksLive[acronym]['price'] = price_current;
        stocksLive[acronym]['latesttick'] = price_diff.toFixed(2);
        stocksLive[acronym]['market_cap'] = mc_current;
        stocksLive[acronym]['market_cap_change'] = mc_diff;
        stocksLive[acronym]['total_shares'] = ts_current;
        stocksLive[acronym]['total_shares_change'] = ts_diff;
        stocksLive[acronym]['time'] = currentTime;

        if (now.getMinutes() % 15 == 0) {
            stocksLive[acronym]['15min_market_cap'] = mc_current;
            stocksLive[acronym]['15min_market_cap_change'] = mc_current - mc_previous_15m;
            stocksLive[acronym]['15min_total_shares'] = ts_current;
            stocksLive[acronym]['15min_total_shares_change'] = ts_current - ts_previous_15m;

            if (ts_ratio_15m < 0.9) {
                // alert channel for 10% share movement
                fchannel.send(" <@&" + roles.WHALE_ROLE_ID.id + "> alert: Total shares in <@&" + roles[acronym + '_ROLE_ID'].id + "> have decreased by more than 10% in the last 15 minutes!")
            } else if (ts_ratio_15m > 1.1) {
                fchannel.send(" <@&" + roles.WHALE_ROLE_ID.id + "> alert: Total shares in <@&" + roles[acronym + '_ROLE_ID'].id + "> have increased by more than 10% in the last 15 minutes!")
            }

        }

        functions.updateJsonFile("/JSON/stocksLive",stocksLive)

        let invest_diff = ts_diff * price_previous;
        if (invest_diff > 100000000000) {
            if (!invest[acronym]) {
                invest[acronym] = {}
            }

            if (!invest[acronym][currentTime]) {
                invest[acronym][currentTime] = {
                    "price": price_previous,
                    "shares_bought": ts_diff,
                    "price_1m": price_current,
                    "price_5m": 0,
                    "price_15m": 0,
                    "price_1h": 0,
                    "price_4h": 0,
                }
            }
        }

        functions.updateJsonFile("/JSON/invest",invest)

        if (invest[acronym]) {
            for (let time in invest[acronym]) {
                if (time > currentTime - 5.5 * 60 && time < currentTime - 4.5 * 60) {
                    invest[acronym][time]['price_5m'] = price_current
                } else if (time > currentTime - 15.5 * 60 && time < currentTime - 14.5 * 60) {
                    invest[acronym][time]['price_15m'] = price_current
                } else if (time > currentTime - 60.5 * 60 && time < currentTime - 59.5 * 60) {
                    invest[acronym][time]['price_1h'] = price_current
                } else if (time > currentTime - 240.5 * 60 && time < currentTime - 239.5 * 60) {
                    invest[acronym][time]['price_4h'] = price_current
                }
            }
        }

        functions.updateJsonFile("/JSON/invest",invest)

    }

    // if time = 15mins calculate DM,TR values
    if (now.getMinutes() % 15 == 0) {
        for (let acronym in stocksPrices) {
            let low = 10000000000000, high = 0;
            for (let time in stocksPrices[acronym]) {
                if (time > currentTime - 60 * 15.5) {
                    if (stocksPrices[acronym][time] > high) {
                        high = stocksPrices[acronym][time]
                    } else if (stocksPrices[acronym][time] < low) {
                        low = stocksPrices[acronym][time]
                    }
                } else {
                    continue
                }
            }

            let trueRange = high - low;

            if (!dm[acronym]) {
                dm[acronym] = {}
            }

            if (!dm[acronym][currentTime]) {
                dm[acronym][currentTime] = {
                    'high': high,
                    'low': low,
                    'truerange': trueRange,
                    'upMove': "",
                    'downMove': "",
                    'dmplus': "",
                    'dmminus': "",
                    'smoothdmplus': "",
                    'smoothdmminus': "",
                    'atr': ""
                }
            }

            for (let time in dm[acronym]) {
                if (time > currentTime - 15.5 * 60 && time < currentTime - 14.5 * 60) {
                    let upMove = high - dm[acronym][time].high
                    let downMove = dm[acronym][time].low - low

                    dm[acronym][currentTime].upMove = upMove
                    dm[acronym][currentTime].downMove = downMove

                    if (upMove > downMove && upMove > 0) {
                        dm[acronym][currentTime].dmplus = upMove
                    } else {
                        dm[acronym][currentTime].dmplus = 0
                    }

                    if (downMove > upMove && downMove > 0) {
                        dm[acronym][currentTime].dmminus = downMove
                    } else {
                        dm[acronym][currentTime].dmminus = 0
                    }

                }

                let n = 0;
                if (time > currentTime - 15.5 * 60) {
                    dm[acronym][currentTime]['smoothdmplus'] = dm[acronym][currentTime].dmplus / 8 + (1 - 1/8) * dm[acronym][time].smoothdmplus

                    dm[acronym][currentTime]['smoothdmminus'] = dm[acronym][currentTime].dmminus / 8 + (1 - 1/8) * dm[acronym][time].smoothdmminus ///

                    dm[acronym][currentTime]['atr'] = (dm[acronym][currentTime].truerange + 7 * dm[acronym][time].atr) / 8 ///

                }
            }

        }
        functions.updateJsonFile("/JSON/dm",dm)
    }

    if (now.getMinutes() % 15 == 0) {
        for (let acronym in dm) {

            let n = 0;
            for (let time in dm[acronym]) {
                if (time > currentTime - 15.5 * 60) {
                    n = 1;
                    let diplus = 100 * dm[acronym][time].smoothdmplus / dm[acronym][time].atr
                    let diminus = 100 * dm[acronym][time].smoothdmminus / dm[acronym][time].atr
                    let adxvalue = 100 * Math.abs(diplus - diminus) / Math.abs(diplus + diminus)

                    if (!adx[acronym]) {
                        adx[acronym] = {}
                    }

                    if (!adx[acronym][currentTime]) {
                        adx[acronym][currentTime] = {
                            'diplus': diplus,
                            'diminus': diminus,
                            'adx': adxvalue
                        }

                    }

                }

            }

            if (n == 0) {
                for (let time in dm[acronym]) {
                    if (time > currentTime - 30.5 * 60) {
                        n = 1;
                        let diplus = 100 * dm[acronym][time].smoothdmplus / dm[acronym][time].atr
                        let diminus = 100 * dm[acronym][time].smoothdmminus / dm[acronym][time].atr
                        let adxvalue = 100 * Math.abs(diplus - diminus) / Math.abs(diplus + diminus)

                        if (!adx[acronym]) {
                            adx[acronym] = {}
                        }

                        if (!adx[acronym][currentTime]) {
                            adx[acronym][currentTime] = {
                                'diplus': diplus,
                                'diminus': diminus,
                                'adx': adxvalue
                            }

                        }

                    }

                }

                // need failsafe here
                if (n == 0) {
                    if (!adx[acronym]) {
                        adx[acronym] = {}
                    }

                    if (!adx[acronym][currentTime]) {
                        adx[acronym][currentTime] = {
                            'diplus': diplus,
                            'diminus': diminus,
                            'adx': adxvalue
                        }

                    }
                }

            }

        }
        functions.updateJsonFile("/JSON/adx",adx)
    }

}

exports.stockAlerts = async function stockAlerts(msg,args) {

    let fname = "Personal stock alerts"
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    if (args.length <= 2) {
        fchannel.send(fmessage + "Not enough parameters. For correct usage see `!help alerts`")
        return;
    }

    let acronym = args[0].toUpperCase();
    if (!enumerations.STOCK_IDS[acronym]) {
        fchannel.send(fmessage + "The first parameter should be a stock acronym. \nSee `!help alerts` for correct usage.")
        return;
    }

    let alertBound = args[1].toLowerCase();
    if (alertBound != "u" && alertBound != "l") {
        fchannel.send(fmessage + "The second parameter should be 'u' for upper price or 'l' for lower price only. \nSee `!help alerts` for correct usage.")
        return;
    }

    let price = args[2].replace("$","")
    if (isNaN(price)) {
        fchannel.send(fmessage + "The third paramter should be a price for an alert. \nSee `!help alerts` for correct usage.")
        return;
    }

    let discordID = msg.author.id;
    if (!personalAlerts[discordID]) {
        personalAlerts[discordID] = {}
    }

    if (!personalAlerts[discordID][acronym]) {
        personalAlerts[discordID][acronym] = {
            'upper': '',
            'lower': ''
        }
    }

    if (alertBound == "u") {
        personalAlerts[discordID][acronym].upper = price;
        fchannel.send(fmessage + "Upper price alert updated for " + acronym + ".")
    } else if (alertBound == "l") {
        personalAlerts[discordID][acronym].lower = price;
        fchannel.send(fmessage + "Lower price alert updated for " + acronym + ".")
    }

    functions.updateJsonFile("/JSON/personalAlerts", personalAlerts);
    //return;

}

exports.getPersonalAlerts = async function getPersonalAlerts(msg,args) {

    let fname = "Personal stock alerts";
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    let discordID = msg.author.id;

    if (!personalAlerts[discordID]) {
        personalAlerts[discordID] = {}
    }

    if (Object.entries(personalAlerts[discordID]).length === 0) {
        fchannel.send(fmessage + "You currently have no alerts set up.")
        return;
    }

    if (args.length === 0) {

        embedTitle = "Your stock alerts";
        let acronym;
        for (let acronym in personalAlerts[discordID]) {

            stock = "**" + acronym + "**";

            embedMessage += stock + ": Lower - $" + personalAlerts[discordID][acronym]['lower']
            embedMessage += " | Upper - $" + personalAlerts[discordID][acronym]['upper'] + "\n"

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

    }


}

exports.deleteStockAlert = async function deleteStockAlert(msg,args) {
    let fname = "Delete stock alerts";
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    let discordID = msg.author.id;

    if (args.length < 2) {
        fchannel.send(fmessage + "Not enough parameters. See `!help alerts` for correct usage.")
        return;
    }

    let acronym = args[0].toUpperCase();
    if (!enumerations.STOCK_IDS[acronym]) {
        fchannel.send(fmessage + "The first parameter should be a stock acronym. \nSee `!help alerts` for correct usage.")
        return;
    }

    let alertBound = args[1].toLowerCase();
    if (alertBound != "u" && alertBound != "l" && alertBound != "b") {
        fchannel.send(fmessage + "The second parameter should be 'u' for upper price, 'l' for lower price or 'b' for both prices only. \nSee `!help alerts` for correct usage.")
        return;
    }

    if (!personalAlerts[discordID][acronym]) {
        fchannel.send(fmessage + "You have no alerts set for " + acronym + ".")
        return;
    }

    if (alertBound == "u") {
        personalAlerts[discordID][acronym]['upper'] = "";
        fchannel.send(fmessage + "Upper alert for " + acronym + " deleted.")
        functions.updateJsonFile("/JSON/personalAlerts",personalAlerts)
    } else if (alertBound == "l") {
        personalAlerts[discordID][acronym]['lower'] = "";
        fchannel.send(fmessage + "Lower alert for " + acronym + " deleted.")
        functions.updateJsonFile("/JSON/personalAlerts",personalAlerts)
    } else if (alertBound == "b") {
        delete personalAlerts[discordID][acronym];
        fchannel.send(fmessage + "All alerts for " + acronym + " deleted.")
        functions.updateJsonFile("/JSON/personalAlerts",personalAlerts)
        return;
    }

    if (personalAlerts[discordID][acronym]['upper'] == "" && personalAlerts[discordID][acronym]['lower'] == "") {
        delete personalAlerts[discordID][acronym];
        functions.updateJsonFile("/JSON/personalAlerts",personalAlerts)
        return;
    }


}

exports.stockReport = async function stockReport(msg, args) {

    let fname = "Stock profile";
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    if (args.length == 0) {
        fchannel.send("Please choose a stock.")
        return;
    }

    let acronym = args[0].toUpperCase();
    if (!stocksLive[acronym]) {
        fchannel.send("Please choose a stock that exists.")
        return;
    }

    let stock = stocksLive[acronym]
    let price = stock.price;
    let tick = stock.latesttick;
    let tick_pct = tick/(price - tick) * 100;
    let market_cap = stock.market_cap;
    let market_cap_change = stock.market_cap_change;
    let market_cap_pct = market_cap_change / (market_cap - market_cap_change);
    let market_cap_15min = stock['15min_market_cap'];
    let market_cap_change_15min = stock['15min_market_cap_change']
    let market_cap_pct_15min = market_cap_change_15min / (market_cap_15min - market_cap_change_15min) * 100;
    let mc_direction = ""
    if (market_cap_pct_15min > 0) {
        mc_direction = "+"
    } else if (market_cap_pct_15min < 0) {
        mc_direction = "-"
    }
    let total_shares = stock.total_shares;
    let total_shares_change = stock.total_shares_change;
    let total_shares_pct = total_shares_change/(total_shares - total_shares_change);
    let total_shares_15min = stock['15min_total_shares'];
    let total_shares_change_15min = stock['15min_total_shares_change'];
    let total_shares_pct_15min = total_shares_change_15min/(total_shares_15min - total_shares_change_15min) * 100;
    let tc_direction = "";
    if (total_shares_pct_15min > 0) {
        tc_direction = "+"
    } else if (total_shares_pct_15min < 0) {
        tc_direction = "-"
    }

    market_cap = market_cap / 1000000000000
    market_cap_change_15min = market_cap_change_15min / 1000000000000


    const currentTime = Math.round(new Date().getTime() / 1000)

    let prices = stocksPrices[acronym]
    let high = 0, low = 10000, trend = "unavailable";
    let hourArray = [];

    for (let time in prices) {
        if (time > currentTime - 3630) {
            if (prices[time] > high) {
                high = prices[time]
            }
            if (prices[time] < low) {
                low = prices[time]
            }
            hourArray.push(prices[time])
        }
    }

    let sigma = await functions.stdev_pct(hourArray)

    let adxdetails = adx[acronym]
    let adxvalue,diplus,diminus;
    let direction = "unavailable", strength = "unavailable";
    for (let time in adxdetails) {
        if (time > currentTime - (60 * 60 * 2 + 30)) {
            adxvalue = adxdetails[time].adx
            diplus = adxdetails[time].diplus
            diminus = adxdetails[time].diminus

            if (diplus > diminus) {
                direction = "upwards"
            } else {
                direction = "downwards"
            }

            if (adxdetails[time].adx > 40) {
                strength = "Strong"
            } else if (adxdetails[time].adx < 20) {
                strength = "Weak"
            } else {
                strength = "Moderate"
            }
        }
    }

    trend = strength + " " + direction + " \n(ADX: " + adxvalue.toFixed(2) + ")";

    let filename = acronym + '_logo.png';
    let filepath = './Images/' + filename
    const embed = new Discord.MessageEmbed()
      .setColor(roles.MINKS_PINK)
      .setTitle(acronym)
      .attachFiles([filepath])
	  .setThumbnail('attachment://'+filename)
      .setURL('https://www.torn.com/page.php?sid=stocks')
      .addFields(
		      { name: 'Price', value: '$'+price, inline: true },
              { name: 'Latest Change', value: '$'+tick + " (" + tick_pct.toFixed(2) + "%)", inline: true },
              { name: '1hr Volatility' , value: sigma, inline: true }
      )
      .addFields(
		      { name: '1hr high', value: '$'+high, inline: true },
              { name: '1hr low', value: '$'+low, inline: true },
              { name: '2hr Trend', value: trend, inline: true },
      )
      .addFields(
		      { name: 'Market Cap', value: '$'+functions.numberWithCommas(market_cap.toFixed(3)) + "t", inline: true },
              { name: '15m change', value: '$'+functions.numberWithCommas(market_cap_change_15min.toFixed(3)) + "t (" + market_cap_pct_15min.toFixed(2) + "%)", inline: true },
              { name: '\u200b', value: '\u200b', inline: true },
      )
      .addFields(
		      { name: 'Total Shares', value: functions.numberWithCommas(total_shares), inline: true }, //+ " (" + total_shares_pct.toFixed(2) + "%)"
              { name: '15m change', value: functions.numberWithCommas(total_shares_change_15min) + " (" +total_shares_pct_15min.toFixed(2) + "%)", inline: true },
              { name: '\u200b', value: '\u200b', inline: true },
      )

    if (fmessage != "") {
        fchannel.send(fmessage)
    }
    fchannel.send(embed)

}

exports.marketCap = async function marketCap(msg, args) {

    let fname = "Total market cap";
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    let market_cap = 0, tcse = 0
    for (let acronym in stocksLive) {
        market_cap += stocksLive[acronym].market_cap
        tcse += stocksLive[acronym].price
    }



    const embed = new Discord.MessageEmbed()
      .setColor(roles.MINKS_PINK)
      .addFields(
          { name: 'TCSE', value: '$' + functions.numberWithCommas(tcse.toFixed(2)), inline: false},
          { name: fname, value: '$' + functions.numberWithCommas(market_cap), inline: false},
      )

    if (fmessage != "") {
        channel.send(fmessage)
    }
    fchannel.send(embed)

}

exports.trendingStocks = async function trendingStocks(msg,args) {

    let fname = "Stock trends (2hrs)";
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    const currentTime = Math.round(new Date().getTime() / 1000)

    for (let acronym in adx) {
        for (let time in adx[acronym]) {
            if (time > currentTime - 15.5 * 60) {
                let diplus = adx[acronym][time].diplus
                let diminus = adx[acronym][time].diminus
                let adxvalue = adx[acronym][time].adx
                let direction = "", strength = ""
                if (diplus>diminus) {
                    direction = "upwards"
                    if (adxvalue > 40) {
                        strength = "Strong"
                    } else if (adxvalue < 20) {
                        strength = "Weak"
                    } else {
                        strength = "Moderate"
                    }
                    embedMessage += "**"+acronym+"**: " + strength + " " + direction + " (ADX: " + adxvalue.toFixed(2) + ")\n"
                } else {
                    continue
                    direction = "downwards"
                }
            }
        }
    }

    const embed = new Discord.MessageEmbed()
      .setColor(roles.MINKS_PINK)
      .addFields(
          { name: fname, value: embedMessage, inline: false},
      )


    if (fmessage != "") {
        channel.send(fmessage)
    }
    fchannel.send(embed)

}

exports.help = async function help(msg, args) {

    let fname = "Help"
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    if (args.length == 0) {
        fchannel.send("Please me more specific.\n`!help alerts` for stock alerts help.")
        return;
    }

    if (args[0].toLowerCase() == "alerts") {

        fname += ": Alerts";
        embedMessage += "`!pa <stock> <l/u> <price>` \n_Set personal alerts. Bot will DM when `<stock>` passes one of the bounds._ \n \n"
        embedMessage += "`!vpa` \n_View your personal alerts. Works in DM or #stock-command._ \n \n"
        embedMessage += "`!da <stock> <l/u/b>` \n_Delete personal alerts (lower/upper/both) for `<stock>`._ \n \n "

    } else {
        return;
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

}

exports.investments = async function investments(msg, args) {

    let fname = "Investments over $100b";
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    let n_1m = 0, n_5m = 0, n_15m = 0, n_1h = 0, n_4h = 0;
    let pct_1m = 0, pct_5m = 0, pct_15m = 0, pct_1h = 0, pct_4h = 0;
    for (let acronym in invest) {
        for (let time in invest[acronym]) {
            if (invest[acronym][time] && invest[acronym][time]['price_4h'] != 0) {
                n_4h += 1;
                let change = (invest[acronym][time]['price_4h'] - invest[acronym][time]['price'])/invest[acronym][time]['price'] * 100;
                pct_4h += change;
            }

            if (invest[acronym][time] && invest[acronym][time]['price_1h'] != 0) {
                n_1h += 1;
                let change = (invest[acronym][time]['price_1h'] - invest[acronym][time]['price'])/invest[acronym][time]['price'] * 100;
                pct_1h += change;
            }

            if (invest[acronym][time] && invest[acronym][time]['price_15m'] != 0) {
                n_15m += 1;
                let change = (invest[acronym][time]['price_15m'] - invest[acronym][time]['price'])/invest[acronym][time]['price'] * 100;
                pct_15m += change;
            }

            if (invest[acronym][time] && invest[acronym][time]['price_5m'] != 0) {
                n_5m += 1;
                let change = (invest[acronym][time]['price_5m'] - invest[acronym][time]['price'])/invest[acronym][time]['price'] * 100;
                pct_5m += change;
            }

            if (invest[acronym][time] && invest[acronym][time]['price_1m'] != 0) {
                n_1m += 1;
                let change = (invest[acronym][time]['price_1m'] - invest[acronym][time]['price'])/invest[acronym][time]['price'] * 100;
                pct_1m += change;
            }
        }
    }


    avg_1m = pct_1m/n_1m
    avg_5m = pct_5m/n_5m
    avg_15m = pct_15m/n_15m
    avg_1h = pct_1h/n_1h
    avg_4h = pct_4h/n_4h
    embedMessage += "After 1 minute: " + avg_1m.toFixed(2) + "% (" + n_1m + " counts)\n";
    embedMessage += "After 5 minutes: " + avg_5m.toFixed(2) + "% (" + n_5m + " counts)\n";
    embedMessage += "After 15 minutes: " + avg_15m.toFixed(2) + "% (" + n_15m + " counts)\n";
    embedMessage += "After 1 hour: " + avg_1h.toFixed(2) + "% (" + n_1h + " counts)\n";
    embedMessage += "After 4 hours: " + avg_4h.toFixed(2) + "% (" + n_4h + " counts)\n";

    const embed = new Discord.MessageEmbed()
      .setColor(roles.MINKS_PINK)
      .addFields(
          { name: fname, value: embedMessage, inline: false},
      )


    if (fmessage != "") {
        fchannel.send(fmessage)
    }
    fchannel.send(embed)

}

exports.up = async function up(msg,args) {

    let fname = "Stock go brrr";
    let fresponse = await admin.getResponseChannel(msg, channels.STOCK_COMMAND_ID)
    let fchannel = fresponse[0], fmessage = fresponse[1];
    let cmessage = "", embedMessage = "";

    if (args.length == 0) {
        fchannel.send("Which stock should I make go up?!")
        return;
    }




    if (fmessage != "") {
        fchannel.send(fmessage)
    }
    fchannel.send(embed)


}

exports.charts = async function charts(msg, args) {
    // do stuff
    return
}

// misc JSON fixing functions
exports.addStockFields = async function addStockFields(args) {

    let time1 = 1618455616
    let time2 = 1618456516
    let time3 = 1618457416
    let time4 = 1618458316
    let time5 = 1618459216
    let time6 = 1618460116
    let time7 = 1618461016
    let time8 = 1618461916

    for (let acronym in dm) {

        // 1
        if (!dm[acronym][time1]['smoothdmplus']) {
            dm[acronym][time1]['smoothdmplus'] = dm[acronym][time1].dmplus;
        } else {
            dm[acronym][time1]['smoothdmplus'] = dm[acronym][time1].dmplus;
        }

        if (!dm[acronym][time1]['smoothdmminus']) {
            dm[acronym][time1]['smoothdmminus'] = dm[acronym][time1].dmminus;
        } else {
            dm[acronym][time1]['smoothdmminus'] = dm[acronym][time1].dmminus;
        }

        if (!dm[acronym][time1]['atr']) {
            dm[acronym][time1]['atr'] = dm[acronym][time1].truerange;
        } else {
            dm[acronym][time1]['atr'] = dm[acronym][time1].truerange;
        }

        // 2
        if (!dm[acronym][time2]['smoothdmplus']) {
            dm[acronym][time2]['smoothdmplus'] = dm[acronym][time2].dmplus / 2 + (1 - 1/2) * dm[acronym][time1].smoothdmplus ///
        } else {
            dm[acronym][time2]['smoothdmplus'] = dm[acronym][time2].dmplus / 2 + (1 - 1/2) * dm[acronym][time1].smoothdmplus ///
        }

        if (!dm[acronym][time2]['smoothdmminus']) {
            dm[acronym][time2]['smoothdmminus'] = dm[acronym][time2].dmminus / 2 + (1 - 1/2) * dm[acronym][time1].smoothdmminus ///
        } else {
            dm[acronym][time2]['smoothdmminus'] = dm[acronym][time2].dmminus / 2 + (1 - 1/2) * dm[acronym][time1].smoothdmminus ///
        }

        if (!dm[acronym][time2]['atr']) {
            dm[acronym][time2]['atr'] = (dm[acronym][time2].truerange + dm[acronym][time1].atr) / 2 ///
        } else {
            dm[acronym][time2]['atr'] = (dm[acronym][time2].truerange + dm[acronym][time1].atr) / 2///
        }

        // 3
        if (!dm[acronym][time3]['smoothdmplus']) {
            dm[acronym][time3]['smoothdmplus'] = dm[acronym][time3].dmplus / 3 + (1 - 1/3) * dm[acronym][time2].smoothdmplus ///
        } else {
            dm[acronym][time3]['smoothdmplus'] = dm[acronym][time3].dmplus / 3 + (1 - 1/3) * dm[acronym][time2].smoothdmplus ///
        }

        if (!dm[acronym][time3]['smoothdmminus']) {
            dm[acronym][time3]['smoothdmminus'] = dm[acronym][time3].dmminus / 3 + (1 - 1/3) * dm[acronym][time2].smoothdmminus ///
        } else {
            dm[acronym][time3]['smoothdmminus'] = dm[acronym][time3].dmminus / 3 + (1 - 1/3) * dm[acronym][time2].smoothdmminus ///
        }

        if (!dm[acronym][time3]['atr']) {
            dm[acronym][time3]['atr'] = (dm[acronym][time3].truerange + 2 * dm[acronym][time2].atr) / 3 ///
        } else {
            dm[acronym][time3]['atr'] = (dm[acronym][time3].truerange + 2 * dm[acronym][time2].atr) / 3///
        }

        // 4
        if (!dm[acronym][time4]['smoothdmplus']) {
            dm[acronym][time4]['smoothdmplus'] = dm[acronym][time4].dmplus / 4 + (1 - 1/4) * dm[acronym][time3].smoothdmplus ///
        } else {
            dm[acronym][time4]['smoothdmplus'] = dm[acronym][time4].dmplus / 4 + (1 - 1/4) * dm[acronym][time3].smoothdmplus ///
        }

        if (!dm[acronym][time4]['smoothdmminus']) {
            dm[acronym][time4]['smoothdmminus'] = dm[acronym][time4].dmminus / 4 + (1 - 1/4) * dm[acronym][time3].smoothdmminus ///
        } else {
            dm[acronym][time4]['smoothdmminus'] = dm[acronym][time4].dmminus / 4 + (1 - 1/4) * dm[acronym][time3].smoothdmminus ///
        }

        if (!dm[acronym][time4]['atr']) {
            dm[acronym][time4]['atr'] = (dm[acronym][time4].truerange + 3 * dm[acronym][time3].atr) / 4 ///
        } else {
            dm[acronym][time4]['atr'] = (dm[acronym][time4].truerange + 3 * dm[acronym][time3].atr) / 4///
        }

        // 5
        if (!dm[acronym][time5]['smoothdmplus']) {
            dm[acronym][time5]['smoothdmplus'] = dm[acronym][time5].dmplus / 5 + (1 - 1/5) * dm[acronym][time4].smoothdmplus ///
        } else {
            dm[acronym][time5]['smoothdmplus'] = dm[acronym][time5].dmplus / 5 + (1 - 1/5) * dm[acronym][time4].smoothdmplus ///
        }

        if (!dm[acronym][time5]['smoothdmminus']) {
            dm[acronym][time5]['smoothdmminus'] = dm[acronym][time5].dmminus / 5 + (1 - 1/5) * dm[acronym][time4].smoothdmminus ///
        } else {
            dm[acronym][time5]['smoothdmminus'] = dm[acronym][time5].dmminus / 5 + (1 - 1/5) * dm[acronym][time4].smoothdmminus ///
        }

        if (!dm[acronym][time5]['atr']) {
            dm[acronym][time5]['atr'] = (dm[acronym][time5].truerange + 4 * dm[acronym][time4].atr) / 5 ///
        } else {
            dm[acronym][time5]['atr'] = (dm[acronym][time5].truerange + 4 * dm[acronym][time4].atr) / 5 ///
        }

        // 6
        if (!dm[acronym][time6]['smoothdmplus']) {
            dm[acronym][time6]['smoothdmplus'] = dm[acronym][time6].dmplus / 6 + (1 - 1/6) * dm[acronym][time5].smoothdmplus ///
        } else {
            dm[acronym][time6]['smoothdmplus'] = dm[acronym][time6].dmplus / 6 + (1 - 1/6) * dm[acronym][time5].smoothdmplus ///
        }

        if (!dm[acronym][time6]['smoothdmminus']) {
            dm[acronym][time6]['smoothdmminus'] = dm[acronym][time6].dmminus / 6 + (1 - 1/6) * dm[acronym][time5].smoothdmminus ///
        } else {
            dm[acronym][time6]['smoothdmminus'] = dm[acronym][time6].dmminus / 6 + (1 - 1/6) * dm[acronym][time5].smoothdmminus ///
        }

        if (!dm[acronym][time6]['atr']) {
            dm[acronym][time6]['atr'] = (dm[acronym][time6].truerange + 5 * dm[acronym][time5].atr) / 6 ///
        } else {
            dm[acronym][time6]['atr'] = (dm[acronym][time6].truerange + 5 * dm[acronym][time5].atr) / 6///
        }

        // 7
        if (!dm[acronym][time7]['smoothdmplus']) {
            dm[acronym][time7]['smoothdmplus'] = dm[acronym][time7].dmplus / 7 + (1 - 1/7) * dm[acronym][time6].smoothdmplus ///
        } else {
            dm[acronym][time7]['smoothdmplus'] = dm[acronym][time7].dmplus / 7 + (1 - 1/7) * dm[acronym][time6].smoothdmplus ///
        }

        if (!dm[acronym][time7]['smoothdmminus']) {
            dm[acronym][time7]['smoothdmminus'] = dm[acronym][time7].dmminus / 7 + (1 - 1/7) * dm[acronym][time6].smoothdmminus ///
        } else {
            dm[acronym][time7]['smoothdmminus'] = dm[acronym][time7].dmminus / 7 + (1 - 1/7) * dm[acronym][time6].smoothdmminus ///
        }

        if (!dm[acronym][time7]['atr']) {
            dm[acronym][time7]['atr'] = (dm[acronym][time7].truerange + 6 * dm[acronym][time6].atr) / 7 ///
        } else {
            dm[acronym][time7]['atr'] = (dm[acronym][time7].truerange + 6 * dm[acronym][time6].atr) / 7 ///
        }

        // 8
        if (!dm[acronym][time8]['smoothdmplus']) {
            dm[acronym][time8]['smoothdmplus'] = dm[acronym][time8].dmplus / 8 + (1 - 1/8) * dm[acronym][time7].smoothdmplus ///
        } else {
            dm[acronym][time8]['smoothdmplus'] = dm[acronym][time8].dmplus / 8 + (1 - 1/8) * dm[acronym][time7].smoothdmplus ///
        }

        if (!dm[acronym][time8]['smoothdmminus']) {
            dm[acronym][time8]['smoothdmminus'] = dm[acronym][time8].dmminus / 8 + (1 - 1/8) * dm[acronym][time7].smoothdmminus ///
        } else {
            dm[acronym][time8]['smoothdmminus'] = dm[acronym][time8].dmminus / 8 + (1 - 1/8) * dm[acronym][time7].smoothdmminus ///
        }

        if (!dm[acronym][time8]['atr']) {
            dm[acronym][time8]['atr'] = (dm[acronym][time8].truerange + 7 * dm[acronym][time7].atr) / 8 ///
        } else {
            dm[acronym][time8]['atr'] = (dm[acronym][time8].truerange + 7 * dm[acronym][time7].atr) / 8 ///
        }

    }

    functions.updateJsonFile("/JSON/dm",dm)

}

exports.fixadx = async function fixadx(args) {
    time = 1618462816

    for (let acronym in adx) {
        adx[acronym][time].adx = 100 * Math.abs(adx[acronym][time].diplus  - adx[acronym][time].diminus ) / Math.abs(adx[acronym][time].diplus  + adx[acronym][time].diminus)
    }

    functions.updateJsonFile("/JSON/adx",adx)
}
