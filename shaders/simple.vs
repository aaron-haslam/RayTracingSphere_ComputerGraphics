//
// Environment
uniform mat4 uAspect;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

uniform vec3 spherePosition;
uniform vec2 windowSize;


// Geometry
attribute vec4 aPosition;

varying vec3 vSpherePosition;
varying vec2 vWindowSize;



void main()
{
    vSpherePosition = spherePosition;
    vWindowSize = windowSize;
    gl_Position = aPosition;
}
