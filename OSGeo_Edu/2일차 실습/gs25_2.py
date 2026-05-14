from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import soupsieve

driver = webdriver.Chrome()
data = []

url = 'http://gs25.gsretail.com/gscvs/ko/store-services/locations'
driver.get(url)
driver.implicitly_wait(3)

opt1 = driver.find_element(By.XPATH, '//*[@id="stb1"]')
driver.implicitly_wait(3)
sid_list = [option.text for option in opt1.find_elements(By.TAG_NAME, "option")]
sid_list.remove('지역 선택')
select1 = Select(opt1)

for sid in sid_list:
    driver.find_element(By.XPATH, '//*[@id="stb1"]').click()
    driver.implicitly_wait(3)
    select1.select_by_visible_text(sid)
    driver.implicitly_wait(3)
    driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
    opt2 = driver.find_element(By.XPATH, '//*[@id="stb2"]')
    driver.implicitly_wait(3)
    sgg_list = [option.text for option in opt2.find_elements(By.TAG_NAME, "option")]
    sgg_list.remove('시/군/구 선택')
    select2 = Select(opt2)
    if sid != '서울시':
        break
    for sgg in sgg_list:
        driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
        select2.select_by_visible_text(sgg)
        driver.implicitly_wait(3)
        driver.find_element(By.XPATH, '//*[@id="searchButton"]').click()
        driver.implicitly_wait(3)
        html = driver.page_source
        soup = BeautifulSoup(html,"html.parser")
        store_list= len(soup.select("#storeInfoList > div p a"))

        for i in range(store_list):
            if i % 2 == 0:
                gs_nm = soup.select("#storeInfoList > div p a")[i].text
                data.append(gs_nm)
            else:
                gs_addr = soup.select("#storeInfoList > div p a")[i].text
                data.append(gs_addr)

for i in range(int(len(data)/4)):
    print(data[i*4] + '|' + data[i*4+1] + '|' + data[i*4+2] + '|' + data[i*4+3])


from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import soupsieve
import time
import json
import urllib

from qgis.core import *

crs = QgsCoordinateReferenceSystem(5181)   # Korean
tlayer = QgsVectorLayer("Point", "gs25", "memory")
tlayer.setCrs(crs)

provider = tlayer.dataProvider()

# start editing mode
tlayer.startEditing()

# add fields
provider.addAttributes( [ 
                QgsField("stat",  QVariant.String),
                QgsField("name", QVariant.String),
                QgsField("addr", QVariant.String)] )

fields = provider.fields()

# add a feature
features = []

driver = webdriver.Chrome()
url = 'http://gs25.gsretail.com/gscvs/ko/store-services/locations'
driver.get(url)
driver.implicitly_wait(3)

opt1 = driver.find_element(By.XPATH, '//*[@id="stb1"]')
driver.implicitly_wait(3)
sid_list = [option.text for option in opt1.find_elements(By.TAG_NAME, "option")]
sid_list.remove('지역 선택')
select1 = Select(opt1)

for sid in sid_list:
    driver.find_element(By.XPATH, '//*[@id="stb1"]').click()
    driver.implicitly_wait(3)
    select1.select_by_visible_text(sid)
    driver.implicitly_wait(3)
    driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
    opt2 = driver.find_element(By.XPATH, '//*[@id="stb2"]')
    driver.implicitly_wait(3)
    sgg_list = [option.text for option in opt2.find_elements(By.TAG_NAME, "option")]
    sgg_list.remove('시/군/구 선택')
    select2 = Select(opt2)
    for sgg in sgg_list:
        if sid != '서울시' or sgg == '관악구':
            break
        driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
        select2.select_by_visible_text(sgg)
        driver.implicitly_wait(3)
        driver.find_element(By.XPATH, '//*[@id="searchButton"]').click()
        driver.implicitly_wait(3)
        html = driver.page_source
        soup = BeautifulSoup(html,"html.parser")
        store_list= len(soup.select("#storeInfoList > div p a"))

        for i in range(store_list):
            if i % 2 == 0:
                gs_nm = soup.select("#storeInfoList > div p a")[i].text #매장이름
                data.append(gs_nm)
                time.sleep(0.01)
            else:
                gs_addr = soup.select("#storeInfoList > div p a")[i].text # 매장주소
                data.append(gs_addr)
                time.sleep(0.01)
        
            encText = urllib.parse.quote(gs_addr)
            url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + encText
            request = urllib.request.Request(url)
            request.add_header("Authorization","KakaoAK " + "KAKAO_REST_API_KEY")
            response = urllib.request.urlopen(request)
            response_body = response.read()
            json_addr = response_body.decode('utf-8')
            json_data = json.loads(json_addr)
            cd_cnt = json_data['meta']['total_count']
            feature = QgsFeature(fields)
            if(cd_cnt > 0):
                y_coord = json_data['documents'][0]['y']
                x_coord = json_data['documents'][0]['x']
                y_coord = float(y_coord)
                x_coord = float(x_coord)
                Transform = QgsCoordinateTransform(QgsCoordinateReferenceSystem('EPSG:4326'), QgsCoordinateReferenceSystem('EPSG:5181'), QgsProject.instance())
                coord = Transform.transform(x_coord, y_coord)
                y_coord = coord.y()
                x_coord = coord.x()
                centroid = QgsPointXY(x_coord, y_coord)
                feature.setGeometry( QgsGeometry.fromPointXY(centroid) )
                feature.setAttribute(0, '지오코딩성공')
                feature.setAttribute(1, gs_nm)
                feature.setAttribute(2, gs_addr)
            else:
                feature.setGeometry(QgsGeometry.fromPointXY(QgsPointXY(0, 0)))
                feature.setAttribute(0, '지오코딩 실패')
                feature.setAttribute(1, gs_nm)
                feature.setAttribute(2, gs_addr)
            
            # 리스트에 추가
            features.append(feature)

        

# features 리스트의 feature를 추가
provider.addFeatures(features)

# commit changes
tlayer.commitChanges()

# udpate extent
tlayer.updateExtents()

# add layer
QgsProject.instance().addMapLayer(tlayer)
qgis.utils.iface.mapCanvas().setExtent(tlayer.extent())
qgis.utils.iface.mapCanvas().refresh()





from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import soupsieve
import time

from qgis.core import *

crs = QgsCoordinateReferenceSystem(5181)   # Korean
tlayer = QgsVectorLayer("Point", "gs25", "memory")
tlayer.setCrs(crs)

provider = tlayer.dataProvider()

# start editing mode
tlayer.startEditing()

# add fields
provider.addAttributes( [ 
                QgsField("name", QVariant.String),
                QgsField("addr", QVariant.String)] )

fields = provider.fields()

# add a feature
features = []

driver = webdriver.Chrome()
url = 'http://gs25.gsretail.com/gscvs/ko/store-services/locations'
driver.get(url)
driver.implicitly_wait(3)

opt1 = driver.find_element(By.XPATH, '//*[@id="stb1"]')
driver.implicitly_wait(3)
sid_list = [option.text for option in opt1.find_elements(By.TAG_NAME, "option")]
sid_list.remove('지역 선택')
select1 = Select(opt1)

for sid in sid_list:
    driver.find_element(By.XPATH, '//*[@id="stb1"]').click()
    driver.implicitly_wait(3)
    select1.select_by_visible_text(sid)
    driver.implicitly_wait(3)
    driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
    opt2 = driver.find_element(By.XPATH, '//*[@id="stb2"]')
    driver.implicitly_wait(3)
    sgg_list = [option.text for option in opt2.find_elements(By.TAG_NAME, "option")]
    sgg_list.remove('시/군/구 선택')
    select2 = Select(opt2)
    if sid != '서울시':
        break
    for sgg in sgg_list:
        driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
        select2.select_by_visible_text(sgg)
        driver.implicitly_wait(3)
        driver.find_element(By.XPATH, '//*[@id="searchButton"]').click()
        driver.implicitly_wait(3)
        html = driver.page_source
        soup = BeautifulSoup(html,"html.parser")
        store_list= len(soup.select("#storeInfoList > div p a"))
        data = []
        for i in range(store_list):
            if i % 2 == 0:
                gs_nm = soup.select("#storeInfoList > div p a")[i].text #매장이름
                data.append(gs_nm)
                time.sleep(0.01)
            else:
                gs_addr = soup.select("#storeInfoList > div p a")[i].text # 매장주소
                y_coord = soup.select("#storeInfoList > div p a")[i].get('href').split()[1].split(',')[0]
                x_coord = soup.select("#storeInfoList > div p a")[i].get('href').split()[1].split(',')[1]
                data.append(gs_addr)
                data.append(y_coord)
                data.append(x_coord)
                time.sleep(0.01)
            if len(data) == 4:
                feature = QgsFeature(fields)
                y_coord = float(data[2])
                x_coord = float(data[3])
                Transform = QgsCoordinateTransform(QgsCoordinateReferenceSystem('EPSG:4326'), QgsCoordinateReferenceSystem('EPSG:5181'), QgsProject.instance())
                coord = Transform.transform(x_coord, y_coord)
                y_coord = coord.y()
                x_coord = coord.x()
                centroid = QgsPointXY(x_coord, y_coord)
                feature.setGeometry( QgsGeometry.fromPointXY(centroid) )
                feature.setAttribute(0, gs_nm)
                feature.setAttribute(1, gs_addr)
        
                # 리스트에 추가
                features.append(feature)
                data = []

# features 리스트의 feature를 추가
provider.addFeatures(features)

# commit changes
tlayer.commitChanges()

# udpate extent
tlayer.updateExtents()

# add layer
QgsProject.instance().addMapLayer(tlayer)
qgis.utils.iface.mapCanvas().setExtent(tlayer.extent())
qgis.utils.iface.mapCanvas().refresh()



# 리스트형에 서울시 넣기 이름, 주소, y좌표, x좌표
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import soupsieve

driver = webdriver.Chrome()
driver.implicitly_wait(3)

data = []

url = 'http://gs25.gsretail.com/gscvs/ko/store-services/locations'
driver.get(url)
driver.implicitly_wait(3)

opt1 = driver.find_element(By.XPATH, '//*[@id="stb1"]')
driver.implicitly_wait(3)
sid_list = [option.text for option in opt1.find_elements(By.TAG_NAME, "option")]
sid_list.remove('지역 선택')
select1 = Select(opt1)

for sid in sid_list:
    driver.find_element(By.XPATH, '//*[@id="stb1"]').click()
    driver.implicitly_wait(3)
    select1.select_by_visible_text(sid)
    driver.implicitly_wait(3)
    driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
    opt2 = driver.find_element(By.XPATH, '//*[@id="stb2"]')
    driver.implicitly_wait(3)
    sgg_list = [option.text for option in opt2.find_elements(By.TAG_NAME, "option")]
    sgg_list.remove('시/군/구 선택')
    select2 = Select(opt2)
    if sid != '서울시':
        break
    for sgg in sgg_list:
        driver.find_element(By.XPATH, '//*[@id="stb2"]').click()
        select2.select_by_visible_text(sgg)
        driver.implicitly_wait(3)
        driver.find_element(By.XPATH, '//*[@id="searchButton"]').click()
        driver.implicitly_wait(3)
        html = driver.page_source
        soup = BeautifulSoup(html,"html.parser")
        store_list= len(soup.select("#storeInfoList > div p a"))

        for i in range(store_list):
            if i % 2 == 0:
                gs_nm = soup.select("#storeInfoList > div p a")[i].text
                data.append(gs_nm)
            else:
                gs_addr = soup.select("#storeInfoList > div p a")[i].text
                y_coord = soup.select("#storeInfoList > div p a")[i].get('href').split()[1].split(',')[0]
                x_coord = soup.select("#storeInfoList > div p a")[i].get('href').split()[1].split(',')[1]
                data.append(gs_addr)
                data.append(y_coord)
                data.append(x_coord)