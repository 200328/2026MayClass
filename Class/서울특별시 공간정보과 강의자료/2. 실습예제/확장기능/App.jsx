import { useEffect } from 'react';

import 'ol/ol.css';
import 'ol-layerswitcher/src/ol-layerswitcher.css';

import Map from 'ol/Map';
import View from 'ol/View';
import { transform } from 'ol/proj';
import LayerGroup from 'ol/layer/Group';
import LayerTile from 'ol/layer/Tile';
import SourceOSM from 'ol/source/OSM';
import { TileWMS } from 'ol/source';
import StadiaMaps from 'ol/source/StadiaMaps.js'; 

import LayerSwitcher from 'ol-layerswitcher';
import ContextMenu from 'ol-contextmenu';


import './App.css';


const App = () => {

    useEffect(() => {
        const map = new Map({
            target: 'map',
            layers: [
                new LayerGroup({
                    'title': 'Base maps',
                    layers: [
                        new LayerTile({
                            title: 'Water color',
                            type: 'base',
                            visible: false,
                            source: new StadiaMaps({
                                layer: 'stamen_watercolor',
                            })
                        }),
                        new LayerTile({
                            title: 'OSM',
                            type: 'base',
                            visible: true,
                            source: new SourceOSM()
                        })
                    ]
                }),
                new LayerGroup({
                    title: 'Overlays',
                    layers: [
                        new LayerTile({
                            source: new TileWMS({
                                url: 'https://ahocevar.com/geoserver/wms',
                                params: {'LAYERS': 'topp:states', 'TILED': true},
                                serverType: 'geoserver', transition: 0
                            })
                        }),
                    ]
                })
            ],
            view: new View({
                center: transform([127, 37], 'EPSG:4326', 'EPSG:3857'),
                zoom: 3
            })
        });

        const layerSwitcher = new LayerSwitcher();
        map.addControl(layerSwitcher);

        const contextmenu = new ContextMenu({
            width: 170,
            defaultItems: true, // defaultItems are (for now) Zoom In/Zoom Out
            items: [
            {
                text: 'Center map here',
                callback: (obj, map) => {
                    map.getView().setCenter(obj.coordinate);
                } 
            },
            {
                text: 'Add a Marker',
                callback: e => {
                    
                }
            },
            '-' // this is a separator
            ]
        });
        map.addControl(contextmenu);

    }, []);

    return (
        <div id="map"></div>
    )

};

export default App;