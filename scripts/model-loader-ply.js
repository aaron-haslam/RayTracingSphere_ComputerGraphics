ModelLoaderPLY = (function() {
    'use strict';


    //------------------------------------------------------------------
    //
    // Placeholder function that returns a hard-coded cube.
    //
    //------------------------------------------------------------------
    function defineModel() {
        let model = {};
        model.vertices = new Float32Array([
            -1.0, -1.0, 0.0,   // 0 - 3 (Front face)
             1.0, -1.0, 0.0,
             1.0,  1.0, 0.0,
            -1.0,  1.0, 0.0,
        ]);

        model.vertexColors = new Float32Array([
            0.0, 0.0, 0.0,  // Front face
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,

            
        ]);

        //
        // CCW winding order
        model.indices = new Uint16Array([
            //0, 1, 2, 0, 2, 3,   // Front face
             //0, 2, 3,0, 1, 2,
             1,2,0,2,0,3
         ]);

        model.center = {
            x: 0.0,
            y: 0.0,
            z: 0.0
        };

        return model;
    }

    //------------------------------------------------------------------
    //
    // Loads and parses a PLY formatted file into an object ready for
    // rendering.
    //
    //------------------------------------------------------------------
    function load(filename) {
        return new Promise((resolve, reject) => {
            loadFileFromServer(filename)
            .then(fileText => {
                let fileLines = fileText.split('\n');
                let model = defineModel();
                resolve(model);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    return {
        load : load
    };

}());
