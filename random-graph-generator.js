/*
  Random Graph Generator Object
  Creates a random connected graph based on:
  - Number of nodes
  - Number of edges
  - Weights
*/

function RandomGraphGenerator() {

  this.generate = function(numberOfNodes,
                    numberOfEdges,
                    isWeighted=false,
                    minWeight=1,
                    maxWeight=100){
    
    /*
      Limit the number of edges so that for each 2 nodes,
      there won't be any of them that have multiple links.
      Based on the property of graph:
      Max number of edges = number of nodes * (number of nodes - 1) / 2
    */
    numberOfEdges = Math.min(numberOfEdges, numberOfNodes * (numberOfNodes-1) / 2);

    var addedNodes = [1];
    var used = [];
    var edgeList = [];
    var weightRange = maxWeight - minWeight + 1;

    /*
      Create an array of object that works as an adjacency matrix
      marking edges that have been used
    */
    for(var i=0;i<=numberOfNodes;i++){
      used.push(new Object());
    }

    /*
      Generating method:
      1. Connect all nodes (Create a spanning tree)
      2. Add random edges while checking for multiple edges
    */
    for(var i=2;i<=numberOfEdges+1;i++){
      var node = i;
      var rand = Math.ceil(Math.random() * (numberOfNodes + 7) * 1000) % (addedNodes.length);
      var randomNode = addedNodes[rand];

      if(i > numberOfNodes){
        rand = Math.ceil(Math.random() * (numberOfNodes + 7) * 1000) % (addedNodes.length);
        node = addedNodes[rand];
      }
      // New edge object
      var edge = {
        source: node,
        destination: randomNode,
      };

      // Keep generating until we find an unused edge
      while(isEdgeUsed(edge, used) || node === randomNode){
        if(i>numberOfNodes){
          rand = Math.ceil(Math.random() * (numberOfNodes + 7) * 1000) % (addedNodes.length);
          node = addedNodes[rand];
          edge.source = node;
        }
        rand = Math.ceil(Math.random() * (numberOfNodes + 7) * 1000) % (addedNodes.length);
        randomNode = addedNodes[rand];
        edge.destination = randomNode;
      }

      // Mark edge as used
      edgeList.push(edge);
      used[edge.source][edge.destination] = true;
      addedNodes.push(node);
    }

    // Generate random weights if needed
    for(var i=0;i<edgeList.length;i++){
      if(isWeighted){ 
        edgeList[i].weight = Math.ceil(Math.random() * weightRange) % (weightRange) + minWeight;
      }
      else{
        edgeList[i].weight = undefined;
      }
    }
    
    return edgeList;
  }

  function isEdgeUsed(edge, used){
    if(used[edge.source].hasOwnProperty(edge.destination) === true
      || used[edge.destination].hasOwnProperty(edge.source) === true){
      return true;
    }
    return false;
  }
}