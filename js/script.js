var renderer, canvas, camera, scene, rayCaster, mouseClickPosition;

var monoliths = [], monolithMeshes, clock;
var rotationX = rotationY = 0;
var mouseOver = false;
const lerp = .03;
const lerp2 = .1;
let screenWidth, screenHeight;
let audioManager = null;
let meshesRotation = 0;
let meshesRotationTarget = 0;
let useOrbitControls = true;
let zoomLevel = 100;
let zoomMax = 500;
let mouse = {x: 0.9, y: -0.05};
let averageNote = null;

let isClicking = false;
let cameraTargetPosition = {x: -1000, y: 63, z: 1100};
let mouseOffset = {x: 0, y: 0};
let originalMousePosition = {x: 0, y: 0};

let mainMonolith = null;
let meshesRotationTargetLocked = false;

function init() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    // Base
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize( screenWidth, screenHeight );
    canvas = renderer.domElement;
    camera = new THREE.PerspectiveCamera( 18, window.innerWidth / window.innerHeight, 10, 100000 );
    scene = new THREE.Scene();
    rayCaster = new THREE.Raycaster();
    mouseClickPosition = new THREE.Vector2();
    mouseOverPosition = new THREE.Vector2();
    clock = new THREE.Clock();
    var container = document.getElementById( 'container' );
    container.appendChild( canvas );
    scene.add(camera);
    camera.position.x = -707;
    camera.position.y = -322;
    camera.position.z = 909;

    // Objects
    monolithMeshes = new THREE.Object3D();

    var monolithNumber = 20;
    var radius = 50;
    var angle = 0.2;
    var step = (2*Math.PI) / monolithNumber;

    averageNote = audioManager.getAverageNote();
    
    for(let i = 0; i < monolithNumber; i++) {
        let options = {};

        let oscIndex = i % 2 === 0 ? 0 : 1;
        // let oscIndex = 0;
        options.osc = audioManager.oscillators[Object.keys(audioManager.oscillators)[oscIndex]];
        options.note = audioManager.getRandomFrequence();

        let distance = (radius + Math.random()*500);
        options.distance = distance;
        options.angle = angle;
        options.position = {
            x: 0,
            y: (options.note - averageNote)/2,
            z: Math.max(80, distance * Math.sin(angle))
        }

        let monolith = new Monolith(options);
        monolith.mesh.lookAt(new THREE.Vector3(0, options.position.y, 0));
        
        monoliths.push(monolith);
        monolithMeshes.add( monolith.parent );

        angle += step;
    }

    scene.add(monolithMeshes);

    mainMonolith = new Monolith();
    mainMonolith.mesh.scale.set(10,10,10);
    scene.add(mainMonolith.mesh);

    // Controls
    if(useOrbitControls) {
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.enableKeys = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.update();
    }
};

function getClicked3DPoint(evt) {
    evt.preventDefault();

    mouseClickPosition.x = (evt.clientX / canvas.width) * 2 - 1;
    mouseClickPosition.y = -(evt.clientY / canvas.height) * 2 + 1;

    rayCaster.setFromCamera(mouseClickPosition, camera);
    var intersects = rayCaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        if(intersects[0].object.uuid === mainMonolith.mesh.uuid) {
            if (meshesRotationTargetLocked) {
                return false;
            }

            meshesRotationTarget = 0;
            meshesRotationTargetLocked = true;
            TweenLite.to(mainMonolith.mesh.rotation, 6, {
                z: mainMonolith.mesh.rotation.z - Math.PI,
                ease: Power4.easeInOut
            });
            setTimeout(() => {
                for(let i = 0, l = monoliths.length; i<l; i++) {
                    const monolith = monoliths[i];
                    const currentNote = {note: monolith.note};
                    const targetNote = audioManager.getRandomFrequence();
                    const duration = 0.4;
                    const delay = 0.25 * i;
                    TweenLite.to(monolith.mesh.position, duration, {y: (targetNote - averageNote)/2, delay: delay, ease: Elastic.easeInOut.config(1)});
                    TweenLite.to(currentNote, duration, {
                        delay: delay,
                        note: targetNote, 
                        ease: Elastic.easeInOut.config(1),
                        onUpdate : () => {
                            audioManager.playNote(monolith.osc, currentNote.note, 0.2)
                        },
                        onComplete: () => {
                            monolith.note = targetNote
                        }
                    });
                }
            }, 1000);
            setTimeout(() => {
                audioManager.playNote(audioManager.oscillators['osc1'], 0)
                audioManager.playNote(audioManager.oscillators['osc2'], 0)
                meshesRotationTargetLocked = false;
            }, 7000);
        } else {
            for(let j = 0, h = intersects.length; j<h; j++) {
                let intersect = intersects[j];
                for(let i = 0, l = monoliths.length; i<l; i++) {
                    const monolith = monoliths[i];
                    if(monolith.mesh.uuid === intersect.object.uuid) {
                        const currentNote = {note: monolith.note};
                        const targetNote = audioManager.getRandomFrequence();
                        TweenLite.to(monolith.mesh.position, 1, {y: (targetNote - averageNote)/2, ease: Elastic.easeInOut.config(1)});
                        TweenLite.to(currentNote, 1, {
                            note: targetNote, 
                            ease: Elastic.easeInOut.config(1),
                            onUpdate : () => {
                                audioManager.playNote(monolith.osc, currentNote.note, 0.2)
                            },
                            onComplete: () => {
                                monolith.note = targetNote
                            }
                        });   
                    }
                }
            }
        }
    }
};

var button = document.querySelector('.overlay-button');
button.addEventListener("click", go);

function go() {
    document.body.classList.add('visible');

    audioManager = new AudioManager();
    audioManager.initAudio();

    init();

    initEvents();

    render();
    button.removeEventListener("click", go);
};

function onWindowResize(){
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    camera.aspect = screenWidth / screenHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(screenWidth, screenHeight);
}


function initEvents() {

    window.addEventListener("resize",onWindowResize, false)
    
    canvas.addEventListener('click', (evt) => {
        getClicked3DPoint(evt);
    });

    canvas.addEventListener('mousedown', (evt) => {
        isClicking = true;
        document.body.classList.add('grabbing');
        mouse.x = (event.clientX / screenWidth - .5) * 2
        mouse.y = (event.clientY / screenHeight - .5) * 2

        originalMousePosition = {
            x: mouse.x,
            y: mouse.y,
        }

        mouseOffset.x = 0;
        mouseOffset.y = 0;
    });

    window.addEventListener('mousemove', function (event) {
        mouse.x = (event.clientX / screenWidth - .5) * 2
        mouse.y = (event.clientY / screenHeight - .5) * 2
        cameraTargetPosition = {
            x: 10*zoomLevel * (Math.cos( 4 * mouse.x )),
            z: -10*zoomLevel * (Math.sin( 4 * mouse.x )),
            y: -700*mouse.y,
        }
    });

    canvas.addEventListener('mouseup', (evt) => {
        isClicking = false;
        document.body.classList.remove('grabbing');

        originalMousePosition = {
            x: 0,
            x: 0,
        }
        mouseOffset.x = 0;
        mouseOffset.y = 0;
    });

    document.addEventListener('keydown', (evt) => {
        if(evt.keyCode === 38) {
            meshesRotationTarget += 10;
        }
        if(evt.keyCode === 40) {
            meshesRotationTarget -= 10;
        }
        if(evt.keyCode === 32) {
            renderer.autoClear = !renderer.autoClear;
        }
    });

    document.addEventListener('mousewheel', (event) => {
        if( (zoomLevel > zoomMax && event.deltaY > 0) || (zoomLevel < -zoomMax && event.deltaY < 0) )  {
            return false;
        }
        zoomLevel += event.deltaY / 4;

        cameraTargetPosition = {
            x: 10*zoomLevel * (Math.cos( 4 * mouse.x )),
            z: -10*zoomLevel * (Math.sin( 4 * mouse.x )),
            y: -700*mouse.y,
        }
    });

    let buttonAdd = document.querySelector('.button--add');
    let buttonRemove = document.querySelector('.button--remove');
    buttonAdd.addEventListener('click', (event) => {
        let options = {};

        let oscIndex = 0;
        options.osc = audioManager.oscillators[Object.keys(audioManager.oscillators)[oscIndex]];
        options.note = audioManager.getRandomFrequence();

        let distance = (50 + Math.random()*500);
        let angle = Math.random();
        options.distance = distance;
        options.angle = angle;
        let positionY = (options.note - averageNote)/2;
        options.position = {
            x: 0,
            y: 1000,
            z: Math.max(80, distance * Math.sin(angle))
        }
        let monolith = new Monolith(options);
        monolith.mesh.lookAt(new THREE.Vector3(0, options.position.y, 0));
        monoliths.push(monolith);
        monolithMeshes.add( monolith.parent );

        TweenLite.to(monolith.mesh.position, 1, {
            y: positionY, 
            ease: Power4.easeOut,
            onUpdate : () => {
                audioManager.playNote(monolith.osc, options.note - 0.1*(positionY-monolith.mesh.position.y), 0.2)
            },
        });
    });

    buttonRemove.addEventListener('click', (event) => {
        let monolith = this.monoliths[0];
        if(monolith) {
            this.monoliths.shift();
            TweenLite.to(monolith.mesh.position, 1, {y: -1000, ease: Power1.easeIn, onComplete: () => {
                monolith.parent.remove(monolith.mesh)
                monolithMeshes.remove(monolith.parent);
            }});
        }
    });

}

function render() {
    requestAnimationFrame( render );
    controls.update();
    delta = clock.getDelta();
    updateGradient();
    for(let i = 0; i < monoliths.length; i++) {
        let monolith = monoliths[i];
        monolith.update(clock.elapsedTime, meshesRotation);
    }

    if(!meshesRotationTargetLocked) {
        meshesRotationTarget += (1 - meshesRotationTarget) * lerp;
    }
    meshesRotation += (meshesRotationTarget - meshesRotation) * lerp2;

    if(!useOrbitControls) {
        /*TweenLite.to(camera.position, 1, {
            x: 10*zoomLevel * (Math.cos( 4 * mouse.x )),
            z: -10*zoomLevel * (Math.sin( 4 * mouse.x )),
            y: -700*mouse.y,
            ease: Power2.easeOut
        });*/
        camera.position.x += (cameraTargetPosition.x - camera.position.x) * lerp2;
        camera.position.y += (cameraTargetPosition.y - camera.position.y) * lerp2;
        camera.position.z += (cameraTargetPosition.z - camera.position.z) * lerp2;
    }

    camera.lookAt( scene.position );
    renderer.render( scene, camera );
}