/*
  Graph Object
  A Force-Directed Graph Layout created using d3js.v4 library
  - Construct graph based on input data
  - Dynamically insert a new node anywhere
  - Dynamically insert a new link between any node
  - Support weighted & unweighted graph
  - Support directed & undirected graph
  - Support dynamic & static graph layout
*/

function Graph(svg){

  // Sample data for visualization demo
  var graphData = {
    nodes: [
      {id: 1}, {id: 2}, {id: 3}, {id: 4},
      {id: 5}, {id: 6}, {id: 7}, {id: 8},
      {id: 9}, {id: 10}
    ],
    links: [
      {source: 7, target: 0, weight: 53},
      {source: 6, target: 1, weight: 17},
      {source: 7, target: 2, weight: 77},
      {source: 3, target: 7, weight: 43},
      {source: 7, target: 5, weight: 62},
      {source: 4, target: 7, weight: 105},
      {source: 7, target: 8, weight: 90},
      {source: 7, target: 9, weight: 5},
      {source: 6, target: 4, weight: 21}
    ]
  };

  /*
    Used as a hash table to mark used nodes
    in order to maintain a list of nodes with
    distinct nodes id
  */
  var nodeList = {};
  for(var i=0;i<graphData.nodes.length;i++){
    nodeList[graphData.nodes[i].id] = i+1;
  }

  var graphMovement = true;
  var isAddingNewLink = false;
  var addingLinkFromNode = undefined;
  var addedNewLink = false;

  var width = +svg.attr("width"),
      height = +svg.attr("height"),
      radius = 20;

  // Initialize force-layout simulation
  var simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links))
      .force("collide",d3.forceCollide( radius * 2.5 ).iterations(20))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(0))
      .force("y", d3.forceY(0))
      .on("tick", ticked);

  /*
    Graph is drawn from bottom to top this way:
    1. Link
    2. Node covers the link
    3. Node Label on top of Node
    4. NodeOverlay on top of NodeLabel

    This is used so that we can click/drag the node
    even when we click on the node label.
    Without NodeOverlay, we will only be able to
    click on the white area of the nodes.
  */
  var link = svg.append("g").selectAll(".link"),
      newLink = svg.append("g").append("line"),
      node = svg.append("g").selectAll(".node"),
      nodeLabel = svg.append("g").selectAll(".nodeLabel"),
      nodeOverlay = svg.append("g").selectAll(".nodeOverlay"),
      linkPath = svg.append("g").selectAll(".linkPath"),
      linkLabel = svg.append("g").selectAll(".linkLabel");

  // Cancel adding new link by clicking anywhere on svg canvas
  svg.on("click", function(){
    isAddingNewLink = false;
    svg.on("mousemove", null);
    newLink.attr("stroke-width", 0);
  });

  // Definition for an arrow (For directed edges)
  svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30) 
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

  restart();

  this.clear = function(){
    nodeList = new Object();
    graphData.nodes.length = 0;
    graphData.links.length = 0;
  }

  this.addNode = function(node){
    // Triggered when creating a new single node from ctrl+click
    if(node === undefined){
      node = findUnusedNodeId();
    }

    if(nodeList.hasOwnProperty(node) === false){
      graphData.nodes.push({id: node});
    }
    nodeList[node] = {"id": node};
  }

  this.addLink = function(source, destination, weight){
    graphData.links.push({
      "source": findNodeObject(source),
      "target": findNodeObject(destination),
      "weight": (isNaN(weight)) ? undefined : weight
    });
  }

  this.setAsDirectedGraph = function(){
    link.attr("marker-end", "url(#arrow)");
  }

  this.setAsUndirectedGraph = function(){
    link.attr("marker-end", "");
  }

  this.redraw = function(){
    restart();
  }

  this.resumeSimulation = function(){
    if(graphMovement === false) simulation.alpha(0.2).restart();
    graphMovement = true;
  }

  this.pauseSimulation = function(){
    graphMovement = false;
    simulation.stop();
  }

  this.getAddedNewLinkStatus = function(){
    return addedNewLink;
  }
  
  this.setAddedNewLinkStatus = function(status){
    addedNewLink = status;
  }

  // Find the Node Object of the given name
  function findNodeObject(name){
    for(var i=0;i<graphData.nodes.length;i++){
      if(graphData.nodes[i].id === name) return graphData.nodes[i];
    }
  }

  // Find the next node that has not been used (when creating a new node)
  function findUnusedNodeId(){
    var len = Object.keys(nodeList).length;
    for(var i=1;i<=len;i++){
      if(nodeList.hasOwnProperty(i) === false) return i;
    }
    return len + 1;
  }

  // Main function to start drawing
  function restart(){

    isAddingNewLink = false;
    addingLinkFromNode = undefined;
    addedNewLink = false;
    svg.on("mousemove", null);
    newLink.attr("stroke-width", 0);

    node = node.data(graphData.nodes, function(d) { return d.id;  });
    node.exit().remove();
    node = node.enter()
            .append("circle")
            .attr("class", "node")
            .attr("fill", "#fff")
            .attr("r", radius)
            .attr("stroke-width", 1.5)
            .merge(node)
            .call(d3.drag()
              .on("start", dragStarted)
              .on("drag", dragged)
              .on("end", dragEnded));

    nodeOverlay = nodeOverlay.data(graphData.nodes, function(d) { return d.id;  });
    nodeOverlay.exit().remove();
    nodeOverlay = nodeOverlay.enter()
            .append("circle")
            .attr("class", "nodeOverlay")
            .attr("fill", "#fff")
            .attr("fill-opacity", 0)
            .attr("r", radius + 7)
            .attr("stroke-width", 0)
            .merge(nodeOverlay)
            .on("dblclick", doubleClicked)
            .on("click", clicked)
            .call(d3.drag()
              .on("start", dragStarted)
              .on("drag", dragged)
              .on("end", dragEnded));

    link = link.data(graphData.links, function(d) { return d.source + d.target; });
    link.exit().remove();
    link = link.enter()
            .append("line")
            .attr("marker-end", "url(#arrow)")
            .attr("stroke-width", 2)
            .merge(link);

    nodeLabel = nodeLabel.data(graphData.nodes, function(d) { return d.id;  });
    nodeLabel.exit().remove();
    nodeLabel = nodeLabel.enter()
                .append("text")
                .attr("class", "nodeLabel")
                .attr("font-size", 15)
                .text(function(d) { return d.id;  })
                .merge(nodeLabel);

    // Used path to align the lineLabel with the line
    linkPath = linkPath.data(graphData.links, function(d) { return d.source + d.target; });
    linkPath.exit().remove();
    linkPath = linkPath.enter()
                .append("path")
                .attr("id", function(d, i) { return  "linkPath" + i})
                .attr("stroke-width", 0)
                .merge(linkPath);

    linkLabel = linkLabel.data(graphData.links, function(d) { return d.source + d.target; });
    linkLabel.exit().remove();
    linkLabel = linkLabel.enter()
                .append("text")
                .attr("dx", 35)
                .attr("dy", 15)
                .merge(linkLabel);

    d3.selectAll(".linkPathLabel").remove();
    linkLabel.append("textPath")
              .attr("xlink:href", function(d, i) { return "#linkPath" + i})
              .attr("class", "linkPathLabel")
              .text(function(d) { return d.weight;  });

    // Run the simulation
    simulation.nodes(graphData.nodes);
    simulation.force("link").links(graphData.links);
    simulation.alpha(1).restart();
  }

  function mouseTicked(pointer){
    if(isAddingNewLink === true){
      newLink.attr("x1", elementBoundary(addingLinkFromNode.x, width))
             .attr("y1", elementBoundary(addingLinkFromNode.y, height))
             .attr("x2", elementBoundary(pointer[0], width))
             .attr("y2", elementBoundary(pointer[1], height));
    }
  }

  function ticked(){
    link.attr("x1", function(d) { return elementBoundary(d.source.x, width); })
        .attr("y1", function(d) { return elementBoundary(d.source.y, height); })
        .attr("x2", function(d) { return elementBoundary(d.target.x, width); })
        .attr("y2", function(d) { return elementBoundary(d.target.y, height); });

    node.attr("cx", function(d) { return elementBoundary(d.x, width); })
        .attr("cy", function(d) { return elementBoundary(d.y, height); });

    nodeOverlay.attr("cx", function(d) { return elementBoundary(d.x, width); })
               .attr("cy", function(d) { return elementBoundary(d.y, height); });

    nodeLabel.attr("x", function(d) { return elementBoundary(d.x, width) - 4 - (d.id > 9 ? 4 : 0);  })
             .attr("y", function(d) { return elementBoundary(d.y, height) + 5; });

    linkPath.attr('d', function(d)  {
      return "M " + elementBoundary(d.source.x, width) + " " 
                  + elementBoundary(d.source.y, height) + " L " 
                  + elementBoundary(d.target.x, width) + " " 
                  + elementBoundary(d.target.y, height);
    }); 

    // Following link rotation
    linkLabel.attr("transform", function(d,i) {
        if(d.target.x < d.source.x){
          bbox = this.getBBox();
          rx = bbox.x + bbox.width/2;
          ry = bbox.y + bbox.height/2;
          return "rotate(180 " + rx + " " + ry + ")";
        }
        else{
          return "rotate(0)";
        }
    });
  }

  function dragStarted(d) {
    if (!d3.event.active && graphMovement) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    d3.select(this).style("cursor", "-webkit-grabbing");
    d3.select(this).style("cursor", "grabbing");
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    if(graphMovement === false){
      d.x = elementBoundary(d3.event.x, width);
      d.y = elementBoundary(d3.event.y, height);
      ticked(); // Skip frame by 1 to update the node's position
    }
  }

  function dragEnded(d) {
    if (!d3.event.active && graphMovement) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    d3.select(this).style("cursor", "-webkit-grab");
    d3.select(this).style("cursor", "grab");
    if(graphMovement === false){
      ticked(); // Skip frame by 1 to update the node's position
    }
  }

  function doubleClicked(d){
    isAddingNewLink = true;
    addingLinkFromNode = d;

    // Set Event Listener for the new link to follow mouse movement
    svg.on("mousemove", function(){
      var pointer = d3.mouse(this);
      mouseTicked(pointer);
    });
    
    newLink.attr("x1", elementBoundary(addingLinkFromNode.x, width))
           .attr("y1", elementBoundary(addingLinkFromNode.y, height))
           .attr("x2", elementBoundary(addingLinkFromNode.x, width))
           .attr("y2", elementBoundary(addingLinkFromNode.y, height))
           .attr("stroke-width", 2);
  }

  function clicked(d) {
    if(isAddingNewLink === true){
      isAddingNewLink = false;

      // Not gonna add a link to itself
      if(addingLinkFromNode !== d){
        graphData.links.push({
          "source": addingLinkFromNode,
          "target": d,
          "weight": undefined
        });
        addedNewLink = true;
      }
    }
  }

  function elementBoundary(d, bound)  {
    return Math.max(radius*2, Math.min(bound - radius, d));
  }
}