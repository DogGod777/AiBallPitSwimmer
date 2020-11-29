window.addEventListener('load', function() {
    const width = 1080;
    const height = 720;
    const agentSpawnX = width/2;
    const agentSpawnY = -100;
    //Aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies;
        Body = Matter.Body
        Composites = Matter.Composites
        Composite = Matter.Composite
        Constraint = Matter.Constraint
        Constraints = Matter.constraints
    
    // create an engine
    var engine = Engine.create();
    
    // create a renderer
    var render = Render.create({
            canvas: document.getElementById("world"),
            engine: engine,
            options: {
                width: width,
                height: height,
                background: '#000',
                wireframes: false,
                showAngleIndicator: false}
    });
    
    // create balls
    var ballStack = Composites.stack(40, 0, 40, 10, 0, 0, function(x, y) {
        return Bodies.circle(x, y, 25);
    });
    
    //Create Ragdoll
    //NOTES: ADD AGENTS' OUTPUT FUNCTION MATRIX TO RAGDOLL DEFINITION IN THE FORM OF FUNCTIONS
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
     * Define Constraints/Joints *
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

    const person = Composite.create({
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

    // create walls
    var ground = Bodies.rectangle(width/2, height, width, 10, { isStatic: true });
    var LWall = Bodies.rectangle(0, height/2, 10, height, { isStatic: true });
    var RWall = Bodies.rectangle(width, height/2, 10, height, { isStatic: true });
    // add all of the bodies to the world
    World.add(engine.world, [person, ballStack, ground, LWall, RWall]);
    
    // run the engine
    Engine.run(engine);
    
    // run the renderer
    Render.run(render);

});