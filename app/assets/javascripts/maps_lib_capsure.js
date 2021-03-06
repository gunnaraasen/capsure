var MapsLibCapsure = MapsLibCapsure || {};
var MapsLibCapsure = {

  districtTableId: "1RkstVFPb1b9TU-QqHZh69cDJnWZzI3j4kJB_zFQ",
  beatTableId: "1GXIIvWOaM_YDdY8GHeK0Vo-4nrceGnmhZtHLDFs",
  googleApiKey:  "AIzaSyA3FQFrNr5W2OEVmuENqhb2MBB2JabdaOY",
  geocoder: new google.maps.Geocoder(),
  map: null,
  map_bounds: new google.maps.LatLngBounds(),
  districtNumber: null,
  beatNumber: null,

  getBeatAndDistrict: function(){
    var address = $("#address").val();
    
    if(address.toLowerCase().indexOf("chicago") == -1)
      address += ", Chicago";

    _trackClickEventWithGA("Search", "Address", address);
    MapsLibCapsure.geocoder.geocode({ address: address }, function(results, status){
      if(status == google.maps.GeocoderStatus.OK){
        var whereClause = "geometry not equal to '' AND ST_INTERSECTS(geometry, CIRCLE(LATLNG" + results[0].geometry.location.toString() + ",1))";
        
        MapsLibCapsure.query("DIST_NUM", whereClause, MapsLibCapsure.districtTableId, "MapsLibCapsure.saveDistrictNumber");
        MapsLibCapsure.query("BEAT_NUM", whereClause, MapsLibCapsure.beatTableId, "MapsLibCapsure.saveBeatNumber");
      }
      else {
        alert("Sorry, we couldn't find your address: " + status);
      }
    });
  },

  saveDistrictNumber: function(json) {
    MapsLibCapsure.handleError(json);

    if (json["rows"] != null) {
      MapsLibCapsure.districtNumber = json["rows"][0];
      MapsLibCapsure.redirectToEvent();
    }
  },

  saveBeatNumber: function(json) {
    MapsLibCapsure.handleError(json);

    if (json["rows"] != null) {
      MapsLibCapsure.beatNumber = json["rows"][0];
      MapsLibCapsure.redirectToEvent();
    }
  },

  redirectToEvent: function() {
    if (MapsLibCapsure.districtNumber != null && MapsLibCapsure.beatNumber != null) {
      window.location = "/district/" + MapsLibCapsure.districtNumber + "/beat/" + MapsLibCapsure.beatNumber + "/next";
    }
  },

  initializeDetailMap: function() {
    var myOptions = {
      zoom: 13,
      center: new google.maps.LatLng(41.37680856570233,-84.287109375),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      scrollwheel: false,
      draggable: false,
      panControl: false
    };
    MapsLibCapsure.map = new google.maps.Map(document.getElementById("mapDetail"), myOptions);
  },

  displayPoint: function(address) {
    MapsLibCapsure.geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (MapsLibCapsure.map != null) {
          MapsLibCapsure.map.setCenter(results[0].geometry.location);
          var marker = new google.maps.Marker({
            map: MapsLibCapsure.map,
            position: results[0].geometry.location
          });
          MapsLibCapsure.map_bounds.extend(results[0].geometry.location);
          MapsLibCapsure.map.fitBounds(MapsLibCapsure.map_bounds);

          if (MapsLibCapsure.map.zoom > 15) {
            MapsLibCapsure.map.setZoom(15);
          }
        } else {
          alert("Geocode was not successful for the following reason: " + status);
        }
      }
    });
  },

  query: function(selectColumns, whereClause, fusionTableId, callback) {
    var queryStr = [];
    queryStr.push("SELECT " + selectColumns);
    queryStr.push(" FROM " + fusionTableId);
    queryStr.push(" WHERE " + whereClause);

    var sql = encodeURIComponent(queryStr.join(" "));
    $.ajax({url: "https://www.googleapis.com/fusiontables/v1/query?sql="+sql+"&callback="+callback+"&key="+MapsLibCapsure.googleApiKey, dataType: "jsonp"});
  },

  handleError: function(json) {
    if (json["error"] != undefined) {
      var error = json["error"]["errors"]
      console.log("Error in Fusion Table call!");
      for (var row in error) {
        console.log(" Domain: " + error[row]["domain"]);
        console.log(" Reason: " + error[row]["reason"]);
        console.log(" Message: " + error[row]["message"]);
      }
    }
  }
}
