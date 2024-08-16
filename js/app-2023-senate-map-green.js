// let SHEET_ID = "17yxvdTk33zFh92z7CE4I2FBkKyLI4F-ePu3P0g1G4Ns";
let SHEET_ID = "17Y0YOQCicpd-PB91AYf4u0rsO5AFcAAl2jyEaFs3U2k";
let PAboundaryLayer;
let PADistricts = {};
let app = {};
let freeze = 0;
let $sidebar = $("#sidebar");
let clickedMemberNumber;

let vote_context =  {
    "priority_votes": [
        {
            "bill_number": "HB 1032",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&sind=0&body=H&type=B&bn=1032",
            "bill_color": "green",
            "stance": "Yes",
            "bill_subtitle": "Solar for Schools Program",
            "status": "Signed by the Governor",
            "bill_date": "7/17/24",
            "movement": "",
            "bill_description": "Creates the \"Solar for Schools Grant Program.\" This will allow school districts, community colleges, and career technical schools to install solar technology on their rooftops and properties to reduce their energy costs and carbon emissions, with targeted federal investments in envrionmental justice communities"
        },
        {
            "bill_number": "SB 819",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=819",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Ban on protesting fossil fuel buildout",
            "status": "Passed in the Senate (32-18)",
            "bill_date": "4/9/24",
            "movement": "Final Passage",
            "bill_description": "Under the guise of protecting the power grid, this bill will have a chilling effect on the public\u2019s right to free speech and assembly. It creates felony penalties if someone trespasses on critical infrastructure facility properties with the \"intent\" to vandalize it, which creates a legal grey area that could lead to the imprisonment of someone for simply standing along a roadside or near a gate for \"impeding\" operations."
        },
        {
            "bill_number": "SB 831",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=831",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Carbon capture infrastructure buildout ",
            "status": "Enacted",
            "bill_date": "TBD",
            "movement": "Signed by the Governor",
            "bill_description": "This bill intends to make it easier for companies engaging in carbon capture and sequestration to do business in Pennsylvania, but places the public and landowners at significant risk. It brazenly passes liability for underground CO2 storage to taxpayers, seemingly forever, once underground injections cease."
        },
        {
            "bill_number": "SB 188",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=188",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Concurrent resolution requirement for \"economically significant\" regulations",
            "status": "Passed in the Senate (28-21)",
            "bill_date": "5/9/23",
            "movement": "Final Passage",
            "bill_description": "Requires the General Assembly to pass a concurrent resolution to approve any final-form rulemaking deemed \u201ceconomically significant\u201d before it can be implemented. If one or both chambers failed to act, the final regulation would be deemed not approved and would not be implemented, potentially halting significant environmental legislation needed to protect vulnerable communities."
        },
        {
            "bill_number": "SB 190",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=190",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Three year review of \"economically significant\" regulations",
            "status": "Passed in the Senate (28-21)",
            "bill_date": "5/9/23",
            "movement": "Final Passage",
            "bill_description": "Creates extraneous layers of bureaucracy that would place considerable time and capacity strains on agencies and the Independent Regulatory Review Commission without any new funding or support."
        },
        {
            "bill_number": "SB 350",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=350",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Third party permitting ",
            "status": "Passed in the Senate (29-19)",
            "bill_date": "5/10/23",
            "movement": "Final Passage",
            "bill_description": "Provides for third party permitting which will force agencies to allow private companies to make permitting decisions without clear oversight."
        },
        {
            "bill_number": "SB 144",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=144",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Weakened PFAS standards",
            "status": "Passed in the Senate (36-14)",
            "bill_date": "3/7/23",
            "movement": "Final Passage",
            "bill_description": "By only limiting, rather than ending, the use of PFAS in firefighting foam, this bill will continue to put Pennsylvania\u2019s communities and firefighters at risk of exposure and contamination."
        },
        {
            "bill_number": "SB 832",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billInfo/billInfo.cfm?sYear=2023&sInd=0&body=S&type=B&bn=832",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Independent Energy Office",
            "status": "Passed in the Senate (28-22)",
            "bill_date": "5/1/24",
            "movement": "Final Passage",
            "bill_description": "The DEP already has an Energy Programs Office, making this legislation extraneous. Additionally, it contains provisions that could put hundreds of millions of dollars of federal funding at risk."
        },
        {
            "bill_number": "SB 143",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=143",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Ban on municipal ability to incentivize renewable energy use",
            "status": "Passed in the Senate (40-9)",
            "bill_date": "3/8/23",
            "movement": "Final Passage",
            "bill_description": "Takes away communities' ability to incentivize the use of renewable energy or limit fossil fuel use in residential properties."
        },
        {
            "bill_number": "SB 1",
            "bill_url": "https://www.legis.state.pa.us/cfdocs/billinfo/billinfo.cfm?syear=2023&body=S&type=B&bn=1",
            "bill_color": "red",
            "stance": "No",
            "bill_subtitle": "Restrictive Voter ID requirements",
            "status": "Passed in the Senate (28-20)",
            "bill_date": "5/22/23",
            "movement": "Final Passage",
            "bill_description": "Harasses and disenfranchises voters by requiring \u2018valid identification,\u2019 which will disproportionately harm elderly and minority voters, robbing them of their constitutional right to vote."
        }
    ]
};

let map = L.map("map", {
    scrollWheelZoom: false,
    zoomSnap: 0.25,
    minZoom: 6
}).setView([40.09, -77.6728], 7);

// 1. Enable the Google Sheets API and check the quota for your project at
//    https://console.developers.google.com/apis/api/sheets
// 2. Get an API key. See
//    https://console.developers.google.com/apis/

let API_KEY = 'AIzaSyDKNPLWdP2gCYRyfTI4mvw20rVGx8QTHxE';

function fetchSheet({ spreadsheetId, sheetName, apiKey, complete }) {
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
    return fetch(url).then(response =>
        response.json().then(result => {
            let data = Papa.parse(Papa.unparse(result.values), { header: true });
            complete(data);
        })
    );
}

async function fetchMemberData() {
    const response = await fetch("/data/senate_member_votes_23-24.json");
    const json = await response.json();
    return json;
}

async function init() {
    const result = await fetchMemberData();
    showInfo(result);
            let key_votes = $("#senate-template-bottom").html();
            app.template = Handlebars.compile(key_votes);
            let html = app.template(vote_context);
            $("#priorityVotes").append(html);
}

window.addEventListener("DOMContentLoaded", init);

function showInfo(results) {
    let data = results.data;
    let scoreColor;
    let lifetimeScoreColor;

    $.each(data, function(i, member) {
        scoreColor = getColor(parseInt(member.score_num));
        member['scoreColor'] = scoreColor;
        lifetimeScoreColor = getColor(parseInt(member.lifetime_score));
        member['lifetimeScoreColor'] = lifetimeScoreColor;
        if (member.District) {
            PADistricts[member.District] = member;
        }
    });

    loadGeo();

    function loadGeo() {

           let tileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
            {
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
            tileSize: 512,
            maxZoom: 18,
            zoomOffset: -1,
            id: 'mapbox/light-v10',
            accessToken: 'pk.eyJ1IjoibXJvc3dlbGwiLCJhIjoiY2twZDN6eTB0MWJ4eDJxcGd5OG0yN2xtNCJ9.tUHOVBolz3YsZRQJOQRETg'
        }).addTo(map);


    PAboundaryLayer = L.geoJson(pa_state_senate_boundary_map, {
        onEachFeature: onEachFeature,
        style: data => geoStyle(data)
    }).addTo(map);
}

    let district = getQueryVariable("district");
    if (district) {
        distsplit = district.split('-');
        distnum = distsplit[distsplit.length - 1];
        PAboundaryLayer.eachLayer(layer => {
            if (layer.feature.properties.NAME === distnum) {
                layer.fireEvent('click');
            }
        });
    }
}

let geoStyle = function(data) {
    let legisId = data.properties.NAME;
    let scoreColor = getColor(parseInt(PADistricts[legisId].score_num));

    return {
        fillColor: scoreColor,
        weight: 1,
        opacity: 0.9,
        color: "#fefefe",
        dashArray: "0",
        fillOpacity: 0.7,
        className: "SD-"+legisId //add class to path
    };
};

$(document).ready(function() {
    let sourcebox = $("#senate-template-infobox").html();
    app.infoboxTemplate = Handlebars.compile(sourcebox);

    let map_help = $("#welcome-map-help").html();
    app.welcome = Handlebars.compile(map_help);
    $sidebar.append(app.welcome);
});

// get color depending on score value
function getColor(score) {
    return score === "Medical leave" ? '#fefefe' :
        score > 99 ? '#409B06' :
            score > 74 ? '#A8CA02' :
                score > 49 ? '#FEF200' :
                    score > 24 ? '#FDC300' :
                        score > 0 ? '#FC8400' :
                            '#F00604';
}

function highlightFeature(e) {
    let layer = e.target;
    let legisId = parseInt(layer.feature.properties.NAME);

    let memberDetail = PADistricts[legisId];

    layer.setStyle({
        weight: 3,
        color: "#8e8e8e",
        dashArray: "",
        fillOpacity: .4
    });
    if (!freeze) {
        let html = app.infoboxTemplate(memberDetail);
        $sidebar.html(html);
        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }
    }
}

function resetHighlight(e) {
    let layer = e.target
    PAboundaryLayer.resetStyle(layer);
    // let districtNumber = PADistricts.feature.properties.legis_id;
}

function mapMemberDetailClick(e) {
    freeze = 1;
    let boundary = e.target;
    let legisId = parseInt(boundary.feature.properties.NAME);
    queryString.push('district', "SD-"+legisId);
    let member = memberDetailFunction(legisId);
}

function memberDetailFunction(legisId) {
    clickedMemberNumber = legisId;
    let districtDetail = PADistricts[legisId];

    let html = app.infoboxTemplate(districtDetail);
    $sidebar.html(html);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: mapMemberDetailClick
    });
}

map.attributionControl.addAttribution(
    'District Boundaries &copy; <a href="http://census.gov/">US Census Bureau</a>'
);

function clearInfobox() {
    $sidebar.html(" ");
    $sidebar.append(app.welcome);
    let $heading = $(".entry-default-text h4");
    $heading.html("Map Help");
}

$(document).on("click", ".close", function(event) {
    event.preventDefault();
    clearInfobox();
    freeze = 0;

    if (typeof isLocal != "undefined") {
        isLocal = getQueryVariable("_ijt");
        isLocalFullParam = "?_ijt="+ isLocal;
    } else {
        isLocalFullParam="";
    }
    window.history.pushState({}, document.title, window.location.pathname + isLocalFullParam );
});

// Enable Escape key to close popup
$(document).on('keydown',function(evt) {
    evt = evt || window.evt;
    let isEscape = false;
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
    } else {
        isEscape = (evt.keyCode === 27);
    }
    if (isEscape) {
        evt.preventDefault();
        clearInfobox();
        freeze = 0;
        if (typeof isLocal != "undefined") {
            isLocal = getQueryVariable("_ijt");
            isLocalFullParam = "?_ijt=" + isLocal;
        } else {
            isLocalFullParam = "";
        }
        window.history.pushState({}, document.title, window.location.pathname + isLocalFullParam);

    }
});

document.getElementById("buttonState").addEventListener("click", function () {
    map.flyTo([40.09, -77.6728], 7, {
        animate: true,
        duration: 1 // in seconds
    });
});

document.getElementById("buttonPittsburgh").addEventListener("click", function () {
    map.flyTo([40.43, -79.98], 10, {
        animate: true,
        duration: 1.4 // in seconds
    });
});

document.getElementById("buttonPhiladelphia").addEventListener("click", function () {
    map.flyTo([40, -75.2], 9.75, {
        animate: true,
        duration: 1.4 // in seconds
    });
});
document.getElementById("buttonAllentown").addEventListener("click", function () {
    map.flyTo([41, -75.5], 9, {
        animate: true,
        duration: 1.4 // in seconds
    });
});

/*!
 query-string
 Parse and stringify URL query strings
 https://github.com/sindresorhus/query-string
 by Sindre Sorhus
 MIT License
 */
(function () {
    'use strict';
    var queryString = {};

    queryString.parse = function (str) {
        if (typeof str !== 'string') {
            return {};
        }

        str = str.trim().replace(/^\?/, '');

        if (!str) {
            return {};
        }

        return str.trim().split('&').reduce(function (ret, param) {
            var parts = param.replace(/\+/g, ' ').split('=');
            var key = parts[0];
            var val = parts[1];

            key = decodeURIComponent(key);
            // missing `=` should be `null`:
            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
            val = val === undefined ? null : decodeURIComponent(val);

            if (!ret.hasOwnProperty(key)) {
                ret[key] = val;
            } else if (Array.isArray(ret[key])) {
                ret[key].push(val);
            } else {
                ret[key] = [ret[key], val];
            }

            return ret;
        }, {});
    };

    queryString.stringify = function (obj) {
        return obj ? Object.keys(obj).map(function (key) {
            var val = obj[key];

            if (Array.isArray(val)) {
                return val.map(function (val2) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
                }).join('&');
            }

            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
        }).join('&') : '';
    };

    queryString.push = function (key, new_value) {
        var params = queryString.parse(location.search);
        if(new_value == null){
            delete params[key];
        } else {
            params[key] = new_value;
        }
        var new_params_string = queryString.stringify(params);
        history.pushState({}, "", window.location.pathname + '?' + new_params_string);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = queryString;
    } else {
        window.queryString = queryString;
    }
})();

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return(false);
}


