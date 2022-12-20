function distance(destination, origin) {
    // Thanks https://www.movable-type.co.uk/scripts/latlong.html
    const R = 6371e3; // metres
    const φ1 = origin.latitude * Math.PI / 180; // φ, λ in radians
    const φ2 = destination.latitude * Math.PI / 180;
    const Δφ = (destination.latitude - origin.latitude) * Math.PI / 180;
    const Δλ = (destination.longitude - origin.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

/**
 * Normalizes a certain attribute of the given region map.
 * Creates a new attribute "ATTRIBUTE_nornalized".
 * @param {Object} map: a map of <region, data>
 * @param {String} attribute: the attribute in data to normalize against
 */

const normalizedSuffix = "_normalized";
const cfeAttr = "cfe";
const carbonIntensityAttr = "gCO2_kWh";
const priceAttr = "gce";
const distanceAttr = "distance";

function normalizeAttributes(map, attribute) {
    let min = Infinity;
    let max = -Infinity;
    for (const region in map) {
        let value = map[region][attribute];
        if (value > max) {
            max = value;
        }
        if (value < min) {
            min = value;
        }
    }
    for (const region in map) {
        if (map[region][attribute]) {
            map[region][attribute + normalizedSuffix] = (map[region][attribute] - min) / (max - min)
        }
    }
}


function rankRegions(regions, inputs, types=true) {
    let results = [];
    let latencyData;

    normalizeAttributes(regions, cfeAttr);
    normalizeAttributes(regions, carbonIntensityAttr);
    normalizeAttributes(regions, priceAttr);

    // If latency is a criteria and some locations have been specified,
    // score each region based on proximity to locations.
    if (inputs.weights.latency > 0 && inputs.locations.length > 0) {
        latencyData = {};
        for (const region in regions) {
            let d = 0;
            for (const location of inputs.locations) {
                // console.log(inputs);
                d += distance(location, regions[region]);
            }
            latencyData[region] = { distance: d };
        }
        normalizeAttributes(latencyData, distanceAttr);
    }

    for (const region in regions) {
        let score = 0;
        let targetLatency = 10;
        
        if (targetLatency > 0 && inputs.locations.length > 0) {
            // latency: lower is better
            score += (1 - latencyData?.[region]?.[distanceAttr + normalizedSuffix]) * inputs.weights.latency;
        }

        if (!isNaN(score) && types.length == 0) {

                results.push({
                    region: region,
                    properties: regions[region],
                    score: score,
                });
        }

        else {

            if (types.includes(regions[region]['type'])) {

                results.push({
                    region: region,
                    properties: regions[region],
                    score: score,
                });

            }

        }
    }

    let resultSorted = results.sort(function (a, b) {
        return b.score - a.score;
    });

    return resultSorted;
}

async function regionOptimizer(regions, inputs, types) {

    return rankRegions(regions, inputs, types);
}


export { regionOptimizer }
