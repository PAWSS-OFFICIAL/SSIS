import urllib.request
from html.parser import HTMLParser
import os
import urllib.parse
import re

class ImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.image_urls = set()

    def add_url(self, url):
        if not url: return
        if url.startswith('http'):
            self.image_urls.add(url)
        elif url.startswith('//'):
            self.image_urls.add('https:' + url)
        elif url.startswith('/'):
            self.image_urls.add('https://www.swamyschoolcbse.ac.in' + url)

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        
        # Check standard image tags
        if tag == 'img':
            for attr in ['src', 'data-src', 'data-lazy-src']:
                if attr in attr_dict:
                    self.add_url(attr_dict[attr])
            
            # Check srcset
            if 'srcset' in attr_dict:
                srcset = attr_dict['srcset']
                parts = srcset.split(',')
                for part in parts:
                    url = part.strip().split(' ')[0]
                    self.add_url(url)
                    
        # Check inline styles for background images
        if 'style' in attr_dict:
            style = attr_dict['style']
            urls = re.findall(r'url\((.*?)\)', style)
            for url in urls:
                url = url.strip('\'"')
                self.add_url(url)

def download_images(urls, folder):
    if not os.path.exists(folder):
        os.makedirs(folder)
    
    all_image_urls = set()
    
    for url in urls:
        print(f"Fetching {url}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req)
            html_content = response.read().decode('utf-8', errors='ignore')
            
            parser = ImageParser()
            parser.feed(html_content)
            
            for img_url in parser.image_urls:
                all_image_urls.add(img_url)
                
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")

    print(f"Found {len(all_image_urls)} unique images. Downloading...")
    
    for img_url in all_image_urls:
        try:
            parsed_url = urllib.parse.urlparse(img_url)
            filename = os.path.basename(parsed_url.path)
            if not filename:
                continue
            
            filepath = os.path.join(folder, filename)
            
            if os.path.exists(filepath):
                continue # Skip if already downloaded
                
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(img_req) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Downloaded {filename}")
        except Exception as e:
            print(f"Failed to download {img_url}: {e}")

if __name__ == '__main__':
    pages = [
        'https://www.swamyschoolcbse.ac.in/',
        'https://www.swamyschoolcbse.ac.in/about-us/',
        'https://www.swamyschoolcbse.ac.in/academics/',
        'https://www.swamyschoolcbse.ac.in/facilities/',
        'https://www.swamyschoolcbse.ac.in/gallery/',
        'https://www.swamyschoolcbse.ac.in/contact-us/'
    ]
    download_images(pages, r'g:\SSIS\swamy_school_images')
