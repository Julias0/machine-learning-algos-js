const csv = require('csv-parser');
const fs = require('fs');

const linerRegressionModel = () => {
    let wPredicted = 0;
    let bPredicted = 0;
    function updateWandB(xData, yData, alpha) {
        let derW = 0;
        let derB = 0;
        for (let index = 0; index < xData.length; index++) {
            derW += -2 * xData[index] * (yData[index] - (wPredicted * xData[index] + bPredicted))
            derB += -2 * yData[index] - (wPredicted * xData[index] + bPredicted)
        }
        // console.log('derW', derW );
        // console.log('derB', derB );
        wPredicted = wPredicted - (1.0 / xData.length) * derW * alpha;
        bPredicted = bPredicted - (1.0 / xData.length) * derB * alpha;
        // console.log(wPredicted, bPredicted);
    }

    function getAverageLoss(xData, yData, w, b) {
        const n = xData.length;
        totalError = 0;
        for (let index = 0; index < n; index++) {
            totalError += Math.pow(yData[index] - (w * xData[index] + b), 2)
        }
        return totalError / n;
    }

    return {
        wPredicted,
        bPredicted,
        train: (data, x, y, alpha, epochs) => {
            const xData = data.map(datum => +datum[x]);
            const averagedXData = xData.reduce((x1, x2) => x2 + x1) / xData.length;
            const normalizedxData = xData.map(x => x / averagedXData);

            const yData = data.map(datum => +datum[y]);
            const averagedYData = yData.reduce((y1, y2) => y2 + y1) / yData.length;
            const normalizedyData = yData.map(x => x / averagedYData);

            for (let index = 0; index < epochs; index++) {
                updateWandB(normalizedxData, normalizedyData, alpha);
                console.log(`epoch ${index + 1} - loss ${getAverageLoss(xData, yData, wPredicted, bPredicted)}`)
            }

            return {
                wPredicted,
                bPredicted
            }
        },
        test: (data, x, y) => {
            const xData = data.map(datum => +datum[x]);
            const yData = data.map(datum => +datum[y]);

            return getAverageLoss(xData, yData, wPredicted, bPredicted);
        },
        predict: (x) => {
            return wPredicted * x + bPredicted;
        }
    }
}

let rows = [];

fs.createReadStream('data.csv')
    .pipe(csv())
    .on('data', (row) => {
        rows.push(row);
    })
    .on('end', () => {
        console.log('CSV file successfully processed');
        console.log(rows.length);
        rows = rows.filter(row => row['Horsepower'] !== '' && row['Price_in_thousands'] !== '')
        console.log(rows.length);
        const newModel = linerRegressionModel();
        newModel.train(rows.slice(0, 100), 'Horsepower', 'Price_in_thousands', 0.0000001, 600000);
        const results = newModel.test(rows.slice(100, 150), 'Horsepower', 'Price_in_thousands');
        console.log('Model loss is ' + results);
        console.log(`predicted price of engline size ${rows[0]['Horsepower']} is ${newModel.predict(rows[0]['Horsepower'])}`)
    });