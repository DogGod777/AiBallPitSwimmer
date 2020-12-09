/* Global vars */
var players = [];
var iteration = 0;
var highestScore = 0;

/** Setup the canvas */
function setup(){
  // Do some initial mutation
  if(!USE_TRAINED_POP){
    for(var i = 0; i < 1; i++) neat.mutate();
  }

  startEvaluation();
}

function draw(){
  // Check if evaluation is done
  if(iteration == ITERATIONS){
    endEvaluation();
    iteration = 0;
  }

  // Update and visualise agents
  for(var i = agents.length - 1; i >= 0; i--){
    var agent = agent[i];

    // Some players are eaten during the iteration
    agent.update();
  }

  iteration++;
}

/** Get a relative color between red and green */
var activationColor = function(value, max){
  var power = 1 - Math.min(value/max, 1);
  var color = [255, 255, 0]

  if(power < 0.5){
    color[0] = 2 * power * 255;
  } else {
    color[1] = (1.0 - 2 * (power - 0.5)) * 255;
  }

  return color;
}