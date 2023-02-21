import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from unicodedata import normalize
import time
import json

class Course(dict):
    def __init__(self):
        self['title'] = ""
        self['full_description'] = ""
        self['prereqs'] = ""
        self['coreqs'] = ""

class CatalogData(dict):
    def __init__(self):
        self['terms'] = []
        self['milestones'] = []
        self['all_courses'] = {}

# MANUALLY GO THROUGH THIS FUNCTION AND CHANGE URLS/YEARS TO UPDATE
def getURLs():
    csURLs = {
        '2019': 'https://catalog.utk.edu/preview_program.php?catoid=26&poid=11104',
        '2020': 'https://catalog.utk.edu/preview_program.php?catoid=29&poid=12469',
        '2021': 'https://catalog.utk.edu/preview_program.php?catoid=32&poid=15044',
        '2022': 'https://catalog.utk.edu/preview_program.php?catoid=34&poid=16680',
    }

    ceURLs = {
        '2019': 'https://catalog.utk.edu/preview_program.php?catoid=26&poid=11103',
        '2020': 'https://catalog.utk.edu/preview_program.php?catoid=29&poid=12468',
        '2021': 'https://catalog.utk.edu/preview_program.php?catoid=32&poid=15043',
        '2022': 'https://catalog.utk.edu/preview_program.php?catoid=34&poid=16679',
    }

    eeURLs = {
        '2019': 'https://catalog.utk.edu/preview_program.php?catoid=26&poid=11111',
        '2020': 'https://catalog.utk.edu/preview_program.php?catoid=29&poid=12476',
        '2021': 'https://catalog.utk.edu/preview_program.php?catoid=32&poid=15051',
        '2022': 'https://catalog.utk.edu/preview_program.php?catoid=34&poid=16687',
    }

    urls = {
        'cs': csURLs,
        'ce': ceURLs,
        'ee': eeURLs,
    }

    return urls

def clickAllLinks(driver: webdriver.Chrome):
    # All of the classes that CS, CE, or EE takes
    class_prefixes = ['COSC', 'ECE', 'EE', 'MATH', 'ENGL', 'BIOL', 'CHEM', 'PHYS', 'EF']

    # Grab all the a elements that have hrefs
    links = driver.find_elements(By.TAG_NAME, 'a')
    f = open('error.txt', 'w')
    
    # go through all the grabbed elements and look for classes we should click on
    for link in links:
        # wrap in a try except block because we get some non-class elements that throw exceptions
        try:
            if link.text.split(' ')[0] in class_prefixes:
                # these print comments are for debugging
                # print(link.text, end='  ')
                # print(link.location)
                link.click()
                time.sleep(2)
                link.click()
                time.sleep(2)

        except Exception as e:
            f.write(str(e))
            pass
    
    f.close()
    return driver.page_source

def getAllCourses(soup: BeautifulSoup):
    # prefixes of classes taken for this major
    class_prefixes = ['COSC', 'ECE', 'EE', 'MATH', 'ENGL', 'BIOL', 'CHEM', 'PHYS', 'EF']

    # isolate all div elements that contain the box that pops up when you click on a class
    class_descriptions = soup.find_all("div")
    class_descriptions = [x for x in class_descriptions if ('<h3>' in str(x)) and (x.h3.text.strip().split(' ')[0] in class_prefixes) and 'facebook' not in str(x)]

    # create 'course' class for each course
    all_courses = {}
    for c in class_descriptions:
        temp_course = Course()
        text = " ".join(c.text.strip().split())
        text = text.replace(' *', '')
        text = text.replace('*', '')
        text = text.replace(' and ', '+')
        text = text.replace(', or', ' or')
        text = text.replace(', ', ' or ')
        text = text.replace('  ', ' ')

        # get name of class
        temp_course['title'] = text.split()[0] + ' ' + text.split()[1]

        # put in full description
        temp_course['full_description'] = text

        # find prereqs if there are any
        index_prereq = text.find('Prerequisite(s):')
        if index_prereq != -1:
            prereq_end = text[index_prereq:].find('.')
            temp_course['prereqs'] = text[index_prereq+17:index_prereq+prereq_end]
        
        # find coreqs if there are any
        index_coreq = text.find('Corequisite(s):')
        if index_coreq != -1:
            coreq_end = text[index_coreq:].find('.')
            temp_course['coreqs'] = text[index_coreq+16:index_coreq+coreq_end]

        all_courses[temp_course['title']] = temp_course.copy()

    return all_courses

def getSchedule(soup: BeautifulSoup, catalogs: dict, major: str, year: str):
    # the table we want has a class of 'acalog-core'
    # we want the first table with this class
    results = soup.find(class_='acalog-core')
    tables = results.find_all('table')
    trs = tables[0].find_all('tr')
    
    # keep up with the term number
    term = 0

    # temporary list for storing classes needed in a term
    temp_classes = []
    
    for tr in trs:
        tds = tr.find_all('td')

        # rows with term, we add our temp list to the term if non-empty, then increment term
        if 'Term' in tds[0].text:
            if len(temp_classes) != 0:
                catalogs[f'{major}-{year}']['terms'].append(temp_classes.copy())
                temp_classes.clear()
            term += 1
            continue

        # this is the last line of our table
        if 'TOTAL' in tds[0].text:
            continue

        # remove superscripts
        while tds[0].find('sup'):
            tds[0].sup.decompose()

        # add strings of class names to list. Normalize here for unicode data
        text = normalize('NFKD', tds[0].text.strip())

        # Various text fixes to make things consistent
        text = text.replace(' *', '')
        text = text.replace('*', '')
        text = text.replace(' and ', '+')
        text = text.replace(', or', ' or')
        text = text.replace(', ', ' or ')
        text = text.replace('  ', ' ')
        temp_classes.append(text)

        # now grab the milestone notes, if any
        milestones = normalize('NFKD', tds[2].text.strip())
        milestones = milestones.replace(' *', '')
        milestones = milestones.replace('*', '')
        milestones = milestones.replace('  ', ' ')
        if milestones:
            catalogs[f'{major}-{year}']['milestones'].append(milestones)

def main():
    urls = getURLs()

    catalogs = {} # this will be a dict of dicts where the key is major-year, and value is the CatalogData class

    # set up the driver options
    options = webdriver.ChromeOptions()
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--incognito')
    options.add_argument('--headless')

    webdriver_service = Service(ChromeDriverManager().install()) 
    # Choose Chrome Browser
    driver = webdriver.Chrome(service=webdriver_service, options=options)

    # loop through every URL to grab catalog
    for major, majorURLs in urls.items():
        for year, url in majorURLs.items():
            print(f'{major}-{year}')

            try:
                # grab the page, click all the links to get everything on the DOM, then let BS4 parse it
                driver.get(url)
                page = clickAllLinks(driver)
                soup = BeautifulSoup(page, 'html.parser')

            except:
                print('unable to access page\n')
            
            # set the value of a certain catalog to an empty dict so we can fill it in later
            catalogs[f'{major}-{year}'] = CatalogData()

            # Before we grab the schedule, we can go ahead and store all of the courses for this catalog
            all_courses = getAllCourses(soup)
            catalogs[f'{major}-{year}']['all_courses'] = all_courses.copy()

            getSchedule(soup, catalogs, major, year)


    # open files for writing
    file_schedule = open('catalog-schedules.txt', 'w')
    file_courses = open('catalog-courses.txt', 'w')
    for catalog, catalog_class in catalogs.items():
        file_schedule.write(f'{catalog}: \n')
        for i, courses in enumerate(catalog_class['terms']):
            file_schedule.write(f'Term {i+1}:\nMilestones: {catalog_class["milestones"][i]}\n\n')
            for course in courses:
                file_schedule.write(course)
                file_schedule.write('\n')
            file_schedule.write('\n')
        
        file_courses.write(f'{catalog}: \n')
        for name, course in catalog_class['all_courses'].items():
            file_courses.write(f'{name}\n')
            file_courses.write(f'Description: {course["full_description"]}\n')
            file_courses.write(f'Prerequisites: {course["prereqs"]}\n')
            file_courses.write(f'Corequisites: {course["coreqs"]}\n')
            file_courses.write('\n')

    file_schedule.close()
    file_courses.close()

    f = open('all_catalogs.json', 'w')
    json.dump(catalogs, f)
    f.close()
        

if __name__ == '__main__':
    main()