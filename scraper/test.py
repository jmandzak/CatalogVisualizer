import json

class Course(dict):
    def __init__(self):
        self.title = ""
        self.full_description = ""
        self.prereqs = ""
        self.coreqs = ""

class CatalogData(dict):
    def __init__(self):
        self.terms = []
        self['milestones'] = []
        self.all_courses = {}
        
    def toJson(self):
        return json.dumps(self, default=lambda o: o.__dict__)

course_a = Course()
course_a.title = 'Class 1'
course_a.full_description = 'test class number 1'

course_b = Course()
course_b.title = 'Class 2'
course_b.full_description = 'test class number 2'
course_b.prereqs = "Class 1"
course_b.coreqs = "Unrelated class"

all_courses = {}
all_courses['Class 1'] = course_a
all_courses['Class 2'] = course_b

catalog = CatalogData()
catalog['terms'] = [['class 101', 'class 102'], ['class 201', 'class 202']]
catalog['milestones'].append(['nothing', 'class 101 and class 102'])
catalog.all_courses = all_courses.copy()

catalog2 = CatalogData()
catalog2.terms = [['class 101', 'class 102'], ['class 201', 'class 202']]
catalog2.milestones = ['nothing', 'class 101 and class 102']
catalog.all_courses = all_courses.copy()

full_data = {}
full_data['cs-2019'] = catalog
full_data['cs-2020'] = catalog2

full_json = {}

# for k, v in full_data.items():
    # json_object = json.dumps(v.toJson())
    # print(json_object)
    # json_object = json.dumps(v)
    # full_json[k] = json_object

f = open('json_test.json', 'w')
# json.dump(full_json, f)
json.dump(full_data, f)
f.close()
