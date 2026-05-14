#GDAL_HTTP_USERAGENT
#Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36

#GDAL_HTTP_UNSAFESSL
#YES

#모듈 설치
#python -m pip install --upgrade pip
#python -m pip install beautifulsoup4

import requests
from bs4 import BeautifulSoup as bs

# 1) reqeusts 라이브러리를 활용한 HTML 페이지 요청 
# 1-1) res 객체에 HTML 데이터가 저장되고, res.content로 데이터를 추출할 수 있음
res = requests.get('https://www.cheogajip.co.kr/bbs/board.php?bo_table=store&page=1')

# print(res.content)
# 2) HTML 페이지 파싱 BeautifulSoup(HTML데이터, 파싱방법)
# 2-1) BeautifulSoup 파싱방법
soup = bs(res.content, 'html.parser')

# 3) 필요한 데이터 검색
find_db = soup.find("div", {"class":"tbl_head01 tbl_wrap"})
for getTxt in find_db.find_all('td'):
    print(getTxt.get_text())

# 리스트형 변수에 넣기
txt = []
for getTxt in find_db.find_all('td'):
    txt.append(getTxt.get_text())

# 하나씩 출력
txt[0]
txt[1]
txt[2]
txt[3]
txt[4]
txt[5]
txt[6]
txt[7]

# 리스트 길이 출력
len(txt)

# 리스트 길이 나누기 4로 출력
for addr in range(int(len(txt)/8)):
    print(txt[addr*8], txt[addr*8+1], txt[addr*8+2])

# 구분자로 구분하여 출력
for addr in range(int(len(txt)/8)):
    print(txt[addr*8]+'|'+txt[addr*8+1]+'|'+txt[addr*8+2])
    


# 텍스트 파일로 저장
txtFile = open('C:/Users/asus/Desktop/test1.txt', 'w')
for i in range(1,3):
    res = requests.get('https://www.cheogajip.co.kr/bbs/board.php?bo_table=store&page='+ str(i))
    soup = bs(res.content, 'html.parser')
    find_db = soup.find("div", {"class":"tbl_head01 tbl_wrap"})
    txt = []
    for getTxt in find_db.find_all('td'):
        txt.append(getTxt.get_text())
    for addr in range(int(len(txt)/8)):
        txtFile.write(txt[addr*8]+'|'+txt[addr*8+1]+'|'+txt[addr*8+2] + '\n')

txtFile.close()

import json
import urllib

# 지오코딩
address = '서울특별시 종로구 세종로 1-1'
encText = urllib.parse.quote(address)
url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + encText
request = urllib.request.Request(url)
request.add_header("Authorization","KakaoAK " + "107610879a37223ed36f6b8990ff6675")
response = urllib.request.urlopen(request)
response_body = response.read()
json_addr = response_body.decode('utf-8')
json_data = json.loads(json_addr)
cd_cnt = json_data['meta']['total_count']

if(cd_cnt>=1):
    y_coord = json_data(json_addr)['documents'][0]['y']
    x_coord = json_data(json_addr)['documents'][0]['x']
    y_coord = float(y_coord)
    x_coord = float(x_coord)

print(x_coord, y_coord)

# 지오코딩하여 텍스트로 저장
import json
import urllib

txtFile = open('C:/Users/asus/Desktop/test2.txt', 'w')
for i in range(1,3):
    res = requests.get('https://www.cheogajip.co.kr/bbs/board.php?bo_table=store&page='+ str(i))
    soup = bs(res.content, 'html.parser')
    find_db = soup.find("div", {"class":"tbl_head01 tbl_wrap"})
    txt = []
    for getTxt in find_db.find_all('td'):
        txt.append(getTxt.get_text())
    for addr in range(int(len(txt)/8)):
        encText = urllib.parse.quote(txt[addr*8+1])
        url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + encText
        request = urllib.request.Request(url)
        request.add_header("Authorization","KakaoAK " + "KAKAO_REST_API_KEY")
        response = urllib.request.urlopen(request)
        response_body = response.read()
        json_addr = response_body.decode('utf-8')
        json_data = json.loads(json_addr)
        cd_cnt = json_data['meta']['total_count']
        if(cd_cnt>=1):
            y_coord = json_data['documents'][0]['y']
            x_coord = json_data['documents'][0]['x']
            y_coord = float(y_coord)
            x_coord = float(x_coord)
            Transform = QgsCoordinateTransform(QgsCoordinateReferenceSystem('EPSG:4326'), QgsCoordinateReferenceSystem('EPSG:5181'), QgsProject.instance())
            coord = Transform.transform(x_coord, y_coord)
            y_coord = coord.y()
            x_coord = coord.x()
            txtFile.write('success|' + txt[addr*8]+'|'+txt[addr*8+1]+'|'+txt[addr*8+2]+'|'+ str(x_coord) +'|'+ str(y_coord) + '\n')
        else:
            txtFile.write('fail(주소없음)|' + txt[addr*8]+'|'+txt[addr*8+1]+'|'+txt[addr*8+2]+ '||\n')


txtFile.close()



#===================================
# 포인트 데이터 생성
#===================================
# create memory layer
from qgis.core import *
crs = QgsCoordinateReferenceSystem(5181)   # Korean
tlayer = QgsVectorLayer("Point", "cheogajip", "memory") #좌표계 정의 안되어 있기 때문에 좌표계 설정 창 표출
tlayer.setCrs(crs)

provider = tlayer.dataProvider()

# start editing mode
tlayer.startEditing()

# add fields
# QgsField("COUNT", QVariant.Double, "real", 24, 16)
provider.addAttributes( [ 
                QgsField("stat",  QVariant.String),
                QgsField("name", QVariant.String),
                QgsField("addr", QVariant.String),
                QgsField("tel", QVariant.String) ] )

fields = provider.fields()

# add a feature
features = []

for i in range(1,126):
    res = requests.get('https://www.cheogajip.co.kr/bbs/board.php?bo_table=store&page='+ str(i))
    soup = bs(res.content, 'html.parser')
    find_db = soup.find("div", {"class":"tbl_head01 tbl_wrap"})
    txt = []
    for getTxt in find_db.find_all('td'):
        txt.append(getTxt.get_text())
    for addr in range(int(len(txt)/8)):
        encText = urllib.parse.quote(txt[addr*8+1])
        url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + encText
        request = urllib.request.Request(url)
        request.add_header("Authorization","KakaoAK " + "KAKAO_REST_API_KEY")
        response = urllib.request.urlopen(request)
        response_body = response.read()
        json_addr = response_body.decode('utf-8')
        json_data = json.loads(json_addr)
        cd_cnt = json_data['meta']['total_count']
        feature = QgsFeature(fields)
        if(cd_cnt>=1):
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
            feature.setAttribute(1, txt[addr*8])
            feature.setAttribute(2, txt[addr*8+1])
            feature.setAttribute(3, txt[addr*8+2])
        else:
            feature.setGeometry(QgsGeometry.fromPointXY(QgsPointXY(0, 0)))
            feature.setAttribute(0, '지오코딩 실패')
            feature.setAttribute(1, txt[addr*8])
            feature.setAttribute(2, txt[addr*8+1])
            feature.setAttribute(3, txt[addr*8+2])
        

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