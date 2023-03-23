const $ = require("jquery")
const connections = require("jquery-connections")

// Dropdown Menu Scripts
$(document).ready(function () {
    // Write the dropdown box options, display classes of first possible catalog
    $.getJSON("scraper/all_catalogs.json", 
        function (data) {
            for(var catalogs in data) {
                $("#dropDownWrite").append('<option value="' + catalogs + '">' + catalogs + '</option>'); 
            }

            catalogClicked($("#dropDownWrite").val());
        } 
    )
});

// Dropdown menu kind of works- next step is only writing the applicable catalog to the page
function catalogClicked(catalog){
    // Write Boxes to Page Script

    // Clear out whatever is in there currently
    boxSection.innerHTML = "";

    // Grab the json and write all the classes
    $.getJSON("scraper/all_catalogs.json", 
    function (data) {
        // Some variables to keep up with classes
        all_classes = [];

        for ( var semesters in data[catalog]['terms']){
            boxSection.innerHTML += '<div class="semesterCol"> Semester '+semesters+'</div>' ;
            for( var classes in data[catalog]['terms'][semesters]){
                boxSection.innerHTML += '<div class="box" contenteditable="true"><span id="close" onclick="this.parentNode.remove(); return false;">x</span>' + data[catalog]['terms'][semesters][classes] + '</div>' ; 
                all_classes.push(data[catalog]['terms'][semesters][classes]);
            }
            boxSection.innerHTML += '<br>' ;
        }
        

        // Now let's create the adjacency matrix for this catalog to do prereqs
        let prereq_matrix = new Array(all_classes.length);
        for(let i = 0; i < prereq_matrix.length; i++) {
            prereq_matrix[i] = new Array(all_classes.length);
        }

        class_regex_string = /[A-Z][A-Z]+ [0-9][0-9]+/g
        for(let i in all_classes) {
            // Grab the actual class names from inside the string
            current_classes = [...all_classes[i].matchAll(class_regex_string)];
            if(current_classes.length < 1) {
                continue;
            }

            // Find all of the prereqs for each class listed
            prereqs = []
            for(let j in current_classes) {
                // console.log(data[catalog]['all_courses'][current_classes[j][0]]);
                // console.log(data[catalog]['all_courses'][current_classes[j][0]]['prereqs']);
                temp = []

                // Try catch block here to catch classes that are missing from scraper
                // find all classes in prereq string, put in temp array
                try {
                    temp = [...data[catalog]['all_courses'][current_classes[j][0]]['prereqs'].matchAll(class_regex_string)]
                } catch(error) {
                    console.log("Could not find class %s", current_classes[j][0])
                }

                // add all classes from temp array into prereq array
                for(let k in temp){
                    prereqs.push(temp[k][0])
                }
            }

            // Now check against all of the other classes
            let matches = []
            for(let j in all_classes) {
                // don't check the same class
                if(i == j) {
                    continue;
                }
                
                // Loop through all prereq possibilities
                matches = []
                for(let k in prereqs) {
                    // See if prereq is in class string, if it is then set adj matrix and break
                    matches = all_classes[j].match(prereqs[k]);
                    if(matches) {
                        prereq_matrix[i][j] = 1;
                        matches = []
                        break;
                    }
                }
            }
        }

        console.log(prereq_matrix)
    });
}