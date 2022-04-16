else if (hW[hCW]['bonus']['name'] == "Blindfire" && hWS[hCW]['ammoleft'] - hRF != 0) {

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
