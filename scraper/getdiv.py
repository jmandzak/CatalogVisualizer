from bs4 import BeautifulSoup

class Course:
    def __init__(self):
        self.title = ""
        self.full_description = ""
        self.prereqs = ""
        self.coreqs = ""

f = open('test.txt', 'r')
text = f.read()
soup = BeautifulSoup(text, 'html.parser')

class_prefixes = ['COSC', 'ECE', 'EE', 'MATH', 'ENGL', 'BIOL', 'CHEM', 'PHYS', 'EF']

class_descriptions = soup.find_all("div")
f = open('please.txt', 'w')
class_descriptions = [x for x in class_descriptions if ('<h3>' in str(x)) and (x.h3.text.strip().split(' ')[0] in class_prefixes) and 'facebook' not in str(x)]

# create 'course' class for each course
all_courses = {}
for c in class_descriptions:
    temp_course = Course()
    text = " ".join(c.text.strip().split())
    text = text.replace('*', '')

    # get name of class
    temp_course.title = text.split()[0] + ' ' + text.split()[1]

    # put in full description
    temp_course.full_description = text

    index_prereq = text.find('Prerequisite(s):')
    if index_prereq != -1:
        prereq_end = text[index_prereq:].find('.')
        # print(text)
        # print(text[index_prereq+17:index_prereq+prereq_end])
        temp_course.prereqs = text[index_prereq+17:index_prereq+prereq_end]
    
    index_coreq = text.find('Corequisite(s):')
    if index_coreq != -1:
        coreq_end = text[index_coreq:].find('.')
        # print(text[index_coreq+16:index_coreq+coreq_end])
        temp_course.coreqs = text[index_coreq+16:index_coreq+coreq_end]

    all_courses[temp_course.title] = temp_course
    # print('\n')

for name, course in all_courses.items():
    print(name)
    print(f'Description: {course.full_description}')
    print(f'Prerequisites: {course.prereqs}')
    print(f'Corequisites: {course.coreqs}')
    print()