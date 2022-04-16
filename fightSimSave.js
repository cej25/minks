/*
To do list
- restructure code?
- bonuses
- command for pulling user data
*/
const Discord = require('discord.js')
let functions = require('../modules/general.js')
let roles = require('../consts/roles.js');
let channels = require('../consts/channels.js')
let players = require('../JSON/players.json')
let a = require('../JSON/armourCoverage.json')

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
            h = Object.assign({}, players[args[0].toString()]);
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
            v = Object.assign({}, players[args[1].toString()]);
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

    //hWin, vWin, stale, turns,  hLife, vLife, hProcs, vProcs
    let results = [0,0,0,0,0,0,0,0]

    for (let i=0;i<trials;i++) {
        results = fight(h,v,results)
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

    const embed = new Discord.MessageEmbed()
      .setColor(roles.MINKS_PINK)
      .addFields(
		      { name: h['name'], value: hBasicInfo, inline: true },
          { name: v['name'], value: vBasicInfo, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
      )
      .addFields(
		      { name: h['name'] + " Wins:", value: results[0], inline: true },
          { name: v['name'] + " Wins:", value: results[1], inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
      )
      .addFields(
          { name: "Stalemates:", value: results[2], inline: true },
          { name: "Average turns:", value: results[3]/trials, inline: true },
          { name: "Average life", value: Math.round(results[4]/trials) + ", " + Math.round(results[5]/trials), inline: true },
      )
      /*
      .addFields(
          { name: "Average special procs:", value: results[6]/trials + ", " + results[7]/trials, inline: false },
      )
      */

      channel.send(embed)

}

function fight(h,v,results) {

    let hPrim = h['weapons']['primary'], hSec = h['weapons']['secondary'];
    let vPrim = v['weapons']['primary'], vSec = v['weapons']['secondary'];

    let hModsPrim = applyBefore(hPrim['mods'],h['perks']), hModsSec = applyBefore(hSec['mods'],h['perks']);
    let vModsPrim = applyBefore(vPrim['mods'],v['perks']), vModsSec = applyBefore(vSec['mods'],v['perks']);

    let hWS = {
        "primary": {
            "ammoleft": Math.round(hPrim['clipsize'] * hModsPrim[0]),
            "maxammo": Math.round(hPrim['clipsize'] * hModsPrim[0]),
            "clipsleft": hModsPrim[1],
            "rof": [Math.max(1,hPrim['rateoffire'][0] * hModsPrim[2]),Math.max(1,hPrim['rateoffire'][1] * hModsPrim[2])]
        },
        "secondary": {
            "ammoleft": Math.round(hSec['clipsize'] * hModsSec[0]),
            "maxammo": Math.round(hSec['clipsize'] * hModsSec[0]),
            "clipsleft": hModsSec[1],
            "rof": [Math.max(1,hSec['rateoffire'][0] * hModsSec[2]),Math.max(1,hSec['rateoffire'][1] * hModsSec[2])]
        },
        "melee": {
            "storage": false,
            "storageused": false
        }
    }
    let vWS = {
        "primary": {
            "ammoleft": Math.round(vPrim['clipsize'] * vModsPrim[0]),
            "maxammo": Math.round(vPrim['clipsize'] * vModsPrim[0]),
            "clipsleft": vModsPrim[1],
            "rof": [Math.max(1,vPrim['rateoffire'][0] * vModsPrim[2]),Math.max(1,vPrim['rateoffire'][1] * vModsPrim[2])]
        },
        "secondary": {
            "ammoleft": Math.round(vSec['clipsize'] * vModsSec[0]),
            "maxammo": Math.round(vSec['clipsize'] * vModsSec[0]),
            "clipsleft": vModsSec[1],
            "rof": [Math.max(1,vSec['rateoffire'][0] * vModsSec[2]),Math.max(1,vSec['rateoffire'][1] * vModsSec[2])]
        },
        "melee": {
            "storage": false,
            "storageused": false
        }
    }

    let hCL = Object.assign(h['life']), vCL = Object.assign(v['life']);
    let turns = 0
    let fightLogMessage = "";
    // status effects: demoralize, freeze, wither, slow, weaken, cripple,
    let hSE = [0,0,0,0,0,0], vSE = [0,0,0,0,0,0];
    // DOT effects: Burn, Poison, Lacerate, Severe Burn
    let hDOT = [[0,0],[0,0],[0,0],[0,0]], vDOT = [[0,0],[0,0],[0,0],[0,0]];
    let hP = Object.assign({},h['passives']), vP = Object.assign({},v['passives']);
    let hAS = Object.assign({}, h['attacksettings']); // will remove
    let vDS = Object.assign({}, v['defendsettings']); // will remove
    let hWset = Object.assign({}, h['weaponsettings']['attacksettings']);
    let vWset = Object.assign({}, v['weaponsettings']['defendsettings']);

    for (let i=0;i<25;i++) {

        turns += 1

        let turnReturn = takeTurns(h,v,turns,hCL,vCL,hWS,vWS,hSE,vSE,hDOT,vDOT,hP,vP,hAS,vDS)
        recentMessage = turnReturn[0];
        hCL = turnReturn[1], vCL = turnReturn[2];
        hWS = turnReturn[3], vWS = turnReturn[4];
        hSE = turnReturn[5], vSE = turnReturn[6];
        hDOT = turnReturn[7], vDOT = turnReturn[8]
        hP = turnReturn[9], vP = turnReturn[10];
        hAS = turnReturn[11], vDS = turnReturn[12];

        if (hCL == 0) {
            results[1] += 1
            recentMessage += v['name'] + " won. ";
            console.log(recentMessage)
            break;
        } else if (vCL == 0) {
            results[0] += 1
            recentMessage += h['name'] + " won. ";
            console.log(recentMessage)
            break;
        }

        fightLogMessage += recentMessage;

        console.log(recentMessage)

    }

    if (turns == 25 && hCL > 0 && vCL > 0) {
        recentMessage += "Stalemate."
        results[2] += 1;
    }

    results[3] += turns;
    results[4] += hCL;
    results[5] += vCL;
    /*results[6] += hProcs;
    results[7] += vProcs;*/
    return results;

}

function takeTurns(h,v,turn,hCL,vCL,hWS,vWS,hSE,vSE,hDOT,vDOT,hP,vP,hAS,vDS) {


    let hS = Object.assign({}, h['battlestats']);
    let vS = Object.assign({}, v['battlestats']);
    let hW = Object.assign({}, h['weapons']);
    let vW = Object.assign({}, v['weapons']);
    let hA = Object.assign({}, h['armour']);
    let vA = Object.assign({}, v['armour']);

    let recentMessage = "";
    // -------  turn -----------

    let hCW = heroChooseWeapon(hAS);
    let vCW = villainChooseWeapon(vDS);

    // start to define stats, perks, etc, here?
    let hPerksArray = applyPerks(hW,hCW,h['perks'])
    let hDmgBonusOut = hPerksArray[0], hDmgBonusIn = hPerksArray[1];
    let hAccBonus = hPerksArray[2];
    let hCR = hPerksArray[3];
    let vPerksArray = applyPerks(vW,vCW,v['perks'])
    let vDmgBonusOut = vPerksArray[0], vDmgBonusIn = vPerksArray[1];
    let vAccBonus = vPerksArray[2];
    let vCR = vPerksArray[3];

    // check for reloads - let weapons act on opponent stats + weapons if not
    if (hWS[hCW]['ammoleft'] == 0 && hAS[hCW]['reload'] == true) {

        // do nothing if weapon is reloading

    } else {

        if (hCW == "primary" || hCW == "secondary") {
            let hModsArray = applyMods(hW[hCW]['mods'],hAccBonus,hCR,hDmgBonusIn,turn,hP['dexterity'],vAccBonus)
            hAccBonus = hModsArray[0];
            hCR = hModsArray[1];
            hDmgBonusIn = hModsArray[2];
            hP['dexterity'] = hModsArray[3];
            vAccBonus = hModsArray[4];
        }

    }

    if (vWS[vCW]['ammoleft'] == 0 && vDS[vCW]['reload'] == true) {

        // do nothing if weapon is reloading

    } else {

        if (vCW == "primary" || vCW == "secondary") {
            let vModsArray = applyMods(vW[vCW]['mods'],vAccBonus,vCR,vDmgBonusIn,turn,vP['dexterity'],hAccBonus)
            vAccBonus = vModsArray[0];
            vCR = vModsArray[1];
            vDmgBonusIn = vModsArray[2];
            vP['dexterity'] = vModsArray[3];
            hAccBonus = vModsArray[4];
        }

    }

    let hSTR = hS['strength'] * (1 + hP['strength']/100)
    let hSPD = hS['speed'] * (1 + hP['speed']/100)
    let hDEF = hS['defense'] * (1 + hP['defense']/100)
    let hDEX = hS['dexterity'] * (1 + hP['dexterity']/100)
    let vSTR = vS['strength'] * (1 + vP['strength']/100)
    let vSPD = vS['speed'] * (1 + vP['speed']/100)
    let vDEF = vS['defense'] * (1 + vP['defense']/100)
    let vDEX = vS['dexterity'] * (1 + vP['dexterity']/100)


    // ------- here make actual turn damage ---------------------
    if (hWS[hCW]['ammoleft'] == 0 && hAS[hCW]['reload'] == true) {

        // add reload to the log fight log
        recentMessage = h['name'] + " reloaded their " + hW[hCW]['name'] + ". \n"
        hWS[hCW]['ammoleft'] = hW['primary']['clipsize'];

        if (v['perks']['company']['gascauterize'] == true) {
            rng = Math.floor(Math.random() * 10 + 1)
            vML = Object.assign(v['life'])
            if (rng == 1) {
                life = parseInt(0.2 * vML)
                if (vCL + life > vML) {
                    life = vML - vCL
                }
                vCL += life
                recentMessage += v['name'] + " cauterized their wound and recovered " + life + " life \n"
            }
        }

        for (let dot in hDOT) {

            if (vCL > 1 && hDOT[dot][0] > 0 && hDOT[dot][1] > 0) {

                let dotDMG
                if (dot == 0) {
                    // Burn
                    dotDMG = parseInt(hDOT[dot][0] * (0.15 / 5 * (6 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Burning damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 5) {
                        hDOT[dot] = [0,0]
                    }
                } else if (dot == 1) {
                    // Poison
                    dotDMG = parseInt(hDOT[dot][0] * (0.45 / 15 * (16 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Poison damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 15) {
                        hDOT[dot] = [0,0]
                    }
                } else if (dot == 2) {
                    // Lacerate
                    dotDMG = parseInt(hDOT[dot][0] * (0.90 / 9 * (10 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Laceration damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 9) {
                        hDOT[dot] = [0,0]
                    }
                } else if (dot == 3) {
                    // Severe Burn
                    dotDMG = parseInt(hDOT[dot][0] * (0.15 / 5 * (10 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Severe burning damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 9) {
                        hDOT[dot] = [0,0]
                    }
                }

                vCL -= dotDMG;

            }

            hDOT[dot][1] += 1;

        }


    } else {

        let hBHC, hFHC, hBP, hMD, vDM, vAM, hHOM, hDMG = 0;

        if (hW[hCW]['category'] != "Non-Damaging") {

            hBHC = hitChance(hSPD,vDEX)
            hFHC = applyAccuracy(hBHC,hW[hCW]['accuracy'],hAccBonus)
            hHOM = hitOrMiss(hFHC);

            if (hHOM == 1) {

                hBP = selectBodyPart(hCR);
                hMD = maxDamage(hSTR);
                vDM = (100-damageMitigation(vDEF,hSTR))/100;
                hWDM = weaponDamageMulti(hW[hCW]['damage'],hDmgBonusIn);
                vAM = (100 - armourMitigation(hBP[0],vA))/100;
                hDV = variance();
                hDMG = Math.round(hBP[1] * hMD * vDM * hWDM * vAM * hDV * (1+hDmgBonusOut/100));
            }

        } else {

            // deal with smokes and boosters and shit

        }

        if (hCW == "primary") {

            let hRF;
            if (hW[hCW]['bonus']['name'] == "Spray" && hWS[hCW]['ammoleft'] == hWS[hCW]['maxammo']) {

                let hProc = procBonus(hW[hCW]['bonus']['proc'])
                if (hProc == 1) {

                    hDMG *= 2
                    if (hDMG > vCL) {
                        hDMG = vCL;
                    }

                    hRF = hWS[hCW]['maxammo']
                    if (hHOM == 1) {
                        recentMessage = h['name'] + " sprayed " + hRF + " rounds of their "
                                        + hW[hCW]['name'] + " hitting " + v['name'] + " in the "
                                        + hBP[0] + " for " + hDMG + "\n"

                    } else {
                        recentMessage = h['name'] + " sprayed " + hRF + " rounds of their "
                                        + hW[hCW]['name'] + " missing " + v['name'] + "\n"
                    }

                } else {

                    if (hDMG > vCL) {
                        hDMG = vCL;
                    }
                    hRF = roundsFired(hW[hCW],hWS[hCW])
                    if (hHOM == 1) {
                        recentMessage = h['name'] + " fired " + hRF + " rounds of "
                                      + "their " + hW[hCW]['name'] + " hitting "
                                      + v['name'] + " in the " + hBP[0] + " for "
                                      + hDMG + "\n";


                    } else {
                        recentMessage = h['name'] + " fired " + hRF + " rounds of "
                                        + "their " + hW[hCW]['name'] + " missing "
                                        + v['name'] + "\n";
                    }
                }



            } else {

                if (hDMG > vCL) {
                    hDMG = vCL;
                }

                hRF = roundsFired(hW[hCW],hWS[hCW])
                if (hHOM == 1) {

                    recentMessage = h['name'] + " fired " + hRF + " rounds of "
                                    + "their " + hW[hCW]['name'] + " hitting "
                                    + v['name'] + " in the " + hBP[0] + " for "
                                    + hDMG + "\n";

                    if (hW[hCW]['bonus']['name'] == "Demoralize") {
                        if (hSE[0] < 5) {
                            let hProc = procBonus(hW[hCW]['bonus']['proc'])
                            if (hProc == 1) {
                                hSE[0] += 1;
                                vP['strength'] -= 10;
                                vP['speed'] -= 10;
                                vP['defense'] -= 10;
                                vP['dexterity'] -= 10;
                                recentMessage += v['name'] + " has been Demoralized. \n"
                            }
                        }
                    } else if (hW[hCW]['bonus']['name'] == "Freeze") {
                        if (hSE[1] < 1) {
                            let hProc = procBonus(hW[hCW]['bonus']['proc'])
                            if (hProc == 1) {
                                hSE[1] += 1;
                                vP['speed'] -= 50;
                                vP['dexterity'] -= 50;
                                recentMessage += v['name'] + " has been Frozen. \n"
                            }
                        }
                    } else if (hW[hCW]['bonus']['name'] == "Blindfire" && hWS[hCW]['ammoleft'] - hRF != 0) {

                        let hProc = procBonus(hW[hCW]['bonus']['proc']);
                        if (hProc == 1) {

                            let totalDMG = hDMG,totalRounds = hRF;
                            for (let i = 0;i<15;i++) {

                                hAccBonus -= 5;
                                hFHC = applyAccuracy(hBHC,hW[hCW]['accuracy'],hAccBonus)
                                hHOM = hitOrMiss(hFHC);

                                if (hHOM == 1) {

                                    hBP = selectBodyPart(hCR);
                                    vAM = (100 - armourMitigation(hBP[0],vA))/100;
                                    hDV = variance();
                                    hDMG = Math.round(hBP[1] * hMD * vDM * hWDM * vAM * hDV * (1+hDmgBonusOut/100));

                                }

                                if (totalDMG + hDMG > vCL) {
                                    hDMG = vCL - totalDMG;
                                }

                                hRF = roundsFired(hW[hCW],hWS[hCW])

                                if (totalRounds + hRF > hWS[hCW]['ammoleft']) {
                                    hRF = hWS[hCW]['ammoleft'] - totalRounds;
                                    if (hRF <= 0) {
                                        break;
                                    }
                                }

                                if (hHOM == 1) {

                                    recentMessage += h['name'] + " fired " + hRF + " rounds of "
                                                    + "their " + hW[hCW]['name'] + " hitting "
                                                    + v['name'] + " in the " + hBP[0] + " for "
                                                    + hDMG + "\n";
                                } else {
                                    recentMessage += h['name'] + " fired " + hRF + " rounds of "
                                                    + "their " + hW[hCW]['name'] + " missing "
                                                    + v['name'] + "\n";
                                }

                                totalDMG += hDMG;
                                if (totalDMG == vCL) {
                                    hDMG = totalDMG; //pass total value back to hDMG to subtract it from vCL
                                    hRF = totalRounds;
                                    break;
                                }

                                totalRounds += hRF;
                                if (totalRounds == hWS[hCW]['ammoleft']) {
                                    hDMG = totalDMG; //pass total value back to hDMG to subtract it from vCL
                                    hRF = totalRounds;
                                    break;
                                }

                            }

                        }

                    }

                } else {

                    recentMessage = h['name'] + " fired " + hRF + " rounds of "
                                    + "their " + hW[hCW]['name'] + " missing "
                                    + v['name'] + "\n";
                }

            }

            hWS[hCW]['ammoleft'] -= hRF;
            if (hWS[hCW]['ammoleft'] == 0) {
                hWS[hCW]['clipsleft'] -= 1;
                if (hWS[hCW]['clipsleft'] == 0 || hAS[hCW]['reload'] != true) {
                    hAS[hCW]['setting'] = 0;
                }
            }

        } else if (hCW == "secondary") {

            if (hDMG > vCL) {
                hDMG = vCL;
            }

            let hRF = roundsFired(hW[hCW],hWS[hCW])

            if (hHOM == 1) {

                recentMessage = h['name'] + " fired " + hRF + " rounds of "
                                + "their " + hW[hCW]['name'] + " hitting "
                                + v['name'] + " in the " + hBP[0] + " for "
                                + hDMG + "\n";

                if (hW[hCW]['bonus']['name'] == "Burn") {

                    let hProc = procBonus(hW[hCW]['bonus']['proc'])
                    if (hProc == 1) {
                        // does it override?
                        if (hDOT[0][0] > 0) {
                            if (hDMG >= hDOT[0][0] * 0.15 / 5 * (6 - hDOT[0][1])) {
                                hDOT[0] = [hDMG,0]
                                recentMessage += v['name'] + " is set alight \n"
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            hDOT[0] = [hDMG,0]
                            recentMessage += v['name'] + " is set alight \n"
                        }
                    }
                } else if (hW[hCW]['bonus']['name'] == "Poison") {

                    let hProc = procBonus(hW[hCW]['bonus']['proc'])
                    if (hProc == 1) {
                        // does it override?
                        if (hDOT[1][0] > 0) {
                            if (hDMG >= hDOT[1][0] * 0.45 / 15 * (16 - hDOT[1][1])) {
                                hDOT[1] = [hDMG,0]
                                recentMessage += v['name'] + " is poisoned \n"
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            hDOT[1] = [hDMG,0]
                            recentMessage += v['name'] + " is poisoned \n"
                        }
                    }
                }

            } else {

                recentMessage = h['name'] + " fired " + hRF + " rounds of "
                                + "their " + hW[hCW]['name'] + " missing "
                                + v['name'] + "\n";
            }

            hWS[hCW]['ammoleft'] -= hRF;
            if (hWS[hCW]['ammoleft'] == 0) {
                hWS[hCW]['clipsleft'] -= 1;
                if (hWS[hCW]['clipsleft'] == 0 || hAS[hCW]['reload'] != true) {
                    hAS[hCW]['setting'] = 0;
                }
            }

        } else if (hCW == "melee") {

            if (hDMG > vCL) {
                hDMG = vCL;
            }

            if (hHOM == 1) {

                recentMessage = h['name'] + " hit " + v['name']
                                + " with their " + hW[hCW]['name'] + " in the "
                                + hBP[0] + " for " + hDMG + "\n";


                if (hW[hCW]['bonus']['name'] == "Toxin") {

                    let hProc = procBonus(hW[hCW]['bonus']['proc'])
                    if (hProc == 1) {

                        // check which effects are left. 3 of each maximum applied.
                        let eL = []
                        for (let i=2;i<6;i++) {
                            if (hSE[i] < 3) {
                                eL.push(i)
                            }
                        }

                        // status effect index
                        let eI = eL[Math.floor(Math.random() * eL.length)]
                        hSE[eI] += 1

                        if (eI == 2) {
                            // effect = wither
                            vP['strength'] -= 25;
                            recentMessage += v['name'] + " is withered \n"

                        } else if (eI == 3) {
                            // effect = slow
                            vP['speed'] -= 25;
                            recentMessage += v['name'] + " is slowed \n"

                        } else if (eI == 4) {
                            // effect = weaken
                            vP['defense'] -= 25;
                            recentMessage += v['name'] + " is weakened \n"

                        } else if (eI == 5) {
                            // effect = cripple
                            vP['dexterity'] -= 25;
                            recentMessage += v['name'] + " is crippled \n"

                        }
                    }
                } else if (hW[hCW]['bonus']['name'] == "Lacerate") {

                    let hProc = procBonus(hW[hCW]['bonus']['proc'])
                    if (hProc == 1) {
                        // does it override?
                        if (hDOT[2][0] > 0) {
                            if (hDMG >= hDOT[2][0] * 0.90 / 9 * (10 - hDOT[2][1])) {
                                hDOT[2] = [hDMG,0]
                                recentMessage += v['name'] + " is lacerated \n"
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            hDOT[2] = [hDMG,0]
                            recentMessage += v['name'] + " is lacerated \n"
                        }
                    }
                }


            } else {
                recentMessage = h['name'] + " missed " + v['name']
                                + " with their " + hW[hCW]['name'] + "\n";
            }

        } else if (hCW == "temporary") {

            /* to be used at some point
            else if (hW[hCW]['bonus']['name'] == "Severe Burn") {

                let hProc = procBonus(hW[hCW]['bonus']['proc'])
                if (hProc == 1) {
                    // does it override?
                    if (hDOT[3][0] > 0) {
                        if (hDMG >= hDOT[3][0] * 0.15 / 5 * (6 - hDOT[3][1])) {
                            hDOT[3] = [hDMG,0]
                            recentMessage += v['name'] + " is set ablaze \n"
                        } else {
                            // do nothing, does not override
                        }
                    } else {
                        hDOT[3] = [hDMG,0]
                        recentMessage += v['name'] + " is set ablaze \n"
                    }
                }
            }
            */


        }

        vCL -= hDMG;

        if (vCL == 0) {
            return [recentMessage, hCL, vCL, hWS, vWS, hSE, vSE, hDOT, vDOT, hP, vP, hAS, vDS];
        }

        if (v['perks']['company']['gascauterize'] == true) {
            rng = Math.floor(Math.random() * 10 + 1)
            vML = Object.assign(v['life'])
            if (rng == 1) {
                life = parseInt(0.2 * vML)
                if (vCL + life > vML) {
                    life = vML - vCL
                }
                vCL += life
                recentMessage += v['name'] + " cauterized their wound and recovered " + life + " life \n"
            }
        }

        for (let dot in hDOT) {

            if (vCL > 1 && hDOT[dot][0] > 0 && hDOT[dot][1] > 0) {

                let dotDMG
                if (dot == 0) {
                    // Burn
                    dotDMG = parseInt(hDOT[dot][0] * (0.15 / 5 * (6 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Burning damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 5) {
                        hDOT[dot] = [0,0]
                    }
                } else if (dot == 1) {
                    // Poison
                    dotDMG = parseInt(hDOT[dot][0] * (0.45 / 15 * (16 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Poison damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 15) {
                        hDOT[dot] = [0,0]
                    }
                } else if (dot == 2) {
                    // Lacerate
                    dotDMG = parseInt(hDOT[dot][0] * (0.90 / 9 * (10 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Laceration damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 9) {
                        hDOT[dot] = [0,0]
                    }
                } else if (dot == 3) {
                    // Severe Burn
                    dotDMG = parseInt(hDOT[dot][0] * (0.15 / 5 * (10 - hDOT[dot][1])))
                    if (dotDMG > vCL - 1) {
                        dotDMG = vCL - 1;
                    }
                    recentMessage += "Severe burning damaged " +  v['name'] + " for " + dotDMG + "\n";

                    if (hDOT[dot][1] == 9) {
                        hDOT[dot] = [0,0]
                    }
                }

                vCL -= dotDMG;

            }

            hDOT[dot][1] += 1;

        }

    }

    // ------- villain make actual turn damage ---------------------
    if (vWS[vCW]['ammoleft'] == 0 && vDS[vCW]['reload'] == true) {

        // add reload to the log fight log
        recentMessage += v['name'] + " reloaded their " + vW[vCW]['name'] + ". \n"
        vWS[vCW]['ammoleft'] = vW['primary']['clipsize'];

    } else {

        // vSPD and hDEX have had all passives and weapon modifiers etc added
        let vBHC = hitChance(vSPD,hDEX)
        let vFHC = applyAccuracy(vBHC,vW[vCW]['accuracy'],vAccBonus) // work out vAccPerks
        let vBP,vMD,hDM,vWDM,hAM,vDMG=0;
        let vHOM = hitOrMiss(vFHC);

        if (vHOM == 1) {

            vBP = selectBodyPart(vCR);
            vMD = maxDamage(vSTR);
            hDM = (100 - damageMitigation(hDEF,vSTR))/100;
            vWDM = weaponDamageMulti(vW[vCW]['damage'],vDmgBonusIn); // work out vDmgPerks
            hAM = (100 - armourMitigation(vBP[0],hA))/100;
            vDV = variance();
            vDMG = Math.round(vBP[1] * vMD * hDM * vWDM * hAM * vDV * (1+vDmgBonusOut/100));

        }

        if (vCW == 'primary' || vCW == 'secondary') {

            let vRF;
            if (vW[vCW]['bonus']['name'] == "Spray" && vWS[vCW]['ammoleft'] == vWS[vCW]['maxammo']) {

                let vProc = procBonus(vW[vCW]['bonus']['proc'])
                if (vProc == 1) {
                    vDMG *= 2
                    if (vDMG > hCL) {
                        vDMG = hCL;
                    }

                    vRF = vWS[vCW]['maxammo']
                    if (vHOM == 1) {
                        recentMessage += v['name'] + " sprayed " + vRF + " rounds of their "
                                        + vW[vCW]['name'] + " hitting " + h['name'] + " in the "
                                        + vBP[0] + " for " + vDMG + "\n"

                    } else {
                        recentMessage += v['name'] + " sprayed " + vRF + " rounds of their "
                                        + vW[vCW]['name'] + " missing " + h['name'] + "\n"
                    }
                } else {

                    vRF = roundsFired(vW[vCW],vWS[vCW])
                    if (vHOM == 1) {
                        recentMessage += v['name'] + " fired " + vRF + " rounds of "
                                        + "their " + vW[vCW]['name'] + " hitting "
                                        + h['name'] + " in  the " + vBP[0] + " for "
                                        + vDMG + "\n";

                    } else {
                        recentMessage += v['name'] + " fired " + vRF + " rounds of "
                                        + "their " + vW[vCW]['name'] + " missing "
                                        + h['name'] + "\n";
                    }
                }


            } else {

                if (vDMG > hCL) {
                    vDMG = hCL;
                }
                vRF = roundsFired(vW[vCW],vWS[vCW])
                if (vHOM == 1) {
                    recentMessage += v['name'] + " fired " + vRF + " rounds of "
                                    + "their " + vW[vCW]['name'] + " hitting "
                                    + h['name'] + " in  the " + vBP[0] + " for "
                                    + vDMG + "\n";

                    if (vW[vCW]['bonus']['name'] == "Demoralize") {
                        if (vSE[0] < 5) {
                            let vProc = procBonus(vW[vCW]['bonus']['proc'])
                            if (vProc == 1) {
                                vSE[0] += 1;
                                hP['strength'] -= 10;
                                hP['speed'] -= 10;
                                hP['defense'] -= 10;
                                hP['dexterity'] -= 10;
                                recentMessage += h['name'] + " has been Demoralized. \n"
                            }
                        }
                    } else if (vW[vCW]['bonus']['name'] == "Freeze") {
                        if (vSE[1] < 1) {
                            let vProc = procBonus(vW[vCW]['bonus']['proc'])
                            if (vProc == 1) {
                                vSE[1] += 1;
                                hP['speed'] -= 50;
                                hP['dexterity'] -= 50;
                                recentMessage += h['name'] + " has been Frozen. \n"
                            }
                        }
                    }

                } else {
                    recentMessage += v['name'] + " fired " + vRF + " rounds of "
                                    + "their " + vW[vCW]['name'] + " missing "
                                    + h['name'] + "\n";
                }

            }

            vWS[vCW]['ammoleft'] -= vRF;
            if (vWS[vCW]['ammoleft'] == 0) {
                vWS[vCW]['clipsleft'] -= 1;
                if (vWS[vCW]['clipsleft'] == 0 || vDS[vCW]['reload'] != true) {
                    vDS[vCW]['setting'] = 0;
                }
            }

        } else {

            if (vDMG > hCL) {
                vDMG = hCL;
            }
            if (vHOM == 1) {
                recentMessage += v['name'] + " hit " + h['name']
                                + " with their " + vW[vCW]['name'] + " in the "
                                + vBP[0] + " for " + vDMG + "\n";
            } else {
                recentMessage += v['name'] + " missed " + h['name']
                                + " with their " + vW[vCW]['name'] + "\n";
            }

        }

        hCL -= vDMG;

        if (hCL == 0) {
            return [recentMessage, hCL, vCL, hWS, vWS, hSE, vSE, hDOT, vDOT, hP, vP, hAS, vDS];
        }

    }






    return [recentMessage, hCL, vCL, hWS, vWS, hSE, vSE, hDOT, vDOT, hP, vP, hAS, vDS];

}


// choose weapons
// miss - just miss text, rounds fired etc
// hit -
    // - check bonus
    // demo etc are applied after
    // blindfire causes repeated "actions" to empty clip


// ---- choose weapons ---------------------------
function heroChooseWeapon(weaponSettings) {

    let weaponChoice
    let settingInteger = 5;
    for (let weapon in weaponSettings) {
        if (weaponSettings[weapon]['setting'] != 0) {
            if (weaponSettings[weapon]['setting'] < settingInteger) {
                settingInteger = weaponSettings[weapon]['setting'];
                weaponChoice = weapon;
            }
        }
    }

    return weaponChoice;

}

function villainChooseWeapon(weaponSettings) {

    let weaponChoice;
    let weaponArray = [];
    let settingSum = 0;
    for (let weapon in weaponSettings) {

        if (isNaN(parseInt(weaponSettings[weapon]['setting']))) {
            // console.log(weapon)
        } else {
            settingSum += weaponSettings[weapon]['setting'];
            if (weaponSettings[weapon]['setting'] != 0) {
                weaponArray.push(weapon);
            }

        }
    }

    let rng = Math.ceil(Math.random() * settingSum + 1)
    if (rng >= 1 && rng <= 1 + weaponSettings['primary']['setting']) {
        weaponChoice = "primary";
    } else if (rng > 1 + weaponSettings['primary']['setting'] && rng <= 1 + weaponSettings['primary']['setting'] + weaponSettings['secondary']['setting']) {
        weaponChoice = "secondary";
    } else if (rng > 1 + weaponSettings['primary']['setting'] + weaponSettings['secondary']['setting'] && rng <= 1 + weaponSettings['primary']['setting'] + weaponSettings['secondary']['setting'] + weaponSettings['melee']['setting']) {
        weaponChoice = "melee";
    } else {
        weaponChoice = "temporary";
    }

    return weaponChoice;

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

function weaponDamageMulti(displayDamage, perks) {

    let baseDamage = ((Math.exp((displayDamage+0.005)/19 + 2) - 13) + (Math.exp((displayDamage-0.005)/19 + 2) - 13))/2
    baseDamage = baseDamage * (1 + perks/100)

    let damageMulti = 1 + Math.log((Math.round(baseDamage,0)))

    return damageMulti;

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

function selectBodyPart(critChance) {

  let bodyPart = "";
  let rng = Math.floor(Math.random() * 100 + 1)
  if (rng >= 1 && rng <= 1 + critChance) {
      // successful crit
      let rng2 = Math.floor(Math.random() * 100 + 1)
      if (rng2 >= 1 && rng2 <= 11) {
          bodyPart = ["heart",1];
      } else if (rng2 > 11 && rng2 <= 21) {
          bodyPart = ["throat",1];
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

function armourMitigation(bodyPart,armour) {

    let mitigation = 0;
    let message = "";
    let coverage = [], dummy = []
    let total = 0;
    let count = 0;
    let rng = Math.floor(Math.random() * 10000 + 1)

    for (let slot in armour) {

        if (!a[bodyPart][armour[slot]['type']]) {
            // do nothing
        } else {
            coverage.push([armour[slot]['armour'],a[bodyPart][armour[slot]['type']]])
            total += a[bodyPart][armour[slot]['type']]
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
            } else if (coverage[high][1] + coverage[second][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                }
            } else if (coverage[high][1] + coverage[second][1] + coverage[third][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                } else if (rng > (coverage[high][1] + coverage[second][1])*100 && rng <= (coverage[high][1] + coverage[second][1] + coverage[third][1])*100) {
                    mitigation = coverage[third][0];
                }
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                } else if (rng > (coverage[high][1] + coverage[second][1])*100 && rng <= (coverage[high][1] + coverage[second][1] + coverage[third][1])*100) {
                    mitigation = coverage[third][0];
                } else {
                    mitigation = coverage[low][0];
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
            } else if (coverage[high][1] + coverage[second][1] >= 100) {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else {
                    mitigation = coverage[second][0];
                }
            } else {
                if (rng > 1 && rng <= coverage[high][1] * 100) {
                    mitigation = coverage[high][0];
                } else if (rng > coverage[high][1] * 100 && rng <= (coverage[high][1] + coverage[second][1])*100) {
                    mitigation = coverage[second][0];
                } else {
                    mitigation = coverage[low][0];
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
                } else {
                    mitigation = coverage[low][0];
                }
            }


        } else if (count == 1) {

            mitigation = coverage[0][0];

        }

    } else {

        if (count == 4) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
            } else if (rng > (coverage[0][1] + coverage[1][1])*100 && rng <= (coverage[0][1] + coverage[1][1] + coverage[2][1])*100) {
                mitigation = coverage[2][0];
            } else if (rng > (coverage[0][1] + coverage[1][1] + coverage[2][1])*100 && (coverage[0][1] + coverage[1][1] + coverage[2][1] + coverage[3][1])*100) {
                mitigation = coverage[3][0];
            } else {
                mitigation = 0;
            }

        } else if (count == 3) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
            } else if (rng > (coverage[0][1] + coverage[1][1])*100 && rng <= (coverage[0][1] + coverage[1][1] + coverage[2][1])*100) {
                mitigation = coverage[2][0];
            } else {
                mitigation = 0;
            }

        } else if (count == 2) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else if (rng > coverage[0][1] * 100 && rng <= (coverage[0][1] + coverage[1][1])*100) {
                mitigation = coverage[1][0];
            } else {
                mitigation = 0;
            }

        } else if (count == 1) {

            if (rng > 1 && rng <= coverage[0][1] * 100) {
                mitigation = coverage[0][0];
            } else {
                mitigation = 0;
            }

        }

    }

    return mitigation;

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

    let rof = weaponState['rof'];
    rof = [sRounding(rof[0]),sRounding(rof[1])]

    let rounds
    if (rof[1] - rof[0] == 0) {
        rounds = rof[0]
    } else {
        rounds = Math.round(Math.random() * (rof[1]-rof[0]) + rof[0])
    }

    if (rounds > weaponState['ammoleft']) {
        rounds = weaponState['ammoleft'];
    }

    return rounds;

}

function applyPerks(weapons,chosenWeapon,perks) {

    let dmgbonusout = 0, dmgbonusint = 0; // apply to outside, intrinsice
    let accbonus = 0;
    let critchance = 12;

    dmgbonusout += perks['education']['damage'] + perks['property']['damage']
                  + perks['faction']['damage'];
    dmgbonusint += 0.25 * weapons[chosenWeapon]['experience'];
    accbonus += perks['faction']['accuracy'] + perks['company']['zooaccuracy']
                + 0.02 * weapons[chosenWeapon]['experience'];

    /*if (bodyPart == "throat") {
        if (perks['education']['neckdamage'] == 10) {
            bodyPart[1] = 3.5
        }
    }*/

    if (chosenWeapon == "melee") {
        dmgbonusout += perks['education']['meleedamage']
                      + perks['company']['meatmeleedamage']
                      + perks['company']['pubmeleedamage']
                      + perks['company']['restaurantmeleedamage'];
    } else if (chosenWeapon == "temporary") {
        dmgbonusout += 2.5 * perks['merits']['temporarymastery'];
        dmgbonusint += perks['education']['tempdamage'];
        accbonus += perks['education']['temporaryaccuracy'];
    } else if (chosenWeapon == "fist") {
        dmgbonusout += perks['education']['fistdamage']
                      + perks['company']['furniturefist'];
    }

    if (isJapanese(chosenWeapon)) {
        dmgbonusint += perks['education']['japanesedamage'];
    }

    critchance += perks['education']['critchance'] + perks['merits']['critrate']*0.5

    if (weapons[chosenWeapon]['category'] == "Machine Gun") {
        accbonus += perks['education']['machinegunaccuracy']
                    + 0.2 * perks['merits']['machinegunmastery'];
        dmgbonusout += 2.5 * perks['merits']['machinegunmastery'];
    } else if (weapons[chosenWeapon]['category'] == "SMG") {
        accbonus += perks['education']['smgaccuracy']
                    + 0.2 * perks['merits']['smgmastery'];
        dmgbonusout += 2.5 * perks['merits']['smgmastery'];
    } else if (weapons[chosenWeapon]['category'] == "Pistol") {
        accbonus += perks['education']['pistolaccuracy']
                    + 0.2 * perks['merits']['pistolmastery'];
        dmgbonusout += 2.5 * perks['merits']['pistolmastery'];
    } else if (weapons[chosenWeapon]['category'] == "Rifle") {
        accbonus += perks['education']['rifleaccuracy']
                    + 0.2 * perks['merits']['riflemastery'];
        dmgbonusout += 2.5 * perks['merits']['riflemastery'];
    } else if (weapons[chosenWeapon]['category'] == "Heavy Artillery") {
        accbonus += perks['education']['heavyartilleryaccuracy']
                    + 0.2 * perks['merits']['heavyartillerymastery'];
        dmgbonusout += 2.5 * perks['merits']['heavyartillerymastery'];
    } else if (weapons[chosenWeapon]['category'] == "Shotgun") {
        accbonus += perks['education']['shotgunaccuracy']
                    + 0.2 * perks['merits']['shotgunmastery'];
        dmgbonusout += 2.5 * perks['merits']['shotgunmastery'];
    } else if (weapons[chosenWeapon]['category'] == "Clubbing") {
        accbonus += 0.2 * perks['merits']['clubmastery'];
        dmgbonusout += 2.5 * perks['merits']['clubmastery'];
    } else if (weapons[chosenWeapon]['category'] == "Slashing") {
        accbonus += 0.2 * perks['merits']['slashingmastery'];
        dmgbonusout += 2.5 * perks['merits']['slashingmastery'];
                      + perks['company']['hairslashdamage'];
    } else if (weapons[chosenWeapon]['category'] == "Piercing") {
        accbonus += 0.2 * perks['merits']['piercingmastery'];
        dmgbonusout += 2.5 * perks['merits']['piercingmastery'];
    } else if (weapons[chosenWeapon]['category'] == "Mechanical") {
        accbonus += 0.2 * perks['merits']['mechanicalmastery'];
        dmgbonusout += 2.5 * perks['merits']['mechanicalmastery'];
    }

    if (weapons[chosenWeapon] == "Flamethrower") {
        dmgbonusout += perks['company']['fireworks'];
        accbonus += perks['company']['fireworks'];
    }

    return [dmgbonusout, dmgbonusint, accbonus, critchance];

}

function isJapanese(weapon) {
    // lookup
}

function applyMods(mods,accbonus,critchance,dmgbonusint,turn,dexPassive,enemyAccBonus) {

    if (mods['one'] == "Reflex Sight") {
        accbonus += 1;
    } else if (mods['one'] == "Holographic Sight") {
        accbonus += 1.25;
    } else if (mods['one'] == "ACOG Sight") {
        accbonus += 1.50;
    } else if (mods['one'] == "Thermal Sight") {
        accbonus += 1.75;
    } else if (mods['one'] == "1mW Laser") {
        critchance += 3;
    } else if (mods['one'] == "5mW Laser") {
        critchance += 4;
    } else if (mods['one'] == "30mW Laser") {
        critchance += 5;
    } else if (mods['one'] == "100mW Laser") {
        critchance += 6;
    } else if (mods['one'] == "Small Suppressor") {
        dmgbonusint -= 5;
    } else if (mods['one'] == "Standard Suppressor") {
        dmgbonusint -= 5;
    } else if (mods['one'] == "Large Suppressor") {
        dmgbonusint -= 5;
    } else if (mods['one'] == "Adjustable Trigger") {
        if (turn == 1) {
            accbonus += 5;
        }
    } else if (mods['one'] == "Hair Trigger") {
        if (turn == 1) {
            accbonus += 7.5;
        }
    } else if (mods['one'] == "Bipod") {
        accbonus += 1.75;
        dexPassive -= 30;
    } else if (mods['one'] == "Tripod") {
        accbonus += 2;
        dexPassive -= 30;
    } else if (mods['one'] == "Custom Grip") {
        accbonus += 0.75;
    } else if (mods['one'] == "Skeet Choke") {
        dmgbonusint += 6;
    } else if (mods['one'] == "Improved Choke") {
        dmgbonusint += 8;
    } else if (mods['one'] == "Full Choke") {
        dmgbonusint += 10;
    } else if (mods['one'] == "Standard Brake") {
        accbonus += 1;
    } else if (mods['one'] == "Heavy Duty Brake") {
        accbonus += 1.25;
    } else if (mods['one'] == "Tactical Brake") {
        accbonus += 1.5;
    } else if (mods['one'] == "Small Light") {
        enemyAccBonus -= 3;
    } else if (mods['one'] == "Precision Light") {
        enemyAccBonus -= 4;
    } else if (mods['one'] == "Tactical Illuminator") {
        enemyAccBonus -= 5;
    }

    if (mods['two'] == "Reflex Sight") {
        accbonus += 1;
    } else if (mods['two'] == "Holographic Sight") {
        accbonus += 1.25;
    } else if (mods['two'] == "ACOG Sight") {
        accbonus += 1.50;
    } else if (mods['two'] == "Thermal Sight") {
        accbonus += 1.75;
    } else if (mods['two'] == "1mW Laser") {
        critchance += 3;
    } else if (mods['two'] == "5mW Laser") {
        critchance += 4;
    } else if (mods['two'] == "30mW Laser") {
        critchance += 5;
    } else if (mods['two'] == "100mW Laser") {
        critchance += 6;
    } else if (mods['two'] == "Small Suppressor") {
        dmgbonusint -= 5;
    } else if (mods['two'] == "Standard Suppressor") {
        dmgbonusint -= 5;
    } else if (mods['two'] == "Large Suppressor") {
        dmgbonusint -= 5;
    } else if (mods['two'] == "Adjustable Trigger") {
        if (turn == 1) {
            accbonus += 5;
        }
    } else if (mods['two'] == "Hair Trigger") {
        if (turn == 1) {
            accbonus += 7.5;
        }
    } else if (mods['two'] == "Bipod") {
        accbonus += 1.75;
        dexPassive -= 30;
    } else if (mods['two'] == "Tripod") {
        accbonus += 2;
        dexPassive -= 30;
    } else if (mods['two'] == "Custom Grip") {
        accbonus += 0.75;
    } else if (mods['two'] == "Skeet Choke") {
        dmgbonusint += 6;
    } else if (mods['two'] == "Improved Choke") {
        dmgbonusint += 8;
    } else if (mods['two'] == "Full Choke") {
        dmgbonusint += 10;
    } else if (mods['two'] == "Standard Brake") {
        accbonus += 1;
    } else if (mods['two'] == "Heavy Duty Brake") {
        accbonus += 1.25;
    } else if (mods['two'] == "Tactical Brake") {
        accbonus += 1.5;
    } else if (mods['two'] == "Small Light") {
        enemyAccBonus -= 3;
    } else if (mods['two'] == "Precision Light") {
        enemyAccBonus -= 4;
    } else if (mods['two'] == "Tactical Illuminator") {
        enemyAccBonus -= 5;
    }

    return [accbonus,critchance,dmgbonusint,dexPassive,enemyAccBonus];

}

// needs dealing with above in code
function applyBefore(mods,perks) {

    let clipsizemulti = 1, rofmulti = 1, clips = 3;

    if (mods['one'] == "Extended Mags") {
        clipsizemulti += 0.2;
    } else if (mods['one'] == "High Capacity Mags") {
        clipsizemulti += 0.3;
    } else if (mods['one'] == "Extra Clips") {
        clips += 1;
    } else if (mods['one'] == "Extra Clips x2") {
        clips += 2;
    } else if (mods['one'] == "Recoil Pad") {
        rofmulti -= 0.25;
    }

    if (mods['two'] == "Extended Mags") {
        clipsizemulti += 0.2;
    } else if (mods['two'] == "High Capacity Mags") {
        clipsizemulti += 0.3;
    } else if (mods['two'] == "Extra Clips") {
        clips += 1;
    } else if (mods['two'] == "Extra Clips x2") {
        clips += 2;
    } else if (mods['two'] == "Recoil Pad") {
        rofmulti -= 0.25;
    }

    rofmulti -= (perks['education']['ammocontrol1'] + perks['education']['ammocontrol2'])/100;

    return [clipsizemulti,clips,rofmulti];

}

function procBonus(proc) {

    let rng = Math.floor(Math.random() * 100 + 1)
    if (rng > 1 && rng <= proc) {
        return 1;
    } else {
        return 0;
    }

}





exports.pullInfo = async function pullInfo(apikey) {

    let apiProfile = 'https://api.torn.com/user/?selections=profile&key='+apikey;
    let profileResponse = this.retrieveApiData(apiProfile)
    let apiBattlestats = 'https://api.torn.com/user/?selections=battlestats&key='+apikey;
    let battlestatsResponse = this.retrieveApiData(apiBattlestats)
    let apiInventory = 'https://api.torn.com/user/?selections=inventory&key='+apikey;
    let inventoryResponse = this.retrieveApiData(apiInventory)
    let apiPerks = 'https://api.torn.com/user/?selections=perks&key='+apikey;
    let perksResponse = this.retrieveApiData(apiPerks)

    let id = profileResponse['player_id'];

    if (!players[id]) {
        players[id] = {
            "name": "n/a",
            "id": 0,
            "battlestats": {
                "strength": 0,
                "speed": 0,
                "defense": 0,
                "dexterity": 0,
                "total": 0,
            },
            "passives": {
                "strength": 0,
                "speed": 0,
                "defense": 0,
                "dexterity": 0
            },
            "life": 0,
            "weapons": {
                "primary": {
                    "name": "n/a",
                    "category": "n/a",
                    "damage": 0,
                    "accuracy": 0,
                    "clipsize": 0,
                    "clips": 0,
                    "rateoffire": [0,0],
                    "experience": 0,
                    "mods": {
                        "one": "n/a",
                        "two": "n/a"
                    },
                    "bonus": "n/a"
                },
                "secondary": {
                    "name": "n/a",
                    "category": "n/a",
                    "damage": 0,
                    "accuracy": 0,
                    "clipsize": 0,
                    "clips": 0,
                    "rateoffire": [0,0],
                    "experience": 0,
                    "mods": {
                        "one": "n/a",
                        "two": "n/a"
                    },
                    "bonus": "n/a"
                },
                "melee": {
                    "name": "n/a",
                    "category": "n/a",
                    "damage": 0,
                    "accuracy": 0,
                    "experience": 0,
                    "bonus": "n/a"
                },
                "temporary": {
                    "name": "n/a",
                    "category": "n/a"
                },
                "fists": {
                    "damage": 12.14,
                    "accuracy": 50.00,
                    "category": "Unarmed"
                },
                "kick": {
                    "damage": 0,
                    "accuracy": 0,
                    "category": "n/a"
                }
            },
            "armour": {
                "head": {
                    "type": "n/a",
                    "armour": 0
                },
                "body": {
                    "type": "n/a",
                    "armour": 0
                },
                "hands": {
                    "type": "n/a",
                    "armour": 0
                },
                "legs": {
                    "type": "n/a",
                    "armour": 0
                },
                "feet": {
                    "type": "n/a",
                    "armour": 0
                }
            },
            "attacksettings": {
                "primary": {
                    "setting": 0,
                    "reload": false
                },
                "secondary": {
                    "setting": 0,
                    "reload": false
                },
                "melee": {
                    "setting": 0,
                    "reload": null
                },
                "temporary": {
                    "setting": 0,
                    "reload": null
                }
            },
            "defendsettings": {
                "primary": {
                    "setting": 0,
                    "reload": false
                },
                "secondary": {
                    "setting": 0,
                    "reload": false
                },
                "melee": {
                    "setting": 0,
                    "reload": null
                },
                "temporary": {
                    "setting": 0,
                    "reload": null
                }
            },
            "perks": {
                "education": {
                    "damage": 0,
                    "neckdamage": 0,
                    "meleedamage": 0,
                    "tempdamage": 0,
                    "japanesedamage": 0,
                    "fistdamage": 0,
                    "critchance": 0,
                    "machinegunaccuracy": 0,
                    "smgaccuracy": 0,
                    "pistolaccuracy": 0,
                    "rifleaccuracy": 0,
                    "heavyartilleryaccuracy": 0,
                    "temporaryaccuracy": 0,
                    "shotgunaccuracy": 0
                },
                "faction": {
                    "accuracy": 0,
                    "damage": 0
                },
                "company": {
                    "fireworks": 0,
                    "furniturefist": 0,
                    "gasburntakedamage": 0,
                    "gasburndealdamage": 0,
                    "gunprimsecdamage": 0,
                    "hairslashdamage": 0,
                    "meatmeleedamage": 0,
                    "pubmeleedamage": 0,
                    "restaurantmeleedamage": 0,
                    "zooaccuracy": 0
                },
                "property": {
                    "damage": 2
                },
                "merits": {
                    "critrate": 0,
                    "heavyartillerymastery": 0,
                    "machinegunmastery": 0,
                    "riflemastery": 0,
                    "smgmastery": 0,
                    "shotgunmastery": 0,
                    "pistolmastery": 0,
                    "clubmastery": 0,
                    "piercingmastery": 0,
                    "slashingmastery": 0,
                    "mechanicalmastery": 0,
                    "temporarymastery": 0
                }
            }
        }
    }

    players[id]['name'] = profileResponse['name'];
    players[id]['id'] = id;
    players[id]['battlestats']['strength'] = battlestatsResponse['strength'];
    players[id]['battlestats']['speed'] = battlestatsResponse['speed'];
    players[id]['battlestats']['defense'] = battlestatsResponse['defense'];
    players[id]['battlestats']['dexterity'] = battlestatsResponse['dexterity'];
    players[id]['passives']['strength'] = battlestatsResponse['strength_modifier'];
    players[id]['passives']['speed'] = battlestatsResponse['speed_modifier'];
    players[id]['passives']['defense'] = battlestatsResponse['defense_modifier'];
    players[id]['passives']['dexterity'] = battlestatsResponse['dexterity_modifier'];
    players[id]['life'] = profileResponse['life']['maximum'];

    // weapon loop
    // check for categories etc

    for (let i=0;i<inventoryResponse['inventory'].length;i++) {

        if (inventoryResponse['inventory'][i]['equipped'] == 1) {
            //is primary
        }

    }

}
