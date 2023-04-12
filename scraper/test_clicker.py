from selenium import webdriver
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re

def clickAllLinks(driver: webdriver.Chrome):
    # All of the classes that CS, CE, or EE takes
    class_prefixes = ['COSC', 'ECE', 'EE', 'MATH', 'ENGL', 'BIOL', 'CHEM', 'PHYS', 'EF', 'ME', 'MSE', 'CBE', 'NE', 'IE']

    # Grab all the a elements that have hrefs
    links = driver.find_elements(By.TAG_NAME, 'a')
    f = open('error.txt', 'w')
    
    # go through all the grabbed elements and look for classes we should click on
    links = [link for link in links if re.search('[A-Z][A-Z]+ [0-9]+', link.text)]
    first_half_links = links[:len(links)//2]
    second_half_links = links[len(links)//2:]
    # print(len(first_half_links))
    # print(len(second_half_links))
    # exit()
    for first_link, second_link in zip(first_half_links, second_half_links):
        # wrap in a try except block because we get some non-class elements that throw exceptions
        try:
            print(first_link.text)
            if first_link.text.split(' ')[0] in class_prefixes:
                print(first_link.text, '\n')
                repeat = 0
                while repeat < 3:
                    try:
                        # these print comments are for debugging
                        # print(link.text, end='  ')
                        # print(link.location)
                        first_link.click()
                        time.sleep(0.25)
                        first_link.click()
                        time.sleep(0.25)
                        break
                    except StaleElementReferenceException as e:
                        print(e)
                        repeat += 1

        except Exception as e:
            f.write(str(e))
            # if link and link.text:
            #     f.write(f'{link.text}\n')
            pass

        try:
            print(second_link.text)
            if second_link.text.split(' ')[0] in class_prefixes:
                print(second_link.text, '\n')
                repeat = 0
                while repeat < 3:
                    try:
                        # these print comments are for debugging
                        # print(link.text, end='  ')
                        # print(link.location)
                        second_link.click()
                        time.sleep(0.25)
                        second_link.click()
                        time.sleep(0.25)
                        break
                    except StaleElementReferenceException as e:
                        print(e)
                        repeat += 1

        except Exception as e:
            f.write(str(e))
            # if link and link.text:
            #     f.write(f'{link.text}\n')
            pass
    
    f.close()
    return driver.page_source

options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument('--incognito')
options.add_argument('--headless')

webdriver_service = Service(ChromeDriverManager().install()) 
# Choose Chrome Browser
driver = webdriver.Chrome(service=webdriver_service, options=options)
driver.get('https://catalog.utk.edu/preview_program.php?catoid=34&poid=16680')
# driver.get('https://catalog.utk.edu/preview_program.php?catoid=26&poid=11104')

page = clickAllLinks(driver)