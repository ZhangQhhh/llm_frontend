<template>
  <div ref="containerRef" class="three-background"></div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

export default defineComponent({
  name: 'ThreeBackground',
  setup() {
    const containerRef = ref<HTMLDivElement | null>(null);
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let particles: THREE.Points;
    let animationId: number;
    let mouseX = 0;
    let mouseY = 0;

    const initThree = () => {
      if (!containerRef.value) return;

      const container = containerRef.value;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // 创建场景
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.001);

      // 创建相机
      camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
      camera.position.z = 400;

      // 创建渲染器
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      // 创建粒子系统 - 大幅减少粒子数量以提升性能
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 30; // 从1000减少到30，大幅降低渲染负担
      const posArray = new Float32Array(particlesCount * 3);
      const colorArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i += 3) {
        // 位置
        posArray[i] = (Math.random() - 0.5) * 1000;
        posArray[i + 1] = (Math.random() - 0.5) * 1000;
        posArray[i + 2] = (Math.random() - 0.5) * 1000;

        // 颜色 - 紫色到蓝色渐变
        const color = new THREE.Color();
        color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.6);
        colorArray[i] = color.r;
        colorArray[i + 1] = color.g;
        colorArray[i + 2] = color.b;
      }

      particlesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(posArray, 3)
      );
      particlesGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colorArray, 3)
      );

      // 粒子材质
      const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      // 添加连接线
      const linesGeometry = new THREE.BufferGeometry();
      const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
      });

      const linesPositions: number[] = [];
      const positions = particlesGeometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 9) {
        if (Math.random() > 0.98) {
          linesPositions.push(
            positions[i],
            positions[i + 1],
            positions[i + 2],
            positions[i + 3],
            positions[i + 4],
            positions[i + 5]
          );
        }
      }

      linesGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linesPositions, 3)
      );
      const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
      scene.add(lines);

      // 添加光晕效果
      const glowGeometry = new THREE.SphereGeometry(150, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      scene.add(glow);

      // 鼠标移动事件
      const onMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX / width) * 2 - 1;
        mouseY = -(event.clientY / height) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouseMove);

      // 窗口大小调整
      const onWindowResize = () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };
      window.addEventListener('resize', onWindowResize);

      // 动画循环
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        // 粒子旋转和移动
        particles.rotation.x += 0.0003;
        particles.rotation.y += 0.0005;

        // 根据鼠标位置调整相机
        camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 50 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // 光晕脉动效果
        glow.scale.x = 1 + Math.sin(Date.now() * 0.001) * 0.1;
        glow.scale.y = 1 + Math.sin(Date.now() * 0.001) * 0.1;
        glow.scale.z = 1 + Math.sin(Date.now() * 0.001) * 0.1;

        renderer.render(scene, camera);
      };

      animate();
    };

    onMounted(() => {
      initThree();
    });

    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer) {
        renderer.dispose();
      }
    });

    return {
      containerRef,
    };
  },
});
</script>

<style scoped>
.three-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.three-background canvas {
  display: block;
}
</style>
