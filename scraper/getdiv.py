from bs4 import BeautifulSoup

f = open('test.txt', 'r')
text = f.read()
soup = BeautifulSoup(text, 'html.parser')

class_prefixes = ['COSC', 'ECE', 'EE', 'MATH' 'ENGL', 'BIOL', 'CHEM', 'PHYS', 'EF']

class_descriptions = soup.find_all("div")

for x in class_descriptions:
    if 'ECE 477' in str(x):
        print(x.prettify())
exit()

class_descriptions = [x for x in class_descriptions if ('<h3>' in str(x)) and x.h3.text.strip().split(' ')[0] in class_prefixes ]#and 'facebook' not in str(x)]
# print(class_descriptions[-2].prettify())
for div in class_descriptions:
    print(" ".join(div.text.strip().split()))
    print()