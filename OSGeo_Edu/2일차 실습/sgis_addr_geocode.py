import json
import urllib

# API 설정
accKey1 = 'https://sgisapi.kostat.go.kr/OpenAPI3/auth/authentication.json?consumer_key='
accKey2 = '&consumer_secret='

conKey = "98e62dec0ccd40f7a2bb"
secKey = "89e24776aac646e9b7e7"
apiKey = accKey1 + conKey + accKey2 + secKey

u = urllib.request.urlopen(apiKey)
accData = u.read()
accToken = json.loads(accData)['result']['accessToken']

address = '서울특별시 종로구 세종로 1-1'
encText = urllib.parse.quote(address)
uri = 'https://sgisapi.kostat.go.kr/OpenAPI3/addr/geocode.json?address='+ encText + '&accessToken=' + accToken
u = urllib.request.urlopen(uri)
coordData = u.read()

if json.loads(coordData)['errCd'] == 0:
    geoResult = '성공'
    x_coord = json.loads(coordData)['result']['resultdata'][0]['x']
    y_coord = json.loads(coordData)['result']['resultdata'][0]['y']
    x_coord = float(x_coord)
    y_coord = float(y_coord)
    transform = QgsCoordinateTransform(QgsCoordinateReferenceSystem('EPSG:5179'), QgsCoordinateReferenceSystem('EPSG:4326'), QgsProject.instance())
    coord = transform.transform(x_coord, y_coord)
    x_coord = coord.x()
    y_coord = coord.y()
    print(x_coord, y_coord)
else:
    print('실패')
    data[row] += [geoResult,'','']
    writer.writerow(data[row])