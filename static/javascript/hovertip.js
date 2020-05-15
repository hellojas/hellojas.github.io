
// TOP POPOVER
/*
  We can use [body] or the element class/id that wraps the elements with tooltip/popover.
  Include the data-[] attribute in each element that needs it.
*/
$(window).load(function() {
  //can also be wrapped with:
  //1. $(function () {...});
  //2. $(window).load(function () {...});
  //3. Or your own custom named function block.
  //It's better to wrap it.

  //Tooltip, activated by hover event
  $("body").tooltip({   
    selector: "[data-toggle='tooltip']",
    container: "body"
  })
    //Popover, activated by clicking
    .popover({
    selector: "[data-toggle='popover']",
    container: "body",
    html: true
  });
  //They can be chained like the example above (when using the same selector).
  
});