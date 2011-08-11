/***
## MagicGraphics(bind_elem_id,fps,callback)

bind_elem_id - string, element to add canvas to

fps - number, frames per second to call update at

callback - function, called once canvas is ready to go

abstracts out the differences between IE's VML and everyone else's Canvas and provides an easy way to make interactive prototypes
***/
var magic_graphics = function(bind_elem_id,fps,scene,callback,is_experimental){
  return new MagicGraphics(bind_elem_id,fps,scene,callback,is_experimental);
};
var MagicGraphics = function(bind_elem_id,fps,scene,callback,is_experimental){
  var bind_elem = document.getElementById(bind_elem_id),
      width = bind_elem.offsetWidth,
      height = bind_elem.offsetHeight,
      is_vml = !document.createElement('canvas').getContext,
      iframe_src = (is_experimental ? 'engines/png_engine.html' : (is_vml ? 'engines/vml_engine.html' : 'engines/canvas_engine.html')), // it wouldn't have killed me to make this more readable, but i didn't wanna risk it
      container_div = document.createElement('div'),
      frame_name = bind_elem_id + '_magic_graphics',
      engine,
      interval,
      last_update = (new Date()).getTime(),
      remainder,
      fps = ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPad/i))) ? fps * 2 : fps,
      base_src = '',
      self = this;
  var scripts = document.getElementsByTagName('script');
  for(var i = 0, il = scripts.length; i < il; i++){
    var s = scripts[i].getAttribute('src');
    if(s){
      s = s.split("?")[0];
      if(s.indexOf('MagicGraphics') !== -1){
        base_src = s.split('/').slice(0,-1).join('/') + '/';
        break;
      };
    };
  };
  container_div.innerHTML = '<iframe name="' + frame_name + '" width="' + width + 'px" height="' + height + 'px" frameborder="0" style="overflow:hidden;" src="' + base_src + iframe_src + '?rand=' + (~~(Math.random() * 0xFFFFFF)) + '"></iframe>';
  bind_elem.appendChild(container_div);
  window.frames[frame_name].on_load = function(bind_element){
    self.load(scene);
    if(callback) callback(self);
  };
  window.frames[frame_name].mouse_event = function(e){
    engine.trigger(e.type,e);
    e.returnValue = false;
  };
/***
#### load(new_scene)

new scene - object,new scene

loads new scene, destroying old
***/
  self.load = function(new_scene){
    if(engine) engine.destroy();
    self.__scene__ = new_scene;
    engine = window.frames[frame_name].magic_graphics_engine(fps,new EventDispatcher());
    new self.__scene__(engine);
  };
/***
#### start

begins calling update
***/
  self.start = function(){
    interval = setInterval(function(){
      try{
        var now_time = new Date().getTime(),
            t_delta = now_time - (last_update + remainder);
        last_update = now_time;
        do{
          engine.update();
          t_delta -= fps;
        }while(t_delta > 1);
        remainder = t_delta;
      }catch(e){
        clearInterval(interval);
        throw e;
      };
    },1000 / (fps));
  };
/***
#### stop

stops calling update
***/
  self.stop = function(){
    clearInterval(interval);
  };
/***
#### update

draws the scene
***/
  self.update = function(){
    engine.update();
  };
};
var EventDispatcher = function(){
  var lookup = {},
      subscribers = {},
      self = this;
  self.bind = function(type,callback){
    if(!subscribers[type]) subscribers[type] = [];
    var l = subscribers[type].length;
    subscribers[type][l] = callback;
    lookup[callback] = {'index':l,'type':type};
  };
  self.unbind = function(callback){
    var binding = lookup[callback];
    subscribers[binding.type][binding.index] = undefined;
    delete lookup[callback];
  };
  self.trigger = function(type,data){
    if(subscribers[type] === undefined) return;
    for(var i = 0, l = subscribers[type].length; i < l; i++){
      var subscriber = subscribers[type][i];
      if(subscriber.call) subscriber.call(self,data);
    };
  };
  self.clear_bindings = function(){
    for(var callback in lookup){
      var binding = lookup[callback];
      subscribers[binding.type][binding.index] = undefined;
      delete lookup[callback];
    };
  };
  return self;
};
/***
## DisplayObject(x,y,style)

x - number, x position of display object

y - number, y position of display object

style - object, styling settings

basic display object display object
***/
var DisplayObject = function(x,y,style){
  var self = new EventDispatcher();
  self.x = x;
  self.y = y;
/***
#### vertices

array, list vertices that make up the displayable object
***/
  self.vertices = [];
  self.style = {
      'background-color':(style['background-color'] || 'rgba(0,0,0,0)'),
      'border-width':(style['border-width'] || 0),
      'border-color':(style['border-color'] || 'rgba(0,0,0,0)')
    };
/***
#### $$id

string, random id to help track the displayable in the draw queue
***/
  self.$$id = (function(){
      var chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G'], uuid = [],
        r, i = 36;
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';
      while (i--) {
        if (!uuid[i]) {
          r = Math.random()*16|0;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
      return uuid.join('');
    })();
/***
#### add_vertex(x,y)

x - number

y - number

adds a point the vertices list
***/
  self.add_vertex = function(x,y){
    self.vertices[self.vertices.length] = {'x':x,'y':y};
  };
  return self;
};
/***
## DisplayObject.Rectangle(x,y,width,height,style)

x - number, x position of rectangle

y - number, y position of rectangle

width - number, width of rectangle

height - number, height of rectangle

style - object, styling settings

simple rectangle display object
***/
DisplayObject.Rectangle = function(x,y,width,height,style){
  var self = new DisplayObject(x,y,style);
  self.width = width;
  self.height = height;
  self.add_vertex(0,0);
  self.add_vertex(width,0);
  self.add_vertex(width,height);
  self.add_vertex(0,height);
  return self;
};
/***
## DisplayObject.Polygon(x,y,radius,edge_count,rotation,style)

x - number, x position of polygon

y - number, y position of polygon

radius - number, radius of polygon

edge_count - number, edges the polygon will have

rotation - number, rotation of polygon

style - object, styling settings

simple polygon display object
***/
DisplayObject.Polygon = function(x,y,radius,edge_count,rotation,style){
  var convert_to_radians = function(degrees){
    return Math.PI / 180 * degrees;
  };
  var self = new DisplayObject(x,y,style);
  self.radius = radius;
  self.edge_count = edge_count;
  self.rotation = rotation;
  var point_index,
      point_increment = 360 / self.edge_count,
      plot_x,
      plot_y;
  for(point_index = 0; point_index <= 360; point_index += point_increment){
    plot_x = Math.sin(convert_to_radians(point_index + self.rotation + 180)) * (0 - self.radius);
    plot_y = Math.cos(convert_to_radians(point_index + self.rotation + 180)) * self.radius;
    self.add_vertex(plot_x,plot_y);
  };
  return self;
};
