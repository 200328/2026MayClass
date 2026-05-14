import urllib, json

crs = QgsCoordinateReferenceSystem(4326)   # WGS84
tlayer = QgsVectorLayer("LineString", "route_lines", "memory") 
tlayer.setCrs(crs)
provider = tlayer.dataProvider()

tlayer.startEditing()

provider.addAttributes( [QgsField("id",  QVariant.Int), QgsField("dista", QVariant.Double),QgsField("durat", QVariant.Double)] )
fields = provider.fields()
# add a feature
features = []

ori_x = '126.93073'
ori_y = '37.59154'
des_x = '127.11572'
des_y = '37.50230'
url = 'https://apis-navi.kakaomobility.com/v1/directions?origin=%s,%s&destination=%s,%s'%(ori_x, ori_y, des_x, des_y)
request = urllib.request.Request(url)
request.add_header("Authorization","KakaoAK " + "4413276d5f22f606936d7574dcf6af73")
response = urllib.request.urlopen(request)
response_body = response.read()
decode_json = response_body.decode('utf-8')
json_routes = json.loads(decode_json)
route_cnt = len(json_routes['routes'])
geomLists = []
geomLists.append(QgsPointXY(float(ori_x), float(ori_y)))
cost = []
for id in range(route_cnt):
	routes_data = json_routes['routes'][id]
	dista = routes_data['summary']['distance']
	durat = routes_data['summary']['duration']
	print('거리(미터) = %d, 소요시간(초) = %d' %(dista, durat))
	cost.append(dista)
	
	section_data = routes_data['sections']
	section_cnt = len(section_data)
	
	for i in range(section_cnt):
		road_data = section_data[i]['roads']
		road_cnt = len(road_data)
		
		for i in range(road_cnt):
			vertexes = road_data[i]['vertexes']
			vertexes_cnt = int(len(vertexes)/2)
			j = 0
			t = 1
			for i in range(vertexes_cnt):
				geomLists.append(QgsPointXY(vertexes[j], vertexes[t]))
				j = j+2
				t = t+2
				
geomLists.append(QgsPointXY(float(des_x), float(des_y)))    
feature = QgsFeature(fields)
feature.setGeometry(QgsGeometry.fromPolylineXY(geomLists))
feature.setAttribute(0, 1)
feature.setAttribute(1, dista)
feature.setAttribute(2, durat)
features.append(feature)
		
# features 리스트의 feature를 추가
provider.addFeatures(features)
                
# commit changes
tlayer.commitChanges()

QgsProject.instance().addMapLayer(tlayer)