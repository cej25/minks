let admin = require('./admin.js');
let stocks = require('./stocks.js');
let chart = require('./chart.js');
let fight = require('./fightSim.js');

exports.commands = async function commands(msg, args, command) {
    switch(command) {
        case 'verify': {
            msg.channel.send("I'm going to verify here!")
            //admin.verifyUser(args)
            // verify self: !verify
            // admin verify another user: !verify @user
            // admin verify all: !verify all
            break;

        }

        case 'ar': {
            admin.addUserRole(msg, args)
            //user add allowed roles: !ar role1 role 2 ..
            //admin assign role: !ar @user role1 role2 ..
            break;
        }

        case 'dr': {
            admin.deleteUserRole(msg, args)
            //user add allowed roles: !ar role1 role 2 ..
            //admin assign role: !ar @user role1 role2 ..
            break;
        }

        case 'api': {
            admin.storeApiKey(msg, args)
            break;
        }

        case 'addquote': {
            admin.addQuote(msg, args)
            break;
        }

        case 'quote': {
            admin.findQuote(msg, args)
            break;
        }

        case 'fight': {
            fight.simulation(args)
            break;
        }

        /*
        case 'stock': {
            stocks.stockReport(msg,args)
            break;
        }

        case 'pa': {
            stocks.stockAlerts(msg,args)
            break;
        }

        case 'vpa': {
            stocks.getPersonalAlerts(msg,args)
            break;
        }

        case 'da': {
            stocks.deleteStockAlert(msg,args)
            break;
        }

        case 'mc': {
            stocks.marketCap(msg, args)
            break;
        }

        case 'trends': {
            stocks.trendingStocks(msg, args)
            break;
        }

        case 'invests': {
            stocks.investments(msg, args)
            break;
        }

        case 'help': {
            stocks.help(msg,args)
            break;
        }

        case 'asf': {
            stocks.addStockFields(args)
            break;
        }

        case 'fadx': {
            stocks.fixadx(args)
            break;
        }
        */

        case 'chart': {
            chart.ChartCommand()
            break;

        }
    }
}
