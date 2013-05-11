// Lists -- {name: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function () {
  return Lists.find();
});


// Equations -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number}
Equations = new Meteor.Collection("equations");

// Publish all items for requested list_id.
Meteor.publish('equations', function (list_id) {
  return Equations.find({list_id: list_id});
});

