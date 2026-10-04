var createScene = function () {
    // Base scene (as given)
    var scene = new BABYLON.Scene(engine);

    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
    ground.isVisible = false;

    var camera = new BABYLON.FreeCamera(
        "camera1",
        new BABYLON.Vector3(0, 5, -10),
        scene
    );
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    var sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 2, segments: 32 },
        scene
    );
    sphere.position.y = 1;
    sphere.position.x = 1;

    var cylinder = BABYLON.MeshBuilder.CreateCylinder(
        "cylinder",
        { height: 2, diameter: 1 },
        scene
    );
    cylinder.position.y = 1;
    cylinder.position.x = -1;

    BABYLON.Effect.ShadersStore["customVertexShader"] = `
    precision highp float;

    /*
    Vertex shader for Phong-style lighting
    - Takes OBJECT-space attributes
    - Produces WORLD-space position/normal for lighting
    - Produces CLIP-space position for rasterization
    */

    // INPUTS (attributes: OBJECT space)
    attribute vec3 position;
    attribute vec3 normal;

    // INPUTS (uniforms)
    uniform mat4 world;
    uniform mat4 worldViewProjection;

    // OUTPUTS (varyings: WORLD space)
    varying vec3 vPosW;
    varying vec3 vNormalW;

    void main() {
        // World-space position
        vec4 pw = world * vec4(position, 1.0);
        vPosW = pw.xyz;

        // World-space normal
        vNormalW = normalize(mat3(world) * normal);

        // Clip-space position
        gl_Position = worldViewProjection * vec4(position, 1.0);
    }`;

    BABYLON.Effect.ShadersStore["customFragmentShader"] = `
    precision highp float;

    // INPUTS:
    varying vec3 vPosW;
    varying vec3 vNormalW;

    // Material parameters
    uniform float uMatAmbient;
    uniform vec3  uMatDiffuse;
    uniform vec3  uMatSpecular;
    uniform float uMatShininess;

    // Camera
    uniform vec3 uCameraPos;

    // FIRST POINT LIGHT
    uniform vec3 uPointLightColor;
    uniform vec3 uPointLightPos;

    // SECOND POINT LIGHT
    uniform vec3 uPointLightColor2;
    uniform vec3 uPointLightPos2;

    vec3 shadePointLight(
        vec3 lColor,
        vec3 lPos,
        vec3 N,
        vec3 V,
        vec3 kd,
        vec3 ks,
        float shin)
    {
        /*
        Inputs:
            lColor : light color/intensity
            lPos   : light position in world space
            N, V   : unit normal and view vectors
            kd, ks : material colors
            shin   : Phong exponent

        Returns:
            RGB contribution from this point light
        */

        // Direction from fragment to light
        vec3 Lvec = lPos - vPosW;

        // Distance from fragment to light
        float distance = length(Lvec);

        // Unit light direction
        vec3 L = normalize(Lvec);

        // Distance attenuation
        float attenuation = 1.0 / (distance * distance);

        // Diffuse term
        float NdotL = max(dot(N, L), 0.0);
        vec3 diffuse = kd * NdotL;

        // Specular term
        vec3 R = reflect(-L, N);
        float RdotV = max(dot(R, V), 0.0);
        vec3 specular = ks * pow(RdotV, shin);

        // Return this light's contribution
        return lColor * attenuation * (diffuse + specular);
    }

    void main()
    {
        // Normalize interpolated normal
        vec3 N = normalize(vNormalW);

        // View vector: surface -> camera
        vec3 V = normalize(uCameraPos - vPosW);

        // Ambient contribution
        vec3 color = uMatAmbient * uMatDiffuse;

        color += shadePointLight(
            uPointLightColor,
            uPointLightPos,
            N,
            V,
            uMatDiffuse,
            uMatSpecular,
            uMatShininess
        );

        color += shadePointLight(
            uPointLightColor2,
            uPointLightPos2,
            N,
            V,
            uMatDiffuse,
            uMatSpecular,
            uMatShininess
        );


        // Final fragment color
        gl_FragColor = vec4(color, 1.0);
    }`;

    var shaderMat = new BABYLON.ShaderMaterial(
        "custom",
        scene,
        "custom",
        {
            attributes: ["position", "normal"],

            uniforms: [
                "world",
                "worldViewProjection",

                "uCameraPos",

                "uMatAmbient",
                "uMatDiffuse",
                "uMatSpecular",
                "uMatShininess",

                // First light
                "uPointLightColor",
                "uPointLightPos",

                // Second light
                "uPointLightColor2",
                "uPointLightPos2"
            ]
        }
    );

    shaderMat.setFloat(
        "uMatAmbient",
        0.25
    );

    shaderMat.setColor3(
        "uMatDiffuse",
        new BABYLON.Color3(0.8, 0.2, 0.2)
    );

    shaderMat.setColor3(
        "uMatSpecular",
        new BABYLON.Color3(1, 1, 1)
    );

    shaderMat.setFloat(
        "uMatShininess",
        32.0
    );


    shaderMat.setColor3(
        "uPointLightColor",
        new BABYLON.Color3(0.7, 0.8, 1.0)
    );

    shaderMat.setVector3(
        "uPointLightPos",
        new BABYLON.Vector3(2.5, 4, -2.0)
    );

    shaderMat.setColor3(
        "uPointLightColor2",
        new BABYLON.Color3(1.0, 0.3, 0.3)
    );

    shaderMat.setVector3(
        "uPointLightPos2",
        new BABYLON.Vector3(-3.0, 3.0, -2.0)
    );

    scene.onBeforeRenderObservable.add(function () {
        shaderMat.setVector3(
            "uCameraPos",
            camera.position
        );
    });


    // Apply shader material
    sphere.material = shaderMat;
    cylinder.material = shaderMat;

    return scene;
};

export default createScene;
