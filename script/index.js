import { regionOptimizer } from './region-optimizer.js';

const regionsToDisplay = 10;

let regions;
let fetching;

async function initializeCountrySelect() {
  let countries;

  await fetch("data/countries.json")
    .then(data => data.json())

}

async function fetchData() {
  fetching = true;

  // Fetch data in parrallel
  await Promise.all([
      fetch("data/regions-combined.json")
          .then(data => data.json())
          .then(json => regions = json)
  ]);

  fetching = false;
}



function bindListeners() {
  

  // Clicked on the iaas icon
  document.getElementById('checBoxContainer').addEventListener('click', recommendRegion);

  // Location has been activated
  document.getElementById('locations').addEventListener('change', recommendRegion);
  
  let activa = document.querySelector("autocomplete-active");

  if (activa){
    // console.log(JSON.stringify(activa));
    activa.addEventListener('change', window.alert("Changed"));
  }

  // document.getElementById('locations').addEventListener('change', recommendRegion);

  document.getElementById('more').addEventListener('click', (event) => {
    event.target.remove();
    document.getElementById('results').classList.remove('short');
  });

};



function printResults(results) {
  // console.log("Results:", results);
  const list = document.getElementById('results');

  // clean the list
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Print top regions
  for (let i = 0; i < Math.min(regionsToDisplay, results.length); i++) {
    printResultInList(list, results[i]);
  }
}

/**
 * Append the given result to the list in the DOM 
 * @param {*} list DOM <li>
 * @param {*} result {region, properties, score}
 */

function printResultInList(list, result) {
  let row = document.getElementById('result-row').content.cloneNode(true);
  row.querySelector('.region').textContent = result.region;
  row.querySelector('.name').textContent = result.properties.name;
  row.querySelector('.flag').src = result.properties.flag;
  row.querySelector('.score').textContent = Math.round(result.score * 1000 - 1) / 10 + '%';

    // document.querySelectorAll(".blank").forEach(element => element.classList.add("hidden"));

  list.appendChild(row);

  if (document.getElementById("target_location").value == "" && getCheckedTypes().length == 0){
    document.querySelectorAll(".child").forEach(element => element.classList.add("hidden"));
  } else {
    document.querySelectorAll(".child").forEach(element => element.classList.remove("hidden"));
    document.querySelectorAll(".blank").forEach(element => element.classList.add("hidden"));
  }

}

// Get values, that have been highlighted
function getCheckedTypes(){

  const list = new Array;
  var checkBoxes;
  checkBoxes = document.getElementsByClassName('checked');

  for (const checkBox of checkBoxes){
    list.push(checkBox.id);
  }
  return list;
  
}

async function recommendRegion() {
  if(!regions && !fetching) {
    await fetchData();
  }
  
  let params = {
    weights: {},
    locations: [],
  };

  params.weights["latency"] = parseInt(10, 10) / 10;

  // Add current location and any other selected country.
  const locationSelect = document.getElementById('locations');

  for (const option of locationSelect.options) {
    if (option.selected) {
      params.locations.push(JSON.parse(option.value));

    }
  }

  const types = getCheckedTypes();  
  regionOptimizer(regions, params, types).then(printResults);

};

initializeCountrySelect();
bindListeners();
recommendRegion();

export {recommendRegion}
