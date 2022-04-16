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
}
