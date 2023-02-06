from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time

# set up the driver options
options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument('--incognito')
options.add_argument('--headless')

# webdriver_service = Service(f"{homedir}/chromedriver/stable/chromedriver")

# Choose Chrome Browser
# browser = webdriver.Chrome(service=webdriver_service, options=chrome_options)
driver = webdriver.Chrome("~/chromedriver/stable/chromedriver", chrome_options=options)
driver.get("https://catalog.utk.edu/preview_program.php?catoid=34&poid=16680")

# All of the classes that CS, CE, or EE makes
class_prefixes = ['COSC', 'ECE', 'EE', 'MATH', 'ENGL', 'BIOL', 'CHEM', 'PHYS', 'EF']

# Grab all the a elements that have hrefs
links = driver.find_elements(By.TAG_NAME, 'a')

# go through all the grabbed elements and look for classes we should click on
for link in links:
    # wrap in a try except block because we get some non-class elements that throw exceptions
    try:
        if link.text.split(' ')[0] in class_prefixes:
            # these print comments are for debugging
            # print(link.text, end='  ')
            # print(link.location)
            link.click()
            time.sleep(0.5)
            # action = webdriver.common.action_chains.ActionChains(driver)
            # action.move_to_element_with_offset(link, 0, -15)
            # action.click()
            # action.perform()
            link.click()
            time.sleep(0.5)

    except Exception as e:
        pass
        # if len(link.text.split()) > 1:
        #     print(e, ' on ', link.text.split(' ')[0], ' ', link.text.split(' ')[1])
        # break
        

page_source = driver.page_source
soup = BeautifulSoup(page_source, 'html.parser')
f = open('test.txt', 'w')
f.write(soup.prettify())
f.close()
