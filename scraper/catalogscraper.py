import requests
from bs4 import BeautifulSoup
from unicodedata import normalize

# MANUALLY GO THROUGH THIS FUNCTION AND CHANGE URLS/YEARS TO UPDATE
def getURLs():
    csURLs = {
        '2019': '',
        '2020': '',
        '2021': '',
        '2022': 'https://catalog.utk.edu/preview_program.php?catoid=34&poid=16680',
    }

    ceURLs = {
        '2019': '',
        '2020': '',
        '2021': '',
        '2022': '',
    }

    eeURLs = {
        '2019': '',
        '2020': '',
        '2021': '',
        '2022': '',
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

                # the table we want has a class of 'acalog-core'
                # we want the first table with this class
                results = soup.find(class_='acalog-core')
                tables = results.find_all('table')
                trs = tables[0].find_all('tr')

                # temporary list for storing classes needed in a term
                temp_classes = []

                # set the value of a certain catalog to an empty dict so we can fill it in later
                catalogs[f'{major}-{year}'] = {}
                for tr in trs:
                    tds = tr.find_all('td')

                    # rows with term, we add our temp list to the term if non-empty, then increment term
                    if 'Term' in tds[0].text:
                        if len(temp_classes) != 0:
                            catalogs[f'{major}-{year}'][f'Term {term}'] = temp_classes.copy()
                            temp_classes.clear()
                        term += 1
                        continue

                    # this is the last line of our table
                    if 'TOTAL' in tds[0].text:
                        continue

                    # remove superscripts
                    if tds[0].find('sup'):
                        tds[0].sup.decompose()

                    # add strings of class names to list. Normalize here for unicode data
                    text = normalize('NFKD', tds[0].text.strip())
                    text = text.replace(' *', '')
                    text = text.replace(' and ', '+')
                    temp_classes.append(text)

                    # for td in tds:
                    #     if td.find('sup'):
                    #         td.sup.decompose()
                        
                    #     print(td.text, end=' - ')
                    # print()
            except:
                print('unable to access page\n')

    for key, val in catalogs.items():
        print(f'{key}: ')
        for term_number, classes in val.items():
            print(f'{term_number}:\n{classes}\n')
        

if __name__ == '__main__':
    main()