d3.queue()
.defer(d3.json, 'data/sankey.json')
.await((error, data) => {
  //
  // draw correlation graph
  //
  if (error) throw error;
  const correlationGraphProps = {
    selector: '#corr_graph_b',
    data,
    options: { 
      fixedNodeSize: undefined
    }
  }
  window.correlationGraph(correlationGraphProps);
});