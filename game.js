const c=document.getElementById('c')
const g=c.getContext('2d')
c.width=innerWidth
c.height=innerHeight
g.imageSmoothingEnabled=false

const S=3
const W=32*S
const off=4
const me=new Image()
me.src='banko.png'
const pl=new Image()
pl.src='bar.png'
const bg=new Image()
bg.src='bg.png'

const keys={}
const p={w:16*S,h:16*S,x:0,y:0,vx:0,vy:0}
let bars,score,dead,dir
let best=+localStorage.getItem('best')||0

const sn=v=>Math.round(v/S)*S

onkeydown=e=>{
  keys[e.key.toLowerCase()]=true
  if(e.key==' '&&dead)start()
}
onkeyup=e=>keys[e.key.toLowerCase()]=false

function fill(){
  let top=bars[bars.length-1].y
  while(top>-100){
    const prev=bars[bars.length-1]
    top-=60+Math.random()*Math.min(30+score/100,50)
    const range=c.width-W
    let x=prev.x+(Math.random()*2-1)*180
    x=((x%range)+range)%range
    bars.push({x,y:top,t:Math.random()<0.12?1:0})
  }
}

function start(){
  bars=[{x:c.width/2-W/2,y:c.height-60,t:0}]
  score=0
  dead=false
  dir=1
  p.x=c.width/2-p.w/2
  p.y=bars[0].y+off*S-p.h
  p.vx=0
  p.vy=-12
  fill()
}

function update(){
  if(dead)return
  const l=keys.arrowleft||keys.a
  const r=keys.arrowright||keys.d
  p.vx=l?-6:r?6:0
  if(p.vx)dir=p.vx>0?1:-1
  const old=p.y+p.h
  p.vy+=0.4
  p.x+=p.vx
  p.y+=p.vy
  if(p.x>c.width)p.x=-p.w
  if(p.x<-p.w)p.x=c.width
  if(p.vy>0)for(const b of bars){
    const top=b.y+off*S
    if(old<=top&&p.y+p.h>=top&&p.x+p.w>b.x+4&&p.x<b.x+W-4){
      p.y=top-p.h
      p.vy=b.t?-20:-12
      break
    }
  }
  const mid=c.height*0.4
  if(p.y<mid){
    const d=mid-p.y
    p.y=mid
    for(const b of bars)b.y+=d
    score+=d
  }
  bars=bars.filter(b=>b.y<c.height+50)
  fill()
  if(p.y>c.height){
    dead=true
    const s=Math.floor(score/10)
    if(s>best){
      best=s
      localStorage.setItem('best',best)
    }
  }
}

function draw(){
  const bw=64*S
  const oy=(score*0.3)%bw
  for(let y=-bw+oy;y<c.height;y+=bw)for(let x=0;x<c.width;x+=bw)g.drawImage(bg,x,y,bw,bw)
  for(const b of bars)g.drawImage(pl,0,b.t*16,32,16,sn(b.x),sn(b.y),W,16*S)
  const f=me.height>=32&&p.vy>0?16:0
  const px=sn(p.x)
  const py=sn(p.y)
  if(dir<0){
    g.save()
    g.translate(px+p.w,py)
    g.scale(-1,1)
    g.drawImage(me,0,f,16,16,0,0,p.w,p.h)
    g.restore()
  }else g.drawImage(me,0,f,16,16,px,py,p.w,p.h)
  g.fillStyle='#fff'
  g.font='20px monospace'
  g.textAlign='left'
  g.fillText('Score '+Math.floor(score/10),16,30)
  g.fillText('Best '+best,16,56)
  if(dead){
    g.textAlign='center'
    g.font='40px monospace'
    g.fillText('GAME OVER',c.width/2,c.height/2)
    g.font='20px monospace'
    g.fillText('Press Space to restart',c.width/2,c.height/2+40)
  }
}

let last=0
let acc=0
function loop(t){
  acc+=Math.min(t-last,100)
  last=t
  while(acc>=1000/60){
    update()
    acc-=1000/60
  }
  draw()
  requestAnimationFrame(loop)
}

start()
requestAnimationFrame(loop)