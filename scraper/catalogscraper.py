import requests
from bs4 import BeautifulSoup
from unicodedata import normalize

class CatalogData:
    def __init__(self):
        self.terms = []
        self.milestones = []

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



def main():
    urls = getURLs()

    catalogs = {} # this will be a dict of dicts where the key is major-year, and value is a dict where those keys are terms and the value is a list of classes

    # loop through every URL to grab catalog
    for major, majorURLs in urls.items():
        for year, url in majorURLs.items():
            print(year)

            # keep up with the term number
            term = 0
            try:
                # grab the page and let bs4 convert it
                page = requests.get(url)
                soup = BeautifulSoup(page.content, 'html.parser')

                # f = open('test.txt', 'w')
                # f.write(soup.prettify())
                # f.close()
                # break

                # the table we want has a class of 'acalog-core'
                # we want the first table with this class
                results = soup.find(class_='acalog-core')
                tables = results.find_all('table')
                trs = tables[0].find_all('tr')

                # temporary list for storing classes needed in a term
                temp_classes = []

                # set the value of a certain catalog to an empty dict so we can fill it in later
                catalogs[f'{major}-{year}'] = CatalogData()
                for tr in trs:
                    tds = tr.find_all('td')

                    # rows with term, we add our temp list to the term if non-empty, then increment term
                    if 'Term' in tds[0].text:
                        if len(temp_classes) != 0:
                            catalogs[f'{major}-{year}'].terms.append(temp_classes.copy())
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
                        catalogs[f'{major}-{year}'].milestones.append(milestones)

            except:
                print('unable to access page\n')

        #     break
        # exit()

    for catalog, catalog_class in catalogs.items():
        print(f'{catalog}: ')
        for i, courses in enumerate(catalog_class.terms):
            print(f'Term {i+1}:\nMilestones: {catalog_class.milestones[i]}\n')
            for course in courses:
                print(course)
            print('')
        print('\n\n*****************************************************************\n\n')
        

if __name__ == '__main__':
    main()