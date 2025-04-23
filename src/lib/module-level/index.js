// dependency-cruiser programmatic API
const { cruise } = require('dependency-cruiser');
const { output } = cruise(['src'], { outputType: 'json' });
const moduleEdges = JSON.parse(output).modules; // array with 'source', 'dependencies'
