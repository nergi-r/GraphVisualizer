var main = function(){

  var graph = new Graph(d3.select("svg"));
  var randomGraphGenerator = new RandomGraphGenerator();
  var $textAreaPlaceholder = $(".form-control");
  var isCtrlPressed = false;

  function draw(){
    graph.clear();
    // Separate input into lines to process each of them individually
    var graphEdges = $(".form-control").val().split("\n");
    for(var i=0;i<graphEdges.length;i++){
      if(graphEdges[i].length === 0){
        continue;
      }
      /*
        Get source, destination, weight
        If there are only 2 numbers, treat it as unweighted
        If there are more than 3 numbers, just use the first 3
      */
      var edge = graphEdges[i].split(" ");
      if(!$.isNumeric(edge[0]) || !$.isNumeric(edge[1])){
        continue;
      }

      var source = +edge[0];
      var destination = +edge[1];
      var weight = +edge[2];
      if(!$.isNumeric(edge[2])){
        weight = undefined;
      }

      graph.addNode(source);
      graph.addNode(destination);
      graph.addLink(source, destination, weight);
    }
    resetSimulation();
  }

  $(".draw").click(function(){
    draw();
  });

  $(".directed").click(function(){
    graph.setAsDirectedGraph();
    $(".undirected").removeClass("active");
    $(".directed").addClass("active");
  });

  $(".undirected").click(function(){
    graph.setAsUndirectedGraph();
    $(".undirected").addClass("active");
    $(".directed").removeClass("active");
  });

  $(".dynamic").click(function(){
    graph.resumeSimulation();
    $(".static").removeClass("active");
    $(".dynamic").addClass("active");
  });

  $(".static").click(function(){
    graph.pauseSimulation();
    $(".dynamic").removeClass("active");
    $(".static").addClass("active");
  });

  $(document).keydown(function(event){
      if(event.which=="17"){
          isCtrlPressed = true;
      }
  });

  $(document).keyup(function(){
      isCtrlPressed = false;
  });

  $("svg").click(function(){
    if(isCtrlPressed === true){
      graph.addNode();
      resetSimulation();
    }
    if(graph.getAddedNewLinkStatus() === true){
      resetSimulation();
      graph.setAddedNewLinkStatus(false);
    }
  });

  function resetSimulation(){
    // Reset UI, always set graph to directed and dynamic
    $(".undirected").removeClass("active");
    $(".directed").addClass("active");
    $(".static").removeClass("active");
    $(".dynamic").addClass("active");
    graph.setAsDirectedGraph()
    graph.resumeSimulation();
    graph.redraw();
  }

  /*
    Using jQuery here to create a placeholder-like for textarea
    because the intial placeholder does not support new lines.
  */
  var placeholder = "Please insert the graph edges...\n\n"
                  + "Example for weighted graph:\n1 2 5\n2 3 10\n\n"
                  + "Example for unweighted graph:\n1 2\n2 3\n\n"
                  + "Ctrl + click to insert a new node.\n"
                  + "Double click on a node to form a link with another node.";

  $textAreaPlaceholder.val(placeholder);
  $textAreaPlaceholder.focus(function(){
    if($(this).val() === placeholder){
      $(this).val("");
      $(this).css("color", "black");
    }
  });

  $textAreaPlaceholder.blur(function(){
    if($(this).val() === ""){
      $(this).val(placeholder);
      $(this).css("color", "gray");
    }
  });

  // Create smooth scroll animation for panel collapse toggling
  $(".panel-generate-random").click(function() {
    if($(this).hasClass("panel-closed")){
      $("html, body").animate({ scrollTop: $(document).height() }, 1000);
      $(this).removeClass("panel-closed");
    }
    else{
      $(this).addClass("panel-closed");
    }
  });

  $(".form-generate-random").submit(function(event){
    // Reset collapse panel UI
    $(".collapse").removeClass("in");
    $(".panel-generate-random").addClass("panel-closed");

    // Get all input data from the form
    var nodes = +($(".number-of-nodes").val());
    var edges = +($(".number-of-edges").val());
    var isWeighted = false;
    
    // Default values
    var minWeight;
    var maxWeight;
    if($(".min-weight").val().length > 0){
      isWeighted = true;
      minWeight = +($(".min-weight").val());
      maxWeight = minWeight;
    }
    if($(".max-weight").val().length > 0){
      isWeighted = true;
      maxWeight = +($(".max-weight").val());
      if(minWeight === undefined){
        minWeight = maxWeight;
      }
    }
    // Prevents minWeight to be larger than maxWeight
    minWeight = Math.min(minWeight, maxWeight);

    // Generate a random graph based on the parameters given
    var edgeList = randomGraphGenerator.generate(nodes, edges, isWeighted, minWeight, maxWeight);

    /* 
      Create a string consisting of all the edges to be pasted on the textarea.
      This creates a consistency to draw only based on the input in textarea
    */
    var generatedGraph = "";
    for(var i=0;i<edgeList.length;i++){
      var edge = edgeList[i];
      generatedGraph += edge.source + " " + edge.destination;
      if(edge.weight !== undefined){
        generatedGraph += " " + edge.weight;
      }
      generatedGraph += "\n";
    }
    $textAreaPlaceholder.val(generatedGraph);
    $textAreaPlaceholder.css("color", "black");

    draw();
  })
}

$(document).ready(main);