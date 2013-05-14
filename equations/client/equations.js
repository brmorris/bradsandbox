//  Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
// ref: https://github.com/slacy/minimongo. Abstracts server data? what about if no connection? need to understand minimongo and its relationship to meteor. 

Lists = new Meteor.Collection("lists"); // lists contain one or more equations
Equations = new Meteor.Collection("equations"); // these are (all?) equations
var eq = new Equation();




// Now we init session variables. this suggests this code is run onLoad?. Note that note all of these session variables are used (like editing_addtag)

// ID of currently selected list
Session.set('list_id', null);

// Name of currently selected tag for filtering
Session.set('tag_filter', null);

// When adding tag to a equation, ID of the equation
Session.set('editing_addtag', null);

// When editing a list name, ID of the list
Session.set('editing_listname', null);

// When editing equation text, ID of the equation
Session.set('editing_itemname', null);


// Subscribe to 'lists' collection on startup. refer to http://docs.meteor.com/#publishandsubscribe
// Select a list once data has arrived.
Meteor.subscribe('lists', function () {
  if (!Session.get('list_id')) {
    var list = Lists.findOne({}, {sort: {name: 1}});
    if (list)
      Router.setList(list._id);
  }
});

// Always be subscribed to the equations for the selected list. TODO where does .autosubscribe() come from?
Meteor.autosubscribe(function () {
  var list_id = Session.get('list_id');
  if (list_id)
    Meteor.subscribe('equations', list_id);
});


////////// Helpers for in-place editing //////////

// i.e., event handling for client UI. see http://stackoverflow.com/a/14736036/2151088

// Returns an event_map key for attaching "ok/cancel" events to
// a text input (given by selector)
var okcancel_events = function (selector) {
  return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};

// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
var make_okcancel_handler = function (options) {
  var ok = options.ok || function () {};
  var cancel = options.cancel || function () {};

  return function (evt) {
    if (evt.type === "keydown" && evt.which === 27) {
      // escape = cancel
      // TODO revist .call()
      cancel.call(this, evt);

    } else if (evt.type === "keyup" && evt.which === 13 ||
               evt.type === "focusout") {
      // blur/return/enter = ok/submit if non-empty
      var value = String(evt.target.value || "");
      if (value)
        ok.call(this, value, evt);
      else
        cancel.call(this, evt);
    }
  };
};

// Finds a text input in the DOM by id and focuses it. this is called by many field's editing click events
var focus_field_by_id = function (id) {
  var input = document.getElementById(id);
  if (input) {
    input.focus();
    input.select();
  }
};

////////// Lists //////////
//
//
// Events for the List Template data structure. Note this runs on the client.

Template.lists.lists = function () {
  // returns all Lists in the collection, sorted by name
  return Lists.find({}, {sort: {name: 1}});
};

Template.lists.events = {
  // create event handlers on the following DOM elements in the 'lists' template
  'mousedown .list': function (evt) { // when mousedown on a .list element, fire this event
    Router.setList(this._id); // TODO. adds this._id to the router? need to grok this
  },
  'dblclick .list': function (evt) { // start editing list name
    Session.set('editing_listname', this._id); // set the editing listname context in the sesssion.
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    focus_field_by_id("list-name-input"); // set focus to the edited field. TODO: how does it know which field? there are multi elements in a list
  }
};

// first instance of calling okcancel_events("id");
// TODO
// the pattern seems to be as follows:
//  - update the Template.lists.events object with a key returned by okcancel_events('#list-name-input')
//  - the value will be the result from make_okcancel_handler()
//
//  an efficient way to setup edit cancel/save events for a generic for control
//  
Template.lists.events[ okcancel_events('#list-name-input') ] =
  make_okcancel_handler({
    ok: function (value) { 
      // # list-name-input ok'd. update this list's name ?
      Lists.update(this._id, {$set: {name: value}});
      // clear the editing_listname session var
      Session.set('editing_listname', null);
    },
    cancel: function () {
      // clear the editin_listname session var
      Session.set('editing_listname', null);
    }
  });

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.lists.events[ okcancel_events('#new-list') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      // create a new list, update the router to the new list. emtpty the even target value (todo)
      var id = Lists.insert({name: text});
      Router.setList(id);
      evt.target.value = "";
    }
  });

Template.lists.selected = function () {
  // returns 'selected' if the list_id in the session var equals this._id, null otherwise
  return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.name_class = function () {
 // returns '' if name is defined, empty otherwise ?TODO ???)
  return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
  // return trye if we are editing this list, as determined by the editing_listname session var
  return Session.equals('editing_listname', this._id);
};

////////// Equations //////////
// Define functions to process equations Templates.

Template.equations.any_list_selected = function () {
  // return true if any List selected
  return !Session.equals('list_id', null);
};

// init Equations template events
Template.equations.events = {};

Template.equations.events[ okcancel_events('#new-equation') ] =
  make_okcancel_handler({
    // handle create new equeation. create it with a tag if one is defined. create the equation within the current list context
    ok: function (text, evt) {
      var tag = Session.get('tag_filter');
      Equations.insert({
        text: text,
        list_id: Session.get('list_id'),
        done: false,
        timestamp: (new Date()).getTime(),
        tags: tag ? [tag] : []
      });
      evt.target.value = ''; // TODO
    }
  });

Template.equations.equations = function () {
  // Determine which equations to display in main pane,
  // selected based on list_id and tag_filter.

  // as the commment says ^. sets up a selector and runs queries for equations in this list with these (optional) tags. Note this is client-side ..
	
  var list_id = Session.get('list_id');
  if (!list_id)
    return {};

  var sel = {list_id: list_id};
  var tag_filter = Session.get('tag_filter');
  if (tag_filter)
    sel.tags = tag_filter;

  return Equations.find(sel, {sort: {timestamp: 1}});
};

Template.equation_item.tag_objs = function () {
  // return all taks for the current object (wll, the on stored in _id)
  // returns object in the form {equation_id: equation_id; tag: tag}. Note the singular tag.
  var equation_id = this._id;
  return _.map(this.tags || [], function (tag) {
    return {equation_id: equation_id, tag: tag};
  });
};

Template.equation_item.done_class = function () {
  // if the current item is done, return done as the class name, otherwise null
  return this.done ? 'done' : '';
};

Template.equation_item.done_checkbox = function () {
  // if the current item is checked, return checked='checked' 
  return this.done ? 'checked="checked"' : '';
};

Template.equation_item.editing = function () {
  //return true if this id is noted in the session as being edited
  return Session.equals('editing_itemname', this._id);
};

Template.equation_item.adding_tag = function () {
  // return true if this id is noted in the session as being added
  return Session.equals('editing_addtag', this._id);
};

// define mouse events on the equation_item Template
Template.equation_item.events = {
  'click .check': function () {
   // update the document's done field when the checkbox (there is only one) is clicked
    Equations.update(this._id, {$set: {done: !this.done}});
  },

  'click .destroy': function () {
   // handle delete equation
    Equations.remove(this._id);
  },

  'click .addtag': function (evt) {
    // handle add tage. Note we set the editing_addtag context to this id (stores state)
    Session.set('editing_addtag', this._id);
    Meteor.flush(); // update DOM before focus
    focus_field_by_id("edittag-input"); // update the UI to this field for quick editing
  },

  'dblclick .display .equation-text': function (evt) {
    // TODO. handle editing the equation text?
    Session.set('editing_itemname', this._id);
    Meteor.flush(); // update DOM before focus
    focus_field_by_id("equation-input");
  },

  'click .remove': function (evt) { 
    // handle removing a tag
    var tag = this.tag;
    var id = this.equation_id;

    evt.target.parentNode.style.opacity = 0;
    // wait for CSS animation to finish
    Meteor.setTimeout(function () {
      Equations.update({_id: id}, {$pull: {tags: tag}});
    }, 300); // TODO understand this callback
  }

};

Template.equation_item.events[ okcancel_events('#equation-input') ] =
  // define events for saving or cancelling "equation text"
  make_okcancel_handler({
    ok: function (value) {
      Equations.update(this._id, {$set: {text: value}});
      Session.set('editing_itemname', null);
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  });

Template.equation_item.events[ okcancel_events('#edittag-input') ] =
  make_okcancel_handler({
   // create ok cancel events for adding a tag. Note the addToSet (handles duplicates?)
    ok: function (value) {
      Equations.update(this._id, {$addToSet: {tags: value}});
      Session.set('editing_addtag', null);
    },
    cancel: function () {
      Session.set('editing_addtag', null); // TODO, clearing this session edit flag redraws the UI to show no tag edit controls?
    }
  });

////////// Tag Filter ////////// TODO what is the tag filter?

// Pick out the unique tags from all equations in current list.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Equations.find({list_id: Session.get('list_id')}).forEach(function (equation) {
    _.each(equation.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (! tag_info)
        tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });
  // TODO where does _ var come from?
  tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
  // TODO why does unshift take an arg here?
  tag_infos.unshift({tag: null, count: total_count});

  return tag_infos;
};

Template.tag_filter.tag_text = function () {
  return this.tag || "All items";
};

Template.tag_filter.selected = function () {
  return Session.equals('tag_filter', this.tag) ? 'selected' : '';
};

Template.tag_filter.events = {
  'mousedown .tag': function () {
    if (Session.equals('tag_filter', this.tag))
      Session.set('tag_filter', null); // empties if already set
    else
      Session.set('tag_filter', this.tag); // sets if already empty
  }
};

////////// Tracking selected list in URL //////////

var EquationsRouter = Backbone.Router.extend({
  routes: {
    ":list_id": "main"
  },
  main: function (list_id) {
    Session.set("list_id", list_id);
    Session.set("tag_filter", null);
  },
  setList: function (list_id) {
    this.navigate(list_id, true);
  }
});

Router = new EquationsRouter; // where is Router used? TODO:understand  Meteor/backbone routers.

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

