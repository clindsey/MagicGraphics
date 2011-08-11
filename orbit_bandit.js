(function(){
  window.OrbitBanditScene = function(scene){
    var MARS_SPEED = 2.8,
        EARTH_SPEED = 2.5,
        MOON_SPEED = 6.2,
        ORB_SPEED = 2.4,
        SUN_RADIUS = 7.2,
        MARS_RADIUS = 2.56,
        EARTH_RADIUS = 3.6,
        MOON_RADIUS = 2.4,
        ORB_RADIUS = 1.895;
    var create_all_elements = function(){
      var background_rect = new DisplayObject.Rectangle(0,0,scene.width,scene.height,{'background-color':'#333333'}),
          sun = new Orb(240,160,0,SUN_RADIUS,{'background-color':'#FFFFAA'}),
          mars = new Well(75,160,MARS_SPEED,MARS_RADIUS,{'background-color':'#FFAAAA'}),
          earth = new Well(360,160,EARTH_SPEED,EARTH_RADIUS,{'background-color':'#AAAAFF'}),
          moon = new Well(390,160,MOON_SPEED,MOON_RADIUS,{'background-color':'#AAAAAA'}),
          orb = new Well(216,106,ORB_SPEED,ORB_RADIUS,{'background-color':'#FFFFFF'});
      scene.add(background_rect);
      for(var i = 0, l = sun.glows.length; i < l; i++){
        scene.add(sun.glows[i]);
      };
      scene.add(sun);
      scene.add(mars.shadow);
      scene.add(earth.shadow);
      scene.add(moon.shadow);
      scene.add(orb.shadow);
      scene.add(mars);
      scene.add(earth);
      scene.add(moon);
      scene.add(orb);
      moon.attract_to(earth,0.9);
      moon.set_position(moon.x,moon.y,0.25,1.75);
      earth.attract_to(sun,0.2);
      earth.set_position(earth.x,earth.y,-0.125,-0.59);
      mars.attract_to(sun,0.3);
      mars.set_position(mars.x,mars.y,-0.125,-0.75);
      orb.attract_to(mars,1);
      orb.attract_to(earth,0.6);
      orb.attract_to(moon,0.2);
      orb.attract_to(sun,0.4);
      scene.bind('update',function(){
        mars.update_position();
        scene.adjust_displayable(mars,{
            'x':mars.x,
            'y':mars.y
          });
        earth.update_position();
        scene.adjust_displayable(earth,{
            'x':earth.x,
            'y':earth.y
          });
        moon.update_position();
        scene.adjust_displayable(moon,{
            'x':moon.x,
            'y':moon.y
          });
        if(orb_held === false){
          orb.update_position();
          scene.adjust_displayable(orb,{
              'x':orb.x,
              'y':orb.y
            });
          for(var i = 0, l = orb.glows.length; i < l; i++){
            scene.adjust_displayable(orb.glows[i],{'x':orb.x,'y':orb.y});
          };
        };
        draw_all_shadows([earth,moon,mars,orb],sun);
      });
      var orb_held = false,
          orb_hold_pos = {'x':0,'y':0};
      var place_orb = function(e){
        if(orb_held) throw_orb(e);
        orb_held = true;
        orb_hold_pos = {'x':e.clientX,'y':e.clientY};
        orb.set_position(e.clientX,e.clientY,0,0);
        scene.adjust_displayable(orb,{'x':e.clientX,'y':e.clientY});
        for(var i = 0, l = orb.glows.length; i < l; i++){
          scene.adjust_displayable(orb.glows[i],{'x':e.clientX,'y':e.clientY});
        };
        draw_all_shadows([earth,moon,mars,orb],sun);
      };
      var throw_orb = function(e){
        if(orb_held === false) return;
        orb_held = false;
        orb.set_position(orb_hold_pos.x,orb_hold_pos.y,(orb_hold_pos.x - e.clientX) * 0.05,(orb_hold_pos.y - e.clientY) * 0.05);
      };
      scene.bind('mousedown',place_orb);
      scene.bind('mouseup',throw_orb);
    };
    var draw_all_shadows = function(shadow_casters,light_caster){
      for(var i = 0, l = shadow_casters.length; i < l; i++){
        cast_shadows(shadow_casters[i],light_caster);
      };
    };
    var cast_shadows = function(shadow_caster,light_caster){
      var project_point = function(point,light){
        var radius = 999,
            light_to_point,
            projected_point,
            extra_len,
            vector_to_add,
            ltp_len;
        light_to_point = {'x':point.x - light.x,'y':point.y - light.y};
        ltp_len = Math.sqrt((light_to_point.x * light_to_point.x) + (light_to_point.y * light_to_point.y));
        extra_len = Math.abs(radius - ltp_len);
        vector_to_add = {'x':(light_to_point.x / ltp_len) * extra_len,'y':(light_to_point.y / ltp_len) * extra_len};
        projected_point = {'x':point.x + vector_to_add.x,'y':point.y + vector_to_add.y};
        return projected_point;
      };
      var dot_product = function(va,vb){
        return (va.x * vb.x + va.y * vb.y);
      };
      var does_edge_cast_shadow = function(start,end,light){
        var start_to_end = {'x':end.x - start.x,'y':end.y - start.y};
        var normal = {'x':start_to_end.y,'y':0 - start_to_end.x};
        var light_to_start = {'x':start.x - light.x,'y':start.y - light.y};
        return (dot_product(normal,light_to_start) < 0) ? true : false;
      };
      var curr,
          prev,
          prev_index,
          projected_point,
          new_shadow_vertices = [];
      for(var i = 0,l = shadow_caster.vertices.length; i < l; i++){
        prev_index = i - 1 >= 0 ? i - 1 : l - 1;
        curr = {'x':shadow_caster.vertices[i].x + shadow_caster.x,'y':shadow_caster.vertices[i].y + shadow_caster.y};
        prev = {'x':shadow_caster.vertices[prev_index].x + shadow_caster.x,'y':shadow_caster.vertices[prev_index].y + shadow_caster.y};
        if(!does_edge_cast_shadow(curr,prev,light_caster)) continue;
        new_shadow_vertices[new_shadow_vertices.length] = {'x':curr.x,'y':curr.y};
        projected_point = project_point(curr,light_caster);
        new_shadow_vertices[new_shadow_vertices.length] = {'x':projected_point.x,'y':projected_point.y};
        projected_point = project_point(prev,light_caster);
        new_shadow_vertices[new_shadow_vertices.length] = {'x':projected_point.x,'y':projected_point.y};
        new_shadow_vertices[new_shadow_vertices.length] = {'x':prev.x,'y':prev.y};
      };
      scene.adjust_displayable(shadow_caster.shadow,{'vertices':new_shadow_vertices});
    };
    create_all_elements();
  };
  var Orb = function(x,y,speed,radius,style){
    var self = new DisplayObject.Polygon(x,y,radius,16,0,style),
        grav_fields = [],
        current_speed = {'x':0,'y':0};
    self.glows = [
        new DisplayObject.Polygon(self.x,self.y,self.radius * 16,40,0,{'background-color':'#373732'}),
        new DisplayObject.Polygon(self.x,self.y,self.radius * 8,50,0,{'background-color':'#3A3A31'}),
        new DisplayObject.Polygon(self.x,self.y,self.radius * 4,40,0,{'background-color':'#3D3D30'}),
        new DisplayObject.Polygon(self.x,self.y,self.radius * 2,26,0,{'background-color':'#40402F'})
      ];
    self.attract_to = function(item,attraction_factor){
      grav_fields[grav_fields.length] = {'target':item,'factor':attraction_factor};
    };
    self.set_position = function(x,y,speed_x,speed_y){
      self.x = x;
      self.y = y;
      current_speed = {'x':speed_x,'y':speed_y};
    };
    self.update_position = function(){
      var pos_update = get_position_update(),
          next_x = pos_update.x,
          next_y = pos_update.y;
      self.x += next_x;
      self.y += next_y;
      current_speed.x = next_x;
      current_speed.y = next_y;
    };
    var get_position_update = function(){
      return create_position_update(get_orb_grav_fields());
    };
    var get_orb_grav_fields = function(){
      var orb_grav_fields = [{'x':current_speed.x,'y':current_speed.y}];
      for(var i = 0, l = grav_fields.length; i < l; i++){
        var distance = Math.sqrt(Math.pow(grav_fields[i]['target'].x - self.x, 2) + Math.pow(grav_fields[i]['target'].y - self.y, 2)),
            field_strength = ((1 / distance) * speed) * grav_fields[i]['factor'];
        var tmp_x = ((grav_fields[i]['target'].x - self.x) / distance) * field_strength,
            tmp_y = ((grav_fields[i]['target'].y - self.y) / distance) * field_strength;
        orb_grav_fields[orb_grav_fields.length] = {'x':tmp_x,'y':tmp_y};
      };
      return orb_grav_fields;
    };
    var create_position_update = function(orb_grav_fields){
      var new_pos = {'x':0,'y':0},
          tmp_total;
      for(var j = 0, k = orb_grav_fields.length; j < k; j++){
        new_pos.x += orb_grav_fields[j].x;
        new_pos.y += orb_grav_fields[j].y;
      };
      return new_pos;
    };
    return self;
  };
  var Well = function(x,y,speed,radius,style){
    var self = new Orb(x,y,speed,radius,style);
    self.shadow = new Shadow(self,{'background-color':'#222222'});
    return self;
  };
  var Shadow = function(parent,style){
    var self = new DisplayObject(0,0,style);
    return self;
  };
})();