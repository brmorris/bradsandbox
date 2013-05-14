/*
Annotating server/publish.js.

File exists only on server, contains code to setup and expose Meteor collection data. 
*/

// Create a new global Lists collection object  -- format {name: String}
Lists = new Meteor.Collection("lists");

// Now we have the Lists collection, we can create an endpoint for all lists. This one just returns all lists.
// Publish complete set of lists to all clients, when a client subscribes to a 'list'
Meteor.publish('lists', function () {
  return Lists.find();
});

// TODO legacy equation schema
// Equations -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number}
//
// Create a toplevel Equation collection. Note that each Equation has a list_id 
Equations = new Meteor.Collection("equations");

// Publish all items for requested list_id. -> returns data for all equations 'linked' via list_id to a list
Meteor.publish('equations', function (list_id) {
  return Equations.find({list_id: list_id});
});

