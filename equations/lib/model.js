function EquationInput(elements) {
    this.elements = [];
    if (typeof elements === "object") {
        for (elem in elements) {
            this.elements.push(elements[elem]);
        }
    } else {
        this.elements.push(elements);
    }
}

function EquationOperator(operator) {
    switch (operator) {
        case '+':
            return function (a) {
                return a + a;
            };
        case '*':
            return function (a) {
                return a * a;
            };
        default:
            return function (a) {
                return a + a;
            };
    }
}

function EquationOutput() {
    // implemented as a queue, only for fun
    this.elements = [];
    this.length = function () {
        return this.elements.length;
    };
    this.enqueue = function (datum) {
        console.log("adding data to reults " +  datum);
        if (typeof datum === "object") {
            for (elem in datum) {
                this.elements.push(datum[elem]); 
            }
        } else {
            this.elements.push(datum);
        }

    };
    this.dequeue = function (datum) {
        return this.elements.shift();
    };
}

function Equation() {
    this.output = new EquationOutput();
    this.watch = {};

    this.init = function (inData, operator, options) {
        this.inData = new EquationInput(inData);
        this.operand = new EquationOperator(operator);
        this.options = options;
    };

    this.compute = function () {
         var inData = this.inData;
         console.log("computing on " + inData.elements);
         var operand = this.operand;
         var opts = this.options; 
         var output = this.output;
         for (var i = 0; i <  inData.elements.length; i++ ) {
             // TODO switch on options?
             var op = this.operand;
             var datum = inData.elements[i];
             var res = op(datum); 
             this.output.enqueue(this.operand(inData.elements[i]));
         }

    };

    this.results = function () {
         // TODO For now, just return all elements
         return this.output.elements;
    };

    this.resultsAsKV = function () {
        var res = {};
        for ( var i = 0; i < this.output.elements.length; i++ ) {
            res[this.inData.elements[i]] = this.output.elements[i];
        }
        return res;
    };

}

/*
File exists only on server, contains code to setup and expose Meteor collection data. 
*/

// Create a new global Lists collection object  -- format {name: String}
Lists = new Meteor.Collection("lists");

// TODO legacy equation schema
// Equations -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number}
//
// Create a toplevel Equation collection. Note that each Equation has a list_id 
Equations = new Meteor.Collection("equations");

if (Meteor.isServer) { 
	
	Meteor.startup(function () {

      /*/ empty an existing Equations.
      var existingEquations = Equations.find().fetch();
      for ( var i = 0; i < existingEquations; i++ ) {
	        existingEquations[i].
	  } */
	 Equations.remove({});
	 Lists.remove({});
	 var existingEquations = Equations.find({}).fetch();
      for ( var i = 0; i < existingEquations; i++ ) {
	        console.log("Found " + existingEquations[i]);
	  }
	    var data = [
	      {name: "Arraysdfsdfsfd Principles",
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
	);
      // Publish all items for requested list_id. -> returns data for all equations 'linked' via list_id to a list
      Meteor.publish('equations', function (list_id) {
              return Equations.find({list_id: list_id});
      });
	// Now we have the Lists collection, we can create an endpoint for all lists. This one just returns all lists.
	// Publish complete set of lists to all clients, when a client subscribes to a 'list'
	Meteor.publish('lists', function () {
	  return Lists.find();
	});

}

var eq = new Equation();
eq.init( [ 1, 2, 3 ], '+');
eq.compute();
console.log("output is " + eq.resultsAsKV());
// printkv(eq.resultsAsKV());
