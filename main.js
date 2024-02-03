
import * as THREE from 'three';

import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

let camera, scene, renderer, controls;
let mesh2, frameCount = 0; 
let isPaused = false;
let animationSpeed = 0.1; // Initial animation speed
let pointArray = [], numPoints = 25;
let audioContext, analyserNode, microphoneGain;

init();

async function init() {

    // Initialize the audio context
    document.addEventListener('click', initializeAudioContext, { once: true });

    // Initialize the visualization
    initVisualization();

    // Start the animation
    animate();
    
}

function initializeAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    initMicrophone();
}

async function initMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneGain = audioContext.createGain();
        const microphoneStream = audioContext.createMediaStreamSource(stream);
        microphoneStream.connect(microphoneGain);
        analyserNode = audioContext.createAnalyser();
        microphoneGain.connect(analyserNode);
        analyserNode.fftSize = 256;
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}


function initVisualization() {

    const info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.style.color = '#fff';
    info.style.link = '#f80';
    info.innerHTML = '<a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> webgl - geometry extrude shapes';
    document.body.appendChild( info );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x222222 );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 0, 0, 500 );

    controls = new TrackballControls( camera, renderer.domElement );
    controls.minDistance = 200;
    controls.maxDistance = 1000;

    scene.add( new THREE.AmbientLight( 0x666666 ) );

    const light = new THREE.PointLight( 0xffffff, 3, 0, 0 );
    light.position.copy( camera.position );
    scene.add( light );
    // Add a button to toggle pause/play
    const toggleButton = document.createElement('button');
    toggleButton.innerText = 'Pause/Play';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '10px';
    toggleButton.style.right = '10px';
    toggleButton.addEventListener('click', togglePausePlay);
    document.body.appendChild(toggleButton);

    // Add a slider to control animation speed
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '0.1';
    speedSlider.max = '2.0';
    speedSlider.step = '0.1';
    speedSlider.value = '0.1';
    speedSlider.style.position = 'absolute';
    speedSlider.style.top = '40px';
    speedSlider.style.right = '10px';
    speedSlider.addEventListener('input', updateSpeed);
    document.body.appendChild(speedSlider);

    initPointArray()
}

function initPointArray() {
    for ( let i = 0; i < numPoints; i ++ ) {
        pointArray.push(0)
    }
}

function shiftPointArray( newPoint ) {
    for (let i = 0; i < numPoints-1; i++ ) {
        pointArray[i] = pointArray[i+1]
    }

    pointArray[numPoints-1] = newPoint

}

function updateScene() {

    scene.remove(mesh2);


    const ThreeDPoints = [];

    for ( let i = 0; i < numPoints; i ++ ) {

        ThreeDPoints.push( new THREE.Vector3( ( i - 4.5 ) * 50, pointArray[i], 0) );
    }

    const randomSpline = new THREE.CatmullRomCurve3( ThreeDPoints );

    //

    const extrudeSettings2 = {
        steps: 200,
        bevelEnabled: false,
        extrudePath: randomSpline
    };


    const pts2 = [], numPts = 100; // Increase the number of points for a smoother shape

for (let i = 0; i < numPts; i++) {
    const radius = 20; // Adjust the radius as needed
    const angle = (i / numPts) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    pts2.push(new THREE.Vector2(x, y));
}

const shape2 = new THREE.Shape(pts2);


    const geometry2 = new THREE.ExtrudeGeometry( shape2, extrudeSettings2 );

 // Create a gradient color based on the position along the spline
 const gradientColor = new THREE.Color();
 gradientColor.setHSL((frameCount*100 / 200) % 1, 1, 0.5); // Adjust hue for gradient variation

 // Apply the gradient color to the material
 const material2 = new THREE.MeshLambertMaterial({
     color: gradientColor,
     wireframe: false,
 });
    mesh2 = new THREE.Mesh( geometry2, material2 );

    scene.add( mesh2 );


}

function togglePausePlay() {
    isPaused = !isPaused;
}

function updateSpeed(event) {
    animationSpeed = parseFloat(event.target.value) * 3;
}

function animate() {

    requestAnimationFrame(animate);


    // Use Microphone 
    if (!isPaused) {

        // Update frame count and render the scene
        frameCount = frameCount + animationSpeed;
        if (frameCount >= 15) {

            // Analyze microphone data
            const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(dataArray);

            // Calculate the average gain from the microphone data
            const averageGain = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;

            // Update the points based on the average gain
            shiftPointArray(averageGain);
            updateScene();
            frameCount = 0;

        }

        controls.update();
        renderer.render(scene, camera);
    }

    // Random points
    // if (!isPaused) {
    //     frameCount = frameCount + animationSpeed;

    //     if (frameCount >= 15) {
    //         updateScene();
    //         shiftPointArray(THREE.MathUtils.randFloat(-100, 100));
    //         frameCount = 0;
    //     }

    //     controls.update();
    //     renderer.render(scene, camera);
    // }

}

