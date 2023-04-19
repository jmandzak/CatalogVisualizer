import data from "./scraper/all_catalogs.json"

let dragSrcEl;

// Dropdown Menu Scripts
$(document).ready(function () {
    // Set the onclick of the buttons
    let dropDownBox = document.getElementById("dropDownWrite")
    dropDownBox.onchange = catalogClicked;

    let updatePrereqBox = document.getElementById("updatePrereqs");
    updatePrereqBox.onclick = generateReqs;

    let editClassesBox = document.getElementById("editClasses");
    editClassesBox.onclick = editClasses;

    let moveClassesBox = document.getElementById("moveClasses");
    moveClassesBox.onclick = moveClasses;
    
    let printBox = document.getElementById("printButton");
    printBox.onclick = printFunction;

    let addClassBox = document.getElementById("addClass");
    addClassBox.onclick = openClassForm;

    let addPrereqBox = document.getElementById("addPrereq");
    addPrereqBox.onclick = openForm;
    
    let form = document.getElementsByClassName('prereqForm')[0];
    form.addEventListener('submit', submitForm);

    let classForm = document.getElementsByClassName('addClassForm')[0];
    form.addEventListener('submit', classForm);

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
    let htmlString = "";
    
    htmlString += '<div class="grid">';

    for ( var semesters in data[catalog]['terms']){
        // let semesterPrint = parseInt(semesters) + 1 ;
        // boxSection.innerHTML += '<div class="semesterCol"> Semester '+semesterPrint+'</div>' ;
        for( var classes in data[catalog]['terms'][semesters]){
            htmlString += '<div class="cell"><div class="box"><span class="span" id="close">x</span>' + data[catalog]['terms'][semesters][classes] + '</div></div>' ; 
            all_classes.push(data[catalog]['terms'][semesters][classes]);
        }
        while(classes < 5) {
            htmlString += '<div class="cell"><div class="box"><span class="span" id="close">x</span></div></div>';
            classes = Number(classes) + 1;
        }
        // htmlString += '<br><div style="padding:30px"></div' ;
    }
    
    htmlString += '</div>';
    boxSection.innerHTML = htmlString;

    // set onclick of all spans
    let spans = document.getElementsByClassName("span");
    for(let i = 0; i < spans.length; i++) {
        spans[i].onclick = deleteText;
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
    
    // Now draw the req lines
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}

// Parameter prereq is true if generating prereqs, false for coreqs
function generateReqs(prereq) {
    // special case for when button is clicked and the parameter is null
    if(prereq != true && prereq != false) {
        // Clear out any req lines
        $('.leader-line').remove();
        generateReqs(false);
        prereq = true;
    }

    let catalog = $("#dropDownWrite").val()

    // Now let's create the adjacency matrix for this catalog to do reqs
    let all_classes = document.getElementsByClassName('box')
    let req_matrix = new Array(all_classes.length);
    for(let i = 0; i < req_matrix.length; i++) {
        req_matrix[i] = new Array(all_classes.length);
    }

    const class_regex_string = /[A-Z][A-Z]+ [0-9][0-9]+/g
    for(let i = 0; i < all_classes.length; i++) {
        // Grab the actual class names from inside the string
        let current_classes = [...all_classes[i].innerText.matchAll(class_regex_string)];
        if(current_classes.length < 1) {
            continue;
        }

        // Find all of the reqs for each class listed
        let reqs = []
        for(let j = 0; j < current_classes.length; j++) {
            let temp = []

            // Try catch block here to catch classes that are missing from scraper
            // find all classes in req string, put in temp array
            try {
                if(prereq) {
                    temp = [...data[catalog]['all_courses'][current_classes[j][0]]['prereqs'].matchAll(class_regex_string)]
                } else {
                    temp = [...data[catalog]['all_courses'][current_classes[j][0]]['coreqs'].matchAll(class_regex_string)]
                }
            } catch(error) {
                console.log("Could not find class %s", current_classes[j][0])
            }

            // add all classes from temp array into req array
            for(let k = 0; k < temp.length; k++){
                reqs.push(temp[k][0])
            }
        }

        // Now check against all of the other classes
        let matches = []
        for(let j = 0; j < all_classes.length; j++) {
            // don't check the same class
            if(i == j) {
                continue;
            }
            
            // Loop through all req possibilities
            matches = []
            for(let k = 0; k < reqs.length; k++) {
                // See if req is in class string, if it is then set adj matrix and break
                matches = all_classes[j].innerText.match(reqs[k]);
                if(matches) {
                    req_matrix[i][j] = 1;
                    matches = []
                    break;
                }
            }
        }
    }

    drawArrows(req_matrix, prereq)
}

// Draw arrows
function drawArrows(req_matrix, prereq) {
    // DELETE THIS TO DRAW COREQS
    if(!prereq) {
        return;
    }

    // Now lets actually go through and draw all the arrows
    // To do this, we need to add ids to all the box divs
    let boxes = document.getElementsByClassName('box')
    for(let i = 0; i < boxes.length; i++) {
        boxes[i].id = "box" + i;
    }

    let from_box = "";
    let all_lines = [];
    for(let i = 0; i < req_matrix.length; i++) {
        from_box = 'box' + i;
        for(let j = 0; j < req_matrix.length; j++) {
            if(req_matrix[j][i]) {
                let to_box = "box" + j;

                // Line style changes based on if it's a prereq or coreq
                let line = null;
                if(prereq) {
                    line = new LeaderLine(
                        document.getElementById(from_box),
                        document.getElementById(to_box),
                        {
                            path: "grid",
                            startSocket: "bottom",
                            endSocket: "top",
                            outline: true,
                            color: "fff",
                            endPlugOutline: true,
                            endPlugSize: 1.5
                        }
                    );
                } else {
                    line = new LeaderLine(
                        document.getElementById(from_box),
                        document.getElementById(to_box),
                        {
                            path: "grid",
                            color: "black",
                            startPlug: "behind",
                            endPlug: "behind",
                            dash: true,
                            endPlugSize: 0
                        }
                    );
                }
                all_lines.push(line);
            }
        }
    }

    // let colors = ["aqua", "blue", "blueviolet", "brown", "cadetblue", "coral", "cyan", "darkgoldenrod", "deeppink", "greenyellow", "green", "lightpink", "palegreen", "steelblue", "wheat", "slategray", "silver", "plum"]
    // for(let i = 0; i < all_lines.length; i++) {
    //     all_lines[i].outlineColor = colors[i % colors.length];
    //     all_lines[i].startPlugColor = colors[i % colors.length];
    //     all_lines[i].endPlugColor = colors[i % colors.length];
    // }
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
    
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
    return false;
}

function editClasses() {
    // Two options: Either we're choosing to edit classes, or we're done editing

    // If editing, remove span, make editable
    if(this.textContent == "Edit Classes") {
        $('.box').find('span').remove();
        let boxes = document.getElementsByClassName('box');
        for(let i = 0; i < boxes.length; i++) {
            boxes[i].setAttribute('contenteditable', 'true');
            boxes[i].setAttribute('draggable', 'false');
        }
        this.textContent = "Done Editing";
    }
    // If done editing, add span back
    else if(this.textContent == "Done Editing") {
        let boxes = document.getElementsByClassName('box');
        for(let i = 0; i < boxes.length; i++) {
            boxes[i].setAttribute('contenteditable', 'false');
            boxes[i].setAttribute('draggable', 'false');
        }
        $('.box').prepend('<span id="close">x</span>');

        // set onclick of all spans
        let spans = document.getElementsByClassName("span");
        for(let i = 0; i < spans.length; i++) {
            spans[i].onclick = deleteText;
        }
        this.textContent = "Edit Classes";
    }
}

function moveClasses() {
    let boxes = document.getElementsByClassName('box');
    for(let i = 0; i < boxes.length; i++) {
        boxes[i].setAttribute('contenteditable', 'false');
        boxes[i].setAttribute('draggable', 'true');
    }
}

function openClassForm() {
    console.log(test1);
    let form = document.getElementsByClassName('newClassForm')[0];
    form.style.display = "block";
    form.style.visibility = "visible";
}

function openForm() {
    let form = document.getElementsByClassName('prereqForm')[0];
    form.style.display = "block";
    form.style.visibility = "visible";
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
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
    
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}

function closeClassForm() {
    let form = document.getElementsByClassName('newClassForm')[0];
    let newClass = document.getElementById('newClass');
    let newClassSem = document.getElementById('newClassSem');

    newClass.value = "";
    newClassSem.value = "";

    form.style.display = "none";
    form.style.visibility = "hidden";
    
}

function printFunction() { 
    // change the width of page to match a piece of printer paper
    let widthContainer = document.getElementById('widthContainer');
    widthContainer.style.width = "1063px";
    
    // remove x if there are any
    let containsSpans = false;
    if($('.box').find('span').length > 0) {
        containsSpans = true;
        $('.box').find('span').remove();
    }

    // Hide all boxes with nothing in them
    let all_boxes = document.getElementsByClassName('box');
    for(let i = 0; i < all_boxes.length; i++) {
        if(all_boxes[i].innerHTML == "") {
            all_boxes[i].style.visibility = "hidden";
        }
    }

    let buttonPanel = document.getElementsByClassName("dropdown")[0];

    buttonPanel.style.display = "none";
    buttonPanel.style.visibility = "hidden";

    // redraw lines
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);

    window.print(); 
    
    buttonPanel.style.display = "";
    buttonPanel.style.visibility = "";

    // Bring back all boxes with nothing in them
    for(let i = 0; i < all_boxes.length; i++) {
        if(all_boxes[i].innerHTML == "") {
            all_boxes[i].style.visibility = "";
        }
    }

    // add back x if there are any
    if(containsSpans) {
        $('.box').prepend('<span id="close">x</span>');

        // set onclick of all spans
        let spans = document.getElementsByClassName("span");
        for(let i = 0; i < spans.length; i++) {
            spans[i].onclick = deleteText;
        }
    }

    // Change width back
    widthContainer.style.width = null;
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
  }

function deleteText() {
    this.parentNode.childNodes[1].textContent = "";
}
