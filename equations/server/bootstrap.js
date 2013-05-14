// SERVER: js code available only on server
// description: bootstrap server function. Handles Meteor.startup event
  
Meteor.startup(function () {
  
// Bootstrap data in the Lists collection, if the Lists collection is empty
// //
// //  currently: if the database is empty on server start, create some sample data.
// //  TODO future: move to client, improve datastructure
// //

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

    // Now we have hardcoded some data object literals, add them to Equations collection via Equations.insert
    // we insert on declaration order. 
    // TODO: check info property contents
    // We insert into the Equations collection via literal object syntax, revealing the Equation document's schema.

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
