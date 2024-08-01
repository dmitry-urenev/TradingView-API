const fs = require('fs');
const TradingView = require('../main');

/**
 * This example tests fetching chart data of a number
 * of candles before or after a timestamp
 */

const client = new TradingView.Client();

function closeClient() {
  if (client.isOpen) {
    client.end();
  }
}

function exitHandler(options, exitCode) {
  if (options.cleanup) {
    console.log('clean');
    closeClient();
  }
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

const chart = new client.Session.Chart();
const pageSize = 200;

const symbol = decodeURIComponent('XETR%3AAPC');
const file = fs.createWriteStream(`./${symbol}.json`);

chart.setMarket(symbol, {
  timeframe: '30',
  range: pageSize, // Can be positive to get before or negative to get after
  // to: 1698177600,
});

chart.onSymbolLoaded(() => {
  console.log('onSymbolLoaded', chart.infos, chart.periods);
});

const maxPages = 10;
let currentPageIndex = 1;

chart.onUpdate(() => {
  console.log(`onUpdate. page ${currentPageIndex}. Items count: ${chart.periods.length}`);

  if (currentPageIndex < maxPages) {
    currentPageIndex += 1;
    chart.fetchMore(pageSize);
  } else {
    closeClient();

    file.write(
      JSON.stringify(
        chart.periods.map((p) => ({
          ...p,
          timestamp: p.time,
          time: new Date(p.time * 1000).toISOString(),
        })), undefined, 4,
      ),
    );

    file.close(() => {
      exitHandler({ exit: true });
    });
  }
});

// This works with indicators

// TradingView.getIndicator('STD;Supertrend').then(async (indic) => {
//   console.log(`Loading '${indic.description}' study...`);
//   const SUPERTREND = new chart.Study(indic);

//   SUPERTREND.onUpdate(() => {
//     console.log('Prices periods:', chart.periods);
//     console.log('Study periods:', SUPERTREND.periods);
//   });
// });

process.stdin.resume(); // so the program will not close instantly

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
