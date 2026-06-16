const BACKGROUND = "#101010" // #101010 是十六进制颜色代码，其RGB值为rgb(16, 16, 16)，比纯黑色#000000稍微亮一点
const FOREGROUND = "#50FF50"

console.log(game) // 可以直接用js变量名来引用对应id的html标签对象，此处代码等价于console.log(document.getElementById("game"))
// console.log(document.getElementById("game"))
game.width = 800
game.height = 800
const ctx = game.getContext("2d")
console.log(ctx)

// 清空屏幕为背景色
function clear() {
  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, game.width, game.height)
}

// put a point in a particular space
function point({x, y}) {
  const s = 20;
  ctx.fillStyle = FOREGROUND
  ctx.fillRect(x - s / 2, y - s / 2, s, s)
}

function line(p1, p2) {
  ctx.lineWidth = 3
  ctx.strokeStyle = FOREGROUND
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.stroke()
}

function screen(p) {
  // x: -1..1 => 0..2 => 0..1 => 0..w
  // y: -1..1 => 0..2 => 1..0 => h..0
  return { 
    x: (p.x + 1) / 2 * game.width,
    y: (1 - (p.y + 1) / 2) * game.height
  }
}

function project({x, y, z}) {
  return {
    x: x / z,
    y: y / z
  }
}

const FPS = 60

// const vs = [
//   {x:  0.25, y:  0.25, z:  0.25}, 
//   {x: -0.25, y:  0.25, z:  0.25}, 
//   {x: -0.25, y: -0.25, z:  0.25}, 
//   {x:  0.25, y: -0.25, z:  0.25},
//   {x:  0.25, y:  0.25, z: -0.25}, 
//   {x: -0.25, y:  0.25, z: -0.25}, 
//   {x: -0.25, y: -0.25, z: -0.25}, 
//   {x:  0.25, y: -0.25, z: -0.25}
// ]
//
// const fs = [
//   [0, 1, 2, 3],
//   [4, 5, 6, 7],
//   [0, 4],
//   [1, 5],
//   [2, 6],
//   [3, 7]
// ]

function translate_z({x, y, z}, dz) {
  return {x, y, z: z + dz}
}

function rotate_xz({x, y, z}, angle) {
  // To rotate a vector with components (x, y) counter-clockwise by an angle β around the origin, use the following formulas:\(x' = x \cos(\beta) - y \sin(\beta)\)\(y' = x \sin(\beta) + y \cos(\beta)\)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x: x * c - z * s,
    y,
    z: x * s + z * c
  }
}

let dz = 1
let angle = 0

// 1. 这里把 const 改为 let，先初始化为空数组
let vs = []
let fs = []

function frame() {
  const dt = 1 / FPS
  angle += Math.PI * dt
  clear()

  // 遍历绘制 3D 模型的连线
  for (const f of fs) {
    for (let i = 0; i < f.length; ++i) {
      const a = vs[f[i]]
      const b = vs[f[(i + 1) % f.length]]
      
      // 预防性保护：确保顶点存在再绘制
      if (a && b) {
        line(
          screen(project(translate_z(rotate_xz(a, angle), dz))),
          screen(project(translate_z(rotate_xz(b, angle), dz)))
        )
      }
    }
  }
  setTimeout(frame, 1000 / FPS)
}

/**
 * 将顶点数组等比放大指定的倍数
 * @param {Array} vertexArray - 原来的 vs 数组
 * @param {number} scaleFactor - 放大的倍数 (例如：2 表示放大到 2 倍，0.5 表示缩小一半)
 * @returns {Array} - 放大后的新顶点数组
 */
function scaleVertices(vertexArray, scaleFactor) {
  return vertexArray.map(v => ({
    x: v.x * scaleFactor,
    y: v.y * scaleFactor,
    z: v.z * scaleFactor
  }));
}

// 2. 新增：用 fetch 异步加载你的 3D 模型 JSON
// 请把 'my_model.json' 换成你实际生成的 json 文件路径
fetch('miku.json')
  .then(response => {
    if (!response.ok) {
      throw new Error("无法加载 JSON 模型文件");
    }
    return response.json();
  })
  .then(data => {
    // 3. 把加载到的数据赋值给全局变量
    vs = data.vs;
    fs = data.fs;
    vs = scaleVertices(vs, 2)
    
    console.log(`模型加载成功！顶点数: ${vs.length}, 面数: ${fs.length}`);
    
    // 4. 数据准备好了，正式启动游戏循环
    frame();
  })
  .catch(err => {
    console.error("加载模型出错:", err);
  });
