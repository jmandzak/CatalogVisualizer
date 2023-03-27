import "jquery-connections"

// Dropdown Menu Scripts
$(document).ready(function () {
    // Set the onclick of the dropdown box
    let dropDownBox = document.getElementById("dropDownWrite")
    dropDownBox.onchange = catalogClicked;

    // Write the dropdown box options, display classes of first possible catalog
    $.getJSON("scraper/all_catalogs.json", 
        function (data) {
            for(var catalogs in data) {
                $("#dropDownWrite").append('<option value="' + catalogs + '">' + catalogs + '</option>'); 
            }

            catalogClicked();
        } 
    )
});

// Dropdown menu kind of works- next step is only writing the applicable catalog to the page
function catalogClicked(){
    let catalog = $("#dropDownWrite").val()

    // Clear out whatever is in there currently
    boxSection.innerHTML = "";

    // Grab the json and write all the classes
    $.getJSON("scraper/all_catalogs.json", 
    function (data) {
        // Some variables to keep up with classes
        let all_classes = [];

        for ( var semesters in data[catalog]['terms']){
            boxSection.innerHTML += '<div class="semesterCol"> Semester '+semesters+'</div>' ;
            for( var classes in data[catalog]['terms'][semesters]){
                boxSection.innerHTML += '<div class="box" contenteditable="true"><span id="close" onclick="this.parentNode.remove(); return false;">x</span>' + data[catalog]['terms'][semesters][classes] + '</div>' ; 
                all_classes.push(data[catalog]['terms'][semesters][classes]);
            }
            boxSection.innerHTML += '<br>' ;
        }
        
        // Now draw the prereq lines
        generatePrereqs();
    });
}

function generatePrereqs() {
    // Clear out any connections
    $('connection').remove();

    let catalog = $("#dropDownWrite").val()

    $.getJSON("scraper/all_catalogs.json", 
    function (data) {

        // Now let's create the adjacency matrix for this catalog to do prereqs
        let all_classes = document.getElementsByClassName('box')
        let prereq_matrix = new Array(all_classes.length);
        for(let i = 0; i < prereq_matrix.length; i++) {
            prereq_matrix[i] = new Array(all_classes.length);
        }

        const class_regex_string = /[A-Z][A-Z]+ [0-9][0-9]+/g
        for(let i = 0; i < all_classes.length; i++) {
            // Grab the actual class names from inside the string
            let current_classes = [...all_classes[i].innerText.matchAll(class_regex_string)];
            if(current_classes.length < 1) {
                continue;
            }

            // Find all of the prereqs for each class listed
            let prereqs = []
            for(let j = 0; j < current_classes.length; j++) {
                let temp = []

                // Try catch block here to catch classes that are missing from scraper
                // find all classes in prereq string, put in temp array
                try {
                    temp = [...data[catalog]['all_courses'][current_classes[j][0]]['prereqs'].matchAll(class_regex_string)]
                } catch(error) {
                    console.log("Could not find class %s", current_classes[j][0])
                }

                // add all classes from temp array into prereq array
                for(let k = 0; k < temp.length; k++){
                    prereqs.push(temp[k][0])
                }
            }

            // Now check against all of the other classes
            let matches = []
            for(let j = 0; j < all_classes.length; j++) {
                // don't check the same class
                if(i == j) {
                    continue;
                }
                
                // Loop through all prereq possibilities
                matches = []
                for(let k = 0; k < prereqs.length; k++) {
                    // See if prereq is in class string, if it is then set adj matrix and break
                    matches = all_classes[j].innerText.match(prereqs[k]);
                    if(matches) {
                        prereq_matrix[i][j] = 1;
                        matches = []
                        break;
                    }
                }
            }
        }

        // Now lets actually go through and draw all the arrows
        // To do this, we need to add ids to all the box divs
        let boxes = document.getElementsByClassName('box')
        for(let i = 0; i < boxes.length; i++) {
            boxes[i].id = "box" + i;
        }

        let from_box = "";
        let box_string = "";
        for(let i = 0; i < prereq_matrix.length; i++) {
            from_box = '#box' + i;
            for(let j = 0; j < prereq_matrix.length; j++) {
                if(prereq_matrix[j][i]) {
                    let to_box = "#box" + j;
                    $(from_box).connections({to: to_box});
                }
            }
        }
    });
}