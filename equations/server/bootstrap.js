// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
  
  if (Lists.find().count() === 0) {
    var data = [
      {name: "Array Principles",
       contents: [
         ["Double integer array", "Simplicity"],
         ["Double integer array by closure", "Trickiness"],
       ]
      },
      {name: "Object Principles",
       contents: [
         ["Variable scope", "Objects"],
         ["Private methods", "Objects"],
         ]
      },
    ];

    var timestamp = (new Date()).getTime();
    for (var i = 0; i < data.length; i++) {
      var list_id = Lists.insert({name: data[i].name});
      for (var j = 0; j < data[i].contents.length; j++) {
        var info = data[i].contents[j];
        Equations.insert({list_id: list_id,
                      text: info[0],
                      timestamp: timestamp,
                      tags: info.slice(1)});
        timestamp += 1; // ensure unique timestamp.
      }
    }
  }
});
