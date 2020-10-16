class Monolith {
  constructor(options = {}) {
    this.class = this;
    this.geometry = options.geometry || new THREE.CubeGeometry(10,20,1,3,6,1);
    this.texture = options.texture ||  new THREE.TextureLoader().load( 'assets/img/black.jpg' );
    this.material = options.material || new THREE.ShaderMaterial( {
      uniforms: {
        tMatCap: {type: 't', value: this.texture },
      },
      vertexShader: document.getElementById( 'sem-vs' ).textContent,
      fragmentShader: document.getElementById( 'sem-fs' ).textContent
    } );
    this.material.uniforms.tMatCap.value.wrapS = this.material.uniforms.tMatCap.value.wrapT = THREE.ClampToEdgeWrapping;
    this.mesh = new THREE.Mesh( this.geometry, this.material );

    this.position = options.position || {x: 0, y: 0, z: 0};
    this.mesh.position.set(this.position.x, this.position.y, this.position.z)

    this.hoverable = true;

    this.rotation = {
      x: 0,
      y: 0,
      z: 0
    }

    this.parent = new THREE.Object3D();
    this.parent.position.set(0,0,0);
    this.rotationSpeed = 1/this.position.z * 1;
    // this.rotationSpeed = 0.01;
    this.parent.rotation.set(0,-options.angle,0);
    this.distance = options.distance || 1;
    this.parent.add(this.mesh);

    this.osc = options.osc || audioManager.oscillators[0];
    this.note = options.note || audioManager.allNotes[0];

    let minNote = Math.min( ...audioManager.allNotes );
    let maxNote = Math.max( ...audioManager.allNotes );
    this.volume = Math.max(1 - (this.note - minNote) / (maxNote - minNote), 0.05) * 0.15;

    this.isAnimating = false;

    return this;
  }

  onClick() {

  }

  playAnimation() {
    this.isAnimating = true;
    TweenMax.to(this.mesh.rotation, 2, {
      z: this.mesh.rotation.z - Math.PI,
      ease: Elastic.easeOut.config(1),
      onComplete: () => {
        setTimeout(() => {
          this.isAnimating = false;
        }, 100);
      }
    })
  }

  update(elapsed, meshesRotation) {
    this.parent.rotation.y += this.rotationSpeed * meshesRotation;

    let playBoth = Math.sin(this.parent.rotation.y) > 0.98 || Math.sin(this.parent.rotation.y) < -0.98;
    let playOne = Math.sin(this.parent.rotation.y) > 0.98;
    if(playOne) {
      if(!this.isAnimating) {
        audioManager.playNote(this.osc, this.note, this.volume);
        this.playAnimation();
      }
    }
  }
}