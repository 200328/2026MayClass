import json
import urllib

# 지오코딩
address = '서울특별시 종로구 세종로 1-1'
encText = urllib.parse.quote(address)
url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + encText
request = urllib.request.Request(url)
request.add_header("Authorization","KakaoAK " + "4413276d5f22f606936d7574dcf6af73")
response = urllib.request.urlopen(request)
response_body = response.read()
json_addr = response_body.decode('utf-8')
cd_cnt = json.loads(json_addr)['meta']['total_count']

if(cd_cnt>=1):
    y_coord = json.loads(json_addr)['documents'][0]['y']
    x_coord = json.loads(json_addr)['documents'][0]['x']
    y_coord = float(y_coord)
    x_coord = float(x_coord)

print(x_coord, y_coord)


def geocode(address):
    encText = urllib.parse.quote(address)
    url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + encText
    request = urllib.request.Request(url)
    request.add_header("Authorization","KakaoAK " + "4413276d5f22f606936d7574dcf6af73")
    response = urllib.request.urlopen(request)
    response_body = response.read()
    json_addr = response_body.decode('utf-8')
    cd_cnt = json.loads(json_addr)['meta']['total_count']

    if(cd_cnt>=1):
        y_coord = json.loads(json_addr)['documents'][0]['y']
        x_coord = json.loads(json_addr)['documents'][0]['x']
        y_coord = float(y_coord)
        x_coord = float(x_coord)

    print(address, x_coord, y_coord)