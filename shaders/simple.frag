precision lowp float;

varying vec3 vSpherePosition;
varying vec2 vWindowSize;

vec3 EyePosition = vec3(0.5, 0.5, 1.0);




//
// Different types of rays
struct Ray{
    vec3 origin;
    vec3 direction;
};
struct Ray_Reflection{
    vec4 intersection;
    vec4 reflectedDirection;
    vec4 time;
};
struct Ray_Shadow{
    vec3 origin;
    vec3 direction;
};
//
// Light
struct Light{
    vec3 location;
    float radius;
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    float shinynessFactor;
};

//
// Material Properties
struct Material{
    vec4 color;
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    bool reflective;
};

//
// Plane
struct Plane{
    vec3 normal;
    vec3 point;
    Material materialProperties;
};

//
// Sphere
struct Sphere{
    vec3 center;
    float radius;
    Material materialProperties;
};
vec3 normalOfSphere(vec3 point, Sphere sphere){
    vec3 normal = point - sphere.center;
    normal = normal / sphere.radius;
    return normal;
}

//
// Intersection
struct Intersection{
    bool hit;
    vec3 point;
    vec3 normal;
    bool reflected;
    vec4 reflection;
    Material materialProperties;
};

//
//Stack
uniform int remove;

const int MAX_STACK_SIZE = 5;
const int STACK_POS_0 = 0;
const int STACK_POS_1 = 1;
const int STACK_POS_2 = 2;
const int STACK_POS_3 = 3;
const int STACK_POS_4 = 4;

struct StackItem {
    float data;
    vec4 color;
};

struct Stack {
    StackItem items[MAX_STACK_SIZE];
    int top;
} stack;


bool stackEmpty() {
    return stack.top == STACK_POS_0;
}

bool stackPush(StackItem item) {
    if (stack.top == (MAX_STACK_SIZE - 1)) return false;
    if (stack.top == STACK_POS_0) {
        stack.items[STACK_POS_0] = item;
    } else if (stack.top == STACK_POS_1) {
        stack.items[STACK_POS_1] = item;
    } else if (stack.top == STACK_POS_2) {
        stack.items[STACK_POS_2] = item;
    } else if (stack.top == STACK_POS_3) {
        stack.items[STACK_POS_3] = item;
    } else if (stack.top == STACK_POS_4) {
        stack.items[STACK_POS_4] = item;
    }

    stack.top++;
    return true;
}

StackItem stackPop() {
    stack.top--;
    if (stack.top == STACK_POS_0) {
        return stack.items[STACK_POS_0];
    } else if (stack.top == STACK_POS_1) {
        return stack.items[STACK_POS_1];
    } else if (stack.top == STACK_POS_2) {
        return stack.items[STACK_POS_2];
    } else if (stack.top == STACK_POS_3) {
        return stack.items[STACK_POS_3];
    } else if (stack.top == STACK_POS_4) {
        return stack.items[STACK_POS_4];
    }
    // Danger Will Robinson, no return if stack underflow!!
}
//
// Declarations of Functions
Ray createRay(vec3 starting, vec3 going);
vec3 findIntersectionPoint(Ray ray, float t);
vec4 cast_a_shadow_ray(Intersection object);
Intersection iPlane(Ray ray, Plane plane);
Intersection iSphere(Ray ray, Sphere sphere);
Intersection findClosestIntersect(Intersection intersect[4]);
Intersection sceneIntersection(Ray ray);
vec4 renderSky(Ray ray);
vec4 cast_a_ray(Ray ray);
Ray createPixelRay();

//
// Functions
vec3 findIntersectionPoint(Ray ray, float t){
    vec3 o = ray.origin;
    vec3 d = ray.direction;

    vec3 pt = o + t*d;

    return pt;
}

Intersection iPlane(Ray ray, Plane plane){
    Intersection intersection;

    float numerator = dot((plane.point - ray.origin) , plane.normal);
    float denominator = dot(ray.direction , plane.normal);

    
    if(denominator != 0.0){
        float t = numerator / denominator;

        intersection.point = findIntersectionPoint(ray, t);
        intersection.hit = true;
        intersection.materialProperties = plane.materialProperties;
        intersection.normal = plane.normal;
        //intersection.materialProperties.color = cast_a_shadow_ray(intersection);
        
    } else{
        intersection.hit = false;
        
    }
    return intersection;
}

Intersection iSphere(Ray ray, Sphere sphere){
    Intersection intersection;

    vec3 d = ray.direction;
    vec3 o = ray.origin;
    vec3 c = sphere.center;
    float r = sphere.radius;

    float A = dot(d,d);
    float B = 2.0*(dot(d,(o-c)));
    float C = dot((o-c),(o-c))-pow(r,2.0);
    float discriminant = pow(B,2.0) - (4.0*A*C);

    if(discriminant > 0.0){
        // Intersection
        intersection.hit = true;

        float t_0  = (-B + sqrt(discriminant))/(2.0*A);
        float t_1 = (-B - sqrt(discriminant))/(2.0*A);

        if(discriminant != 0.0){
            // Two points (entry & exit)

            if(t_0 > 0.0){
                if(t_0 > t_1){
                    //Find intersection point and Normal
                    intersection.point = findIntersectionPoint(ray, t_0);
                    intersection.normal = normalize(intersection.point - sphere.center);

                    //Calculate colors
                    intersection.materialProperties = sphere.materialProperties;
                    //intersection.materialProperties.color = cast_a_shadow_ray(intersection);

                    return intersection;
                }else{
                    //Find intersection point and Normal
                    intersection.point = findIntersectionPoint(ray, t_1);
                    intersection.normal = normalize(intersection.point - sphere.center);
    
                    //Calculate colors
                    intersection.materialProperties = sphere.materialProperties;
                    //intersection.materialProperties.color = cast_a_shadow_ray(intersection);
    
                    return intersection;
                }
            }else{
                // Intersection is behind eye
                intersection.hit = false;
                return intersection;
            }

        }else{
            // One point (tangent to sphere)

            //Find intersection point and Normal
            intersection.point = findIntersectionPoint(ray, t_0);
            intersection.normal = normalize(intersection.point - sphere.center);

            //Calculate colors
            intersection.materialProperties = sphere.materialProperties;
            //intersection.materialProperties.color = cast_a_shadow_ray(intersection);
            
            return intersection;
        }
    }else{
        // No intersection
        intersection.hit = false;
        return intersection;
    }
}

Intersection findClosestIntersect(Intersection intersect[4]){
    Intersection closestIntersect;

    if     (intersect[0].point.z <= intersect[1].point.z && intersect[0].point.z <= intersect[2].point.z && intersect[0].point.z <= intersect[3].point.z){
        closestIntersect = intersect[0];
    }
    else if(intersect[1].point.z < intersect[0].point.z && intersect[1].point.z <= intersect[2].point.z && intersect[1].point.z <= intersect[3].point.z){
        closestIntersect = intersect[1];
    }
    else if(intersect[2].point.z < intersect[0].point.z && intersect[2].point.z < intersect[1].point.z && intersect[2].point.z <= intersect[3].point.z){
        closestIntersect = intersect[2];
    }
    else if(intersect[3].point.z < intersect[0].point.z && intersect[3].point.z < intersect[1].point.z && intersect[3].point.z < intersect[2].point.z){
        closestIntersect = intersect[3];
    }


    return closestIntersect;
}

Intersection sceneIntersection(Ray ray){
    // Create Objects

    //Planes
    Plane plane;
    plane.normal = vec3(0.0,1.0,0.0);
    plane.point  = vec3(0.0,-1.0,0.0);
    plane.materialProperties.diffuse  = vec4(0.2, 0.2, 0.2, -1.0);
    plane.materialProperties.specular = plane.materialProperties.diffuse;

    //Spheres
    Sphere sphere1;
    sphere1.center                      = vSpherePosition;
    sphere1.radius                      = 1.0;
    sphere1.materialProperties.diffuse  = vec4(0.0, 0.35, 0.0, 1.0);
    sphere1.materialProperties.specular = sphere1.materialProperties.diffuse;

    Sphere sphere2;
    sphere2.center                      = vec3(-vSpherePosition.x+1.0*2.0,2.0,vSpherePosition.z-7.0);
    sphere2.radius                      = 1.0;
    sphere2.materialProperties.diffuse  = vec4(0.5, 0.0, 0.0, 1.0);
    sphere2.materialProperties.specular = sphere2.materialProperties.diffuse;
    sphere2.materialProperties.reflective = true;

    Sphere sphere3;
    sphere3.center                      = vec3(0.5,5.5,-13.0);
    sphere3.radius                      = 1.0;
    sphere3.materialProperties.diffuse  = vec4(0.25, 0.0, 0.25, 1.0);
    sphere3.materialProperties.specular = sphere3.materialProperties.diffuse;

    Sphere sphere4;
    sphere4.center                      = vec3(1.5,0.5,-1.0);
    sphere4.radius                      = 1.0;
    sphere4.materialProperties.diffuse  = vec4(0.25, 0.35, 0.0, 1.0);
    sphere4.materialProperties.specular = sphere4.materialProperties.diffuse;
    

    //Test Intersections of objects
    Intersection intersection;

    Intersection possibleIntersects[4];
    possibleIntersects[0] = iSphere(ray, sphere1);
    possibleIntersects[1] = iSphere(ray, sphere2);
    possibleIntersects[2] = iSphere(ray, sphere3);
    possibleIntersects[3] = iPlane(ray, plane);

    intersection = findClosestIntersect(possibleIntersects);
    
    return intersection;
}

vec4 renderSky(Ray ray){
    Sphere sky;
    sky.center                      = vec3(0.5, 0.5, 0);
    sky.radius                      = 500.0;

    Intersection intersect = iSphere(ray, sky);


    return vec4(0.0,0.0,intersect.normal.y,1.0);
}

bool intersectsObject(Ray ray){
    //Planes
    Plane plane;
    plane.normal = vec3(0.0,1.0,0.0);
    plane.point  = vec3(0.0,-1.0,0.0);
    plane.materialProperties.diffuse  = vec4(0.2, 0.2, 0.2, -1.0);
    plane.materialProperties.specular = plane.materialProperties.diffuse;

    //Spheres
    Sphere sphere1;
    sphere1.center                      = vSpherePosition;
    sphere1.radius                      = 1.0;
    sphere1.materialProperties.diffuse  = vec4(0.0, 0.35, 0.0, 1.0);
    sphere1.materialProperties.specular = sphere1.materialProperties.diffuse;

    Sphere sphere2;
    sphere2.center                      = vec3(-vSpherePosition.x+1.0*2.0,2.0,vSpherePosition.z-7.0);
    sphere2.radius                      = 1.0;
    sphere2.materialProperties.diffuse  = vec4(0.5, 0.0, 0.0, 1.0);
    sphere2.materialProperties.specular = sphere2.materialProperties.diffuse;
    sphere2.materialProperties.reflective = true;

    Sphere sphere3;
    sphere3.center                      = vec3(0.5,5.5,-13.0);
    sphere3.radius                      = 1.0;
    sphere3.materialProperties.diffuse  = vec4(0.25, 0.0, 0.25, 1.0);
    sphere3.materialProperties.specular = sphere3.materialProperties.diffuse;

    Sphere sphere4;
    sphere4.center                      = vec3(1.5,0.5,-1.0);
    sphere4.radius                      = 1.0;
    sphere4.materialProperties.diffuse  = vec4(0.25, 0.35, 0.0, 1.0);
    sphere4.materialProperties.specular = sphere4.materialProperties.diffuse;


    return true;
}

vec4 cast_a_shadow_ray(Intersection object){
    //Lights
    Light light;
    light.location = vec3(0.5,5.0,-15.0);
    light.diffuse  = vec4(1.0,1.0,1.0,1.0);
    light.specular = vec4(0.5,0.5,0.5,1.0);
    light.shinynessFactor = 15.0;

    Ray ray = createRay(object.point, object.normal);

    //Diffuse
        vec3 N = object.normal;
        vec3 L = normalize(light.location - object.point);
        vec4 diffuse = object.materialProperties.diffuse * light.diffuse * clamp(dot(N,L), 0.0, 1.0);
        diffuse = vec4(diffuse.xyz, 1.0);

        //Specular
        vec3 R = 2.0 * dot(N,L) * (N - L);
        vec3 V = normalize(EyePosition - object.point);
        vec4 specular = object.materialProperties.specular * light.specular * pow(clamp(dot(V,R),0.0,1.0), light.shinynessFactor);
        specular = vec4(specular.xyz, 1.0);

        vec4 totalColor = diffuse + specular;
        return totalColor;

    
}

vec4 cast_a_ray(Ray ray){
    
    Intersection intersect = sceneIntersection(ray);

    if(intersect.hit == true){
        return cast_a_shadow_ray(intersect);
    }else{
        return renderSky(ray);
    }
    
}

Ray createPixelRay(){
    vec3 a  = EyePosition;
    vec3 b  = vec3((gl_FragCoord.x + 0.5)/vWindowSize.x,(gl_FragCoord.y + 0.5)/vWindowSize.y,0.0);

    Ray ray = createRay(a, b);

    return ray;
}

Ray createRay(vec3 starting, vec3 going){
    Ray ray;
    ray.origin = starting;
    ray.direction = going - starting;
    return ray;
}


void main()
{
    Ray ray = createPixelRay();

    vec4 color = cast_a_ray(ray);


    gl_FragColor = color;

    
}
/*
Ray Tracing Algorithm
    •for each pixel
        ◦compute ray from eye through the pixel
            ▪“cast a ray”
                •for each object
                    ◦hit test
                    ◦if hit, compute color
                        ▪if hit & diffuse return computed color
                            •“cast a shadow ray” to each light, accumulate all intensities
                        ▪if hit & reflective, use reflected ray and “cast a ray”
                            •Advance the ray origin in the ray direction by a small epsilon to avoid self-intersections.
                •Select color from intersection that was closest to the eye
                •If nothing was hit, do something (sky color)
            ▪end “cast a ray”
    •end for each pixel

*/