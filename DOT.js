// DOT effects: Burn, Poison, Lacerate, Severe Burn
let hDOT = [[0,0],[0,0],[0,0],[0,0]], vDOT = [[0,0],[0,0],[0,0],[0,0]];

^ under status effect line

// takeTurn function passes hDOT and vDOT

// function below used:
- immediately after reload (where text is added to log)
- after hDMG is subtracted from vCL and after variables are returned vCL = 0
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
