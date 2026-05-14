def crs_changed():
    print("좌표 변경됨")

layer = iface.activeLayer()

###
layer.crsChanged.connect(crs_changed)    
###

### TEST
new_crs = QgsCoordinateReferenceSystem("EPSG:4326")
layer.setCrs(new_crs) # emits crsChanged signal 