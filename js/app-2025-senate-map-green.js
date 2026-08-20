// let SHEET_ID = "17yxvdTk33zFh92z7CE4I2FBkKyLI4F-ePu3P0g1G4Ns";
let SHEET_ID = "17Y0YOQCicpd-PB91AYf4u0rsO5AFcAAl2jyEaFs3U2k";
let PAboundaryLayer;
let PADistricts = {};
let app = {};
let freeze = 0;
let $sidebar = $("#sidebar");
let clickedMemberNumber;

let vote_context = {
    "priority_votes": [
        {
            "bill_number": "SB 154",
            "stance": "No",
            "bill_subtitle": "Anti-Environment Chapter 14 Reauthorization",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb0154",
            "status": "Passed in Senate (41-7), Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Reauthorizes Chapter 14 without critical protections for low and moderate income ratepayers."
        },
        {
            "bill_number": "SB 186",
            "stance": "No",
            "bill_subtitle": "RGGI Abrogation",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb0186",
            "status": "Passed in the Senate (31-18), Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Prevents Pennsylvania from entering the Regional Greenhouse Gas Initiative (RGGI), or enacting any sort of cap-and-invest carbon regulation to reduce harmful emissions."
        },
        {
            "bill_number": "SB 187",
            "stance": "No",
            "bill_subtitle": "Independent Energy Office",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb0187",
            "status": "Passed in the Senate (27-21), Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Establishes a duplicative and politicized Independent Energy Office and contains provisions that could put hundreds of millions of dollars of alternative fuels funding at risk."
        },
        {
            "bill_number": "SB 311",
            "stance": "No",
            "bill_subtitle": "Anti-Renewables Energy Choice",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb0311",
            "status": "Passed in the Senate (34-15), Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Takes away communities' ability to incentivize the use of renewable energy or limit fossil fuel use in residential properties."
        },
        {
            "bill_number": "SB 333",
            "stance": "No",
            "bill_subtitle": "REINS Act",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb0333",
            "status": "Passed in the Senate (27-23), Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Requires the General Assembly to pass a concurrent resolution to approve any final-form rulemaking deemed \"economically significant\" before it can be implemented. If one or both chambers failed to act, the final regulation would be deemed not approved and would not be implemented, potentially halting significant environmental legislation needed to protect at-risk communities."
        },
        {
            "bill_number": "SB 1236",
            "stance": "No",
            "bill_subtitle": "Weakening the Clean Streams Law",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb1236",
            "status": "Passed in the Senate (30-20), Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Waives requirements for a National Pollutant Discharge Elimination System permit, allowing for companies to bypass environmental protections for waterways."
        },
        {
            "bill_number": "SB 444",
            "stance": "No",
            "bill_subtitle": "Automatic Three-Year Review of \"Economically Significant\" Regulations",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb0444",
            "status": "Passed in the Senate (27-23), Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Creates extraneous layers of bureaucracy that would place considerable time and capacity strains on agencies and the Independent Regulatory Review Commission without any new funding or support."
        },
        {
            "bill_number": "SB 6",
            "stance": "No",
            "bill_subtitle": "Transparency in Permitting",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/sb0006",
            "status": "Passed in the Senate (28-22). Awaiting action in the House.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Provides for third party permitting which will force agencies to allow private companies to make permitting decisions without clear oversight."
        },
        {
            "bill_number": "HB 416",
            "stance": "No",
            "bill_subtitle": "Anti-RGGI Fiscal Code",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb0416",
            "status": "Passed in the House (189-14), Passed in the Senate (43-6). Signed into law by the Governor.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Prohibits Pennsylvania from entering the Regional Greenhouse Gas Initiative (RGGI), which is the most consequential climate program in our Commonwealth's history."
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
    const response = await fetch("/data/senate_member_votes_25-26.json");
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
        scoreColor = getColor(memberScore(member, member.score_num));
        member['scoreColor'] = scoreColor;
        lifetimeScoreColor = getColor(memberScore(member, member.lifetime_score));
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
    let scoreColor = getColor(memberScore(PADistricts[legisId], PADistricts[legisId].score_num));

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
// A vacant seat has no score to report -- render it neutral rather than as a
// legislator who voted against the environment every time.
function memberScore(member, score) {
    if (member && member.Party === "Vacant") {
        return "Vacant";
    }
    return parseInt(score);
}

function getColor(score) {
    return (score === "Medical leave" || score === "Vacant") ? '#fefefe' :
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


