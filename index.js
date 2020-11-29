window.addEventListener('load', function() {

    var Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies;
        Composites = Matter.Composites
    
    // create an engine
    var engine = Engine.create();
    
    // create a renderer
    var render = Render.create({
            canvas: document.getElementById("world"),
            engine: engine,
            options: {
                width: 1080,
                height: 720,
                background: '#000',
                wireframes: false,
                showAngleIndicator: false}
    });
    
    // create balls
    var ballStack = Composites.stack(40, 0, 40, 10, 0, 0, function(x, y) {
        return Bodies.circle(x, y, 25);
    });
    
    // create walls
    var ground = Bodies.rectangle(540, 720, 1080, 10, { isStatic: true });
    var LWall = Bodies.rectangle(0, 360, 10, 720, { isStatic: true });
    var RWall = Bodies.rectangle(1080, 360, 10, 720, { isStatic: true });
    // add all of the bodies to the world
    World.add(engine.world, [ballStack, ground, LWall, RWall]);
    
    // run the engine
    Engine.run(engine);
    
    // run the renderer
    Render.run(render);

});