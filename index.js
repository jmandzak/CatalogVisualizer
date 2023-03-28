import "jquery-connections"
import data from "./scraper/all_catalogs.json"

let dragSrcEl;

// Dropdown Menu Scripts
$(document).ready(function () {
    // Set the onclick of the buttons
    let dropDownBox = document.getElementById("dropDownWrite")
    dropDownBox.onchange = catalogClicked;

    let updatePrereqBox = document.getElementById("updatePrereqs");
    updatePrereqBox.onclick = generatePrereqs;

    let editClassesBox = document.getElementById("editClasses");
    editClassesBox.onclick = editClasses;

    let moveClassesBox = document.getElementById("moveClasses");
    moveClassesBox.onclick = moveClasses;

    let addPrereqBox = document.getElementById("addPrereq");
    addPrereqBox.onclick = openForm;
    
    let form = document.getElementsByClassName('prereqForm')[0];
    form.addEventListener('submit', submitForm);

    let cancelFormButton = document.getElementById("cancelButton");
    cancelFormButton.onclick = closeForm;

    // Write the dropdown box options, display classes of first possible catalog
    for(var catalogs in data) {
        $("#dropDownWrite").append('<option value="' + catalogs + '">' + catalogs + '</option>'); 
    }

    catalogClicked();
    
});

// Dropdown menu kind of works- next step is only writing the applicable catalog to the page
function catalogClicked(){
    let catalog = $("#dropDownWrite").val()

    // Clear out whatever is in there currently
    boxSection.innerHTML = "";

    // Grab the json and write all the classes
    // Some variables to keep up with classes
    let all_classes = [];

    for ( var semesters in data[catalog]['terms']){
        let semesterPrint = parseInt(semesters) + 1 ;
        boxSection.innerHTML += '<div class="semesterCol"> Semester '+semesterPrint+'</div>' ;
        for( var classes in data[catalog]['terms'][semesters]){
            boxSection.innerHTML += '<div class="box"><span id="close" onclick="this.parentNode.remove(); return false;">x</span>' + data[catalog]['terms'][semesters][classes] + '</div>' ; 
            all_classes.push(data[catalog]['terms'][semesters][classes]);
        }
        boxSection.innerHTML += '<br><div style="padding:30px"></div' ;
    }
    

    // Add drag and drop listening to each 
    let items = document.getElementsByClassName('box');
    for(let i = 0; i < items.length; i++) {
        items[i].addEventListener('dragstart', handleDragStart);
        items[i].addEventListener('dragend', handleDragEnd);
        items[i].addEventListener('dragenter', handleDragEnter);
        items[i].addEventListener('dragleave', handleDragLeave);
        items[i].addEventListener('dragover', handleDragOver);
        items[i].addEventListener('drop', handleDrop);
    }
    
    // Now draw the prereq lines
    generatePrereqs();
}

function generatePrereqs() {
    // Clear out any connections
    $('connection').remove();

    let catalog = $("#dropDownWrite").val()

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
    for(let i = 0; i < prereq_matrix.length; i++) {
        from_box = '#box' + i;
        for(let j = 0; j < prereq_matrix.length; j++) {
            if(prereq_matrix[j][i]) {
                let to_box = "#box" + j;
                $(from_box).connections({to: to_box, css: { zIndex: -1 }});
            }
        }
    }
}


// Drag and Drop functionality: much of this taken from https://web.dev/drag-and-drop/
function handleDragStart(e) {
    this.style.opacity = '0.4';

    dragSrcEl = this;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

function handleDrop(e) {
    e.stopPropagation(); // stops the browser from redirecting.

    if (dragSrcEl !== this) {
        dragSrcEl.innerHTML = this.innerHTML;
        this.innerHTML = e.dataTransfer.getData('text/html');
    }
      
    this.classList.remove('over');
      
    return false;
}

function editClasses() {
    let boxes = document.getElementsByClassName('box');
    for(let i = 0; i < boxes.length; i++) {
        boxes[i].setAttribute('contenteditable', 'true');
        boxes[i].setAttribute('draggable', 'false');
    }
}

function moveClasses() {
    let boxes = document.getElementsByClassName('box');
    for(let i = 0; i < boxes.length; i++) {
        boxes[i].setAttribute('contenteditable', 'false');
        boxes[i].setAttribute('draggable', 'true');
    }
}

function openForm() {
    let form = document.getElementsByClassName('prereqForm')[0];
    form.style.display = "block";
    form.style.visibility = "visible";
    generatePrereqs();
}

function submitForm(e) {
    e.preventDefault();

    let prereq = document.getElementById('prereq').value;
    let desiredClass = document.getElementById('desiredClass').value;

    // Now we try to actually add the prereq
    let catalog = $("#dropDownWrite").val();
    if(data[catalog]['all_courses'][desiredClass]) {
        data[catalog]['all_courses'][desiredClass]['prereqs'] += ' ' + prereq;
    } else {
        // If the class isn't in our records, we'll create it
        let new_class = {
            'title': desiredClass,
            'full_description': desiredClass,
            'coreqs': "",
            'prereqs': prereq
        }

        data[catalog]['all_courses'][desiredClass] = new_class;
        console.log(data[catalog]['all_courses']);
    }

    closeForm();
}

function closeForm() {
    let form = document.getElementsByClassName('prereqForm')[0];
    let prereq = document.getElementById('prereq');
    let desiredClass = document.getElementById('desiredClass');

    prereq.value = "";
    desiredClass.value = "";

    form.style.display = "none";
    form.style.visibility = "hidden";
    
    generatePrereqs();
}