import data from "./scraper/all_catalogs.json"

let dragSrcEl;
let highlighted_classes = [];
let arrow_style = ["grid", "straight", "arc", "fluid", "magnet"];
let highlight_colors = ["red", "blue", "green", "yellow", "turquoise"];

// Dropdown Menu Scripts
$(document).ready(function () {
    // Set the onclick of the buttons
    let dropDownBox = document.getElementById("dropDownWrite")
    dropDownBox.onchange = catalogClicked;

    let updatePrereqBox = document.getElementById("updatePrereqs");
    updatePrereqBox.onclick = generateReqs;

    let editClassesBox = document.getElementById("editClasses");
    editClassesBox.onclick = editClasses;
    
    let printBox = document.getElementById("printButton");
    printBox.onclick = printFunction;

    // let addClassBox = document.getElementById("addClass");
    // addClassBox.onclick = openClassForm;

    let addPrereqBox = document.getElementById("addPrereq");
    addPrereqBox.onclick = openForm;

    let editCoreqBox = document.getElementById("editCoreq");
    editCoreqBox.onclick = openCoreqForm;
    
    let prereqForm = document.getElementById('prereqForm');
    prereqForm.addEventListener('submit', submitPrereqForm);
    
    let coreqForm = document.getElementById('coreqForm');
    coreqForm.addEventListener('submit', submitCoreqForm);

    // let classForm = document.getElementById('newClassForm');
    // classForm.addEventListener('submit', classForm);

    let cancelPrereqFormButton = document.getElementById("cancelButton");
    cancelPrereqFormButton.onclick = closePrereqForm;

    let cancelCoreqFormButton = document.getElementById("cancelCoreqButton");
    cancelCoreqFormButton.onclick = closeCoreqForm;

    let highlightButton = document.getElementById("highlightPrereqs");
    highlightButton.onclick = highlightPrereqs;

    let prereqArrowButton = document.getElementById("changeArrowStyle");
    prereqArrowButton.onclick = changeArrowStyle;

    let changeHighlightColor = document.getElementById("changeArrowColor");
    changeHighlightColor.onclick = changeArrowColor;


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
            htmlString += '<div class="cell"><div class="box" draggable="true"><span class="span" id="close">x</span>' + data[catalog]['terms'][semesters][classes] + '</div></div>' ; 
            all_classes.push(data[catalog]['terms'][semesters][classes]);
        }
        while(classes < 5) {
            htmlString += '<div class="cell"><div class="box" draggable="true"><span class="span" id="close">x</span></div></div>';
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
    
    // initialize highlighted prereq classes list
    highlighted_classes = [];
    for(let i = 0; i < all_classes.length; i++) {
        highlighted_classes.push(false);
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

    // Now lets actually go through and draw all the arrows
    // To do this, we need to add ids to all the box divs
    let boxes = document.getElementsByClassName('box')
    for(let i = 0; i < boxes.length; i++) {
        boxes[i].id = "box" + i;
    }

    let highlighted_from_boxes = [];
    let highlighted_to_boxes = [];

    let from_box = "";
    let all_lines = [];
    let line = null;
    for(let i = 0; i < req_matrix.length; i++) {
        from_box = 'box' + i;
        for(let j = 0; j < req_matrix.length; j++) {
            if(req_matrix[j][i]) {
                let to_box = "box" + j;

                // Line style changes based on if it's a prereq or coreq
                if(prereq) {
                    // we need to add highlighted prereqs last to make them pop up over non-highlighted ones
                    if(!highlighted_classes[i]) {
                        line = new LeaderLine(
                            document.getElementById(from_box),
                            document.getElementById(to_box),
                            {
                                path: arrow_style[0],
                                startSocket: "bottom",
                                endSocket: "top",
                                // outline: true,
                                size: 2,
                                color: "black",
                                // endPlugOutline: true,
                                endPlugSize: 1.5,
                                startSocketGravity: 10,
                                endSocketGravity: 10,
                            }
                        );
                    } else {
                        highlighted_from_boxes.push(from_box);
                        highlighted_to_boxes.push(to_box);
                    }
                } else {
                    line = new LeaderLine(
                        document.getElementById(from_box),
                        document.getElementById(to_box),
                        {
                            path: "straight",
                            color: "black",
                            startPlug: "behind",
                            endPlug: "behind",
                            size: 2,
                            startSocketGravity: 10,
                            endSocketGravity: 10,
                            dash: {len: 2, gap: 4},
                            endPlugSize: 0
                        }
                    );
                }
                all_lines.push(line);
            }
        }
    }

    // create the highlighted lines
    for(let i = 0; i < highlighted_from_boxes.length; i++) {
        line = new LeaderLine(
            document.getElementById(highlighted_from_boxes[i]),
            document.getElementById(highlighted_to_boxes[i]),
            {
                path: arrow_style[0],
                startSocket: "bottom",
                endSocket: "top",
                // outline: true,
                size: 2,
                color: highlight_colors[0],
                // endPlugOutline: true,
                endPlugSize: 1.5,
                startSocketGravity: 10,
                endSocketGravity: 10,
            }
        );
    }

    // now set the z index of all of the leader lines to be 0
    $('.leader-line').css('z-index', '-1');

    // let colors = ["aqua", "blue", "blueviolet", "brown", "cadetblue", "coral", "cyan", "darkgoldenrod", "deeppink", "greenyellow", "green", "lightpink", "palegreen", "steelblue", "wheat", "slategray", "silver", "plum"]
    // for(let i = 0; i < all_lines.length; i++) {
    //     all_lines[i].outlineColor = colors[i % colors.length];
    //     all_lines[i].startPlugColor = colors[i % colors.length];
    //     all_lines[i].endPlugColor = colors[i % colors.length];
    // }
}

// Enter or exit highlight mode
function highlightPrereqs() {
    // two options, either enter highlight mode or leave it
    if(this.textContent == "Highlight Prerequisites") {
        this.textContent = "Done Highlighting";

        // set onClick of all boxes
        let boxes = document.getElementsByClassName("box");
        for(let i = 0; i < boxes.length; i++) {
            boxes[i].onclick = drawHighlight;
        }
        $('.box').css('cursor', 'pointer');
    } else {
        this.textContent = "Highlight Prerequisites"
        // set onClick of all boxes to null
        let boxes = document.getElementsByClassName("box");
        for(let i = 0; i < boxes.length; i++) {
            boxes[i].onclick = null;
        }
        $('.box').css('cursor', 'move');
    }
}

// change color of prereq arrows
function drawHighlight() {
    // invert highlight status of box
    let box_num = Number(this.id.match(/\d+/g)[0]);
    highlighted_classes[box_num] = !highlighted_classes[box_num];
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}

function changeArrowStyle() {
    let temp = arrow_style.shift();
    arrow_style.push(temp);
    
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}

function changeArrowColor() {
    let temp = highlight_colors.shift();
    highlight_colors.push(temp);
    
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
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

    // Apparently this removes the onclick function of the spans, so add them back
    let spans = document.getElementsByClassName("span");
    for(let i = 0; i < spans.length; i++) {
        spans[i].onclick = deleteText;
    }
    
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
        $('.box').css('cursor', 'text');
        this.textContent = "Done Editing";
    }
    // If done editing, add span back
    else if(this.textContent == "Done Editing") {
        let boxes = document.getElementsByClassName('box');
        for(let i = 0; i < boxes.length; i++) {
            boxes[i].setAttribute('contenteditable', 'false');
            boxes[i].setAttribute('draggable', 'true');
        }
        $('.box').prepend('<span id="close" class="span">x</span>');

        // set onclick of all spans
        let spans = document.getElementsByClassName("span");
        for(let i = 0; i < spans.length; i++) {
            spans[i].onclick = deleteText;
        }
        $('.box').css('cursor', 'move');
        this.textContent = "Edit Classes";
    }
}

// function openClassForm() {
//     console.log(test1);
//     let form = document.getElementById('newClassForm');
//     form.style.display = "block";
//     form.style.visibility = "visible";
// }

function openForm() {
    let form = document.getElementById('prereqForm');
    form.style.display = "block";
    form.style.visibility = "visible";
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}

function openCoreqForm() {
    let form = document.getElementById('coreqForm');
    form.style.display = "block";
    form.style.visibility = "visible";
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}

function submitPrereqForm(e) {
    e.preventDefault();

    // Two options, either remove or add prereq. Figure out which
    let buttonClicked = e.submitter;

    let prereq = document.getElementById('prereq').value;
    let desiredClass = document.getElementById('desiredClass').value;

    if(buttonClicked == document.getElementById('addPrereqButton')) {
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
    } else {
        // Remove the prereq
        let catalog = $("#dropDownWrite").val();

        // since some boxes have multiple classes, we want to remove all prereqs between those two boxes
        let boxes = document.getElementsByClassName('box');
        let from_classes = [];
        let to_classes = [];
        const class_regex_string = /[A-Z][A-Z]+ [0-9][0-9]+/g

        for(let i = 0; i < boxes.length; i++) {
            if(boxes[i].textContent.includes(desiredClass)) {
                to_classes = [...boxes[i].textContent.matchAll(class_regex_string)]
            } else if(boxes[i].textContent.includes(prereq)) {
                from_classes = [...boxes[i].textContent.matchAll(class_regex_string)]
            }
        }
        
        // now go through and remove all of the prereqs for each of the to_classes
        for(let i = 0; i < to_classes.length; i++) {
            for(let j = 0; j < from_classes.length; j++) {
                if(data[catalog]['all_courses'][desiredClass]) {
                    let newPrereq = data[catalog]['all_courses'][to_classes[i]]['prereqs'].replace(from_classes[j], '');
                    data[catalog]['all_courses'][to_classes[i]]['prereqs'] = newPrereq;
                }
            }
        }
    }

    closePrereqForm();
}

function submitCoreqForm(e) {
    e.preventDefault();

    // Two options, either remove or add coreq. Figure out which
    let buttonClicked = e.submitter;

    let coreq1 = document.getElementById('coreq1').value;
    let coreq2 = document.getElementById('coreq2').value;

    if(buttonClicked == document.getElementById('addCoreqButton')) {
        // Now we try to actually add the coreq
        let catalog = $("#dropDownWrite").val();
        if(data[catalog]['all_courses'][coreq2]) {
            data[catalog]['all_courses'][coreq2]['coreqs'] += ' ' + coreq1;
        } else {
            // If the class isn't in our records, we'll create it
            let new_class = {
                'title': coreq2,
                'full_description': coreq2,
                'coreqs': coreq1,
                'prereqs': ""
            }

            data[catalog]['all_courses'][coreq2] = new_class;
        }
    } else {
        // Now we remove the coreq
        let catalog = $("#dropDownWrite").val();

        // since some boxes have multiple classes, we want to remove all coreqs between those two boxes
        let boxes = document.getElementsByClassName('box');
        let from_classes = [];
        let to_classes = [];
        const class_regex_string = /[A-Z][A-Z]+ [0-9][0-9]+/g

        for(let i = 0; i < boxes.length; i++) {
            if(boxes[i].textContent.includes(coreq1)) {
                to_classes = [...boxes[i].textContent.matchAll(class_regex_string)]
            } else if(boxes[i].textContent.includes(coreq2)) {
                from_classes = [...boxes[i].textContent.matchAll(class_regex_string)]
            }
        }

        
        // now go through and remove all of the coreqs for each of the to_classes
        for(let i = 0; i < to_classes.length; i++) {
            for(let j = 0; j < from_classes.length; j++) {
                // We need to do this from both to->from and from->to since it's a coreq
                if(data[catalog]['all_courses'][to_classes[i]]) {
                    let newCoreq = data[catalog]['all_courses'][to_classes[i]]['coreqs'].replace(from_classes[j], '');
                    data[catalog]['all_courses'][to_classes[i]]['coreqs'] = newCoreq;
                }
                if(data[catalog]['all_courses'][from_classes[j]]) {
                    let newCoreq2 = data[catalog]['all_courses'][from_classes[j]]['coreqs'].replace(to_classes[i], '');
                    data[catalog]['all_courses'][from_classes[j]]['coreqs'] = newCoreq2;
                }
            }
        }
    }

    closeCoreqForm();
}

function closePrereqForm() {
    let form = document.getElementById('prereqForm');
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

function closeCoreqForm() {
    let form = document.getElementById('coreqForm');
    let coreq1 = document.getElementById('coreq1');
    let coreq2 = document.getElementById('coreq2');

    coreq1.value = "";
    coreq2.value = "";

    form.style.display = "none";
    form.style.visibility = "hidden";
    
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}

// function closeClassForm() {
//     let form = document.getElementById('newClassForm');
//     let newClass = document.getElementById('newClass');
//     let newClassSem = document.getElementById('newClassSem');

//     newClass.value = "";
//     newClassSem.value = "";

//     form.style.display = "none";
//     form.style.visibility = "hidden";
    
// }

function printFunction() { 
    // change the width of page to match a piece of printer paper
    let widthContainer = document.getElementById('widthContainer');
    widthContainer.style.width = "1063px";
    widthContainer.style.height = "1300px";
    
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
        $('.box').prepend('<span id="close" class="span">x</span>');

        // set onclick of all spans
        let spans = document.getElementsByClassName("span");
        for(let i = 0; i < spans.length; i++) {
            spans[i].onclick = deleteText;
        }
    }

    // Change width back
    widthContainer.style.width = null;
    widthContainer.style.height = null;
    // Clear out any req lines
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
  }

function deleteText() {
    this.parentNode.childNodes[1].textContent = "";
    
    // Redraw the lines in case cells get resized
    $('.leader-line').remove();
    generateReqs(true);
    generateReqs(false);
}
