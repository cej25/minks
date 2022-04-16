const Commando = require('discord.js-commando')
const { CanvasRenderService } = require('chartjs-node-canvas')

const data = require('../JSON/chart-data.json')

module.exports = class ChartCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'chart',
            group: 'misc',
            memberName: 'chart',
            description: 'Displays a chart'
        })
    }

    run = async (message) => {
        console.log(data)

    }
}
