import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import * as BufferGeometryUtils from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/utils/BufferGeometryUtils.js';

import { third_person_camera } from './third-person-camera.js';
import { entity_manager } from './entity-manager.js';
import { player_entity } from './player-entity.js'
import { entity } from './entity.js';
import { health_component } from './health-component.js';
import { player_input } from './player-input.js';
import { npc_entity } from './npc-entity.js';
import { spatial_hash_grid } from './spatial-hash-grid.js';
import { spatial_grid_controller } from './spatial-grid-controller.js';
import { attack_controller } from './attacker-controller.js';

class Game {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._musicStatus = false;
    this._music = new Audio('resources/sounds/DJ_Birdy_-_Chicken_Dance.mp3');
    this._music.loop = true;
    this._music.volume = 0.1;

    this._zombiesToKill = 10;

    this._spotLightParam = {
      y: 19,
      angle: 0.2,
    }
    this._spotLightParam.radius = Math.tan(this._spotLightParam.angle / 2) * this._spotLightParam.y * 5;

    this._discoSpotLightParam = {
      radius: 50,
      height: 17,
    }

    this._spotLightsLeft = {
      spotLights: [],
      targets: [],
      cones: [],
    }

    this._spotLightsRight = {
      spotLights: [],
      targets: [],
      cones: [],
    }

    this._discoSpotLights = {
      spotLights: [],
      targets: [],
      cones: [],
    }

    this._planeDimensions = {
      width: 100,
      depth: 100,
      height: 20,
    }

    const container = document.createElement('div');
    container.setAttribute('id', 'game-render');
    document.getElementById('game-container').appendChild(container);

    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.gammaFactor = 2.2;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.id = 'threejs';
    this._threejs.toneMapping = THREE.ReinhardToneMapping;

    container.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 10000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000000);

    this._LoadLight();
    this._LoadScene();

    this._entityManager = new entity_manager.EntityManager();
    this._grid = new spatial_hash_grid.SpatialHashGrid(
      [[-1000, -1000], [1000, 1000]], [100, 100]);

    this._LoadPlayer();
    this._LoadNPCs();

    this._previousRAF = null;
    this._RAF();

    window.addEventListener('keydown', () => {
      if (!this._musicStatus) {
        this._music.play();
        this._musicStatus = true;
      }
    });
  }

  _generateRandomHexColor() {
    const hexColor = Math.floor(Math.random() * 16777215).toString(16);
    return `#${hexColor.padStart(6, '0')}`;
  }

  _genSpotLightsRow(num, offset, height, axis, container) {
    let spotLightColor = this._generateRandomHexColor();
    let x;
    let z;
    if (axis === 'x') {
      x = offset;
    } else if (axis === 'z') {
      z = offset;
    }

    let coneMaterial = new THREE.MeshBasicMaterial({
      color: spotLightColor,
      transparent: true,
      opacity: .05,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < num; ++i) {
      let val = this._planeDimensions.depth * (2 * i + 1) / (2 * num) - this._planeDimensions.depth / 2;
      if (axis === 'x') {
        z = val
      } else if (axis === 'z') {
        x = val;
      }


      let spotLight = new THREE.SpotLight(spotLightColor, 5);
      spotLight.position.set(x, height, z);
      spotLight.angle = this._spotLightParam.angle;
      spotLight.penumbra = 0.7;
      spotLight.castShadow = true;

      let target = new THREE.Object3D();
      target.position.set(x, 0, z);
      spotLight.target = target;

      let coneMesh = new THREE.Mesh(new THREE.ConeGeometry(this._spotLightParam.radius + 13, height + 100, 64), coneMaterial);
      coneMesh.position.copy(spotLight.position);
      let geometry = coneMesh.geometry;
      geometry.computeBoundingBox();
      let size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      geometry.translate(0, -size.y / 2, 0);
      coneMesh.position.y = height;

      this._scene.add(spotLight);
      this._scene.add(target);
      this._scene.add(coneMesh);

      container.spotLights.push(spotLight)
      container.targets.push(target);
      container.cones.push(coneMesh);
    }
  }

  _genDiscoSpotLights(num, x, y, z, container) {
    for (let i = 0; i < num; ++i) {
      let spotLightColor = this._generateRandomHexColor();
      let coneMaterial = new THREE.MeshBasicMaterial({
        color: spotLightColor,
        transparent: true,
        opacity: .05,
        side: THREE.DoubleSide
      });

      let angle = (i / num) * 2 * Math.PI;
      let _x = this._discoSpotLightParam.radius * Math.cos(angle);
      let _y = 0;
      let _z = this._discoSpotLightParam.radius * Math.sin(angle);

      let spotLight = new THREE.SpotLight(spotLightColor, 5);
      spotLight.position.set(x, y, z);
      spotLight.angle = this._spotLightParam.angle;
      spotLight.penumbra = 0.7;
      spotLight.castShadow = true;
      spotLight.shadow.camera.near = 1;
      spotLight.shadow.camera.far = 10;

      let target = new THREE.Object3D();
      target.position.set(_x, _y, _z);
      spotLight.target = target;

      let coneMesh = new THREE.Mesh(new THREE.ConeGeometry(this._spotLightParam.radius + 13, y + 100, 64), coneMaterial);
      coneMesh.position.copy(spotLight.position);
      let geometry = coneMesh.geometry;
      geometry.computeBoundingBox();
      let size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      geometry.translate(0, -size.y / 2, 0);
      coneMesh.position.y = y;
      coneMesh.rotation.z = Math.atan(_x / y);
      coneMesh.rotation.x = Math.atan(_z / y);

      this._scene.add(spotLight);
      this._scene.add(target);
      this._scene.add(coneMesh);

      container.spotLights.push(spotLight)
      container.targets.push(target);
      container.cones.push(coneMesh);
    }
  }

  _LoadLight() {
    this._scene.add(new THREE.AmbientLight(0x0c0c0c, 0.2));
    this._genSpotLightsRow(4, this._planeDimensions.width / 2, this._spotLightParam.y, 'x', this._spotLightsLeft);
    this._genDiscoSpotLights(2, 0, this._discoSpotLightParam.height, 0, this._discoSpotLights);

  }

  _createDiscoClubBox() {
    const textureLoader = new THREE.TextureLoader();
    const textures = [
      textureLoader.load('resources/textures/terrain/disco_wall1.png'),
      textureLoader.load('resources/textures/terrain/disco_wall1.png'),
      textureLoader.load('resources/textures/terrain/disco_wall3.png'),
      textureLoader.load('resources/textures/terrain/disco_wall2.png'),
      textureLoader.load('resources/textures/terrain/dancefloor2.png'),
      textureLoader.load('resources/textures/terrain/dancefloor2.png'),
    ];

    const materials = textures.map(texture => {
      let mat = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 10,
        specular: 0x111111,
        side: THREE.DoubleSide,
      });
      mat.map.repeat.set(-2, 1);
      if (texture === textures[4] || texture === textures[5]) {
        mat.map.repeat.set(2, 2);
      }
      mat.map.wrapS = THREE.RepeatWrapping;
      mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.colorSpace = THREE.SRGBColorSpace;
      return mat;
    });

    const group = new THREE.Group();

    const dim = this._planeDimensions;
    const planes = [
      new THREE.PlaneGeometry(dim.width, dim.height), // front
      new THREE.PlaneGeometry(dim.width, dim.height), // back
      new THREE.PlaneGeometry(dim.depth, dim.height), // left
      new THREE.PlaneGeometry(dim.depth, dim.height), // right
      new THREE.PlaneGeometry(dim.width, dim.depth),  // top
      new THREE.PlaneGeometry(dim.width, dim.depth)   // bottom
    ];

    const offsets = [
      new THREE.Vector3(0, dim.height/2, dim.depth / 2),  // front
      new THREE.Vector3(0, dim.height/2, -dim.depth / 2), // back
      new THREE.Vector3(-dim.width / 2, dim.height/2, 0), // left
      new THREE.Vector3(dim.width / 2, dim.height/2, 0),  // right
      new THREE.Vector3(0, dim.height, 0), // top
      new THREE.Vector3(0, 0, 0) // bottom
    ];

    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(planes[i], materials[i]);
      if(i === 2 || i === 3) {
        mesh.rotation.y = Math.PI / 2;
      }
      if(i === 4 || i === 5) {
        mesh.rotation.x = Math.PI / 2;
      }
      mesh.position.copy(offsets[i]);
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    this._scene.add(group);
  }

  _LoadScene() {
    // const gridHelper = new THREE.GridHelper(2000, 20, 0x00ff00, 0xffffff);
    // this._scene.add(gridHelper);

    // DISCO CLUB BOX
    this._createDiscoClubBox();

    // const geometry = new THREE.BoxGeometry(this._planeDimensions.width, this._planeDimensions.height, this._planeDimensions.depth);
    const textureLoader = new THREE.TextureLoader();

    // DISCO BALL

    const discoBallTxt = textureLoader.load('resources/textures/material/matcap-crystal.png');
    const dummy = new THREE.Object3D();

    const mirrorMaterial = new THREE.MeshMatcapMaterial({
      matcap: discoBallTxt
    });

    let geometryOriginal = new THREE.IcosahedronBufferGeometry(3, 3);
    geometryOriginal = BufferGeometryUtils.mergeVertices(geometryOriginal);
    geometryOriginal.computeVertexNormals();

    const mirrorGeometry = new THREE.PlaneBufferGeometry(.3, .3);
    let instancedMirrorMesh = new THREE.InstancedMesh(
      mirrorGeometry,
      mirrorMaterial,
      geometryOriginal.attributes.position.count
    );
    // instancedMirrorMesh.receiveShadow = true;
    // instancedMirrorMesh.castShadow = true;

    const positions = geometryOriginal.attributes.position.array;
    const normals = geometryOriginal.attributes.normal.array;
    for (let i = 0; i < positions.length; i += 3) {
      dummy.position.set(positions[i], positions[i + 1], positions[i + 2]);
      dummy.lookAt(positions[i] + normals[i], positions[i + 1] + normals[i + 1], positions[i + 2] + normals[i + 2]);
      dummy.updateMatrix();
      instancedMirrorMesh.setMatrixAt(i / 3, dummy.matrix);
    }

    const obj = new THREE.Group();
    const innerGeometry = geometryOriginal.clone();
    const ballInnerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const innerMesh = new THREE.Mesh(
      innerGeometry,
      ballInnerMaterial
    );
    innerMesh.receiveShadow = true;
    innerMesh.castShadow = true;
    obj.add(innerMesh, instancedMirrorMesh);
    obj.position.set(0, 17, 0);

    this._scene.add(obj);
    this._discoBall = obj;

  }

  _LoadPlayer() {
    const params = {
      camera: this._camera,
      scene: this._scene,
      dim: this._planeDimensions,
    };

    const player = new entity.Entity();
    player.AddComponent(new player_input.BasicCharacterControllerInput(params));
    player.AddComponent(new player_entity.BasicCharacterController(params));
    player.AddComponent(new health_component.HealthComponent({
      health: 100,
      maxHealth: 100,
      strength: 5000,
    }));
    player.AddComponent(
      new spatial_grid_controller.SpatialGridController({ grid: this._grid }));
    player.AddComponent(new attack_controller.AttackController({ timing: 0.25 }));
    this._entityManager.Add(player, 'player');

    const camera = new entity.Entity();
    camera.AddComponent(
      new third_person_camera.ThirdPersonCamera({
        camera: this._camera,
        target: this._entityManager.Get('player')
      }));
    this._entityManager.Add(camera, 'player-camera');

    // ORBIT CONTROLS

    // this._orbitControls = new OrbitControls(
    //     this._camera, this._threejs.domElement);
    // this._orbitControls.target.set(0, 10, 0);
    // this._orbitControls.update();
  }

  _LoadNPCs() {
    for (let i = 0; i < this._zombiesToKill; ++i) {
      const npc = new entity.Entity();
      npc.AddComponent(new npc_entity.NPCController({
        camera: this._camera,
        scene: this._scene,
        resourceName: 'zombie.fbx',
        danceName: `dance${i + 1}.fbx`,
      }));
      npc.AddComponent(
        new health_component.HealthComponent({
          health: 50,
          maxHealth: 50,
        }));
      npc.AddComponent(
        new spatial_grid_controller.SpatialGridController({ grid: this._grid }));
      npc.SetPosition(new THREE.Vector3(
        (Math.random() * this._planeDimensions.width) - this._planeDimensions.width / 2,
        0,
        (Math.random() * this._planeDimensions.depth) - this._planeDimensions.depth / 2));
      this._entityManager.Add(npc, 'npc-zombie-' + i);
    }
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();


      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _UpdateSpotLights(elapsedTime) {
    for (let i = 0; i < this._spotLightsLeft.spotLights.length; i++) {
      let spotLight = this._spotLightsLeft.spotLights[i];
      let target = this._spotLightsLeft.targets[i];
      let coneMesh = this._spotLightsLeft.cones[i];

      let spotLightPosX = this._planeDimensions.width / 2 * Math.sin(elapsedTime);
      target.position.x = spotLightPosX;
      coneMesh.rotation.z = -Math.atan(Math.abs(spotLightPosX - this._planeDimensions.width / 2) / this._spotLightParam.y);

      spotLight.target.updateMatrixWorld();
    }
  }

  _UpdateDiscoSpotLights(elapsedTime) {
    let discoSpotLightsNum = this._discoSpotLights.spotLights.length;
    for (let i = 0; i < discoSpotLightsNum; i++) {
      let spotLight = this._discoSpotLights.spotLights[i];
      let target = this._discoSpotLights.targets[i];
      let coneMesh = this._discoSpotLights.cones[i];

      let spotLightPosX = this._discoSpotLightParam.radius * Math.cos(elapsedTime + ((2 * Math.PI) / discoSpotLightsNum) * i);
      let spotLightPosZ = this._discoSpotLightParam.radius * Math.sin(elapsedTime + ((2 * Math.PI) / discoSpotLightsNum) * i);
      target.position.x = spotLightPosX;
      target.position.z = spotLightPosZ;
      spotLight.target.updateMatrixWorld();
      // coneMesh.rotation.x = Math.atan(spotLightPosX / this._discoSpotLightParam.height);
      // coneMesh.rotation.z = Math.atan(spotLightPosZ / this._discoSpotLightParam.height);
      
      coneMesh.rotation.y = -elapsedTime;
    }
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    const elapsedTime = performance.now() / 1000;

    this._discoBall.rotation.y += 0.05;

    this._UpdateSpotLights(elapsedTime);
    this._UpdateDiscoSpotLights(2.5*elapsedTime);

    this._entityManager.Update(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new Game();
});
