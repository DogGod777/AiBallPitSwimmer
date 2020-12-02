window.addEventListener('load', function() {
    const width = 2160;
    const height = 1440;
    const agentSpawnX = width/2;
    const agentSpawnY = -500;
    const innerChunkAmt = 3;
    const outerChunkAmt = 2;
    const chunkSize = width/innerChunkAmt;
    const ballWidth = 25;
    const ballRows = 5;
    const ballCols = (innerChunkAmt + 2*outerChunkAmt)*chunkSize/ballWidth * 1/2-2;
    const canvas = document.getElementById("world")
    const diving = false;
    const timer = 15;
    var time = timer*60
    var offsetCounter = 0;

    //Aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composites = Matter.Composites,
        Composite = Matter.Composite,
        Constraint = Matter.Constraint,
        Constraints = Matter.constraints,
        Events = Matter.Events,
        Bounds = Matter.Bounds;
    
    // create an engine
    var engine = Engine.create();
    
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
    
    var originalRenderBounds = render.bounds
    
    // create balls
    if (diving){
        var ballStack = Composites.stack(width*5/8+50, -250, ballCols, ballRows, 0, 0, function(x, y) {
            return Bodies.circle(x, y, ballWidth);
        });
    } else {
        var ballStack = Composites.stack(width/2 - ballCols*ballWidth + ballWidth/2, -250, ballCols, ballRows, 0, 0, function(x, y) {
            return Bodies.circle(x, y, ballWidth);
        });
    }

    const defaultCollisionGroup = -1;

    /*********************
     * Define Body Parts *
     *********************/
    const headOptions = {
        friction: 1,
        frictionAir: 0.05,
        render: {
        fillStyle: "#FFBC42",
        },
    };
    const chestOptions = {
        friction: 1,
        frictionAir: 0.05,
        collisionFilter: {
        group: defaultCollisionGroup - 1,
        },
        chamfer: {
        radius: 20,
        },
        label: "chest",
        render: {
        fillStyle: "#E0A423",
        },
    };
    const armOptions = {
        friction: 1,
        frictionAir: 0.03,
        collisionFilter: {
        group: defaultCollisionGroup,
        },
        chamfer: {
        radius: 10,
        },
        render: {
        fillStyle: "#FFBC42",
        },
    };
    const legOptions = {
        friction: 1,
        frictionAir: 0.03,
        collisionFilter: {
        group: defaultCollisionGroup - 1,
        },
        chamfer: {
        radius: 10,
        },
        render: {
        fillStyle: "#FFBC42",
        },
    };

    const lowerLegOptions = {
        friction: 1,
        frictionAir: 0.03,
        collisionFilter: {
        group: defaultCollisionGroup - 1,
        },
        chamfer: {
        radius: 10,
        },
        render: {
        fillStyle: "#E59B12",
        },
    };

    const head = Bodies.circle(agentSpawnX, agentSpawnY - 70, 30, headOptions);
    chest = Bodies.rectangle(agentSpawnX, agentSpawnY, 60, 80, chestOptions);
    chest.size = 40; // To determine overlap of goal
    const rightUpperArm = Bodies.rectangle(agentSpawnX + 40, agentSpawnY - 20, 20, 40, Object.assign({}, armOptions));
    const rightLowerArm = Bodies.rectangle(agentSpawnX + 40, agentSpawnY + 20, 20, 60, Object.assign({}, armOptions));
    const leftUpperArm = Bodies.rectangle(agentSpawnX - 40, agentSpawnY - 20, 20, 40, Object.assign({}, armOptions));
    const leftLowerArm = Bodies.rectangle(agentSpawnX - 40, agentSpawnY + 20, 20, 60, Object.assign({}, armOptions));
    const leftUpperLeg = Bodies.rectangle(agentSpawnX - 20, agentSpawnY + 60, 20, 40, Object.assign({}, legOptions));
    const rightUpperLeg = Bodies.rectangle(agentSpawnX + 20, agentSpawnY + 60, 20, 40, Object.assign({}, legOptions));
    const leftLowerLeg = Bodies.rectangle(agentSpawnX - 20, agentSpawnY + 100, 20, 60, Object.assign({}, lowerLegOptions));
    const rightLowerLeg = Bodies.rectangle(agentSpawnX + 20, agentSpawnY + 100, 20, 60, Object.assign({}, lowerLegOptions));

    const legTorso = Body.create({
        parts: [chest, leftUpperLeg, rightUpperLeg],
        collisionFilter: {
        group: defaultCollisionGroup - 1,
        },
    });

    /*****************************
     * Define Ragdoll *
     *****************************/
    const chestToRightUpperArm = Constraint.create({
        bodyA: legTorso,
        pointA: {
        x: 25,
        y: -40,
        },
        pointB: {
        x: -5,
        y: -10,
        },
        bodyB: rightUpperArm,
        stiffness: 0.2,
        render: {
        visible: false,
        },
    });
    const chestToLeftUpperArm = Constraint.create({
        bodyA: legTorso,
        pointA: {
        x: -25,
        y: -40,
        },
        pointB: {
        x: 5,
        y: -10,
        },
        bodyB: leftUpperArm,
        stiffness: 0.2,
        render: {
        visible: false,
        },
    });

    const upperToLowerRightArm = Constraint.create({
        bodyA: rightUpperArm,
        bodyB: rightLowerArm,
        pointA: {
        x: 0,
        y: 15,
        },
        pointB: {
        x: 0,
        y: -20,
        },
        stiffness: 0.2,
        render: {
        visible: false,
        },
    });

    const upperToLowerLeftArm = Constraint.create({
        bodyA: leftUpperArm,
        bodyB: leftLowerArm,
        pointA: {
        x: 0,
        y: 15,
        },
        pointB: {
        x: 0,
        y: -20,
        },
        stiffness: 0.2,
        render: {
        visible: false,
        },
    });

    const upperToLowerLeftLeg = Constraint.create({
        bodyA: legTorso,
        bodyB: leftLowerLeg,
        pointA: {
        x: -20,
        y: 60,
        },
        pointB: {
        x: 0,
        y: -25,
        },
        stiffness: 0.2,
        render: {
        visible: false,
        },
    });

    const upperToLowerRightLeg = Constraint.create({
        bodyA: legTorso,
        bodyB: rightLowerLeg,
        pointA: {
        x: 20,
        y: 60,
        },
        pointB: {
        x: 0,
        y: -25,
        },
        stiffness: 0.2,
        render: {
        visible: false,
        },
    });

    const headContraint = Constraint.create({
        bodyA: head,
        pointA: {
        x: 0,
        y: 20,
        },
        pointB: {
        x: 0,
        y: -50,
        },
        bodyB: legTorso,
        stiffness: 0.3,
        render: {
        visible: false,
        },
    });

    agent = Composite.create({
        bodies: [legTorso, head, leftLowerArm, leftUpperArm, rightLowerArm, rightUpperArm, leftLowerLeg, rightLowerLeg],
        constraints: [
        upperToLowerLeftArm,
        upperToLowerRightArm,
        chestToLeftUpperArm,
        chestToRightUpperArm,
        headContraint,
        upperToLowerLeftLeg,
        upperToLowerRightLeg,
        ],
    });

    //NOTE: body index is discrete integer from 0 - 7
    //Force magnitude from -Math.pi/30 --> +Math.pi/30
    //when implementing output layer
    function applyForceToLimb(bodyIndex, forceMagnitude){
        Body,setAngularVelocity(agent.bodies[bodyIndex], forceMagnitude);
    }

    // create boundaries
    var ground = Bodies.rectangle(width/2, height, width+4*chunkSize, 3*ballWidth, { isStatic: true });
    var LWall = Bodies.rectangle(-2*chunkSize, height/2,  3*ballWidth, height, {isStatic: true});
    var RWall = Bodies.rectangle(width+2*chunkSize, height/2,  3*ballWidth, height, {isStatic: true});

    //OPTIONAL: Diving platform
    //BUG: Remove gaps behind the board
    //Solution: Spawn balls half in front, half behind
    var divingPlatform = Bodies.rectangle(width/2, height-height/4, width/4, height/2, {isStatic: true});
    //Update Loop(s)
    Events.on(engine, 'beforeUpdate', function(event) { //Smooth camera? Dampening?
        Render.lookAt(render, Composite.bounds(agent), {x: chunkSize*innerChunkAmt*1/2, y: height/3})

    });
 
    //Chunk render logic
    Events.on(engine, 'afterUpdate', function(event) {
        if (Composite.bounds(agent).max.x >=  width/2 + chunkSize/2 + offsetCounter){ 
            for (i=0; i<ballStack.bodies.length; i++){
                if(ballStack.bodies[i].bounds.max.x <= -chunkSize * (outerChunkAmt-1) + offsetCounter){
                    Body.translate(ballStack.bodies[i], {x: (innerChunkAmt+2*outerChunkAmt)*chunkSize + ballWidth, y: -5*ballWidth})
                }
            }
            [ground, LWall, RWall].forEach(body => Body.translate(body, {x: chunkSize, y:0}))
            offsetCounter += chunkSize;
        } else if (Composite.bounds(agent).max.x <=  width/2 - chunkSize/2 + offsetCounter){
            for (i=0; i<ballStack.bodies.length; i++){
                if(ballStack.bodies[i].bounds.min.x >= width + chunkSize * (outerChunkAmt-1) + offsetCounter){
                    Body.translate(ballStack.bodies[i], {x: -(innerChunkAmt+2*outerChunkAmt)*chunkSize + ballWidth, y: -5*ballWidth})
                }
            }
            [ground, LWall, RWall].forEach(body => Body.translate(body, {x: -chunkSize, y:0}))
            offsetCounter -= chunkSize;
        }
    });

    // add all of the bodies to the world
    if (diving) {
        World.add(engine.world, [agent, ballStack, ground, divingPlatform, LWall, RWall])
    } else {
        World.add(engine.world, [agent, ballStack, ground, LWall, RWall])
    }
    // run the engine
    Engine.run(engine);
    
    // run the renderer
    Render.run(render);
    
    //After 15s (evolution simulator)
    //Fitness = Composite.bounds(agent).max.x

    /*NOTES: To Add:
    - USER INTERFACE
      - Countdown
      - FPS
      - UI FITNESS COUNTER (See Distance tracker carykh evolution simulator)
      - OPTION TOGGLES --> boxes that can be checked or not, options will apply on restart
      - RESTART BUTTON
    */
});