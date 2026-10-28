// Quelle für www/js/lib/three-mini.js (three.js 0.170.0, nur die Teile, die das Restaurant braucht).
// Neu bauen: npm i three@0.170.0 esbuild && npx esbuild docs/three/entry.js --bundle --minify --format=iife --global-name=THREE --legal-comments=eof --outfile=www/js/lib/three-mini.js
export {WebGLRenderer,Scene,PerspectiveCamera,Group,Mesh,BoxGeometry,PlaneGeometry,CylinderGeometry,CircleGeometry,
  MeshStandardMaterial,MeshBasicMaterial,MeshLambertMaterial,HemisphereLight,DirectionalLight,AmbientLight,PointLight,Color,Vector2,Vector3,Box3,
  Raycaster,CanvasTexture,RepeatWrapping,SRGBColorSpace,DoubleSide,FrontSide,Fog,GridHelper,EdgesGeometry,LineSegments,LineBasicMaterial,
  ACESFilmicToneMapping,NoToneMapping,MathUtils,Object3D,Plane,Matrix4,Quaternion,Shape,ShapeGeometry,RingGeometry,BufferGeometry,BufferAttribute,Float32BufferAttribute} from 'three';
export {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
