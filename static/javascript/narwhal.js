// animate narwhal
(function() {
    window.narwhal = {
      initialize: function() {
        return $('.narwhal svg').each(function() {
          var delay, i, len, length, path, paths, previousStrokeLength, results, speed;
          paths = $('path, circle, rect', this);
          delay = 0;
          results = [];
          for (i = 0, len = paths.length; i < len; i++) {
            path = paths[i];
            length = path.getTotalLength();
            previousStrokeLength = speed || 0;
            speed = length < 100 ? 20 : Math.floor(length);
            delay += previousStrokeLength + 100;
            results.push($(path).css('transition', 'none').attr('data-length', length).attr('data-speed', speed).attr('data-delay', delay).attr('stroke-dashoffset', length).attr('stroke-dasharray', length + ',' + length));
          }
          return results;
        });
      },
      animate: function() {
        return $('.narwhal svg').each(function() {
          var delay, i, len, length, path, paths, results, speed;
          paths = $('path, circle, rect', this);
          results = [];
          for (i = 0, len = paths.length; i < len; i++) {
            path = paths[i];
            length = $(path).attr('data-length');
            speed = $(path).attr('data-speed');
            delay = $(path).attr('data-delay');
            results.push($(path).css('transition', 'stroke-dashoffset ' + speed + 'ms ' + delay + 'ms linear').attr('stroke-dashoffset', '0'));
          }
          return results;
        });
      }
    };
  
    $(document).ready(function() {
      window.narwhal.initialize();
      return $('button').on('click', function() {
        window.narwhal.initialize();
        return setTimeout(function() {
          return window.narwhal.animate();
        }, 500);
      });
    });
  
    $(window).load(function() {
      return window.narwhal.animate();
    });
  
  }).call(this);
  // motto

  $.fn.strech_text = function(){
    var elmt          = $(this),
        cont_width    = elmt.width(),
        txt           = elmt.html(),
        one_line      = $('<span class="stretch_it">' + txt + '</span>'),
        nb_char       = elmt.text().length,
        spacing       = cont_width/nb_char,
        txt_width;
    
    elmt.html(one_line);
    txt_width = one_line.width();
    
    if (txt_width < cont_width){
        var  char_width     = txt_width/nb_char,
             ltr_spacing    = spacing - char_width + (spacing - char_width)/nb_char ; 
  
        one_line.css({'letter-spacing': ltr_spacing});
    } else {
        one_line.contents().unwrap();
        elmt.addClass('justify');
    }
};


$(document).ready(function () {
    $('.stretch').each(function(){
        $(this).strech_text();
    });
});