import * as d3 from 'd3'
import * as L from 'leaflet'

// Define marker list
var allMarkers = [];

// Define Icons
var CigIcon = L.Icon.extend({
    options: {
        iconSize:     [25, 45],
        iconAnchor:   [22, 94],
        popupAnchor:  [-8, -90]
    }
});

var blackIcon = new CigIcon({iconUrl: 'assets/img/cig-marker-black.png'}),
    redIcon = new CigIcon({iconUrl: 'assets/img/cig-marker-red.png'});

// Todo: Dynamically compute center based on pid locations.
var lat = 48.735491;
var long = -122.485801;
var mymap = L.map('mapid').setView([lat, long], 13);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);

function clearBox(elementID)
{
    document.getElementById(elementID).innerHTML = "";
}

// Plot current menu choice to start out
var option = document.getElementById("map_participant_menu");
build_map_view(option.value);

// Update map when participant changes
document.getElementById("map_participant_menu").onchange = function() {
    var pid = this.value;
    build_map_view(pid);

    return false;
};


// Setting up map interface
function build_map_view(pid) 
{
    try {
        d3.csv('data/smoking_locations.csv').row( (d, i) => {
                console.log("Loading smoking episodes...")
                return {
                    participant_id: +d["participant_id"],
                    datetime: d["datetime"],
                    latitude: +d["latitude"],
                    longitude: +d["longitude"],
                }
            }).get( (error, rows) => {
                // Clear existing markers
                for (var i = 0; i < allMarkers.length; i++) {
                    mymap.removeLayer(allMarkers[i]);
                }

                // Add new markers
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i]
                    var datetime = new Date(Date.parse(row.datetime));
                    
                    if (!isNaN(row.latitude)) {
                        if (row.participant_id == pid) {
                            var marker = new L.marker([row.latitude, row.longitude], {icon: redIcon})
                            .bindPopup("Participant ID: "+ row.participant_id
                                        + "<br>Date: " + datetime.toLocaleDateString()
                                        + "<br>Time: " + datetime.toLocaleTimeString())
                            .openPopup();
                            mymap.addLayer(marker);
                            allMarkers.push(marker);
                        } else {
                            // L.marker([row.latitude, row.longitude], {icon: blackIcon})
                            // .bindPopup("Participant ID: "+ row.participant_id
                            //             + "<br>Date: " + datetime.toLocaleDateString()
                            //             + "<br>Time: " + datetime.toLocaleTimeString())
                            // .openPopup()
                            // .addTo(mymap)

                            var marker = new L.marker([row.latitude, row.longitude], {icon: blackIcon})
                            .bindPopup("Participant ID: "+ row.participant_id
                                        + "<br>Date: " + datetime.toLocaleDateString()
                                        + "<br>Time: " + datetime.toLocaleTimeString())
                            .openPopup();
                            mymap.addLayer(marker);
                            allMarkers.push(marker);
                        }
                    }
                }

                console.log("Done.")
            });
    } catch(err) {
        console.log(err.message)
        console.log("'mapid' element not found. Must be on a different page...")
    }
}