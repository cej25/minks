function action(recentMessage,p1,p2,p1_CL,p2_CL,p1_WS,p2_WS,p1_SE,p2_SE,p1_DOT,p2_DOT,p1_P,p2_P,p1_Wset,p2_Wset) {

    let p1_S = Object.assign({}, p1['battlestats']);
    let p2_S = Object.assign({}, p2['battlestats']);
    let p1_W = Object.assign({}, p1['weapons']);
    let p2_W = Object.assign({}, p2['weapons']);
    let p1_A = Object.assign({}, p1['armour']);
    let p2_A = Object.assign({}, p2['armour']);

    // -------  turn -----------

    let p1_CW, p2_CW;
    if (p1['posiiton'] == "attack") {
        p1_CW = heroChooseWeapon(p1_Wset['attacksettings'])
    } else {
        p1_CW = villainChooseWeapon(p1_Wset['defendsettings'])
    }

    if (p2['posiiton'] == "attack") {
        p2_CW = heroChooseWeapon(p2_Wset['attacksettings'])
    } else {
        p2_CW = villainChooseWeapon(p2_Wset['defendsettings'])
    }

    // start to define stats, perks, etc, here?
    let p1_PerksArray = applyPerks(p1_W,p1_CW,p1['perks'])
    let p1_DmgBonusOut = p1_PerksArray[0], p1_DmgBonusIn = p1_PerksArray[1];
    let p1_AccBonus = p1_PerksArray[2];
    let p1_CR = p1_PerksArray[3];
    let p2_PerksArray = applyPerks(p2_W,p2_CW,p2['perks'])
    let p2_DmgBonusOut = p2_PerksArray[0], p2_DmgBonusIn = p2_PerksArray[1];
    let p2_AccBonus = p2_PerksArray[2];
    let p2_CR = p2_PerksArray[3];

    // check for reloads - let weapons act on opponent stats + weapons if not
    if (p1_WS[p1_CW]['ammoleft'] == 0 && p1_AS[p1_CW]['reload'] == true) {

        // do nothing if weapon is reloading

    } else {

        if (p1_CW == "primary" || p1_CW == "secondary") {
            let p1_ModsArray = applyMods(p1_W[p1_CW]['mods'],p1_AccBonus,p1_CR,p1_DmgBonusIn,turn,p1_P['dexterity'],p2_AccBonus)
            p1_AccBonus = p1_ModsArray[0];
            p1_CR = p1_ModsArray[1];
            p1_DmgBonusIn = p1_ModsArray[2];
            p1_P['dexterity'] = p1_ModsArray[3];
            p1_AccBonus = p1_ModsArray[4];
        }

    }

    if (p2_WS[p2_CW]['ammoleft'] == 0 && p2_DS[p2_CW]['reload'] == true) {

        // do nothing if weapon is reloading

    } else {

        if (p2_CW == "primary" || p2_CW == "secondary") {
            let p2_ModsArray = applyMods(p2_W[p2_CW]['mods'],p2_AccBonus,p2_CR,p2_DmgBonusIn,turn,p2_P['dexterity'],p1_AccBonus)
            p2_AccBonus = p2_ModsArray[0];
            p2_CR = p2_ModsArray[1];
            p2_DmgBonusIn = p2_ModsArray[2];
            p2_P['dexterity'] = p2_ModsArray[3];
            p2_AccBonus = p2_ModsArray[4];
        }

    }

    let p1_STR = p1_S['strength'] * (1 + p1_P['strength']/100)
    let p1_SPD = p1_S['speed'] * (1 + p1_P['speed']/100)
    let p1_DEF = p1_S['defense'] * (1 + p1_P['defense']/100)
    let p1_DEX = p1_S['dexterity'] * (1 + p1_P['dexterity']/100)
    let p2_STR = p2_S['strength'] * (1 + p2_P['strength']/100)
    let p2_SPD = p2_S['speed'] * (1 + p2_P['speed']/100)
    let p2_DEF = p2_S['defense'] * (1 + p2_P['defense']/100)
    let p2_DEX = p2_S['dexterity'] * (1 + p2_P['dexterity']/100)

    // ------- here make actual turn damage ---------------------
    if (p1_WS[p1_CW]['ammoleft'] == 0 && p1_AS[hCW]['reload'] == true) {

        // add reload to the log fight log
        recentMessage += p1['name'] + " reloaded their " + p1_W[hCW]['name'] + ". \n"
        p1_WS[p1_CW]['ammoleft'] = p1_W['primary']['clipsize'];

        if (p2['perks']['company']['gascauterize'] == true) {
            rng = Math.floor(Math.random() * 10 + 1)
            p2_ML = Object.assign(p2['life'])
            if (rng == 1) {
                life = parseInt(0.2 * p2_ML)
                if (p2_CL + life > p2_ML) {
                    life = p2_ML - p2_CL
                }
                p2_CL += life
                recentMessage += p2['name'] + " cauterized their wound and recovered " + life + " life \n"
            }
        }

        for (let dot in p1_DOT) {

            if (p2_CL > 1 && p1_DOT[dot][0] > 0 && p1_DOT[dot][1] > 0) {

                let dotDMG
                if (dot == 0) {
                    // Burn
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.15 / 5 * (6 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Burning damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 5) {
                        p1_DOT[dot] = [0,0]
                    }
                } else if (dot == 1) {
                    // Poison
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.45 / 15 * (16 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Poison damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 15) {
                        p1_DOT[dot] = [0,0]
                    }
                } else if (dot == 2) {
                    // Lacerate
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.90 / 9 * (10 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Laceration damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 9) {
                        p1_DOT[dot] = [0,0]
                    }
                } else if (dot == 3) {
                    // Severe Burn
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.15 / 5 * (10 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Severe burning damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 9) {
                        p1_DOT[dot] = [0,0]
                    }
                }

                p2_CL -= dotDMG;

            }

            p1_DOT[dot][1] += 1;

        }


    } else {

        let p1_BHC, p1_FHC, p1_BP, p1_MD, p2_DM, p2_AM, p1_HOM, p1_DMG = 0;

        if (p1_W[p1_CW]['category'] != "Non-Damaging") {

            p1_BHC = hitChance(p1_SPD,p2_DEX)
            p1_FHC = applyAccuracy(p1_BHC,p1_W[p1_CW]['accuracy'],p1_AccBonus)
            p1_HOM = hitOrMiss(p1_FHC);

            if (p1_HOM == 1) {

                p1_BP = selectBodyPart(p1_CR);
                p1_MD = maxDamage(p1_STR);
                p2_DM = (100-damageMitigation(p2_DEF,p1_STR))/100;
                p1_WDM = weaponDamageMulti(p1_W[p1_CW]['damage'],p1_DmgBonusIn);
                p2_AM = (100 - armourMitigation(p1_BP[0],p2_A))/100;
                p1_DV = variance();
                p1_DMG = Math.round(p1_BP[1] * p1_MD * p2_DM * p1_WDM * p2_AM * p1_DV * (1+p1_DmgBonusOut/100));
            }

        } else {

            // deal with smokes and boosters and shit

        }

        if (p1_CW == "primary") {

            let p1_RF;
            if (p1_W[p1_CW]['bonus']['name'] == "Spray" && p1_WS[hCW]['ammoleft'] == p1_WS[hCW]['maxammo']) {

                let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                if (p1_Proc == 1) {

                    p1_DMG *= 2
                    if (p1_DMG > p2_CL) {
                        p1_DMG = p2_CL;
                    }

                    p1_RF = p1_WS[p1_CW]['maxammo']
                    if (p1_HOM == 1) {
                        recentMessage += p1['name'] + " sprayed " + p1_RF + " rounds of their "
                                        + p1_W[p1_CW]['name'] + " hitting " + p2['name'] + " in the "
                                        + p1_BP[0] + " for " + p1_DMG + "\n"

                    } else {
                        recentMessage += p1['name'] + " sprayed " + p1_RF + " rounds of their "
                                        + p1_W[hCW]['name'] + " missing " + p2['name'] + "\n"
                    }

                } else {

                    if (p1_DMG > p2_CL) {
                        p1_DMG = p2_CL;
                    }
                    p1_RF = roundsFired(p1_W[p1_CW],p1_WS[p1_CW])
                    if (p1_HOM == 1) {
                        recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                      + "their " + p1_W[p1_CW]['name'] + " hitting "
                                      + p2['name'] + " in the " + p1_BP[0] + " for "
                                      + p1_DMG + "\n";


                    } else {
                        recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                        + "their " + p1_W[p1_CW]['name'] + " missing "
                                        + p2['name'] + "\n";
                    }
                }



            } else {

                if (p1_DMG > p2_CL) {
                    p1_DMG = p2_CL;
                }

                p1_RF = roundsFired(p1_W[p1_CW],p1_WS[p1_CW])
                if (p1_HOM == 1) {

                    recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                    + "their " + p1_W[p1_CW]['name'] + " hitting "
                                    + p2['name'] + " in the " + p1_BP[0] + " for "
                                    + p1_DMG + "\n";

                    if (p1_W[p1_CW]['bonus']['name'] == "Demoralize") {
                        if (p1_SE[0] < 5) {
                            let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                            if (p1_Proc == 1) {
                                p1_SE[0] += 1;
                                p2_P['strength'] -= 10;
                                p2_P['speed'] -= 10;
                                p2_P['defense'] -= 10;
                                p2_P['dexterity'] -= 10;
                                recentMessage += p2['name'] + " has been Demoralized. \n"
                            }
                        }
                    } else if (p1_W[p1_CW]['bonus']['name'] == "Freeze") {
                        if (p1_SE[1] < 1) {
                            let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                            if (p1_Proc == 1) {
                                p1_SE[1] += 1;
                                p2_P['speed'] -= 50;
                                p2_P['dexterity'] -= 50;
                                recentMessage += p2['name'] + " has been Frozen. \n"
                            }
                        }
                    } else if (p1_W[p1_CW]['bonus']['name'] == "Blindfire" && p1_WS[p1_CW]['ammoleft'] - p1_RF != 0) {

                        let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc']);
                        if (p1_Proc == 1) {

                            let totalDMG = p1_DMG,totalRounds = p1_RF;
                            for (let i = 0;i<15;i++) {

                                p1_AccBonus -= 5;
                                p1_FHC = applyAccuracy(p1_BHC,p1_W[p1_CW]['accuracy'],p1_AccBonus)
                                p1_HOM = hitOrMiss(p1_FHC);

                                if (p1_HOM == 1) {

                                    p1_BP = selectBodyPart(p1_CR);
                                    p2_AM = (100 - armourMitigation(p1_BP[0],p2_A))/100;
                                    p1_DV = variance();
                                    p1_DMG = Math.round(p1_BP[1] * p1_MD * p2_DM * p1_WDM * p2_AM * p1_DV * (1+p1_DmgBonusOut/100));

                                }

                                if (totalDMG + p1_DMG > p2_CL) {
                                    p1_DMG = p2_CL - totalDMG;
                                }

                                p1_RF = roundsFired(p1_W[p1_CW],p1_WS[p1_CW])

                                if (totalRounds + p1_RF > p1_WS[p1_CW]['ammoleft']) {
                                    p1_RF = p1_WS[p1_CW]['ammoleft'] - totalRounds;
                                    if (p1_RF <= 0) {
                                        break;
                                    }
                                }

                                if (p1_HOM == 1) {

                                    recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                                    + "their " + p1_W[p1_CW]['name'] + " hitting "
                                                    + p2['name'] + " in the " + p1_BP[0] + " for "
                                                    + p1_DMG + "\n";
                                } else {
                                    recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                                    + "their " + p1_W[p1_CW]['name'] + " missing "
                                                    + p2['name'] + "\n";
                                }

                                totalDMG += p1_DMG;
                                if (totalDMG == p2_CL) {
                                    p1_DMG = totalDMG; //pass total value back to hDMG to subtract it from p2_CL
                                    p1_RF = totalRounds;
                                    break;
                                }

                                totalRounds += p1_RF;
                                if (totalRounds == p1_WS[p1_CW]['ammoleft']) {
                                    p1_DMG = totalDMG; //pass total value back to hDMG to subtract it from p2_CL
                                    p1_RF = totalRounds;
                                    break;
                                }

                            }

                        }

                    }

                } else {

                    recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                    + "their " + p1_W[p1_CW]['name'] + " missing "
                                    + p2['name'] + "\n";
                }

            }

            p1_WS[p1_CW]['ammoleft'] -= p1_RF;
            if (p1_WS[p1_CW]['ammoleft'] == 0) {
                p1_WS[p1_CW]['clipsleft'] -= 1;
                if (p1_WS[p1_CW]['clipsleft'] == 0 || p1_AS[p1_CW]['reload'] != true) {
                    p1_AS[p1_CW]['setting'] = 0;
                }
            }

        } else if (p1_CW == "secondary") {

            if (p1_DMG > p2_CL) {
                p1_DMG = p2_CL;
            }

            let p1_RF = roundsFired(p1_W[p1_CW],p1_WS[p1_CW])

            if (p1_HOM == 1) {

                recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                + "their " + p1_W[p1_CW]['name'] + " hitting "
                                + p2['name'] + " in the " + p1_BP[0] + " for "
                                + p1_DMG + "\n";

                if (p1_W[p1_CW]['bonus']['name'] == "Burn") {

                    let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                    if (p1_Proc == 1) {
                        // does it override?
                        if (p1_DOT[0][0] > 0) {
                            if (p1_DMG >= p1_DOT[0][0] * 0.15 / 5 * (6 - p1_DOT[0][1])) {
                                p1_DOT[0] = [p1_DMG,0]
                                recentMessage += p2['name'] + " is set alight \n"
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            p1_DOT[0] = [p1_DMG,0]
                            recentMessage += p2['name'] + " is set alight \n"
                        }
                    }
                } else if (p1_W[p1_CW]['bonus']['name'] == "Poison") {

                    let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                    if (p1_Proc == 1) {
                        // does it override?
                        if (p1_DOT[1][0] > 0) {
                            if (p1_DMG >= p1_DOT[1][0] * 0.45 / 15 * (16 - p1_DOT[1][1])) {
                                p1_DOT[1] = [p1_DMG,0]
                                recentMessage += p2['name'] + " is poisoned \n"
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            p1_DOT[1] = [p1_DMG,0]
                            recentMessage += p2['name'] + " is poisoned \n"
                        }
                    }
                }

            } else {

                recentMessage += p1['name'] + " fired " + p1_RF + " rounds of "
                                + "their " + p1_W[p1_CW]['name'] + " missing "
                                + p2['name'] + "\n";
            }

            p1_WS[p1_CW]['ammoleft'] -= p1_RF;
            if (p1_WS[p1_CW]['ammoleft'] == 0) {
                p1_WS[p1_CW]['clipsleft'] -= 1;
                if (p1_WS[p1_CW]['clipsleft'] == 0 || p1_AS[p1_CW]['reload'] != true) {
                    p1_AS[p1_CW]['setting'] = 0;
                }
            }

        } else if (p1_CW == "melee") {

            if (p1_DMG > p2_CL) {
                p1_DMG = p2_CL;
            }

            if (p1_HOM == 1) {

                recentMessage += p1['name'] + " hit " + p2['name']
                                + " with their " + p1_W[p1_CW]['name'] + " in the "
                                + p1_BP[0] + " for " + p1_DMG + "\n";


                if (p1_W[p1_CW]['bonus']['name'] == "Toxin") {

                    let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                    if (p1_Proc == 1) {

                        // check which effects are left. 3 of each maximum applied.
                        let eL = []
                        for (let i=2;i<6;i++) {
                            if (p1_SE[i] < 3) {
                                eL.push(i)
                            }
                        }

                        // status effect index
                        let eI = eL[Math.floor(Math.random() * eL.length)]
                        p1_SE[eI] += 1

                        if (eI == 2) {
                            // effect = wither
                            p2_P['strength'] -= 25;
                            recentMessage += p2['name'] + " is withered \n"

                        } else if (eI == 3) {
                            // effect = slow
                            p2_P['speed'] -= 25;
                            recentMessage += p2['name'] + " is slowed \n"

                        } else if (eI == 4) {
                            // effect = weaken
                            p2_P['defense'] -= 25;
                            recentMessage += p2['name'] + " is weakened \n"

                        } else if (eI == 5) {
                            // effect = cripple
                            p2_P['dexterity'] -= 25;
                            recentMessage += p2['name'] + " is crippled \n"

                        }
                    }
                } else if (p1_W[p1_CW]['bonus']['name'] == "Lacerate") {

                    let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                    if (p1_Proc == 1) {
                        // does it override?
                        if (p1_DOT[2][0] > 0) {
                            if (p1_DMG >= p1_DOT[2][0] * 0.90 / 9 * (10 - p1_DOT[2][1])) {
                                p1_DOT[2] = [p1_DMG,0]
                                recentMessage += p2['name'] + " is lacerated \n"
                            } else {
                                // do nothing, does not override
                            }
                        } else {
                            p1_DOT[2] = [p1_DMG,0]
                            recentMessage += p2['name'] + " is lacerated \n"
                        }
                    }
                }


            } else {
                recentMessage += p1['name'] + " missed " + p2['name']
                                + " with their " + p1_W[p1_CW]['name'] + "\n";
            }

        } else if (p1_CW == "temporary") {

            // to be used at some point
            if (p1_W[p1_CW]['bonus']['name'] == "Severe Burn") {

                let p1_Proc = procBonus(p1_W[p1_CW]['bonus']['proc'])
                if (p1_Proc == 1) {
                    // does it override?
                    if (p1_DOT[3][0] > 0) {
                        if (p1_DMG >= p1_DOT[3][0] * 0.15 / 5 * (6 - p1_DOT[3][1])) {
                            p1_DOT[3] = [p1_DMG,0]
                            recentMessage += p2['name'] + " is set ablaze \n"
                        } else {
                            // do nothing, does not override
                        }
                    } else {
                        p1_DOT[3] = [p1_DMG,0]
                        recentMessage += p2['name'] + " is set ablaze \n"
                    }
                }
            }


        }

        p2_CL -= p1_DMG;

        if (p2_CL == 0) {
            return [recentMessage, p1_CL, p2_CL, p1_WS, p2_WS, p1_SE, p2_SE, p1_DOT, p2_DOT, p1_P, p2_P, p1_Wset, p2_Wset];
        }


        if (p2['perks']['company']['gascauterize'] == true) {
            rng = Math.floor(Math.random() * 10 + 1)
            p2_ML = Object.assign(p2['life'])
            if (rng == 1) {
                life = parseInt(0.2 * p2_ML)
                if (p2_CL + life > p2_ML) {
                    life = p2_ML - p2_CL
                }
                p2_CL += life
                recentMessage += p2['name'] + " cauterized their wound and recovered " + life + " life \n"
            }
        }

        for (let dot in p1_DOT) {

            if (p2_CL > 1 && p1_DOT[dot][0] > 0 && p1_DOT[dot][1] > 0) {

                let dotDMG
                if (dot == 0) {
                    // Burn
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.15 / 5 * (6 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Burning damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 5) {
                        p1_DOT[dot] = [0,0]
                    }
                } else if (dot == 1) {
                    // Poison
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.45 / 15 * (16 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Poison damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 15) {
                        p1_DOT[dot] = [0,0]
                    }
                } else if (dot == 2) {
                    // Lacerate
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.90 / 9 * (10 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Laceration damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 9) {
                        p1_DOT[dot] = [0,0]
                    }
                } else if (dot == 3) {
                    // Severe Burn
                    dotDMG = parseInt(p1_DOT[dot][0] * (0.15 / 5 * (10 - p1_DOT[dot][1])))
                    if (dotDMG > p2_CL - 1) {
                        dotDMG = p2_CL - 1;
                    }
                    recentMessage += "Severe burning damaged " +  p2['name'] + " for " + dotDMG + "\n";

                    if (p1_DOT[dot][1] == 9) {
                        p1_DOT[dot] = [0,0]
                    }
                }

                p2_CL -= dotDMG;

            }

            p1_DOT[dot][1] += 1;

        }

    }

    return [recentMessage, p1_CL, p2_CL, p1_WS, p2_WS, p1_SE, p2_SE, p1_DOT, p2_DOT, p1_P, p2_P, p1_Wset, p2_Wset];

}
