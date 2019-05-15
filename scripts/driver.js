
MySample.main = (function() {
    'use strict';

    let canvas = document.getElementById('canvas-main');
    let gl = canvas.getContext('webgl');

    let model = {};
    let buffers = {};
    let shaders = {};
    let spherePosition = [0.0,0.0,0.0];
    let windowSize;
    let previousTime = performance.now();


    //------------------------------------------------------------------
    //
    // Prepare the rendering environment.
    //
    //------------------------------------------------------------------
    function initializeData() {
        model.vertices = new Float32Array([
            -1.0, -1.0, 0.0,   // 0 - 3 (Front face)
             1.0, -1.0, 0.0,
             1.0,  1.0, 0.0,
            -1.0,  1.0, 0.0,
        ]);

        //
        // CCW winding order
        model.indices = new Uint16Array([
            0, 2, 1, 0, 3, 2,   // Front face
         ]);
    }

    //------------------------------------------------------------------
    //
    // Prepare and set the Vertex Buffer Object to render.
    //
    //------------------------------------------------------------------
    function initializeBufferObjects() {
        buffers.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        buffers.vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, model.vertexColors, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        buffers.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    //------------------------------------------------------------------
    //
    // Prepare and set the shaders to be used.
    //
    //------------------------------------------------------------------
    function initializeShaders() {
        return new Promise((resolve, reject) => {
            loadFileFromServer('shaders/simple.vs')
            .then(source => {
                shaders.vertexShader = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(shaders.vertexShader, source);
                gl.compileShader(shaders.vertexShader);
                return loadFileFromServer('shaders/simple.frag');
            })
            .then(source => {
                shaders.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(shaders.fragmentShader, source);
                gl.compileShader(shaders.fragmentShader);
            })
            .then(() => {
                shaders.shaderProgram = gl.createProgram();
                gl.attachShader(shaders.shaderProgram, shaders.vertexShader);
                gl.attachShader(shaders.shaderProgram, shaders.fragmentShader);
                gl.linkProgram(shaders.shaderProgram);

                resolve();
            })
            .catch(error => {
                console.log('(initializeShaders) something bad happened: ', error);
                reject();
            });
        });
    }

    //------------------------------------------------------------------
    //
    // Associate the vertex and pixel shaders, and the expected vertex
    // format with the VBO.
    //
    //------------------------------------------------------------------
    function associateShadersWithBuffers() {
        gl.useProgram(shaders.shaderProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        let position = gl.getAttribLocation(shaders.shaderProgram, 'aPosition');
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, model.vertices.BYTES_PER_ELEMENT * 3, 0);
        gl.enableVertexAttribArray(position);

        gl.uniform3fv(gl.getUniformLocation(shaders.shaderProgram, "spherePosition"), spherePosition);
        gl.uniform2fv(gl.getUniformLocation(shaders.shaderProgram, "windowSize"), windowSize);
    }

    //------------------------------------------------------------------
    //
    // Prepare some WegGL settings, things like the clear color, depth buffer, etc.
    //
    //------------------------------------------------------------------
    function initializeWebGLSettings() {
        gl.clearColor(0.3921568627450980392156862745098, 0.58431372549019607843137254901961, 0.92941176470588235294117647058824, 1.0);
        gl.clearDepth(1.0);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.DEPTH_TEST);
    }

    //------------------------------------------------------------------
    //
    // Scene updates go here.
    //
    //------------------------------------------------------------------
    let radius = 1.0;
    let angle = 0.0;
    let distance = -3.0;

    function update(elapsedTime) {
        windowSize = [800.0,800.0];

        //
        // Move center of circle in a circle
        spherePosition = [Math.cos(angle)*radius+0.5,Math.sin(angle)*radius+0.5,distance];
        angle += 0.01;
        //distance += 0.01;

        
    }

    //------------------------------------------------------------------
    //
    // Rendering code goes here
    //
    //------------------------------------------------------------------
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //
        // This sets which buffers/shaders to use for the draw call in the render function.
        associateShadersWithBuffers();
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    //------------------------------------------------------------------
    //
    // This is the animation loop.
    //
    //------------------------------------------------------------------
    function animationLoop(time) {
        let elapsedTime = previousTime - time;
        previousTime = time;

        update(elapsedTime);
        render();

        requestAnimationFrame(animationLoop);
    }

    console.log('initializing...');
    console.log('    Loading model');
    ModelLoaderPLY.load('models/cube.ply')
    .then(modelSource => {
        model = modelSource;
        console.log('    WebGL settings');
        initializeWebGLSettings();
        console.log('    raw data')
        initializeData();
        console.log('    vertex buffer objects');
        initializeBufferObjects();
        console.log('    shaders');
        return initializeShaders();
    })
    .then(() => {
        console.log('initialization complete!');
        requestAnimationFrame(animationLoop);
    });

}());
