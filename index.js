window.addEventListener('load', function() {
    /** Global vars */
    //Canvas variables
    const canvas = document.getElementById("world")

    //Chunk variables
    const innerChunkAmt = 3;
    const outerChunkAmt = 2;
    const chunkSize = width/innerChunkAmt;
    var offsetCounter = 0;

    //Ball variables
    const ballWidth = 25;
    const ballRows = 5;
    const ballCols = ((innerChunkAmt + 2*outerChunkAmt)*chunkSize)/ballWidth * 1/2 - 5;

    //Environment variables
    const balls = true;
    const diving = false;
    var best;

    //Camera Variables:
    var opacity = 0.1; //changed opacity if not fittest
    var xBuffer = 50; //If the difference is greater than this much extra, only then switch. So that the camera doesn't flutter that muchif multiple are close to the highest
    var following = true; //Toggle follow fittest to fit everyone render camera
    var renderBuffer = 100; // if fits everyone then this much is border from the bottom left and top right bounding box.

    //Aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composites = Matter.Composites,
        Composite = Matter.Composite,
        Constraint = Matter.Constraint,
        Constraints = Matter.constraints,
        Events = Matter.Events,
        Bounds = Matter.Bounds;
        Detector = Matter.Detector;

    //NEAT Aliases

    var Neat    = neataptic.Neat;
        Methods = neataptic.methods;
        Config  = neataptic.config;
        Architect = neataptic.architect;
    
    Config.warnings = false;

    //NEAT Exoeriment Variables
    //GA settings
    //var PLAYER_AMOUNT    = Math.round(2.3e-4 * WIDTH * HEIGHT);
    var PLAYER_AMOUNT    = 10;
    var ITERATIONS       = 10e2; // should be ~250 for real use
    var MUTATION_RATE    = 0.3;
    var ELITISM          = Math.round(0.1 * PLAYER_AMOUNT);

    // Trained population
    var USE_TRAINED_POP = false;

    var neat = new Neat(
        4, 6,
        null,
        {
        mutation: [
            Methods.mutation.ADD_NODE,
            Methods.mutation.SUB_NODE,
            Methods.mutation.ADD_CONN,
            Methods.mutation.SUB_CONN,
            Methods.mutation.MOD_WEIGHT,
            Methods.mutation.MOD_BIAS,
            Methods.mutation.MOD_ACTIVATION,
            Methods.mutation.ADD_GATE,
            Methods.mutation.SUB_GATE,
            Methods.mutation.ADD_SELF_CONN,
            Methods.mutation.SUB_SELF_CONN,
            Methods.mutation.ADD_BACK_CONN,
            Methods.mutation.SUB_BACK_CONN
        ],
        popsize: PLAYER_AMOUNT,
        mutationRate: MUTATION_RATE,
        elitism: ELITISM
        }
    );

    if(USE_TRAINED_POP){
        neat.population = population;
    }

    //Runtime variables 
    var iteration = 0;

    // create an engine
    var engine = Engine.create();

    //If diving
    var ballStack;
    var divingPlatform = Bodies.rectangle(width/2, height-height/4, width/4, height/2, {isStatic: true});
    
    /** Start the evaluation of the current generation */
    //FIX: Make it so that the simulation is reset.
    //buggy: make proper
    function startEvaluation(){
        players = [];
        highestScore = 0;
    
        //Spawn balls
        //BUG: Remove gaps behind the board
        //Solution: Spawn balls half in front, half behind - (still doesn't work)
        //If diving --> spawn diving board and position balls differently
        if (diving){
            ballStack = Composites.stack(width*5/8+50, -250, ballCols, ballRows, 0, 0, function(x, y) {
                return Bodies.circle(x, y, ballWidth, {collisionFilter:{layer:0}});
            });
            Composite.add(engine.world, divingPlatform);
        } else {
            ballStack = Composites.stack(width/2 - ballCols*ballWidth + ballWidth/2, -250, ballCols, ballRows, 0, 0, function(x, y) {
                return Bodies.circle(x, y, ballWidth, {collisionFilter:{layer:0}});
            });
        }

        //if balls
        if (balls){
            Composite.add(engine.world, ballStack);
        }

        for(var genome in neat.population){
            genome = neat.population[genome];
            agent = new Agent(genome)
            Composite.add(engine.world, agent.physics);
        }
    }

    //Start first evaluation
    startEvaluation();

    function endEvaluation(){
        // Evaluate final score and networks should not get to big
        for(var i in neat.population){
          genome = neat.population[i];
          players[i].score();
          genome.score -= genome.nodes.length *  width / 10;
        }
      
        console.log('Generation:', neat.generation, '- average score:', Math.round(neat.getAverage()));
        console.log('Fittest score:', Math.round(neat.getFittest().score));
        // Sort the population by score
        neat.sort();
    
        // Init new pop
        var newPopulation = [];
      
        // Elitism
        for(var i = 0; i < neat.elitism; i++){
          newPopulation.push(neat.population[i]);
        }
      
        // Breed the next individuals
        for(var i = 0; i < neat.popsize - neat.elitism; i++){
          newPopulation.push(neat.getOffspring());
        }
      
        // Replace the old population with the new population
        neat.population = newPopulation;
        neat.mutate();
      
        neat.generation++;

        players.forEach(player => Composite.remove(engine.world, player.physics))
        Composite.remove(engine.world, ballStack);
        startEvaluation();
    }

    // create a renderer
    var render = Render.create({
            canvas: canvas,
            engine: engine,
            options: {
                width: width,
                height: height,
                background: '#000',
                wireframes: false,
                showAngleIndicator: false,
                hasBounds: true
            }
    });

    // create boundaries
    var ground = Bodies.rectangle(width/2, height, width+4*chunkSize, 3*ballWidth, {isStatic: true, collisionFilter:{layer:0}}); //Fix collsiion filtering system
    var LWall = Bodies.rectangle(-2*chunkSize, height/2,  3*ballWidth, height, {isStatic: true, collisionFilter:{layer:0}});
    var RWall = Bodies.rectangle(width+2*chunkSize, height/2,  3*ballWidth, height, {isStatic: true, collisionFilter:{layer:0}});


    // UI Lines
    var fittestLine = Bodies.rectangle(0, height/2, width/72, height, {isStatic: true, collisionFilter:{layer:-1}}) //Sort out collision filters - make it 100% non-collidable
    var averageLine = Bodies.rectangle(0, height/2, width/72, height, {isStatic: true, collisionFilter:{layer:-1}})

    //Update Loop(s) --

    //Update Camera (follow fittest player) //BUGGY
    Events.on(engine, 'beforeUpdate', function(event) { //Stretch: make camera fit all agents 
                                                        //EXTRA: make option between scale to fittest and all agents - toggle check mark box
        best = players.reduce((prev, current) => (Composite.bounds(prev.physics).max.x > Composite.bounds(current.physics).max.x) ? prev : current);
        players.forEach(agent => agent.physics.bodies.forEach(limb => limb.render.opacity = opacity))
        best.physics.bodies.forEach(limb => limb.render.opacity = 1)
        agentBounds = Composite.bounds(best.physics)
        Body.setPosition(averageLine, {x: (players.reduce(function (a, b) { 
            return a + Composite.bounds(b.physics).max.x
        }, 0))/players.length+width/144, y:height/2})
        Body.setPosition(fittestLine, {x: agentBounds.max.x+width/144, y:height/2})  //Add text arrow at top of line to the right
        agentBounds.min.y -= height/3;
        agentBounds.max.y -= height/3;
        Render.lookAt(render, agentBounds, {x: chunkSize*innerChunkAmt*1/2, y: height/3});
    });
 
    
    //Chunk render logic
    //IDEAS: case - everyone in the same simulation, avg max x rather than first max x
    Events.on(engine, 'afterUpdate', function(event) {
        bounds = Composite.bounds(best.physics);
        if (bounds.max.x >=  width/2 + chunkSize/2 + offsetCounter){  // if agent moved to the right too far, move leftmost chunk to the far right
            for (i=0; i<ballStack.bodies.length; i++){
                if(ballStack.bodies[i].bounds.max.x <= -chunkSize * (outerChunkAmt-1) + offsetCounter){
                    Body.translate(ballStack.bodies[i], {x: (innerChunkAmt+2*outerChunkAmt)*chunkSize + ballWidth, y: -5*ballWidth})
                }
            }
            [ground, LWall, RWall].forEach(body => Body.translate(body, {x: chunkSize, y:0}))
            offsetCounter += chunkSize;
        } else if (bounds.max.x <=  width/2 - chunkSize/2 + offsetCounter){ // same for the left
            for (i=0; i<ballStack.bodies.length; i++){
                if(ballStack.bodies[i].bounds.min.x >= width + chunkSize * (outerChunkAmt-1) + offsetCounter){
                    Body.translate(ballStack.bodies[i], {x: -(innerChunkAmt+2*outerChunkAmt)*chunkSize + ballWidth, y: -5*ballWidth})
                }
            }
            [ground, LWall, RWall].forEach(body => Body.translate(body, {x: -chunkSize, y:0}))
            offsetCounter -= chunkSize;
        }

        for (i=0; i<ballStack.bodies.length; i++){  //If balls below the map
            if(ballStack.bodies[i].bounds.max.y >= height+3*ballWidth){
                Body.setPosition(ballStack.bodies[i], {x: ballStack.bodies[i].x, y: height-ballWidth})
            }
        }

        if(iteration == ITERATIONS){
            endEvaluation();
            iteration = 0;
        }

        //Update agent position based based on brain outputs
        players.forEach(player => player.update());
        
        iteration++;
    });

    // add all of the bodies to the world
    Composite.add(engine.world, [fittestLine, averageLine, ground, LWall, RWall])
  
    // run the engine
    Engine.run(engine);
    
    // run the renderer
    Render.run(render);
    
    //After 15s (evolution simulator)

    /*NOTES: To Add:
    - USER INTERFACE
      - Countdown
      - FPS
      - UI FITNESS COUNTER (See Distance tracker carykh evolution simulator)
      - OPTION TOGGLES --> css checkboxes,  options will be applied on next evaluation
      - RESTART BUTTON
      - SAVE POPULATION TO FILE BUTTON
    */
       //Temporarily added for debugging purposely.
       document.body.addEventListener("keydown", function(e){ 
        switch(e.which){
          case 65:
            best.physics.bodies.forEach(body => Body.setVelocity(body, {x: -50, y: 0}));
            break;
          case 68:
            best.physics.bodies.forEach(body => Body.setVelocity(body, {x: 50, y: 0}));
            break;
          case 87:
            best.physics.bodies.forEach(body => Body.setVelocity(body, {x: 0, y: -50}));
            break;
        case 83:
            best.physics.bodies.forEach(body => Body.setVelocity(body, {x: 0, y:50}));
            break;
        }
    })
});