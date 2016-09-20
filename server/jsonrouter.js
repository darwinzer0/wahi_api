import { Meteor } from 'meteor/meteor'
import query from 'pg-query';

query.connectionParameters = "postgres://ben:0rangepumpkint0es@localhost:5432/fp";

JsonRoutes.add("post", "/isea3h/:orientation/:level/geojson", function (req, res, next) {
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  var geojson = req.body;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 12)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (geojson.type && (geojson.type == "Polygon" || geojson.type == "Point")) {
    //console.log(geojson);
    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT gid,ST_AsGeoJSON(geog) AS geog FROM hexgrid.isea3h'+level+' WHERE ST_Intersects(geog, ST_GeomFromGeoJSON($1)::geography)', [geojson]);
    var geojson_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "FeatureCollection": "geojson:FeatureCollection",
        "Polygon": "geojson:Polygon", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "features": {
          "@container": "@set",
          "@id": "geojson:features"
        },
        "id": "@id",
        "geometry": "geojson:vocab#geometry",
      },
      "crs": {
        "type": "name",
        "properties": { "name":"urn:ogc:def:crs:EPSG::4326" }
      },
      "type": "FeatureCollection",
      "features": [ ]
    };
    if (geojson.properties) {
      geojson_template.properties = geojson.properties;
    }

    var features = [];
    for (var i = 0; i < rows.length; i++) {
      features.push({
        "type": "Feature",
        "@type": ["Feature"],
        "id": "dg3:isea3h/"+orientation+"/"+level+"/cell/"+rows[i].gid,
        "geometry": JSON.parse(rows[i].geog),
        "properties": {}
      });
    }

    geojson_template.features = features;

    JsonRoutes.sendResult(res, {
      data: geojson_template
    });
  } else {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  }
});

JsonRoutes.add("get", "/isea3h/:orientation/:level/cell/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 12)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var json_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "adjacent": {
          "@id": "dg3:vocab#adjacent",
          "@container": "@set"
        },
        "centroid": "dg3:vocab#centroid",
        "projection": "dg3:vocab#projection",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "Polygon": "geojson:Polygon", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "id": "@id"
      },
      "type": "Feature",
      "id": "dg3:isea3h/"+orientation+"/"+level+"/cell/"+id,
      "crs": {
        "type": "name",
        "properties": { "name": "urn:ogc:def:crs:EPSG::4326" }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[ ]]
      },
      "properties":  {
        "gid": id,
        "adjacent": [ ],
        "centroid": "dg3:isea3h/"+orientation+"/"+level+"/point/"+id,
        "projection": "isea3h"
      }
    };

    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT ST_AsGeoJSON(geog) AS geog, adjacent FROM hexgrid.isea3h'+level+' AS a JOIN hexgrid.isea3h'+level+'_adjacency AS b ON a.gid=b.gid WHERE b.gid=$1 LIMIT 1', [id]);
    if (rows.length < 1) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      json_template.geometry.coordinates = JSON.parse(rows[0].geog).coordinates;
      var adjacent = [];
      for (var i = 0; i < rows[0].adjacent.length; i++) {
        adjacent.push("dg3:isea3h/"+orientation+"/"+level+"/cell/"+rows[0].adjacent[i]);
      }
      json_template.properties.adjacent = adjacent; 
      JsonRoutes.sendResult(res, {
        data: json_template 
      });
    }
  }
});

JsonRoutes.add("get", "/isea3h/:orientation/:level/point/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 12)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var json_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "cell": "dg3:vocab#cell",
        "projection": "dg3:vocab#projection",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "Point": "geojson:Point", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "id": "@id"
      },
      "type": "Feature",
      "id": "dg3:isea3h/"+orientation+"/"+level+"/point/"+id,
      "crs": {
        "type": "name",
        "properties": { "name": "urn:ogc:def:crs:EPSG::4326" }
      },
      "geometry": {
        "type": "Point",
        "coordinates": [[ ]]
      },
      "properties":  {
        "gid": id,
        "cell": "dg3:isea3h/"+orientation+"/"+level+"/cell/"+id,
        "projection": "isea3h"
      }
    };

    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT ST_AsGeoJSON(geog) AS geog FROM hexgrid.isea3h'+level+'p WHERE gid=$1 LIMIT 1', [id]);
    if (rows.length < 1) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      json_template.geometry.coordinates = JSON.parse(rows[0].geog).coordinates;
      JsonRoutes.sendResult(res, {
        data: json_template 
      });
    }
  }
});

JsonRoutes.add("get", "/isea3h/:orientation/:level/gaz/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 12)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT gid,ST_AsGeoJSON(geog) AS geog FROM hexgrid.isea3h'+level+' WHERE gid=ANY((SELECT gids FROM geonames20160531.geoname_hexgrid_isea3h'+level+' WHERE geonameid=$1 LIMIT 1)::integer[])', [id]);
    if (rows.length == 0) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      var rowsName = querySync('SELECT name FROM geonames20160531.geoname WHERE geonameid=$1 LIMIT 1', [id]);
      var name = '';
      if (rowsName.length > 0) {
        name = rowsName[0].name;
      }
      var json_template = {
        "@context": {
          "dg3": "http://dg3.cer.auckland.ac.nz/",
          "geojson": "http://ld.geojson.org/vocab#",
          "Feature": "geojson:Feature",
          "FeatureCollection": "geojson:FeatureCollection",
          "Polygon": "geojson:Polygon", 
          "geometry": "geojson:geometry",
          "properties": "geojson:properties",
          "coordinates": "geojson:coordinates",
          "features": {
            "@container": "@set",
            "@id": "geojson:features"
          },
          "id": "@id",
          "Place": "http://schema.org/Place",
          "toponym": "http://schema.org/name",
          "geometry": "geojson:vocab#geometry",
          "sameAs": {
            "@container": "@set",
            "@id": "http://www.w3.org/2002/07/owl#sameAs"
          }
        },
        "id": "dg3:isea3h/"+orientation+"/"+level+"/gaz/"+id,
        "sameAs": [ "http://sws.geonames.org/"+id+"/" ],
        "crs": {
          "type": "name",
          "properties": { "name":"urn:ogc:def:crs:EPSG::4326" }
        },
        "type": "FeatureCollection",
        "@type": ["FeatureCollection", "Place"],
        "toponym": name,
        "features": [ ]
      };
      var features = [];
      for (var i = 0; i < rows.length; i++) {
        features.push({
          "type": "Feature",
          "@type": ["Feature"],
          "id": "dg3:isea3h/"+orientation+"/"+level+"/cell/"+rows[i].gid,
          "geometry": JSON.parse(rows[i].geog),
          "properties": {}
        });
      }

      json_template.features = features;

      JsonRoutes.sendResult(res, {
        data: json_template
      });
    }
  }
});

JsonRoutes.add("post", "/isea4h/:orientation/:level/geojson", function (req, res, next) {
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  var geojson = req.body;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (geojson.type && (geojson.type == "Polygon" || geojson.type == "Point")) {
    //console.log(geojson);
    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT gid,ST_AsGeoJSON(geog) AS geog FROM hexgrid.isea4h'+level+' WHERE ST_Intersects(geog, ST_GeomFromGeoJSON($1)::geography)', [geojson]);

    var geojson_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "FeatureCollection": "geojson:FeatureCollection",
        "Polygon": "geojson:Polygon", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "features": {
          "@container": "@set",
          "@id": "geojson:features"
        },
        "id": "@id",
        "geometry": "geojson:vocab#geometry",
      },
      "crs": {
        "type": "name",
        "properties": { "name":"urn:ogc:def:crs:EPSG::4326" }
      },
      "type": "FeatureCollection",
      "features": [ ]
    };
    if (geojson.properties) {
      geojson_template.properties = geojson.properties;
    }

    var features = [];
    for (var i = 0; i < rows.length; i++) {
      features.push({
        "type": "Feature",
        "@type": ["Feature"],
        "id": "dg3:isea4h/"+orientation+"/"+level+"/cell/"+rows[i].gid,
        "geometry": JSON.parse(rows[i].geog),
        "properties": {}
      });
    }

    geojson_template.features = features;

    JsonRoutes.sendResult(res, {
      data: geojson_template
    });
  } else {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  }
});

JsonRoutes.add("get", "/isea4h/:orientation/:level/cell/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var json_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "adjacent": {
          "@id": "dg3:vocab#adjacent",
          "@container": "@set"
        },
        "centroid": "dg3:vocab#centroid",
        "projection": "dg3:vocab#projection",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "Polygon": "geojson:Polygon", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "id": "@id"
      },
      "type": "Feature",
      "id": "dg3:isea4h/"+orientation+"/"+level+"/cell/"+id,
      "crs": {
        "type": "name",
        "properties": { "name": "urn:ogc:def:crs:EPSG::4326" }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[ ]]
      },
      "properties":  {
        "gid": id,
        "adjacent": [ ],
        "centroid": "dg3:isea4h/"+orientation+"/"+level+"/point/"+id,
        "projection": "isea4h"
      }
    };

    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT ST_AsGeoJSON(geog) AS geog, adjacent FROM hexgrid.isea4h'+level+' AS a JOIN hexgrid.isea4h'+level+'_adjacency AS b ON a.gid=b.gid WHERE b.gid=$1 LIMIT 1', [id]);
    if (rows.length < 1) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      json_template.geometry.coordinates = JSON.parse(rows[0].geog).coordinates;
      var adjacent = [];
      for (var i = 0; i < rows[0].adjacent.length; i++) {
        adjacent.push("dg3:isea4h/"+orientation+"/"+level+"/cell/"+rows[0].adjacent[i]);
      }
      json_template.properties.adjacent = adjacent; 
      JsonRoutes.sendResult(res, {
        data: json_template 
      });
    }
  }
});

JsonRoutes.add("get", "/isea4h/:orientation/:level/point/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var json_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "cell": "dg3:vocab#cell",
        "projection": "dg3:vocab#projection",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "Point": "geojson:Point", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "id": "@id"
      },
      "type": "Feature",
      "id": "dg3:isea4h/"+orientation+"/"+level+"/point/"+id,
      "crs": {
        "type": "name",
        "properties": { "name": "urn:ogc:def:crs:EPSG::4326" }
      },
      "geometry": {
        "type": "Point",
        "coordinates": [[ ]]
      },
      "properties":  {
        "gid": id,
        "cell": "dg3:isea4h/"+orientation+"/"+level+"/cell/"+id,
        "projection": "isea4h"
      }
    };

    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT ST_AsGeoJSON(geog) AS geog FROM hexgrid.isea4h'+level+'p WHERE gid=$1 LIMIT 1', [id]);
    if (rows.length < 1) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      json_template.geometry.coordinates = JSON.parse(rows[0].geog).coordinates;
      JsonRoutes.sendResult(res, {
        data: json_template 
      });
    }
  }
});

JsonRoutes.add("get", "/isea4h/:orientation/:level/gaz/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT gid,ST_AsGeoJSON(geog) AS geog FROM hexgrid.isea4h'+level+' WHERE gid=ANY((SELECT gids FROM geonames20160531.geoname_hexgrid_isea4h'+level+' WHERE geonameid=$1 LIMIT 1)::integer[])', [id]);
    if (rows.length == 0) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      var rowsName = querySync('SELECT name FROM geonames20160531.geoname WHERE geonameid=$1 LIMIT 1', [id]);
      var name = '';
      if (rowsName.length > 0) {
        name = rowsName[0].name;
      }
      var json_template = {
        "@context": {
          "dg3": "http://dg3.cer.auckland.ac.nz/",
          "geojson": "http://ld.geojson.org/vocab#",
          "Feature": "geojson:Feature",
          "FeatureCollection": "geojson:FeatureCollection",
          "Polygon": "geojson:Polygon", 
          "geometry": "geojson:geometry",
          "properties": "geojson:properties",
          "coordinates": "geojson:coordinates",
          "features": {
            "@container": "@set",
            "@id": "geojson:features"
          },
          "id": "@id",
          "Place": "http://schema.org/Place",
          "toponym": "http://schema.org/name",
          "geometry": "geojson:vocab#geometry",
          "sameAs": {
            "@id": "http://www.w3.org/2002/07/owl#sameAs",
            "@container": "@set"
          }
        },
        "id": "dg3:isea4h/"+orientation+"/"+level+"/gaz/"+id,
        "sameAs": [ "http://sws.geonames.org/"+id+"/" ],
        "crs": {
          "type": "name",
          "properties": { "name":"urn:ogc:def:crs:EPSG::4326" }
        },
        "type": "FeatureCollection",
        "@type": ["FeatureCollection", "Place"],
        "toponym": name,
        "features": [ ]
      };
      var features = [];
      for (var i = 0; i < rows.length; i++) {
        features.push({
          "type": "Feature",
          "@type": ["Feature"],
          "id": "dg3:isea4h/"+orientation+"/"+level+"/cell/"+rows[i].gid,
          "geometry": JSON.parse(rows[i].geog),
          "properties": {}
        });
      }

      json_template.features = features;

      JsonRoutes.sendResult(res, {
        data: json_template
      });
    }
  }
});

JsonRoutes.add("post", "/isea4t/:orientation/:level/geojson", function (req, res, next) {
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  var geojson = req.body;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (geojson.type && (geojson.type == "Polygon" || geojson.type == "Point")) {
    //console.log(geojson);
    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT gid,ST_AsGeoJSON(geog) AS geog FROM hexgrid.isea4t'+level+' WHERE ST_Intersects(geog, ST_GeomFromGeoJSON($1)::geography)', [geojson]);
    var geojson_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "FeatureCollection": "geojson:FeatureCollection",
        "Polygon": "geojson:Polygon", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "features": {
          "@container": "@set",
          "@id": "geojson:features"
        },
        "id": "@id",
        "geometry": "geojson:vocab#geometry",
      },
      "crs": {
        "type": "name",
        "properties": { "name":"urn:ogc:def:crs:EPSG::4326" }
      },
      "type": "FeatureCollection",
      "features": [ ]
    };
    if (geojson.properties) {
      geojson_template.properties = geojson.properties;
    }

    var features = [];
    for (var i = 0; i < rows.length; i++) {
      features.push({
        "type": "Feature",
        "@type": ["Feature"],
        "id": "dg3:isea4t/"+orientation+"/"+level+"/cell/"+rows[i].gid,
        "geometry": JSON.parse(rows[i].geog),
        "properties": {}
      });
    }

    geojson_template.features = features;

    JsonRoutes.sendResult(res, {
      data: geojson_template
    });
  } else {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  }
});

JsonRoutes.add("get", "/isea4t/:orientation/:level/cell/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var json_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "adjacent": {
          "@id": "dg3:vocab#adjacent",
          "@container": "@set"
        },
        "centroid": "dg3:vocab#centroid",
        "projection": "dg3:vocab#projection",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "Polygon": "geojson:Polygon", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "id": "@id"
      },
      "type": "Feature",
      "id": "dg3:isea4t/"+orientation+"/"+level+"/cell/"+id,
      "crs": {
        "type": "name",
        "properties": { "name": "urn:ogc:def:crs:EPSG::4326" }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[ ]]
      },
      "properties":  {
        "gid": id,
        "adjacent": [ ],
        "centroid": "dg3:isea4t/"+orientation+"/"+level+"/point/"+id,
        "projection": "isea4t"
      }
    };

    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT ST_AsGeoJSON(geog) AS geog, adjacent FROM trigrid.isea4t'+level+' AS a JOIN trigrid.isea4t'+level+'_adjacency AS b ON a.gid=b.gid WHERE b.gid=$1 LIMIT 1', [id]);
    if (rows.length < 1) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      json_template.geometry.coordinates = JSON.parse(rows[0].geog).coordinates;
      var adjacent = [];
      for (var i = 0; i < rows[0].adjacent.length; i++) {
        adjacent.push("dg3:isea4t/"+orientation+"/"+level+"/cell/"+rows[0].adjacent[i]);
      }
      json_template.properties.adjacent = adjacent; 
      JsonRoutes.sendResult(res, {
        data: json_template 
      });
    }
  }
});

JsonRoutes.add("get", "/isea4t/:orientation/:level/point/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var json_template = {
      "@context": {
        "dg3": "http://dg3.cer.auckland.ac.nz/",
        "cell": "dg3:vocab#cell",
        "projection": "dg3:vocab#projection",
        "geojson": "http://ld.geojson.org/vocab#",
        "Feature": "geojson:Feature",
        "Point": "geojson:Point", 
        "geometry": "geojson:geometry",
        "properties": "geojson:properties",
        "coordinates": "geojson:coordinates",
        "id": "@id"
      },
      "type": "Feature",
      "id": "dg3:isea4t/"+orientation+"/"+level+"/point/"+id,
      "crs": {
        "type": "name",
        "properties": { "name": "urn:ogc:def:crs:EPSG::4326" }
      },
      "geometry": {
        "type": "Point",
        "coordinates": [[ ]]
      },
      "properties":  {
        "gid": id,
        "cell": "dg3:isea4t/"+orientation+"/"+level+"/cell/"+id,
        "projection": "isea4t"
      }
    };

    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT ST_AsGeoJSON(geog) AS geog FROM trigrid.isea4t'+level+'p WHERE gid=$1 LIMIT 1', [id]);
    if (rows.length < 1) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      json_template.geometry.coordinates = JSON.parse(rows[0].geog).coordinates;
      JsonRoutes.sendResult(res, {
        data: json_template 
      });
    }
  }
});

JsonRoutes.add("get", "/isea4t/:orientation/:level/gaz/:id", function (req, res, next) {
  var id = req.params.id;
  var level = req.params.level;
  var level_int = parseInt(level);
  var orientation = req.params.orientation;
  if (isNaN(level_int) || (level_int < 1) || (level_int > 10)) {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else if (orientation != "11.25_58.2825") {
    JsonRoutes.sendResult(res, {
      data: { "error": 404 },
      code: 404
    });
  } else {
    var querySync = Meteor.wrapAsync(query);
    var rows = querySync('SELECT gid,ST_AsGeoJSON(geog) AS geog FROM trigrid.isea4t'+level+' WHERE gid=ANY((SELECT gids FROM geonames20160531.geoname_trigrid_isea4t'+level+' WHERE geonameid=$1 LIMIT 1)::integer[])', [id]);
    if (rows.length == 0) {
      JsonRoutes.sendResult(res, {
        data: { "error": 404 },
        code: 404
      });
    } else {
      var rowsName = querySync('SELECT name FROM geonames20160531.geoname WHERE geonameid=$1 LIMIT 1', [id]);
      var name = '';
      if (rowsName.length > 0) {
        name = rowsName[0].name;
      }
      var json_template = {
        "@context": {
          "dg3": "http://dg3.cer.auckland.ac.nz/",
          "geojson": "http://ld.geojson.org/vocab#",
          "Feature": "geojson:Feature",
          "FeatureCollection": "geojson:FeatureCollection",
          "Polygon": "geojson:Polygon", 
          "geometry": "geojson:geometry",
          "properties": "geojson:properties",
          "coordinates": "geojson:coordinates",
          "features": {
            "@container": "@set",
            "@id": "geojson:features"
          },
          "id": "@id",
          "Place": "http://schema.org/Place",
          "toponym": "http://schema.org/name",
          "geometry": "geojson:vocab#geometry",
          "sameAs": {
            "@id": "http://www.w3.org/2002/07/owl#sameAs",
            "@container": "@set"
          }
        },
        "id": "dg3:isea4t/"+orientation+"/"+level+"/gaz/"+id,
        "sameAs": [ "http://sws.geonames.org/"+id+"/" ],
        "crs": {
          "type": "name",
          "properties": { "name":"urn:ogc:def:crs:EPSG::4326" }
        },
        "type": "FeatureCollection",
        "@type": ["FeatureCollection", "Place"],
        "toponym": name,
        "features": [ ]
      };
      var features = [];
      for (var i = 0; i < rows.length; i++) {
        features.push({
          "type": "Feature",
          "@type": ["Feature"],
          "id": "dg3:isea4t/"+orientation+"/"+level+"/cell/"+rows[i].gid,
          "geometry": JSON.parse(rows[i].geog),
          "properties": {}
        });
      }

      json_template.features = features;

      JsonRoutes.sendResult(res, {
        data: json_template
      });
    }
  }
});

