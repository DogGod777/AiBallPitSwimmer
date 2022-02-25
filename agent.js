const width = 1080;
const height = 720;

const agentSpawnX = width/2;
const agentSpawnY = -500;

const MAX_TORQUE = 0.25;

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

// //Fix bug
Detector.canCollide = function (filterA, filterB) {
    //console.log(filterA.layer, filterB.layer)
    if (filterA.layer != -1 && filterB.layer != -1){
        return (filterA.layer == filterB.layer || (filterA.layer == 0 || filterB.layer==0));
    } else {
        return false;
    }
}  

function Agent (genome) {
    /*********************
     * Define Body Parts *
     *********************/
    const layer = -1

    const headOptions = {
        friction: 1,
        frictionAir: 0.05,
        collisionFilter: {
            group: layer,
            layer: (players.length+1)
        },
        render: {
            fillStyle: "#FFBC42",
        },
    };
    const chestOptions = {
        friction: 1,
        frictionAir: 0.05,
        collisionFilter: {
           group: layer-2,
           layer: (players.length+1)
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
           group: layer-1,
           layer: (players.length+1)
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
           group: layer-2,
           layer: (players.length+1)
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
           group: layer-2,
           layer: (players.length+1)
        },
        chamfer: {
            radius: 10,
        },
        render: {
            fillStyle: "#E59B12",
        },
    };

    //NEAT AI variables
    this.brain = genome;
    this.brain.score = 0;

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
           group: layer-2,
           layer: (players.length+1)
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

    this.physics = Composite.create({
        bodies: [head, legTorso, leftLowerArm, leftUpperArm, rightLowerArm, rightUpperArm, leftLowerLeg, rightLowerLeg],
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
    players.push(this);
}
    //NOTE: body index is discrete integer from 3 - 7 inclusive
    //Force magnitude from -Math.pi/30 --> +Math.pi/30
    //when implementing output layer --> fix bug all values are the same
    //all values are positive? allow for negative values
Agent.prototype = {
    applyForceToLimb: function(bodyIndex, forceMagnitude){
        Body.setAngularVelocity(this.physics.bodies[bodyIndex], forceMagnitude);
    },
    score: function(){ // Fix: Only call at end of evalution
        this.brain.score += Composite.bounds(this.physics).max.x //+ highest velX?
        highestScore = this.brain.score > highestScore ? this.brain.score : highestScore;
    },
    update: function(){
        var bounds = Composite.bounds(this.physics);
        var input = [bounds.min.x, //His AABB Bounding box for simplicity
                     bounds.max.x,
                     bounds.min.y,
                     bounds.max.y];
        var output = this.brain.activate(input);
        //console.log(output);
    
        for (var i=1; i<output.length; i++){
            //Normalise outputs
            output[i] = output[i] * MAX_TORQUE * 2 - MAX_TORQUE;
            output[i] = output[i] > MAX_TORQUE ? MAX_TORQUE  : output[i] < -MAX_TORQUE  ? -MAX_TORQUE  : output[i]; //BUG

            //Apply force
            this.applyForceToLimb(i, output[i])
        }
    }
}
// Add in offsets for TRAINING in Paralell, overlay