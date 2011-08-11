/***
## MVUtil(string)

simple wrapper for document.getElementById(string)

## MVUtil(object)

returns a helper object that makes operations on the object easier

one example is event listener, bind and unbind
***/
var MGUtil = function(obj){
  // if obj is a string, this acts as a simple document.getElementById wrapper
  if(typeof obj === 'string') return document.getElementById(obj);
  // else, we wrap the object in a helper
  return new function(){
    // event handlers thanks to - http://ejohn.org/projects/flexible-javascript-events/
/***
#### bind(type,fn)

type - string, event type to listen for

fn - function, callback function that will handle event

simple cross browser event bindings
***/
    this.bind = function(type,fn){
      if(obj.attachEvent){
        obj['e' + type + fn] = fn;
        obj[type + fn] = function() { obj['e' + type + fn](window.event); };
        obj.attachEvent('on' + type,obj[type + fn]);
      }else{
       obj.addEventListener(type,fn,false);
      };
    };
/***
#### unbind(type,fn)

type - string, event type

fn - function, callback function that handles the event

removes bound event from object
***/
    this.unbind = function(type,fn){
      if(obj.detachEvent){
        obj.detachEvent('on' + type,obj[type + fn]);
        obj[type + fn] = null;
      }else{
        obj.removeEventListener(type,fn,false);
      };
    };
  };
};