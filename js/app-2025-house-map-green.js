
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
            "bill_number": "HB 1261",
            "stance": "Yes",
            "bill_subtitle": "PFAS Firefighting Foam Ban",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb1261",
            "status": "Passed in the House (202-0), Awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Prohibits the use of PFAS-laden firefighting foam beginning in 2026, and directs Fire Commissioner and DEP to work together to assist fire companies with disposal. Requires warning label for all firefighting PPE containing PFAS."
        },
        {
            "bill_number": "HB 1396",
            "stance": "Yes",
            "bill_subtitle": "Election Reform",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb1396",
            "status": "Passed in the House (102-101), Awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Helps to modernize our election system, while also maintaining the security measures that keep elections safe. Includes provisions like pre-canvassing, expanding access to mail-in voting and machine-based early voting, and reforming recount rules."
        },
        {
            "bill_number": "HB 504",
            "stance": "Yes",
            "bill_subtitle": "Community Energy",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb0504",
            "status": "Passed in the House (114-89), Awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Enables community energy projects and will expand Pennsylvania\u2019s energy portfolio by allowing multiple customers within a certain geographic area to receive their energy from an off-site solar array or anaerobic digestor. This is especially beneficial to low-income homeowners and renters who otherwise would not be able to install alternative sources of energy on their property."
        },
        {
            "bill_number": "HB 1599",
            "stance": "Yes",
            "bill_subtitle": "PJM Transparency",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb1599",
            "status": "Passed in the House (159-43), Awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Requires an electric utility company within PJM to disclose any recorded vote they make and provide a description on how that vote was in the public interest."
        },
        {
            "bill_number": "HB 1364",
            "stance": "Yes",
            "bill_subtitle": "Investing in Mass Transit",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb1364",
            "status": "Passed in the House (107-96), Awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Invests nearly $300 million into public transportation agencies across Pennsylvania."
        },
        {
            "bill_number": "HB 505",
            "stance": "Yes",
            "bill_subtitle": "Act 129 Reform",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb0505",
            "status": "Passed in the House (102-101), Awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Reforms Pennsylvania's flagship energy efficiency and conservation program to make it more accessible for low-income ratepayers and help industries further reduce energy consumption."
        },
        {
            "bill_number": "HB 416",
            "stance": "No",
            "bill_subtitle": "Anti-RGGI Fiscal Code",
            "bill_color": "red",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb0416",
            "status": "Passed in the House (189-14), Passed in the Senate (43-6). Signed into law by the Governor .",
            "bill_date": "",
            "movement": "",
            "bill_description": "Prohibits Pennsylvania from entering the Regional Greenhouse Gas Initiative (RGGI), which is the most consequential climate program in our Commonwealth's history."
        },
        {
            "bill_number": "HB 1556",
            "stance": "Yes",
            "bill_subtitle": "Advanced Clean Manufacturing Tax Credit",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb1556",
            "status": "Passed in the House (104-93), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Establishes a tax credit to promote in-state production of clean manufacturing products."
        },
        {
            "bill_number": "HB 1260",
            "stance": "Yes",
            "bill_subtitle": "Solar-Ready Warehouses",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb1260",
            "status": "Passed in the House (101-98). Awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Requires all new warehouse facilities built in Pennsylvania to have 40% of their roof be structurally compatible for solar panels."
        },
        {
            "bill_number": "HB 1834",
            "stance": "Yes",
            "bill_subtitle": "Data Center Act",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb1834",
            "status": "Passed in the House (104-95), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Requires data centers in Pennsylvania to source a portion of their power from renewable energy and contribute to ratepayer assistance programs."
        },
        {
            "bill_number": "HB 2151",
            "stance": "Yes",
            "bill_subtitle": "Model Data Center Ordinance",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb2151",
            "status": "Passed in House (133-68), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Creates a model ordinance municiplaities can use to set standards for data center development and operations."
        },
        {
            "bill_number": "HB 2333",
            "stance": "Yes",
            "bill_subtitle": "Pro-Environment Chapter 14 Reauthorization",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb2333",
            "status": "Passed in the House (107-94), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Bolsters protections for ratepayers and implements a summer moratorium on utility shutoffs for low-income households."
        },
        {
            "bill_number": "HB 2246",
            "stance": "Yes",
            "bill_subtitle": "Water Usage Reporting Requirements for Data Centers",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb2246",
            "status": "Passed in the House (116-84), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Requires data centers to report substantial water usage to DEP to accurately track how much water each facility consumes."
        },
        {
            "bill_number": "HB 2076",
            "stance": "Yes",
            "bill_subtitle": "Advancing Geothermal Energy Deployment",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb2076",
            "status": "Passed in the House (118-83), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Establishes a regulatory framework for the construction of geothermal energy facilities in Pennsylvania."
        },
        {
            "bill_number": "HB 2302",
            "stance": "Yes",
            "bill_subtitle": "Licensing for Water Well Drillers",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb2302",
            "status": "Passed in the House (114-87), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Establishes licensing requirements for companies that are drilling new water wells in Pennsylvania."
        },
        {
            "bill_number": "HB 2145",
            "stance": "Yes",
            "bill_subtitle": "PFAS in Consumer Products",
            "bill_color": "green",
            "bill_link": "https://www.palegis.us/legislation/bills/2025/hb2145",
            "status": "Passed in the House (188-13), awaiting action in the Senate.",
            "bill_date": "",
            "movement": "",
            "bill_description": "Bans the sale of certain consumer products in Pennsylvania that contain PFAS."
        }
    ]
};
let map = L.map("map", {
    scrollWheelZoom: false,
    zoomSnap: 0.25,
    minZoom: 6
}).setView([40.09, -77.6728], 7);

async function fetchMemberData() {
    const response = await fetch("/data/house_member_votes_25-26.json");
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
        scoreColor = getColor(memberScore(member, member.Score));
        member['scoreColor'] = scoreColor;
        lifetimeScoreColor = getColor(memberScore(member, member["Life"]));
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


        PAboundaryLayer = L.geoJson(pa_state_house_boundary_map, {
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
    let scoreColor = getColor(memberScore(PADistricts[legisId], PADistricts[legisId].Score));

    return {
        fillColor: scoreColor,
        weight: 1,
        opacity: 0.9,
        color: "#fefefe",
        dashArray: "0",
        fillOpacity: 0.7,
        className: "HD-"+legisId //add class to path
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
    queryString.push('district', "HD-"+legisId);
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


