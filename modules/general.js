const fetch = require('node-fetch');


exports.numberWithCommas = function numberWithCommas(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

exports.retrieveApiData = async function retrieveApiData(api) {

    const apiResponse = await fetch(api)
      .then(response => response.json())

    if (!apiResponse['error']) {
        return apiResponse;
    } else {

        let now = this.formatTime(new Date())
        console.log(now + ' - API error! ' + apiResponse['error']['error'])
        return 'error';
    }
}

// filepath must be relative to where function is called
exports.updateJsonFile = async function updateJsonFile(filePath,object) {
    require("fs").writeFileSync("." + filePath + ".json", JSON.stringify(object, null, 2));
}

exports.rng = function rng(min,max) {

    return rng = Math.floor(Math.random() * max + min)

}

exports.timeConverter = function timeConverter(timestamp){
    let a = new Date(timestamp * 1000);
    let year = a.getFullYear();
    let month = a.getMonth();
    if (month < 10) {
        month = "0" + month;
    }
    let date = a.getDate();
    if (date < 10) {
        date = "0" + date;
    }
    let hour = a.getHours();
    if (hour < 10) {
        hour = "0" + hour;
    }
    let min = a.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    let sec = a.getSeconds();
    if (sec < 10) {
        sec = "0" + sec;
    }
    let time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

exports.timeToNearest = function timeToNearest(time) {
    if (time > 99) {
        time = parseInt(time / 100)
        let now = new Date();
        let future = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time, 0, 0, 0) - now;
        if (future < 0) {
            future += 86400000;
        }
        return future / 1000
    } else {
        let now = new Date()
        timeLeft = (now.getMinutes() * 60 + now.getSeconds()) % (time * 60);
        return (time * 60) - timeLeft;
    }
}

exports.sleep = function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time || 1000))
}

exports.runInterval = async function runInterval(func,time,funcName) {

    console.log("Opened interval for " + funcName)

    let firstDelay = await this.timeToNearest(time);
    await this.sleep ((firstDelay + 15) * 1000)
    // if "minutes" > 99, do something else..
    if (time > 99) {
        time = 24 * 60
    }

    func();

    const intervalConst = await setInterval(async function () {

        func();

    }, time * 60 * 1000)

}

exports.stdev_pct = async function stdev_pct(array) {

    let n = array.length;
    let sum = 0;
    for (let element in array) {
        sum += array[element]
    }

    let mean = sum / n;

    let diff = 0, sigma = 0;
    for (let element in array) {
        diff += (mean - array[element]) ** 2
    }

    sigma = ((diff / n) ** 0.5).toFixed(2)
    sigma_pct = (sigma/mean*100).toFixed(2)

    return sigma+" ("+sigma_pct+"%)";
}
