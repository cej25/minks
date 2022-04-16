// after a check for 0 life
// before check for DOT
// must also be included in reload loop, before DOT check
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
