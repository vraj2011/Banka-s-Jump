const c=document.getElementById('c')
const g=c.getContext('2d')

c.width=innerWidth
c.height=innerHeight

g.imageSmoothingEnabled=false

const S=3
const W=32*S
const off=4
const BREAK=30
const LV=200
const TINT=['rgba(0,0,0,0)','rgba(130,0,170,0.25)','rgba(0,130,130,0.25)','rgba(170,70,0,0.25)','rgba(170,0,50,0.3)']
const F='"Press Start 2P",monospace'

const me=new Image()
me.src='banko.png'

const pl=new Image()
pl.src='bar.png'

const bg=new Image()
bg.src='bg.png'

document.fonts.load('16px "Press Start 2P"')

const keys={}
const p={w:16*S,h:16*S,x:0,y:0,vx:0,vy:0}

let bars,score,dead,dir,fresh,ty,lx,lt,lv,ban
let best=+localStorage.getItem('best')||0
let ac
let mute=localStorage.getItem('mute')=='1'

const sn=v=>Math.round(v/S)*S
const lvl=()=>Math.floor(score/10/LV)
const bl=()=>Math.floor(best/LV)+1

function wake(){
  if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)()
  if(ac.state=='suspended')ac.resume()
}

const VOL=5

function snd(f1,f2,dur,type,vol,delay){
  if(mute||!ac)return

  const t=ac.currentTime+(delay||0)
  const o=ac.createOscillator()
  const v=ac.createGain()

  o.type=type
  o.frequency.setValueAtTime(f1,t)
  o.frequency.exponentialRampToValueAtTime(f2,t+dur)

  v.gain.setValueAtTime(Math.min(vol*VOL,1),t)
  v.gain.exponentialRampToValueAtTime(0.001,t+dur)

  o.connect(v)
  v.connect(ac.destination)
  o.start(t)
  o.stop(t+dur)
}

const jump=()=>snd(300,600,0.12,'square',0.06)

const boost=()=>{
  snd(300,1400,0.3,'square',0.07)
  snd(600,1800,0.3,'triangle',0.07,0.05)
}

const crack=()=>snd(220,70,0.2,'sawtooth',0.05)
const crumble=()=>snd(160,40,0.4,'sawtooth',0.06)

const over=()=>{
  snd(400,90,0.7,'sawtooth',0.08)
  snd(300,60,0.7,'square',0.05,0.1)
}

const win=()=>{
  snd(523,523,0.12,'square',0.07)
  snd(659,659,0.12,'square',0.07,0.12)
  snd(784,784,0.12,'square',0.07,0.24)
  snd(1047,1047,0.3,'square',0.07,0.36)
}

const levelup=()=>{
  snd(440,440,0.1,'square',0.07)
  snd(660,660,0.1,'square',0.07,0.1)
  snd(880,1100,0.25,'square',0.07,0.2)
}

onkeydown=e=>{
  wake()
  const k=e.key.toLowerCase()
  keys[k]=true

  if(k=='m'&&!e.repeat){
    mute=!mute
    localStorage.setItem('mute',mute?'1':'0')
  }

  if(e.key==' '&&dead)start()
}

onkeyup=e=>keys[e.key.toLowerCase()]=false

onpointerdown=()=>{
  wake()
  if(dead)start()
}

function fill(){
  while(ty>-100){
    ty-=55+Math.min(lvl(),8)*4+Math.random()*Math.min(30+score/100,50)

    const range=c.width-W
    let x=lx+(Math.random()*2-1)*180
    x=((x%range)+range)%range

    const r=Math.random()
    const bk=0.12+Math.min(lvl(),8)*0.02
    const t=lt==2?0:r<bk?2:r<bk+0.1?1:0

    bars.push({x,y:ty,t,hit:0,vy:0})
    lx=x
    lt=t
  }
}

function start(){
  bars=[{x:c.width/2-W/2,y:c.height-60,t:0,hit:0,vy:0}]
  ty=bars[0].y
  lx=bars[0].x
  lt=0
  score=0
  dead=false
  fresh=false
  lv=0
  ban=0
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

  for(const b of bars){
    if(b.t!=2||!b.hit)continue

    b.hit++
    if(b.hit==BREAK)crumble()

    if(b.hit>BREAK){
      b.vy+=0.5
      b.y+=b.vy
    }
  }

  if(p.vy>0)for(const b of bars){
    if(b.hit>BREAK)continue

    const top=b.y+off*S

    if(old<=top&&p.y+p.h>=top&&p.x+p.w>b.x+4&&p.x<b.x+W-4){
      p.y=top-p.h
      p.vy=b.t==1?-20:-12

      if(b.t==1)boost()

      else if(b.t==2){
        if(!b.hit){
          b.hit=1
          crack()
        }
      }

      else jump()
      break
    }
  }

  const mid=c.height*0.4

  if(p.y<mid){
    const d=mid-p.y
    p.y=mid

    for(const b of bars)b.y+=d
    ty+=d
    score+=d
  }

  if(ban>0)ban--

  const n=lvl()

  if(n>lv){
    lv=n
    ban=120
    levelup()
  }

  bars=bars.filter(b=>b.y<c.height+50)
  fill()

  if(p.y>c.height){
    dead=true

    const s=Math.floor(score/10)

    if(s>best){
      best=s
      fresh=true
      localStorage.setItem('best',best)
      win()
    }

    else over()
  }
}

function text(t,x,y,size,col,shadow){
  g.font=size+'px '+F

  if(shadow){
    g.fillStyle=shadow
    g.fillText(t,x+size/8,y+size/8)
  }

  g.fillStyle=col
  g.fillText(t,x,y)
}

function draw(){
  const bw=64*S
  const oy=(score*0.3)%bw

  for(let y=-bw+oy;y<c.height;y+=bw)for(let x=0;x<c.width;x+=bw)g.drawImage(bg,x,y,bw,bw)

  g.fillStyle=TINT[lv%TINT.length]
  g.fillRect(0,0,c.width,c.height)

  for(const b of bars){
    let bx=sn(b.x)

    if(b.hit&&b.hit<=BREAK)bx+=(Math.floor(b.hit/3)%2?S:-S)
    if(b.hit>BREAK)g.globalAlpha=Math.max(0,1-(b.hit-BREAK)/30)

    g.drawImage(pl,0,b.t*16,32,16,bx,sn(b.y),W,16*S)
    g.globalAlpha=1
  }

  const f=me.height>=32&&p.vy>0?16:0
  const px=sn(p.x)
  const py=sn(p.y)

  if(dir<0){
    g.save()
    g.translate(px+p.w,py)
    g.scale(-1,1)
    g.drawImage(me,0,f,16,16,0,0,p.w,p.h)
    g.restore()
  }

  else g.drawImage(me,0,f,16,16,px,py,p.w,p.h)

  g.textAlign='left'
  g.textBaseline='top'

  text('SCORE '+Math.floor(score/10),16,16,16,'#fff','#000')
  text('BEST LEVEL '+bl()+' ('+best+')',16,42,16,'#ffd34d','#000')
  text('LEVEL '+(lv+1),16,68,16,'#8cf','#000')

  g.textAlign='right'

  text('M: SOUND '+(mute?'OFF':'ON'),c.width-16,16,12,'#aaa','#000')

  if(ban>0&&!dead){
    g.textAlign='center'
    g.globalAlpha=Math.min(1,ban/30)

    text('LEVEL '+(lv+1),c.width/2,c.height*0.25,Math.min(40,c.width/14),'#fff','#000')
    g.globalAlpha=1
  }

  if(dead){
    const m=c.width/2
    const h=c.height/2
    const big=Math.min(56,c.width/11)

    g.fillStyle='rgba(0,0,0,0.75)'
    g.fillRect(0,0,c.width,c.height)
    g.textAlign='center'

    text('GAME OVER',m,h-big*2,big,'#ff3b3b','#5a0000')
    text('SCORE',m,h-big*0.3,16,'#aaa')
    text(Math.floor(score/10),m,h+16,big*0.7,'#fff','#222')

    if(fresh){
      if(Math.floor(Date.now()/300)%2)text('NEW BEST!',m,h+big*1.2,20,'#ffd34d','#5a4400')
    }

    else text('BEST LEVEL '+bl()+' ('+best+')',m,h+big*1.2,16,'#ffd34d')

    if(Math.floor(Date.now()/500)%2)text('PRESS SPACE OR TAP',m,h+big*2.4,16,'#fff')
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
