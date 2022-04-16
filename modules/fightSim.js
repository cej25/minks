/*
v2.01.01
- severe burning turns fixed (9 --> 5)
- "clubmastery" -> "clubbingmastery"
*/
const Discord = require('discord.js')
let functions = require('../modules/general.js')
let roles = require('../consts/roles.js');
let channels = require('../consts/channels.js')
let players = require('../JSON/players.json')
let a = require('../JSON/armorCoverage.json')
let t = require('../JSON/tempBlock.json')
let m = require('../JSON/mods.json')

exports.simulation = async function simulation(args) {

    channel = botChannels.get(channels.BOT_TESTING_ID)

    if (isNaN(args[0])) {
        channel.send("First argument must be a Torn ID")
        return;
    } else {
        if (!players[args[0].toString()]) {
            channel.send("No information for first ID")
            return;
        } else {
            h = clone(players[args[0].toString()]);
            h.position = "attack"
        }
    }

    if (isNaN(args[1])) {
        channel.send("Seconds argument must be a Torn ID")
        return;
    } else {
        if (!players[args[1].toString()]) {
            channel.send("No information for second ID")
            return;
        } else {
            v = clone(players[args[1].toString()]);
            v.position = "defend"
            //v = Object.assign({}, players[args[1].toString()]);
        }
    }

    let trials = 1;
    if (!args[2]) {
        // do not change default
    } else {
        if (isNaN(args[2])) {
            channel.send("Third argument must be an integer number of trial fights.")
            return;
        } else {
            if (args[2] % 1 != 0) {
                // do not change default
            } else {
                trials = args[2];
            }
        }
    }

    h.armor_bonus_total = 0;
    v.armor_bonus_total = 0;

    let h_count = 0, v_count = 0;
    let hA_set = h.armor.head.set, vA_set = v.armor.head.set;
    let hA_bonus = 0, vA_bonus = 0;

    // count for full set, add up Delta bonus
    for (let i in h.armor) {
        if (h.armor[i].set == hA_set && hA_set != "n/a") {
            h_count += 1;
            if (hA_set == "Delta") {
                hA_bonus += h.armor[i].bonus.value;
            }
        }
    }
    for (let i in v.armor) {
        if (v.armor[i].set == vA_set && vA_set != "n/a") {
            v_count += 1;
            if (vA_set == "Delta") {
                vA_bonus += v.armor[i].bonus.value;
            }
        }
    }

    // add full set bonuses
    let h_comp = h.perks.company, v_comp = v.perks.company;

    if (h_count == 5) {
        if (hA_set == "Riot" || hA_set == "Assault") {
            for (let i in h.armor) {
                h.armor[i].bonus.value += 10;
            }
        } else if (hA_set == "Dune") {
            for (let i in h.armor) {
                h.armor[i].bonus.value += 15;
            }
        } else if (hA_set == "Delta") {
            hA_bonus += 15;
        } else if (hA_set == "EOD") {
            for (let i in h.armor) {
                // separate because unsure if 10, 15, 20 etc
                h.armor[i].bonus.value += 10;
            }
        }

        if (h_comp.name == "Private Security Firm" && h_comp.star >= 7) {
            for (let i in h.armor) {
                h.armor[i].armor *= 1.25
            }
        }

    }

    if (v_count == 5) {
        if (vA_set == "Riot" || vA_set == "Assault") {
            for (let i in v.armor) {
                v.armor[i].bonus.value += 10;
            }
        } else if (vA_set == "Dune") {
            for (let i in v.armor) {
                v.armor[i].bonus.value += 15;
            }
        } else if (vA_set == "Delta") {
            vA_bonus += 15;
        } else if (vA_set == "EOD") {
            for (let i in v.armor) {
                v.armor[i].bonus.value += 10;
            }
        }

        if (v_comp.name == "Private Security Firm" && v_comp.star >= 7) {
            for (let i in v.armor) {
                v.armor[i].armor *= 1.25
            }
        }
    }

    h.armor_bonus_total += hA_bonus;
    v.armor_bonus_total += vA_bonus;

    if (h_comp.name == "Clothing Store" && h_comp.star >= 7) {
        for (let i in h.armor) {
            h.armor[i].armor *= 1.2
        }
    }

    if (v_comp.name == "Clothing Store" && v_comp.star >= 7) {
        for (let i in v.armor) {
            v.armor[i].armor *= 1.2
        }
    }


    //hWin, vWin, stale, turns,  hLife, vLife, hProcs, vProcs
    let results = {
        "hero_wins": 0,
        "stalemate": 0,
        "villain_wins": 0,
        "hero_escapes": 0,
        "turns": 0,
        "hero_life": 0,
        "villain_life": 0
    }

    let time_label = h.name + " vs. " + v.name + " - " + trials + " fights"
    console.time(time_label)
    for (let i=0;i<trials;i++) {
        fight(h,v,results)
    }

    let hBasicInfo = "Strength: " + functions.numberWithCommas(h['battlestats']['strength']) + "\n"
                    + "Speed: " + functions.numberWithCommas(h['battlestats']['speed']) + "\n"
                    + "Defense: " + functions.numberWithCommas(h['battlestats']['defense']) + "\n"
                    + "Dexterity: " + functions.numberWithCommas(h['battlestats']['dexterity']) + "\n \n"
                    + "Primary - DMG: " + h['weapons']['primary']['damage'] + " | ACC: " + h['weapons']['primary']['accuracy'] + "\n"
                    //+ "Melee - DMG: " + h['weapons']['melee']['damage'] + " | ACC: " + h['weapons']['melee']['accuracy'];
                    //+ "\nHas 100% XP";

    let vBasicInfo = "Strength: " + functions.numberWithCommas(v['battlestats']['strength']) + "\n"
                    + "Speed: " + functions.numberWithCommas(v['battlestats']['speed']) + "\n"
                    + "Defense: " + functions.numberWithCommas(v['battlestats']['defense']) + "\n"
                    + "Dexterity: " + functions.numberWithCommas(v['battlestats']['dexterity']) + "\n \n"
                    + "Primary - DMG: " + v['weapons']['primary']['damage'] + " | ACC: " + v['weapons']['primary']['accuracy'] + "\n"
                    //+ "Melee - DMG: " + v['weapons']['melee']['damage'] + " | ACC: " + v['weapons']['melee']['accuracy'];

    let h_score = (results.hero_wins * 3) / trials;
    let v_score = (results.villain_wins * 3 + results.hero_escapes + results.stalemate) / trials;
    let ratio = h_score/v_score;
    let diff = h_score-v_score;

    const embed = new Discord.MessageEmbed()
      .setColor(roles.MINKS_PINK)
      .addFields(
		      { name: h.name, value: hBasicInfo, inline: true },
          { name: v.name, value: vBasicInfo, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
      )
      .addFields(
		      { name: h.name + " Wins:", value: results.hero_wins, inline: true },
          { name: v.name + " Wins:", value: results.villain_wins, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
      )
      .addFields(
          { name: "Stalemates:", value: results.stalemate, inline: true },
          { name: "Average turns:", value: results.turns/trials, inline: true },
          { name: "Average life", value: Math.round(results.hero_life/trials) + ", " + Math.round(results.villain_life/trials), inline: true },
          { name: "Hero escapes:", value: results.hero_escapes, inline: true },
          { name: "Hero score: ", value: h_score, inline: true },
          { name: "Villain score: ", value: v_score, inline: true },
          { name: "Ratio | Difference: ", value: ratio + " | " + diff, inline: true },
      )
      /*
      .addFields(
          { name: "Average special procs:", value: results[6]/trials + ", " + results[7]/trials, inline: false },
      )
      */

      channel.send(embed)
      console.timeEnd(time_label)

}

function fight(h,v,results) {

    let f_track = {};
    f_track.turns = 0, f_track.time = 300;
    f_track.escape_attempted = false, f_track.escape = false;
    f_track.life_tick = false;

    let h_track = {}, v_track = {};
    h_track.current_life = clone(h.life);
    v_track.current_life = clone(v.life);
    h_track.turn = "miss", h_track.average_damage = 0;
    v_track.turn = "miss", v_track.average_damage = 0;

    h_track.weapon_settings = clone(h.weaponsettings.attacksettings);
    v_track.weapon_settings = clone(v.weaponsettings.defendsettings);
    h_track.chosen_weapon = "";
    v_track.chosen_weapon = "";
    h_track.weapon_state = {
        "primary": weapon_state(h,h.weapons.primary),
        "secondary": weapon_state(h,h.weapons.secondary),
        "melee": {
            "storage_used": false,
            "dropped": false
        },
        "temporary": "n/a"
    }
    v_track.weapon_state = {
        "primary": weapon_state(v,v.weapons.primary),
        "secondary": weapon_state(v,v.weapons.secondary),
        "melee": {
            "storage_used": false,
            "dropped": false
        },
        "temporary": "n/a"
    }
    h_track.status_effects = {
        "dealt": {
            "demoralized": 0,
            "frozen": 0,
            "withered": 0,
            "slowed": 0,
            "weakened": 0,
            "crippled": 0,
            "eviscerated": 0,
            "motivated": 0,
            "sleep": 0,
            "confused": 0
        },
        "received": {
            "demoralized": 0,
            "frozen": 0,
            "withered": 0,
            "slowed": 0,
            "weakened": 0,
            "crippled": 0,
            "eviscerated": 0,
            "motivated": 0,
            "sleep": 0,
            "confused": 0
        },
    }
    h_track.dot_effects = {
        "burning": {
            "damage": 0,
            "turns": 0
        },
        "severe_burning": {
            "damage": 0,
            "turns": 0
        },
        "lacerated": {
            "damage": 0,
            "turns": 0
        },
        "poisoned": {
            "damage": 0,
            "turns": 0
        }
    }
    h_track.temp_effects = {
        "epinephrine": {
            "time": 0
        },
        "melatonin": {
            "time": 0
        },
        "serotonin": {
            "time": 0
        },
        "tyrosine": {
            "time": 0
        },
        "smoke_grenade": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "tear_gas": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "flash_grenade": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "pepper_spray": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "sand": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "concussion_grenade": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        }
    }
    v_track.status_effects = {
        "dealt": {
            "demoralized": 0,
            "frozen": 0,
            "withered": 0,
            "slowed": 0,
            "weakened": 0,
            "crippled": 0,
            "eviscerated": 0,
            "motivated": 0,
            "sleep": 0,
            "confused": 0
        },
        "received": {
            "demoralized": 0,
            "frozen": 0,
            "withered": 0,
            "slowed": 0,
            "weakened": 0,
            "crippled": 0,
            "eviscerated": 0,
            "motivated": 0,
            "sleep": 0,
            "confused": 0
        },
    }
    v_track.dot_effects = {
        "burning": {
            "damage": 0,
            "turns": 0
        },
        "severe_burning": {
            "damage": 0,
            "turns": 0
        },
        "lacerated": {
            "damage": 0,
            "turns": 0
        },
        "poisoned": {
            "damage": 0,
            "turns": 0
        },
        "bleed": {
            "damage": 0,
            "turns": 0
        }
    }
    v_track.temp_effects = {
        "epinephrine": {
            "time": 0
        },
        "melatonin": {
            "time": 0
        },
        "serotonin": {
            "time": 0
        },
        "tyrosine": {
            "time": 0
        },
        "smoke_grenade": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "tear_gas": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "flash_grenade": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "pepper_spray": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "sand": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        },
        "concussion_grenade": {
            "number": 0,
            "time_one": 0,
            "time_two": 0,
        }
    }

    let log;
    for (let i = 0; i < 25; i++) {

        log = take_turns(h, v, h_track, v_track, f_track)

        if (h_track.current_life == 0) {
            results.villain_wins += 1;
            log += v.name + " won. ";
            //console.log(log)
            break;
        } else if (v_track.current_life == 0) {
            results.hero_wins += 1;
            log += h.name + " won. ";
            //console.log(log)
            break;
        } else if (f_track.escape == true) {
            results.hero_escapes += 1;
            //console.log(log)
            break;
        }

        //console.log(log)

    }

    if (f_track.turns == 25 && h_track.current_life > 0 && v_track.current_life > 0) {
        log += "Stalemate."
        results.stalemate += 1;
    }

    results.turns += f_track.turns;
    results.hero_life += h_track.current_life;
    results.villain_life += v_track.current_life;
    /*results[6] += hProcs;
    results[7] += vProcs;*/
    return;

}

function take_turns(h, v, h_track, v_track, f_track) {

    f_track.turns += 1, f_track.time -= 1;
    let log = "";

    // random life tick
    if (f_track.life_tick == false) {
        rng = Math.floor(Math.random() * 300 + 1)
        if (rng == 1) {
            h_life = Math.min(0.05 * h.life, h.life - h_track.current_life);
            v_life = Math.min(0.05 * v.life, v.life - v_track.current_life);
            h_track.current_life += h_life;
            v_track.current_life += v_life;
            log += "Life tick: " + h.name + " gained " + h_life + " life, " + v.name + " gained " + v_life + " life. \n";
            f_track.life_tick = true;
        }
    }

    // choose weapons
    h_track.chosen_weapon = choose_weapon(h,h_track.weapon_settings)
    v_track.chosen_weapon = choose_weapon(v,v_track.weapon_settings)

    log = action(log, h, v, h_track, v_track, f_track)

    if (v_track.current_life == 0) {
        return log;
    } else if (f_track.escape == true) {
        return log;
    }

    log = action(log, v, h, v_track, h_track, f_track)

    return log;

}

function action(log, x, y, x_track, y_track, f_track) {

    let xW = x.weapons, xA = clone(x.armor);
    let xCW = x_track.chosen_weapon;
    let x_comp = x.perks.company;

    let yW = y.weapons, yA = clone(y.armor);
    let yCW = y_track.chosen_weapon;
    let y_comp = y.perks.company;

    // apply perks, mods, temps
    let pmt = apply_pmt(x, y, xCW, yCW, xA, yA, x_track, y_track, f_track)
    let xSTR = pmt[0][0], xSPD = pmt[0][1], xDEF = pmt[0][2], xDEX = pmt[0][3];
    let ySTR = pmt[1][0], ySPD = pmt[1][1], yDEF = pmt[1][2], yDEX = pmt[1][3];

    // reduce turns left on temp. Delete from temps if turns run out.

    for (let temp in x_track.temp_effects) {
        if (x_track.temp_effects[temp].time > 0) {
            x_track.temp_effects[temp].time -= 1;
        }
        if (x_track.temp_effects[temp].time_one > 0) {
            x_track.temp_effects[temp].time_one -= 1;
            if (x_track.temp_effects[temp].time_one == 0) {
                x_track.temp_effects[temp].number -= 1;
            }
        }
        if (x_track.temp_effects[temp].time_two > 0) {
            x_track.temp_effects[temp].time_two -= 1;
            if (x_track.temp_effects[temp].time_two == 0) {
                x_track.temp_effects[temp].number -= 1;
            }
        }
    }

    let xDMG = 0;

    // ------- check if turn needs to be skipped ----------------
    if (x_track.status_effects.received.stunned > 0) {
        if (x_track.status_effects.received.stunned == 1) {
            log += x.name + " is stunned. \n";
            x_track.status_effects.received.stunned = 0;
            x_track.average_damage = (x_track.average_damage * (f_track.turns - 1) + xDMG) / f_track.turns;
            return log;
        } else if (x_track.status_effects.received.stunned == 2) {
            x_track.status_effects.received.stunned = 1;
        } else if (x_track.status_effects.received.stunned > 2) {
            log += x.name + " is stunned. \n";
            x_track.status_effects.received.stunned = 1;
            x_track.average_damage = (x_track.average_damage * (f_track.turns - 1) + xDMG) / f_track.turns;
            return log;
        }
    }

    // if stun procs and stun is not already procd (= 0) , set to 2 for attack and 1 for defend
    // if stun == 1, enemy is stunned, reduce to 0
    // if stun == 2, enemy is not stunned yet, but reduce to 1 (not by 1)
    // if stun procs and stun == 1, set to 4 for attack and 3 for defend
    // if stun == 3 or 4, enemy is stunned, reduce to 1
    // lets test...


    if (x_track.status_effects.received.paralyzed > 0) {
        if (x_track.status_effects.received.paralyzed == 1) {
            let rng = Math.floor(Math.random() * 2 + 1)
            if (rng == 1) {
                log += x.name + " is paralyzed. \n";
                x_track.average_damage = (x_track.average_damage * (f_track.turns - 1) + xDMG) / f_track.turns;
                return log;
            }
        } else if (x_track.status_effects.received.paralyzed == 2) {
            x_track.status_effects.received.paralyzed = 1
        }
    }

    if (x_track.status_effects.received.suppressed > 0) {
        let rng = Math.floor(Math.random() * 4 + 1)
        if (rng == 1) {
            log += x.name + " is suppressed. \n";
            x_track.average_damage = (x_track.average_damage * (f_track.turns - 1) + xDMG) / f_track.turns;
            return log;
        }
    }

    // ------- here make actual turn damage ---------------------

    // start escape attempt
    if (x_track.weapon_settings.escape == true && y_track.turn == "miss") {

        //if (x_track.current_life < 0.2 * x.life && y_track.current_life > 0.3 * y.life) {
        if (x_track.current_life < y_track.average_damage && x_track.current_life < y_track.current_life) {
            f_track.escape_attempted = true;
            x_track.average_damage = (x_track.average_damage * (f_track.turns - 1) + xDMG) / f_track.turns;
            return log;
        }
    }

    if (x_track.weapon_state[xCW].ammo_left == 0 && x_track.weapon_settings[xCW].reload == true) {

        // add reload to the log fight log
        x_track.turn = "miss";
        if (f_track.escape_attempted == true) {
            log += y.name + " escaped. \n";
            f_track.escape = true;
            return log;

        } else {
            log += x.name + " reloaded their " + xW[xCW].name + ". \n";
        }

        x_track.weapon_state[xCW].ammo_left = x_track.weapon_state[xCW].max_ammo;

        if (y_comp.name == "Gas Station" && y_comp.star >= 5) {
            rng = Math.floor(Math.random() * 10 + 1)
            if (rng == 1) {
                life = parseInt(0.2 * y.life)
                if (y_track.current_life + life > y.life) {
                    life = y.life - y_track.current_life
                }
                y_track.current_life += life;
                log += y.name + " cauterized their wound and recovered " + life + " life \n";
            }
        }

        for (let dot in x_track.dot_effects) {

            if (y_track.current_life > 1 && x_track.dot_effects[dot].turns > 0) {

                let dotDMG;
                if (dot == "burning") {

                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.15 / 5 * (6 - x_track.dot_effects[dot].turns)))
                    if (y_comp.name == "Gas Station" && y_comp.star >= 7) {
                        dotDMG = parseInt(dotDMG / 1.5)
                    }
                    if (x_comp.name == "Gas Station" && x_comp.star == 10) {
                        dotDMG = parseInt(dotDMG * 1.5)
                    }
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Burning damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 5) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                } else if (dot == "poisoned") {

                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.45 / 15 * (16 - x_track.dot_effects[dot].turns)))
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Poison damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 15) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                } else if (dot == "lacerated") {
                    // Lacerate
                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.90 / 9 * (10 - x_track.dot_effects[dot].turns)))
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Laceration damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 9) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                } else if (dot == "severe_burning") {

                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.15 / 5 * (10 - x_track.dot_effects[dot].turns)))
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Severe burning damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 5) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                }

                y_track.current_life -= dotDMG;
                x_track.dot_effects[dot].turns += 1;

            }

        }


    } else {

        // basic hit chance, final hc, max dmg, damage mitigation, weapon damage,
        // armor mitigation, hit or miss, damage variance, final damage, rounds fired
        let xBHC, xFHC, xBP, xMD, yDM, xWD, yAM, xHOM, xDV, xRF;
        // armor penetration, ammo dmg multi
        let x_pen = 1, x_ammo_dmg = 1;

        // non-damaging temps will not produce HOM chance, damage value, nor rounds fired
        if (xW[xCW].category != "Non-Damaging") {

            if (xCW == "primary" || xCW == "secondary") {
                xRF = roundsFired(xW[xCW],x_track.weapon_state[xCW])
                if (xW[xCW].ammo == "TR") {
                    x_track.bonus.acc += 10
                } else if (xW[xCW].ammo == "PI") {
                    x_pen = 1 / 0.5 // reduced to 50%
                } else if (xW[xCW].ammo == "HP") {
                    x_pen = 1 / 1.5 // increased by 50%
                    x_ammo_dmg = 1.5
                } else if (xW[xCW].ammo == "IN") {
                    x_ammo_dmg = 1.4
                }
            }

            xBHC = hitChance(xSPD,yDEX)
            xFHC = applyAccuracy(xBHC,xW[xCW].accuracy,x_track.bonus.acc)
            xHOM = hitOrMiss(xFHC);

            if (xHOM == 1) {

                if (xCW == "temporary" && xW[xCW].name != "Ninja Stars" && xW[xCW].name != "Throwing Knife") {
                    xBP = ["chest",1/1.75];
                } else {
                    xBP = selectBodyPart(x,x_track.bonus.crit_rate);
                }

                let mitigation = armorMitigation(xBP[0],yA)

                xMD = maxDamage(xSTR);
                yDM = (100-damageMitigation(yDEF,xSTR))/100;
                xWD = xW[xCW].damage / 10;
                yAM = (100 - mitigation[0]/x_pen)/100;
                xDV = variance();
                xDMG = Math.round(xBP[1] * xMD * yDM * xWD * yAM * xDV * (1+x_track.bonus.dmg/100) * x_ammo_dmg);

                let set = mitigation[1].split(' ');
                let yA_bonus;
                for (let i in yA) {
                    if (yA[i].type == mitigation[1]) {
                        yA_bonus = yA[i].bonus.value;
                        break;
                    }
                }
                if (set[0] == "EOD") {

                    let y_proc = procBonus(yA_bonus)
                    if (y_proc == 1) {
                        xDMG = 0;
                        log += "Damage fully blocked by EOD bonus! \n";
                    }

                } else if (set[0] == "Dune") {

                    if (y_track.current_life < 0.25 * y.life) {
                        xDMG = parseInt(xDMG * (100 - yA_bonus)/100)
                    }

                } else if (set[0] == "Assault") {
                    // check for guns/ammo
                    if (xCW == "primary" || xCW == "secondary") {
                        xDMG = parseInt(xDMG * (100 - yA_bonus)/100)
                    }

                } else if (set[0] == "Riot") {

                    if (xCW == "melee") {
                        xDMG = parseInt(xDMG * (100 - yA_bonus)/100)
                    }

                }

            }

        }

        if (xCW == "primary") {

            let xRF;
            if (xW[xCW].bonus.name== "Spray" && x_track.weapon_state[xCW].ammo_left == x_track.weapon_state[xCW].max_ammo) {

                let x_proc = procBonus(xW[xCW].bonus.proc)
                if (x_proc == 1) {

                    xDMG *= 2
                    if (xDMG > y_track.current_life) {
                        xDMG = y_track.current_life;
                    }

                    xRF = x_track.weapon_state[xCW].max_ammo;
                    if (xHOM == 1) {

                        x_track.turn = "hit";
                        if (f_track.escape_attempted == true) {
                            log += y.name + " attempted to escape but failed. \n";
                            f_track.escape_attempted = false;
                        }

                        log += x.name + " sprayed " + xRF + " " + xW[xCW].ammo + " rounds of their "
                                        + xW[xCW].name + " hitting " + y.name + " in the "
                                        + xBP[0] + " for " + xDMG + "\n";

                    } else {

                        x_track.turn = "miss";
                        if (f_track.escape_attempted == true) {
                            log += y.name + " escaped. \n";
                            f_track.escape = true;
                            return log;

                        } else {
                            log += x.name + " sprayed " + xRF + " " + xW[xCW].ammo + " rounds of their "
                                            + xW[xCW].name + " missing " + y.name + "\n";
                        }

                    }

                } else {

                    if (xDMG > y_track.current_life) {
                        xDMG = y_track.current_life;
                    }
                    xRF = roundsFired(xW[xCW],x_track.weapon_state[xCW])
                    if (xHOM == 1) {

                        x_track.turn = "hit";
                        if (f_track.escape_attempted == true) {
                            log += y.name + " attempted to escape but failed. \n";
                            f_track.escape_attempted = false;
                        }

                        log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                      + "their " + xW[xCW].name + " hitting "
                                      + y.name + " in the " + xBP[0] + " for "
                                      + xDMG + "\n";


                    } else {

                        x_track.turn = "miss";
                        if (f_track.escape_attempted == true) {
                            log += y.name + " escaped. \n";
                            f_track.escape = true;
                            return log;

                        } else {
                            log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                        + "their " + xW[xCW].name + " missing "
                                        + y.name + "\n";
                        }
                    }
                }



            } else {

                if (xDMG > y_track.current_life) {
                    xDMG = y_track.current_life;
                }

                xRF = roundsFired(xW[xCW],x_track.weapon_state[xCW])
                if (xHOM == 1) {

                    x_track.turn = "hit";
                    if (f_track.escape_attempted == true) {
                        log += y.name + " attempted to escape but failed. \n";
                        f_track.escape_attempted = false;
                    }

                    log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                    + "their " + xW[xCW].name + " hitting "
                                    + y.name + " in the " + xBP[0] + " for "
                                    + xDMG + "\n";

                    if (xW[xCW].bonus.name == "Demoralize") {
                        if (x_track.status_effects.dealt.demoralized < 5) {
                            let x_proc = procBonus(xW[xCW].bonus.proc);
                            if (x_proc == 1) {
                                x_track.status_effects.dealt.demoralized += 1;
                                y_track.status_effects.received.demoralized += 1;
                                log += y.name + " has been Demoralized. \n";
                            }
                        }
                    } else if (xW[xCW].bonus.name == "Freeze") {
                        if (x_track.status_effects.dealt.frozen < 1) {
                            let x_proc = procBonus(xW[xCW].bonus.proc);
                            if (x_proc == 1) {
                                x_track.status_effects.dealt.frozen += 1;
                                y_track.status_effects.received.frozen += 1;
                                log += y.name + " has been Frozen. \n";
                            }
                        }
                    } else if (xW[xCW].bonus.name == "Blindfire" && x_track.weapon_state[xCW].ammo_left - xRF != 0) {

                        let x_proc = procBonus(xW[xCW].bonus.proc);
                        if (x_proc == 1) {

                            let totalDMG = xDMG,totalRounds = xRF;
                            for (let i = 0;i<15;i++) {

                                x_track.bonus.acc -= 5;
                                xFHC = applyAccuracy(xBHC,xW[xCW].accuracy,x_track.bonus.acc);
                                xHOM = hitOrMiss(xFHC);

                                if (xHOM == 1) {

                                    let mitigation = armorMitigation(xBP[0],yA)

                                    xBP = selectBodyPart(x_track.bonus.crit_rate);
                                    yAM = (100 - mitigation[0]/x_pen)/100;
                                    xDV = variance();
                                    xDMG = Math.round(xBP[1] * xMD * yDM * xWD * yAM * xDV * (1+x_track.bonus.dmg/100) * x_ammo_dmg);

                                    let set = mitigation[1].split(' ');
                                    let yA_bonus;
                                    for (let i in yA) {
                                        if (yA[i].type == mitigation[1]) {
                                            yA_bonus = yA[i].bonus.value;
                                            break;
                                        }
                                    }
                                    if (set[0] == "EOD") {

                                        let y_proc = procBonus(yA_bonus)
                                        if (y_proc == 1) {
                                            xDMG = 0;
                                            log += "Damage fully blocked by EOD bonus! \n";
                                        }

                                    } else if (set[0] == "Dune") {

                                        if (y_track.current_life < 0.25 * y.life) {
                                            xDMG = parseInt(xDMG * (100 - yA_bonus)/100)
                                        }

                                    } else if (set[0] == "Assault") {
                                        // check for guns/ammo
                                        if (xCW == "primary" || xCW == "secondary") {
                                            xDMG = parseInt(xDMG * (100 - yA_bonus)/100)
                                        }

                                    } else if (set[0] == "Riot") {

                                        if (xCW == "melee") {
                                            xDMG = parseInt(xDMG * (100 - yA_bonus)/100)
                                        }

                                    }

                                }

                                if (totalDMG + xDMG > y_track.current_life) {
                                    xDMG = y_track.current_life - totalDMG;
                                }

                                xRF = roundsFired(xW[xCW],x_track.weapon_state[xCW])

                                if (totalRounds + xRF > x_track.weapon_state[xCW].ammo_left) {
                                    xRF = x_track.weapon_state[xCW].ammo_left - totalRounds;
                                    if (xRF <= 0) {
                                        break;
                                    }
                                }

                                if (xHOM == 1) {

                                    log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                                    + "their " + xW[xCW].name + " hitting "
                                                    + y.name + " in the " + xBP[0] + " for "
                                                    + xDMG + "\n";
                                } else {
                                    log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                                    + "their " + xW[xCW].name + " missing "
                                                    + y.name + "\n";
                                }

                                totalDMG += xDMG;
                                if (totalDMG == y_track.current_life) {
                                    xDMG = totalDMG; // pass total value back to hDMG to subtract it from yCL
                                    xRF = totalRounds;
                                    break;
                                }

                                totalRounds += xRF;
                                if (totalRounds == x_track.weapon_state[xCW].ammo_left) {
                                    xDMG = totalDMG; // pass total value back to hDMG to subtract it from yCL
                                    xRF = totalRounds;
                                    break;
                                }

                            }

                        }

                    }

                } else {

                    x_track.turn = "miss";
                    if (f_track.escape_attempted == true) {
                        log += y.name + " escaped. \n";
                        f_track.escape = true;
                        return log;

                    } else {
                        log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                    + "their " + xW[xCW].name + " missing "
                                    + y.name + "\n";
                    }
                }
            }

            x_track.weapon_state[xCW].ammo_left -= xRF;
            if (x_track.weapon_state[xCW].ammo_left == 0) {
                x_track.weapon_state[xCW].clips_left -= 1;
                if (x_track.weapon_state[xCW].clips_left == 0 || x_track.weapon_settings[xCW].reload != true) {
                    x_track.weapon_settings[xCW].setting = 0;
                }
            }

        } else if (xCW == "secondary") {

            if (xDMG > y_track.current_life) {
                xDMG = y_track.current_life;
            }

            let xRF = roundsFired(xW[xCW],x_track.weapon_state[xCW]);

            if (xHOM == 1) {

                x_track.turn = "hit";
                if (f_track.escape_attempted == true) {
                    log += y.name + " attempted to escape but failed. \n";
                    f_track.escape_attempted = false;
                }

                log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                + "their " + xW[xCW].name + " hitting "
                                + y.name + " in the " + xBP[0] + " for "
                                + xDMG + "\n";

                if (xW[xCW].bonus.name == "Burn") {

                    let x_proc = procBonus(xW[xCW].bonus.proc);
                    if (x_proc == 1) {
                        // does it override?
                        if (x_track.dot_effects.burning.damage > 0) {
                            if (xDMG >= x_track.dot_effects.burning.damage * 0.15 / 5 * (6 - x_track.dot_effects.burning.turns)) {
                                x_track.dot_effects.burning.damage = xDMG;
                                x_track.dot_effects.burning.turns = 0;
                                log += y.name + " is set alight \n";
                            }
                        } else {
                            x_track.dot_effects.burning.damage = xDMG;
                            x_track.dot_effects.burning.turns = 0;
                            log += y.name + " is set alight \n";
                        }
                    }
                } else if (xW[xCW].bonus.name == "Poison") {

                    let x_proc = procBonus(xW[xCW].bonus.proc);
                    if (x_proc == 1) {
                        // does it override?
                        if (x_track.dot_effects.poisoned.damage > 0) {
                            if (xDMG >= x_track.dot_effects.poisoned.damage * 0.45 / 15 * (16 - x_track.dot_effects.poisoned.turns)) {
                                x_track.dot_effects.poisoned.damage = xDMG;
                                x_track.dot_effects.poisoned.turns = 0;
                                log += y.name + " is poisoned \n";
                            }
                        } else {
                            x_track.dot_effects.poisoned.damage = xDMG;
                            x_track.dot_effects.poisoned.turns = 0;
                            log += y.name + " is poisoned \n";
                        }
                    }
                }

            } else {

                x_track.turn = "miss";
                if (f_track.escape_attempted == true) {
                    log += y.name + " escaped. \n";
                    f_track.escape = true;
                    return log;

                } else {

                    log += x.name + " fired " + xRF + " " + xW[xCW].ammo + " rounds of "
                                + "their " + xW[xCW].name + " missing "
                                + y.name + "\n";
                }
            }

            x_track.weapon_state[xCW].ammo_left -= xRF;
            if (x_track.weapon_state[xCW].ammo_left == 0) {
                x_track.weapon_state[xCW].clips_left -= 1;
                if (x_track.weapon_state[xCW].clips_left == 0 || x_track.weapon_settings[xCW].reload != true) {
                    x_track.weapon_settings[xCW].setting = 0;
                }
            }

        } else if (xCW == "melee") {

            if (xDMG > y_track.current_life) {
                xDMG = y_track.current_life;
            }

            if (xW[xCW].bonus.name == "Storage" && x_track.weapon_state[xCW].storage_used == false) {

                // current setting = 0, initial setting != 0
                if (x_track.weapon_settings.temporary.setting == 0 && x_track.weapon_settings.temporary.initial_setting != 0) {

                    log += x.name + " withdrew a " + xW.temporary.name + " from their " + xW[xCW].name + " \n";
                    x_track.weapon_settings.temporary.setting = x_track.weapon_settings.temporary.initial_setting;
                    x_track.weapon_state[xCW].storage_used = true;

                }

            } else {

                if (xW[xCW].bonus.name == "Smash") {
                    xDMG *= 2;
                    if (x_track.weapon_state[xCW].dropped == true) {
                        log += x.name + " picked up their Sledgehammer. \n";
                        x_track.weapon_state[xCW].dropped = false;
                    } else {
                        if (xHOM == 1) {
                            log += x.name + " smashed " + y.name + " with their Sledgehammer in the " + xBP[0] + " for " + xDMG + "\n";
                            x_track.weapon_state[xCW].dropped = true;
                        } else {
                            log += x.name + " missed " + y.name + " with their Sledgehammer. \n";
                            x_track.weapon_state[xCW].dropped = true;
                        }
                    }
                } else {

                    if (xHOM == 1) {

                        x_track.turn = "hit";
                        if (f_track.escape_attempted == true) {
                            log += y.name + " attempted to escape but failed. \n";
                            f_track.escape_attempted = false;
                        }

                        log += x.name + " hit " + y.name
                                        + " with their " + xW[xCW].name + " in the "
                                        + xBP[0] + " for " + xDMG + "\n";


                        if (xW[xCW].bonus.name == "Toxin") {

                            let x_proc = procBonus(xW[xCW].bonus.proc);
                            if (x_proc == 1) {

                                let toxin_effect = ["withered","slowed","weakened","crippled"]
                                let remaining = []
                                for (let i=0;i<toxin_effect.length;i++) {
                                    if (x_track.status_effects.dealt[toxin_effect[i]] < 3) {
                                        remaining.push(toxin_effect[i])
                                    }
                                }

                                let rng = Math.floor(remaining.length * Math.random());

                                x_track.status_effects.dealt[remaining[rng]] += 1;
                                y_track.status_effects.received[remaining[rng]] += 1;

                                if (remaining[rng] == "withered") {
                                    // effect = wither
                                    log += y.name + " is withered \n";

                                } else if (remaining[rng] == "slowed") {
                                    // effect = slow
                                    log += y.name + " is slowed \n";

                                } else if (remaining[rng] == "weakened") {
                                    // effect = weaken
                                    log += y.name + " is weakened \n";

                                } else if (remaining[rng] == "crippled") {
                                    // effect = cripple
                                    log += y.name + " is crippled \n";

                                }
                            }
                        } else if (xW[xCW].bonus.name == "Lacerate") {

                            let x_proc = procBonus(xW[xCW].bonus.proc);
                            if (x_proc == 1) {
                                // does it override?
                                if (xDOT[2][0] > 0) {
                                    if (xDMG >= x_track.dot_effects.lacerated.damage * 0.90 / 9 * (10 - x_track.dot_effects.lacerated.turns)) {
                                        xDOT[2] = [xDMG,0]
                                        log += y.name + " is lacerated \n";
                                    }
                                } else {
                                    x_track.dot_effects.lacerated.damage = xDMG;
                                    x_track.dot_effects.lacerated.turns = 0;
                                    log += y.name + " is lacerated \n";
                                }
                            }
                        }


                    } else {

                        x_track.turn = "miss";
                        if (f_track.escape_attempted == true) {
                            log += y.name + " escaped. \n";
                            f_track.escape = true;
                            return log;

                        } else {
                            log += x.name + " missed " + y.name
                                        + " with their " + xW[xCW].name + "\n";
                        }
                    }
                }
            }

        } else if (xCW == "temporary") {

            x_track.turn = "miss";
            if (xW[xCW].category == "Non-Damaging") {
                if (f_track.escape_attempted == true) {
                    log += y.name + " escaped. \n";
                    f_track.escape = true;
                    return log;
                }
            }

            if (xW[xCW].name == "Epinephrine") {

                x_track.temp_effects.epinephrine.time = 120;
                log += x.name + " injected " + xW[xCW].name + "\n";

            } else if (xW[xCW].name == "Melatonin") {

                x_track.temp_effects.melatonin.time = 120;
                log += x.name + " injected " + xW[xCW].name + "\n";

            } else if (xW[xCW].name == "Serotonin") {

                let life = parseInt(x.life * 0.25)
                if (x_track.current_life + life > x.life) {
                    life = x.life - x_track.current_life
                }

                x_track.current_life += life;

                x_track.temp_effects.serotonin.time = 120;
                log += x.name + " injected " + xW[xCW].name + " and gained " + life + " life \n";

            } else if (xW[xCW].name == "Tyrosine") {

                x_track.temp_effects.tyrosine.time = 120;
                log += x.name + " injected " + xW[xCW].name + "\n";

            } else if (xW[xCW].name == "Concussion Grenade") {

                if (t["Concussion Grenade"].includes(yA.head.type)) {
                    log += x.name + " used a " + xW[xCW].name + " but it was blocked! \n";
                } else {
                    log += x.name + " used a " + xW[xCW].name + " \n";
                    y_track.temp_effects.concussion_grenade.number += 1;
                    if (y_track.temp_effects.concussion_grenade.number == 1) {
                        y_track.temp_effects.concussion_grenade.time_one == Math.floor(Math.random() * 5 + 15);
                    } else if (y_track.temp_effects.concussion_grenade.number == 2) {
                        y_track.temp_effects.concussion_grenade.time_two == Math.floor(Math.random() * 5 + 15);
                    }
                }

            } else if (xW[xCW].name == "Smoke Grenade") {

                if (t["Smoke Grenade"].includes(yA.head.type)) {
                    log += x.name + " used a " + xW[xCW].name + " but it was blocked! \n";
                } else {
                    log += x.name + " used a " + xW[xCW].name + " \n";
                    y_track.temp_effects.smoke_grenade.number += 1;
                    if (y_track.temp_effects.smoke_grenade.number == 1) {
                        y_track.temp_effects.smoke_grenade.time_one == Math.floor(Math.random() * 60 + 120);
                    } else if (y_track.temp_effects.smoke_grenade.number == 2) {
                        y_track.temp_effects.smoke_grenade.time_two == Math.floor(Math.random() * 60 + 120);
                    }
                }

            } else if (xW[xCW].name == "Tear Gas") {

                if (t["Tear Gas"].includes(yA.head.type)) {
                    log += x.name + " used a " + xW[xCW].name + " but it was blocked! \n";
                } else {
                    log += x.name + " used a " + xW[xCW].name + " \n";
                    y_track.temp_effects.tear_gas.number += 1;
                    if (y_track.temp_effects.tear_gas.number == 1) {
                        y_track.temp_effects.tear_gas.time_one == Math.floor(Math.random() * 60 + 120);
                    } else if (y_track.temp_effects.tear_gas.number == 2) {
                        y_track.temp_effects.tear_gas.time_two == Math.floor(Math.random() * 60 + 120);
                    }
                }

            } else if (xW[xCW].name == "Flash Grenade") {

                if (t["Flash Grenade"].includes(yA.head.type)) {
                    log += x.name + " used a " + xW[xCW].name + " but it was blocked! \n";
                } else {
                    log += x.name + " used a " + xW[xCW].name + " \n";
                    y_track.temp_effects.flash_grenade.number += 1;
                    if (y_track.temp_effects.flash_grenade.number == 1) {
                        y_track.temp_effects.flash_grenade.time_one == Math.floor(Math.random() * 5 + 15);
                    } else if (y_track.temp_effects.flash_grenade.number == 2) {
                        y_track.temp_effects.flash_grenade.time_two == Math.floor(Math.random() * 5 + 15);
                    }
                }

            } else if (xW[xCW].name == "Pepper Spray") {

                if (t["Pepper Spray"].includes(yA.head.type)) {
                    log += x.name + " used a " + xW[xCW].name + " but it was blocked! \n";
                } else {
                    log += x.name + " used a " + xW[xCW].name + " \n";
                    y_track.temp_effects.pepper_spray.number += 1;
                    if (y_track.temp_effects.pepper_spray.number == 1) {
                        y_track.temp_effects.pepper_spray.time_one == Math.floor(Math.random() * 5 + 15);
                    } else if (y_track.temp_effects.pepper_spray.number == 2) {
                        y_track.temp_effects.pepper_spray.time_two == Math.floor(Math.random() * 5 + 15);
                    }
                }

            } else if (xW[xCW].name == "Sand") {

                if (t["Sand"].includes(yA.head.type)) {
                    log += x.name + " used a " + xW[xCW].name + " but it was blocked! \n";
                } else {
                    log += x.name + " used a " + xW[xCW].name + " \n";
                    y_track.temp_effects.sand.number += 1;
                    if (y_track.temp_effects.sand.number == 1) {
                        y_track.temp_effects.sand.time_one == Math.floor(Math.random() * 5 + 15);
                    } else if (y_track.temp_effects.sand.number == 2) {
                        y_track.temp_effects.sand.time_two == Math.floor(Math.random() * 5 + 15);
                    }
                }

            } else {

                if (xHOM == 1) {

                    x_track.turn = "hit";
                    if (f_track.escape_attempted == true) {
                        log += y.name + " attempted to escape but failed. \n";
                        f_track.escape_attempted = false;
                    }

                    log += x.name + " threw a " + xW[xCW].name + " hitting "
                                    + y.name + " in the " + xBP[0] + " for "
                                    + xDMG + "\n";

                } else {

                    if (f_track.escape_attempted == true) {
                        log += y.name + " escaped. \n";
                        f_track.escape = true;
                        return log;

                    } else {
                        log += x.name + " threw a " + xW[xCW].name + " missing " + y.name + "\n";
                    }
                }
            }

            // stop trying to use temp after one is used.
            x_track.weapon_settings[xCW].setting = 0;
            if (x_track.weapon_state.melee.storage_used == true && x_track.weapon_settings.type == "hb_primary") {
                x_track.weapon_settings.primary.setting = 1;
                x_track.weapon_settings.melee.setting = 2;
            }

            if (xW[xCW].bonus.name == "Severe Burn") {

                let x_proc = procBonus(xW[xCW].bonus.proc);
                if (x_proc == 1) {
                    // does it override?
                    if (x_track.dot_effects.severe_burning.damage > 0) {
                        if (xDMG >= x_track.dot_effects.severe_burning.damage * 0.15 / 5 * (6 - x_track.dot_effects.severe_burning.turns)) {
                            x_track.dot_effects.severe_burning.damage = xDMG;
                            x_track.dot_effects.severe_burning.turns = 0;
                            log += y.name + " is set ablaze \n";
                        }
                    } else {
                        x_track.dot_effects.severe_burning.damage = xDMG;
                        x_track.dot_effects.severe_burning.turns = 0;
                        log += y.name + " is set ablaze \n";
                    }
                }
            }

        }

        y_track.current_life -= xDMG;

        if (y_track.current_life == 0) {
            return log;
        }

        if (xHOM == 1) {
            if (xW[xCW].bonus.name == "Stun") {
                let x_proc = procBonus(xW[xCW].bonus.proc);
                if (x_proc == 1) {
                    if (y_track.status_effects.received.stunned == 0) {
                        if (x.position == "attack") {
                            y_track.status_effects.received.stunned = 2;
                        } else if (x.position == "defend") {
                            y_track.status_effects.received.stunned = 1;
                        }
                        log += y.name + " becomes stunned. \n";
                    } else {
                        if (x.position == "attack") {
                            y_track.status_effects.received.stunned = 4;
                        } else if (x.position == "defend") {
                            y_track.status_effects.received.stunned = 3;
                        }
                        log += y.name + " becomes stunned. \n";
                    }
                }
            }

            if (xW[xCW].bonus.name == "Paralyze") {
                let x_proc = procBonus(xW[xCW].bonus.proc);
                if (x_proc == 1) {
                    y_track.status_effects.received.paralyzed = 1;
                    log += y.name + " becomes paralyzed. \n";
                }
            }

            if (xW[xCW].bonus.name == "Suppress") {
                let x_proc = procBonus(xW[xCW].bonus.proc);
                if (x_proc == 1) {
                    y_track.status_effects.received.suppressed = 1;
                    log += y.name + " becomes suppressed. \n";
                }
            }
        }

        if (y_comp.name == "Gas Station" && y_comp.star >= 5) {
            rng = Math.floor(Math.random() * 10 + 1)
            if (rng == 1) {
                life = parseInt(0.2 * y.life)
                if (y_track.current_life + life > y.life) {
                    life = y.life - y_track.current_life
                }
                y_track.current_life += life;
                log += y.name + " cauterized their wound and recovered " + life + " life \n";
            }
        }

        for (let dot in x_track.dot_effects) {

            if (y_track.current_life > 1 && x_track.dot_effects[dot].turns > 0) {

                console.log(x_track.dot_effects[dot])

                let dotDMG;
                if (dot == "burning") {

                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.15 / 5 * (6 - x_track.dot_effects[dot].turns)))
                    if (y_comp.name == "Gas Station" && y_comp.star >= 7) {
                        dotDMG = parseInt(dotDMG / 1.5)
                    }
                    if (x_comp.name == "Gas Station" && x_comp.star == 10) {
                        dotDMG = parseInt(dotDMG * 1.5)
                    }
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Burning damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 5) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                } else if (dot == "poisoned") {

                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.45 / 15 * (16 - x_track.dot_effects[dot].turns)))
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Poison damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 15) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                } else if (dot == "lacerated") {
                    // Lacerate
                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.90 / 9 * (10 - x_track.dot_effects[dot].turns)))
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Laceration damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 9) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                } else if (dot == "severe_burning") {

                    dotDMG = parseInt(x_track.dot_effects[dot].damage * (0.15 / 5 * (10 - x_track.dot_effects[dot].turns)))
                    if (dotDMG > y_track.current_life - 1) {
                        dotDMG = y_track.current_life - 1;
                    }
                    log += "Severe burning damaged " +  y.name + " for " + dotDMG + "\n";

                    if (x_track.dot_effects[dot].turns == 5) {
                        x_track.dot_effects[dot].damage = 0;
                        x_track.dot_effects[dot].turns = 0;
                    }
                }

                y_track.current_life -= dotDMG;

                x_track.dot_effects[dot].turns += 1;

            }

        }

    }

    // x_track.average_damage = (y.life - y_track.current_life) / f_track.turns;

    x_track.average_damage = (x_track.average_damage * (f_track.turns - 1) + xDMG) / f_track.turns;

    return log;

}


// ---- choose weapons ---------------------------
function choose_weapon(p,weapon_settings) {


    if (p.position == "attack") {


        let weaponChoice
        let settingInteger = 5;
        for (let weapon in weapon_settings) {
            if (weapon_settings[weapon].setting != 0) {
                if (weapon_settings[weapon].setting < settingInteger) {
                    settingInteger = weapon_settings[weapon].setting;
                    weaponChoice = weapon;
                }
            }
        }

        return weaponChoice;

    } else if (p.position == "defend") {

        let weaponChoice;
        let weaponArray = [];
        let settingSum = 0;
        for (let weapon in weapon_settings) {

            if (isNaN(parseInt(weapon_settings[weapon].setting))) {
                // console.log(weapon)
            } else {
                settingSum += weapon_settings[weapon].setting;
                if (weapon_settings[weapon].setting != 0) {
                    weaponArray.push(weapon);
                }

            }
        }

        let rng = Math.ceil(Math.random() * settingSum + 1)
        if (rng >= 1 && rng <= 1 + weapon_settings.primary.setting) {
            weaponChoice = "primary";
        } else if (rng > 1 + weapon_settings.primary.setting && rng <= 1 + weapon_settings.primary.setting + weapon_settings.secondary.setting) {
            weaponChoice = "secondary";
        } else if (rng > 1 + weapon_settings.primary.setting + weapon_settings.secondary.setting && rng <= 1 + weapon_settings.primary.setting + weapon_settings.secondary.setting + weapon_settings.melee.setting) {
            weaponChoice = "melee";
        } else {
            weaponChoice = "temporary";
        }

        return weaponChoice;
    }

}


// -----------------------------------------------
function maxDamage(strength) {

    return 7 * (Math.log10(strength/10))**2 + 27 * Math.log10(strength/10) + 30

    // calculate and return maximum damage based on effective strength

}

function damageMitigation(defense, strength) {

    let ratio = defense / strength
    let mitigation;

    if (ratio >= 14) {
        mitigation = 100
    } else if (ratio >= 1 && ratio < 14) {
        mitigation = 50 + 50 / Math.log(14) * Math.log(ratio)
    } else if (ratio > 1/32 && ratio < 1) {
        mitigation = 50 + 50 / Math.log(32) * Math.log(ratio)
    } else {
        mitigation = 0
    }

    return mitigation;
    // calculate and return damage mitigation percentage

}

function hitChance(speed, dexterity) {

    let ratio = speed / dexterity
    let hitChance;

    if (ratio >= 64) {
        hitChance = 100
    } else if (ratio >= 1 && ratio < 64) {
        hitChance = 100 - 50 / 7 * (8 * Math.sqrt(1/ratio) - 1)
    } else if (ratio > 1/64 && ratio < 1) {
        hitChance = 50 / 7 * (8 * Math.sqrt(ratio) - 1)
    } else {
        hitChance = 0
    }

    return hitChance;

}

function applyAccuracy(hitChance, displayAccuracy, perks) {

    let accuracy = displayAccuracy + perks
    if (accuracy < 0) {
        accuracy = 0;
    }

    if (hitChance > 50) {
        hitChance = hitChance + ((accuracy-50)/50)*(100-hitChance)
    } else {
        hitChance = hitChance + ((accuracy-50)/50)*hitChance
    }

    return hitChance

}

function hitOrMiss(hitChance) {

    let rng = Math.floor(Math.random() * 10000 + 1)
    let hit;

    if (rng >= 1 && rng <= 1 + hitChance * 100) {
        hit = 1;
    } else {
        hit = 0;
    }

    return hit;

}

function selectBodyPart(x,critChance) {

  let bodyPart = "";
  let rng = Math.floor(Math.random() * 1000 + 1)
  if (rng >= 1 && rng <= critChance * 10) {
      // successful crit
      let rng2 = Math.floor(Math.random() * 100 + 1)
      if (rng2 >= 1 && rng2 <= 11) {
          bodyPart = ["heart",1];
      } else if (rng2 > 11 && rng2 <= 21) {
          bodyPart = ["throat",1];
          if (x['perks']['education']['neckdamage'] == true) {
              bodyPart[1] *= 1.1
          }
      } else if (rng2 > 21 && rng2 <= 101) {
          bodyPart = ["head",1];
      }
  } else {
      // non-crit
      let rng2 = Math.floor(Math.random() * 100 + 1)
      if (rng2 >= 1 && rng2 <= 6) {
          bodyPart = ["groin",1/1.75];
      } else if (rng2 > 6 && rng2 <= 11) {
          bodyPart = ["left arm",1/3.5];
      } else if (rng2 > 11 && rng2 <= 16) {
          bodyPart = ["right arm",1/3.5];
      } else if (rng2 > 16 && rng2 <= 21) {
          bodyPart = ["left hand",1/5];
      } else if (rng2 > 21 && rng2 <= 26) {
          bodyPart = ["right hand",1/5];
      } else if (rng2 > 26 && rng2 <= 31) {
          bodyPart = ["left foot",1/5];
      } else if (rng2 > 31 && rng2 <= 36) {
          bodyPart = ["right foot",1/5];
      } else if (rng2 > 36 && rng2 <= 46) {
          bodyPart = ["left leg",1/3.5];
      } else if (rng2 > 46 && rng2 <= 56) {
          bodyPart = ["right leg",1/3.5];
      } else if (rng2 > 56 && rng2 <= 76) {
          bodyPart = ["stomach",1/1.75];
      } else if (rng2 > 76 && rng2 <= 101) {
          bodyPart = ["chest",1/1.75];
      }
  }

  return bodyPart;

}

function armorMitigation(bodyPart,armor) {

    let mitigation = 0;
    let piece_hit = "";
    let message = "";
    let coverage = [], dummy = []
    let total = 0;
    let count = 0;
    let rng = Math.floor(Math.random() * 10000 + 1)

    for (let slot in armor) {

        if (!a[bodyPart][armor[slot]['type']]) {
            // do nothing
        } else {
            coverage.push([armor[slot]['armor'],a[bodyPart][armor[slot]['type']],armor[slot]['type']])
            total += a[bodyPart][armor[slot]['type']]
            count += 1;
        }

    }

    dummy = dummy.concat(coverage)

    let high = 0, second = 0, third = 0, low = 0;
    if (total >= 100) {

        if (count == 4) {

            for (i = 0;i < dummy.length;i++) {
                if (dummy[i][0] > coverage[high][0]) {
                    high = i;
                } else if (dummy[i][0] < coverage[low][0]) {
                    low = i;
                }
            }

            delete dummy[high], delete dummy[low];

            for (i = 0;i < dummy.length;i++) {

                if (dummy[i] == undefined) {
                    continue;
                } else if (dummy[i][0] > coverage[second][0]) {
                    second = i;
                } else if (dummy[i][0] < coverage[third][0]) {
                    third = i;
                }

            }

            if (coverage[high][1] >= 100) {
                mitigation = coverage[high][0];
                piece_hit = coverage[high][2];
            } else if (coverage[high][1] + coverage[second][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                    piece_hit = coverage[high][2];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                    piece_hit = coverage[second][2];
                }
            } else if (coverage[high][1] + coverage[second][1] + coverage[third][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                    piece_hit = coverage[high][2];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                    piece_hit = coverage[second][2];
                } else if (rng > (coverage[high][1] + coverage[second][1])*100 && rng <= (coverage[high][1] + coverage[second][1] + coverage[third][1])*100) {
                    mitigation = coverage[third][0];
                    piece_hit = coverage[third][2];
                }
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                    piece_hit = coverage[high][2];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                    piece_hit = coverage[second][2];
                } else if (rng > (coverage[high][1] + coverage[second][1])*100 && rng <= (coverage[high][1] + coverage[second][1] + coverage[third][1])*100) {
                    mitigation = coverage[third][0];
                    piece_hit = coverage[third][2];
                } else {
                    mitigation = coverage[low][0];
                    piece_hit = coverage[low][2];
                }
            }


        } else if (count == 3) {

            for (i = 0;i < dummy.length;i++) {
                if (dummy[i][0] > coverage[high][0]) {
                    high = i;
                } else if (dummy[i][0] < coverage[low][0]) {
                    low = i;
                }
            }

            delete dummy[high], delete dummy[low];

            for (i = 0;i < dummy.length;i++) {

                if (dummy[i] == undefined) {
                    continue;
                } else if (dummy[i][0] > coverage[second][0]) {
                    second = i;
                }

            }

            if (coverage[high][1] >= 100) {
                mitigation = coverage[high][0];
                piece_hit = coverage[high][2];
            } else if (coverage[high][1] + coverage[second][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                    piece_hit = coverage[high][2];
                } else {
                    mitigation = coverage[second][0];
                    piece_hit = coverage[second][2];
                }
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                    piece_hit = coverage[high][2];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                    piece_hit = coverage[second][2];
                } else {
                    mitigation = coverage[low][0];
                    piece_hit = coverage[low][2];
                }
            }

        } else if (count == 2) {

            for (i = 0;i < dummy.length;i++) {
                if (dummy[i][0] > coverage[high][0]) {
                    high = i;
                } else if (dummy[i][0] < coverage[low][0]) {
                    low = i;
                }
            }

            if (coverage[high][1] >= 100) {
                mitigation = coverage[high][0];
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                    piece_hit = coverage[high][2];
                } else {
                    mitigation = coverage[low][0];
                    piece_hit = coverage[low][2];
                }
            }


        } else if (count == 1) {

            mitigation = coverage[0][0];
            piece_hit = coverage[0][2]

        }

    } else {

        if (count == 4) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
                piece_hit = coverage[0][2];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
                piece_hit = coverage[1][2];
            } else if (rng > (coverage[0][1] + coverage[1][1])*100 && rng <= (coverage[0][1] + coverage[1][1] + coverage[2][1])*100) {
                mitigation = coverage[2][0];
                piece_hit = coverage[2][2];
            } else if (rng > (coverage[0][1] + coverage[1][1] + coverage[2][1])*100 && (coverage[0][1] + coverage[1][1] + coverage[2][1] + coverage[3][1])*100) {
                mitigation = coverage[3][0];
                piece_hit = coverage[3][2];
            } else {
                mitigation = 0;
                piece_hit = "none";
            }

        } else if (count == 3) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
                piece_hit = coverage[0][2];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
                piece_hit = coverage[1][2];
            } else if (rng > (coverage[0][1] + coverage[1][1])*100 && rng <= (coverage[0][1] + coverage[1][1] + coverage[2][1])*100) {
                mitigation = coverage[2][0];
                piece_hit = coverage[2][2];
            } else {
                mitigation = 0;
                piece_hit = "none";
            }

        } else if (count == 2) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
                piece_hit = coverage[0][2];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
                piece_hit = coverage[1][2];
            } else {
                mitigation = 0;
                piece_hit = "none";
            }

        } else if (count == 1) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
                piece_hit = coverage[0][2];
            } else {
                mitigation = 0;
                piece_hit = "none";
            }

        }

    }

    return [mitigation,piece_hit];

}

function variance() {

    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    //num = num / 10.0 + 0.5; // Translate to 0 -> 1
    num = (20 * (num / 10.0 + 0.5) - 10 + 100)/100; // Translate to 0.95 -> 1.05?
    if (num > 1.05 || num < 0.95) return variance(); // resample
    return num;

}

function sRounding(x) {
    let a  = Math.floor(x)
    let b  = a + 1

    let rng = Math.round(Math.random() * 1000 * (b-a) + a) / 1000
    if (rng <= x){
        return a
    } else if (rng > x) {
        return b
    }

}

function roundsFired(weapon,weaponState) {

    let rof = weaponState.rate_of_fire;
    rof = [sRounding(rof[0]),sRounding(rof[1])]

    let rounds
    if (rof[1] - rof[0] == 0) {
        rounds = rof[0]
    } else {
        rounds = Math.round(Math.random() * (rof[1]-rof[0]) + rof[0])
    }

    if (rounds > weaponState.ammo_left) {
        rounds = weaponState.ammo_left;
    }

    return rounds;

}

function isJapanese(weapon) {

    let jw = ["Samurai Sword", "Yasukuni Sword", "Kodachi", "Sai", "Kodachi", "Katana", "Dual Samurai Sword"]

    if (jw.includes(weapon)) {
        return true
    } else {
        return false
    }
}

function procBonus(proc) {

    let rng = Math.floor(Math.random() * 100 + 1)
    if (rng > 1 && rng <= proc) {
        return 1;
    } else {
        return 0;
    }

}


function weapon_state(player,weapon) {

    let clip_size_multi = 1, clips = 3, rof_multi = 1;

    for (let mod in weapon.mods) {
        clip_size_multi += m[weapon.mods[mod]].clip_size_multi;
        clips += m[weapon.mods[mod]].extra_clips;
        rof_multi += m[weapon.mods[mod]].rate_of_fire_multi;
    }

    let comp = player.perks.company, edu = player.perks.education;

    if (comp.name == "Gun Shop" && comp.stars >= 7) {
        clips += 1;
    }

    if (edu.ammocontrol1 == true) {
        rof_multi -= -0.05;
    }

    if (edu.ammocontrol2 == true) {
        rof_multi -= 0.2;
    }

    let state = {
        "max_ammo": weapon.clipsize * clip_size_multi,
        "ammo_left": weapon.clipsize * clip_size_multi,
        "max_clips": clips,
        "clips_left": clips,
        "rate_of_fire": [weapon.rateoffire[0]*rof_multi,weapon.rateoffire[1]*rof_multi]
    }

    return state

}


// ---- // --- // --- // --- //
function apply_perks(x, xCW, x_track) {

    let edu = x.perks.education, comp = x.perks.company, fac = x.perks.faction;
    let prop = x.perks.property, merit = x.perks.merits, wep = x.weapons[xCW];

    x_track.bonus.acc += wep.experience * 0.02 + fac.accuracy * 0.2;
    x_track.bonus.dmg += wep.experience * 0.1 + fac.damage;
    x_track.bonus.crit_rate += merit.critrate * 0.5;

    if (comp.name == "Zoo" && comp.star == 10) {
        x_track.bonus.acc += 3;
    }
    if (edu.damage == true) {
        x_track.bonus.dmg += 1;
    }
    if (prop.damage == true) {
        x_track.bonus.dmg += 2;
    }
    if (edu.critchance == true) {
        x_track.bonus.crit_rate += 3;
    }

    if (xCW == "primary" || xCW == "secondary") {

        if (comp.name == "Gun Shop" && comp.star == 10) {
            x_track.bonus.dmg += 10;
        }
        if (wep.name == "Flamethrower" && comp.name == "Firework Stand" && comp.star >= 5) {
            x_track.bonus.acc += 10;
            x_track.bonus.dmg += 25;
        }

    } else if (xCW == "melee") {

        if (edu.meleedamage == true) {

            x_track.bonus.dmg += 2;

        }
        if ((comp.name == "Pub" || comp.star == "Restaurant") && comp.star >= 3) {
            x_track.bonus.dmg += 10;
        }
        if (isJapanese(wep.name)) {
            x_track.bonus.dmg += 10;
        }

    } else if (xCW == "temporary") {

        x_track.bonus.acc += merit.temporarymastery * 0.2;
        x_track.bonus.dmg += merit.temporarymastery;
        if (edu.temporaryaccuracy == true) {
            x_track.bonus.acc += 1;
        }
        if (edu.tempdamage == true) {
            x_track.bonus.dmg += 5;
        }

    } else if (xCW == "fists") {

        if (edu.fistdamage == "true") {
            x_track.bonus.dmg += 100;
        }
        if (comp.name == "Furniture Store" && comp.star == 10) {
            x_track.bonus.dmg += 100;
        }

    } else if (xCW == "kick") {

        if (comp.name == "Furniture Store" && comp.star == 10) {
            x_track.bonus.dmg += 100;
        }

    }

    if (wep.category == "Clubbing") {
        x_track.bonus.acc += merit.clubbingmastery * 0.2;
        x_track.bonus.dmg += merit.clubbingmastery;
    } else if (wep.category == "Heavy Artillery") {
        x_track.bonus.acc += merit.heavyartillerymastery * 0.2;
        x_track.bonus.dmg += merit.heavyartillerymastery;
        if (edu.heavyartilleryaccuracy == true) {
            x_track.bonus.acc += 1;
        }
    } else if (wep.category == "Machine Gun") {
        x_track.bonus.acc += merit.machinegunmastery * 0.2;
        x_track.bonus.dmg += merit.machinegunmastery;
        if (edu.machinegunaccuracy == true) {
            x_track.bonus.acc += 1;
        }
    } else if (wep.category == "Mechanical") {
        x_track.bonus.acc += merit.mechanicalmastery * 0.2;
        x_track.bonus.dmg += merit.mechanicalmastery;
    } else if (wep.category == "Piercing") {
        x_track.bonus.acc += merit.piercingmastery * 0.2;
        x_track.bonus.dmg += merit.piercingmastery;
    } else if (wep.category == "Pistol") {
        x_track.bonus.acc += merit.pistolmastery * 0.2;
        x_track.bonus.dmg += merit.pistolmastery;
        if (edu.pistolaccuracy == true) {
            x_track.bonus.acc += 1;
        }
    } else if (wep.category == "Rifle") {
        x_track.bonus.acc += merit.riflemastery * 0.2;
        x_track.bonus.dmg += merit.riflemastery;
        if (edu.rifleaccuracy == true) {
            x_track.bonus.acc += 1;
        }
    } else if (wep.category == "Shotgun") {
        bonus.acc += merit.shotgunmastery * 0.2;
        bonus.dmg += merit.shotgunmastery;
        if (edu.shotgunaccuracy == true) {
            bonus.acc += 1;
        }
    } else if (wep.category == "Slashing") {
        x_track.bonus.acc += merit.slashingmastery * 0.2;
        x_track.bonus.dmg += merit.slashingmastery;
        if (comp.name == "Hair Salon" && comp.star == 10) {
            x_track.bonus.dmg += 20;
        }
    } else if (wep.category == "SMG") {
        x_track.bonus.acc += merit.smgmastery * 0.2;
        x_track.bonus.dmg += merit.smgmastery;
        if (edu.smgaccuracy == true) {
            x_track.bonus.acc += 1;
        }
    }

}

function apply_mods(x, xCW, x_track, y_track, f_track) {

    let x_pass = clone(x.passives)
    let wep = x.weapons[xCW];

    if (xCW == "primary" || xCW == "secondary") {

        if (x_track.weapon_state[xCW].ammo_left == 0 && x_track.weapon_settings[xCW].reload == true) {
            // do nothing
        } else {

            for (let mod in wep.mods) {
                x_track.bonus.acc += m[wep.mods[mod]].acc_bonus;
                y_track.bonus.acc += m[wep.mods[mod]].enemy_acc_bonus;
                x_track.bonus.crit_rate += m[wep.mods[mod]].crit_chance;
                x_track.bonus.dmg += m[wep.mods[mod]].dmg_bonus;
                x_pass.dexterity += m[wep.mods[mod]].dex_passive;
                if (m[wep.mods[mod]].turn1 && f_track.turn == 1) {
                    x_track.bonus.acc += m[wep.mods[mod]].turn1.acc_bonus;
                }
            }
        }
    }

    return x_pass

}

function apply_effects(x, y, xA, x_pass, y_pass, x_track) {

    let x_edu = x.perks.education, y_comp = x.perks.company;
    let x_se = x_track.status_effects.received;

    // positive effects

    if (x_track.temp_effects.epinephrine.time > 0) {
        x_pass.strength += 500;
        if (x_edu.needleeffect == true) {
            x_pass.strength += 50;
        }
    }
    if (x_track.temp_effects.melatonin.time > 0) {
        x_pass.speed += 500;
        if (x_edu.needleeffect == true) {
            x_pass.speed += 50;
        }
    }
    if (x_track.temp_effects.serotonin.time > 0) {
        x_pass.defense += 300;
        if (x_edu.needleeffect == true) {
            x_pass.defense += 30;
        }
    }
    if (x_track.temp_effects.tyrosine.time > 0) {
        x_pass.dexterity += 500;
        if (x_edu.needleeffect == true) {
            x_pass.dexterity += 50;
        }
    }

    let xSTR_positive = x.battlestats.strength * (1 + x_pass.strength/100);
    let xSPD_positive = x.battlestats.speed * (1 + x_pass.speed/100);
    let xDEF_positive = x.battlestats.defense * (1 + x_pass.defense/100);
    let xDEX_positive = x.battlestats.dexterity * (1 + x_pass.dexterity/100);

    // negative effects

    if (y_comp.name == "Adult Novelties" && y_comp.star >= 7) {
        x_pass.speed -= 25;
    }

    x_pass.strength -= (10 * x_se.demoralized + 25 * x_se.withered);
    x_pass.speed -= (10 * x_se.demoralized + 25 * x_se.slowed + 50 * x_se.frozen);
    x_pass.defense -= (10 * x_se.demoralized + 25 * x_se.weakened);
    x_pass.dexterity -= (10 * x_se.demoralized + 25 * x_se.crippled + 50 * x_se.frozen);

    let xSTR_negative = x.battlestats.strength * (1 + x_pass.strength/100);
    let xSPD_negative = x.battlestats.speed * (1 + x_pass.speed/100);
    let xDEF_negative = x.battlestats.defense * (1 + x_pass.defense/100);
    let xDEX_negative = x.battlestats.dexterity * (1 + x_pass.dexterity/100);

    let spd_multi = 1, dex_multi = 1;

    if (x_track.temp_effects.smoke_grenade.number == 1) {
        spd_multi = 1/3;
    } else if (x_track.temp_effects.smoke_grenade.number == 2) {
        spd_multi = 1/3 * 2/3;
    }

    if (x_track.temp_effects.tear_gas.number == 1) {
        dex_multi = 1/3;
    } else if (x_track.temp_effects.tear_gas.number == 2) {
        dex_multi = 1/3 * 2/3;
    }

    if (x_track.temp_effects.flash_grenade.number == 1) {
        spd_multi = 1/5;
    } else if (x_track.temp_effects.flash_grenade.number == 2) {
        spd_multi = 1/5 * 3/5;
    }

    if (x_track.temp_effects.pepper_spray.number == 1) {
        dex_multi = 1/5;
    } else if (x_track.temp_effects.pepper_spray.number == 2) {
        dex_multi = 1/5 * 3/5;
    }

    if (x_track.temp_effects.sand.number == 1) {
        spd_multi = 1/5;
    } else if (x_track.temp_effects.sand.number == 2) {
        spd_multi = 1/5 * 3/5;
    }

    if (x_track.temp_effects.concussion_grenade.number == 1) {
        dex_multi = 1/5;
    } else if (x_track.temp_effects.concussion_grenade.number == 2) {
        dex_multi = 1/5 * 3/5;
    }

    xSPD_negative *= spd_multi;
    xDEX_negative *= dex_multi;

    let xSTR_diff = (xSTR_negative - xSTR_positive) / x.battlestats.strength;
    let xSPD_diff = (xSPD_negative - xSPD_positive) / x.battlestats.speed;
    let xDEF_diff = (xDEF_negative - xDEF_positive) / x.battlestats.defense;
    let xDEX_diff = (xDEX_negative - xDEX_positive) / x.battlestats.dexterity;

    // "bonus total != 0" used because only Delta changes this value.
    if (x.armor_bonus_total != 0) {
        xSTR_diff *= (100 - x.armor_bonus_total)/100;
        xSPD_diff *= (100 - x.armor_bonus_total)/100;
        xDEF_diff *= (100 - x.armor_bonus_total)/100;
        xDEX_diff *= (100 - x.armor_bonus_total)/100;
    }

    xSTR = xSTR_positive + xSTR_diff * x.battlestats.strength;
    xSPD = xSPD_positive + xSPD_diff * x.battlestats.speed;
    xDEF = xDEF_positive + xDEF_diff * x.battlestats.defense;
    xDEX = xDEX_positive + xDEX_diff * x.battlestats.dexterity;

    return [xSTR,xSPD,xDEF,xDEX];

}

function apply_pmt(x, y, xCW, yCW, xA, yA, x_track, y_track, f_track) {

    // reset for calculation
    x_track.bonus = {
        "acc": 0,
        "dmg": 0,
        "crit_rate": 12
    }
    y_track.bonus = {
        "acc": 0,
        "dmg": 0,
        "crit_rate": 12
    }

    apply_perks(x, xCW, x_track)
    apply_perks(y, yCW, y_track)

    let x_pass = apply_mods(x, xCW, x_track, y_track, f_track)
    let y_pass = apply_mods(y, yCW, y_track, x_track, f_track)

    let x_stats = apply_effects(x, y, xA, x_pass, y_pass, x_track)
    let y_stats = apply_effects(y, x, yA, y_pass, x_pass, y_track)

    return [x_stats, y_stats];

}


function clone(obj) {
    if (obj === null || typeof (obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

    if (obj instanceof Date)
        var temp = new obj.constructor(); //or new Date(obj);
    else
        var temp = obj.constructor();

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj['isActiveClone'] = null;
            temp[key] = clone(obj[key]);
            delete obj['isActiveClone'];
        }
    }
    return temp;
}
