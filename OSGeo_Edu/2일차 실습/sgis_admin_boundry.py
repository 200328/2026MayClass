import json
import urllib

accKey1 = 'https://sgisapi.kostat.go.kr/OpenAPI3/auth/authentication.json?consumer_key='
accKey2 = '&consumer_secret='

conKey = "98e62dec0ccd40f7a2bb"
secKey = "89e24776aac646e9b7e7"
apiKey = accKey1 + conKey + accKey2 + secKey

u = urllib.request.urlopen(apiKey)
data = u.read()
accToken = json.loads(data)['result']['accessToken']
year = str(2018)
adm_cd = str(11)
low_search = str(0)
layer_nm = "admin_bnd"

uri = 'https://sgisapi.kostat.go.kr/OpenAPI3/boundary/hadmarea.geojson?year='+ year + '&adm_cd=' + adm_cd + '&low_search=' + low_search + '&accessToken=' + accToken

vLayer = QgsVectorLayer(uri, layer_nm, "ogr")

crs = vLayer.crs()
crs.createFromId(5179)
vLayer.setCrs(crs)

QgsProject.instance().addMapLayer(vLayer)
