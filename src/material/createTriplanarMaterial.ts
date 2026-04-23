import * as THREE from 'three';

export interface TriplanarOptions {
  map: THREE.Texture;
  normalMap?: THREE.Texture;
  tileSize?: number;

  // 👇 新增：控制“横向方向”（比如砖的横向）
  direction?: THREE.Vector3;

  side?: THREE.Side;
}

export function createTriplanarMaterial(
  options: TriplanarOptions
): THREE.MeshStandardMaterial {
  const {
    map,
    normalMap = null,
    tileSize = 1,
    direction = new THREE.Vector3(1, 0, 0), // 默认沿 X 方向
    side = THREE.FrontSide,
  } = options;

  const material = new THREE.MeshStandardMaterial({
    map,
    normalMap: normalMap ?? undefined,
    side,
  });

  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  if (normalMap) {
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  }

  // @ts-ignore
  material.onBeforeCompile = (shader: THREE.Shader) => {
    // uniforms
    (shader.uniforms as Record<string, THREE.IUniform>).tileSize = {
      value: tileSize,
    };
    (shader.uniforms as Record<string, THREE.IUniform>).direction = {
      value: direction.clone().normalize(),
    };

    // ===== vertex =====
    shader.vertexShader =
      `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>

        vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
        vWorldPosition = worldPos.xyz;

        vWorldNormal = normalize(normalMatrix * normal);
      `
    );

    // ===== fragment =====
    shader.fragmentShader =
      `
      uniform float tileSize;
      uniform vec3 direction;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
        // 👇 双面修正
        vec3 normalDir = gl_FrontFacing ? vWorldNormal : -vWorldNormal;

        // 👇 Triplanar blending
        vec3 blending = abs(normalize(normalDir));
        blending /= (blending.x + blending.y + blending.z);

        // 👇 构建“方向坐标系”（核心）
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 dir = normalize(direction);

        // 防止 direction 和 up 共线
        if (abs(dot(dir, up)) > 0.999) {
          up = vec3(0.0, 0.0, 1.0);
        }

        vec3 right = normalize(cross(up, dir));
        vec3 forward = normalize(cross(dir, right));

        // 👇 用统一方向生成UV（关键）
        vec2 uv = vec2(
          dot(vWorldPosition, right),
          dot(vWorldPosition, forward)
        ) / tileSize;

        // 👇 三方向采样（但方向统一）
        vec4 texX = texture2D(map, uv);
        vec4 texY = texture2D(map, uv);
        vec4 texZ = texture2D(map, uv);

        vec4 texColor = texX * blending.x + texY * blending.y + texZ * blending.z;

        diffuseColor *= texColor;
      `
    );

    // ===== normalMap（简化版）=====
    if (normalMap) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `
          vec3 normalDir = gl_FrontFacing ? vWorldNormal : -vWorldNormal;

          vec3 blending = abs(normalize(normalDir));
          blending /= (blending.x + blending.y + blending.z);

          vec3 up = vec3(0.0, 1.0, 0.0);
          vec3 dir = normalize(direction);

          if (abs(dot(dir, up)) > 0.999) {
            up = vec3(0.0, 0.0, 1.0);
          }

          vec3 right = normalize(cross(up, dir));
          vec3 forward = normalize(cross(dir, right));

          vec2 uv = vec2(
            dot(vWorldPosition, right),
            dot(vWorldPosition, forward)
          ) / tileSize;

          vec3 n = texture2D(normalMap, uv).xyz * 2.0 - 1.0;
          normal = normalize(n);
        `
      );
    }
  };

  return material;
}