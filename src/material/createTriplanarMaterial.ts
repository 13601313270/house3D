import * as THREE from 'three';

export interface TriplanarOptions {
  map: THREE.Texture;
  normalMap?: THREE.Texture;
  tileSize?: number; // 世界单位尺寸
}

/**
 * 创建 Triplanar 材质（基于 MeshStandardMaterial）
 */
export function createTriplanarMaterial(
  options: TriplanarOptions
): THREE.MeshStandardMaterial {
  const { map, normalMap = null, tileSize = 1 } = options;

  // 基础材质（保留PBR能力）
  const material = new THREE.MeshStandardMaterial({
    map,
    normalMap: normalMap ?? undefined,
  });

  // 纹理重复模式
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  if (normalMap) {
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  }

  // @ts-ignore
  material.onBeforeCompile = (shader: THREE.Shader) => {
    // 👇 添加 uniform（这里需要扩展类型）
    (shader.uniforms as Record<string, THREE.IUniform>).tileSize = {
      value: tileSize,
    };

    // ===== 顶点着色器 =====
    shader.vertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
    #include <begin_vertex>

    vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPos.xyz;

    vWorldNormal = normalize(mat3(modelMatrix) * normal);
  `
    );

    // ===== 片元着色器 =====
    shader.fragmentShader =
      `
      uniform float tileSize;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
    ` + shader.fragmentShader;

    // 替换贴图采样逻辑
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
        vec3 blending = abs(normalize(vWorldNormal));
        blending /= (blending.x + blending.y + blending.z);

        vec2 uvX = vWorldPosition.yz / tileSize;
        vec2 uvY = vWorldPosition.xz / tileSize;
        vec2 uvZ = vWorldPosition.xy / tileSize;

        vec4 texX = texture2D(map, uvX);
        vec4 texY = texture2D(map, uvY);
        vec4 texZ = texture2D(map, uvZ);

        vec4 texColor = texX * blending.x + texY * blending.y + texZ * blending.z;

        diffuseColor *= texColor;
      `
    );

    // ===== normalMap（可选）=====
    if (normalMap) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `
          vec3 blending = abs(normalize(vWorldNormal));
          blending /= (blending.x + blending.y + blending.z);

          vec2 uvX = vWorldPosition.yz / tileSize;
          vec2 uvY = vWorldPosition.xz / tileSize;
          vec2 uvZ = vWorldPosition.xy / tileSize;

          vec3 nX = texture2D(normalMap, uvX).xyz * 2.0 - 1.0;
          vec3 nY = texture2D(normalMap, uvY).xyz * 2.0 - 1.0;
          vec3 nZ = texture2D(normalMap, uvZ).xyz * 2.0 - 1.0;

          vec3 normalTex = nX * blending.x + nY * blending.y + nZ * blending.z;
          normal = normalize(normalTex);
        `
      );
    }
  };

  return material;
}