// RIFTBORN Hitbox and Hurtbox Collision Primitives

export class Hitbox {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || 40;
    this.height = options.height || 40;
    
    this.damage = options.damage || 50;
    this.hitStop = options.hitStop || 6; // Freeze frames on hit
    this.knockbackX = options.knockbackX || 4;
    this.knockbackY = options.knockbackY || -2;
    this.hitStun = options.hitStun || 14;
    
    this.isHeavy = !!options.isHeavy;
    this.isLauncher = !!options.isLauncher;
    this.isUnblockable = !!options.isUnblockable;
    this.isProjectile = !!options.isProjectile;
    this.isUltimate = !!options.isUltimate;
    
    this.owner = options.owner || null;
    this.offsetX = options.offsetX !== undefined ? options.offsetX : 0;
    this.offsetY = options.offsetY !== undefined ? options.offsetY : 0;
    this.activeFrames = options.activeFrames || 6;
    this.frameTimer = 0;
    this.active = true;
    this.hasHit = false;
  }

  updatePosition() {
    if (this.owner) {
      this.x = this.owner.x + (this.owner.facing === 1 ? this.offsetX : -this.offsetX - this.width);
      this.y = this.owner.y + this.offsetY;
    }
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
}

export class Hurtbox {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || 40;
    this.height = options.height || 90;
    this.type = options.type || 'body'; // 'body', 'head', 'legs'
    this.owner = options.owner || null;
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
}

export function checkAABB(boxA, boxB) {
  if (!boxA || !boxB) return false;
  const a = boxA.getBounds ? boxA.getBounds() : (boxA.left !== undefined ? boxA : { left: boxA.x, right: boxA.x + boxA.width, top: boxA.y, bottom: boxA.y + boxA.height });
  const b = boxB.getBounds ? boxB.getBounds() : (boxB.left !== undefined ? boxB : { left: boxB.x, right: boxB.x + boxB.width, top: boxB.y, bottom: boxB.y + boxB.height });
  if (!a || !b) return false;

  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

export class Projectile {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.radius = options.radius || 18;
    this.color = options.color || '#00D2FF';
    this.damage = options.damage || 110;
    this.owner = options.owner || null;
    this.life = options.life || 75; // frames
    this.active = true;
    this.hasHit = false;
    this.homing = !!options.homing;
    this.type = options.type || 'sphere'; // 'sphere', 'crescent', 'trap'
    this.hitStop = options.hitStop || 6;
    this.knockbackX = options.knockbackX || 4;
    this.knockbackY = options.knockbackY || -2;
    this.hitStun = options.hitStun || 16;
  }

  update(opponent) {
    if (this.homing && opponent && this.life > 20) {
      const targetY = opponent.y - 50;
      const dy = targetY - this.y;
      this.vy += Math.sign(dy) * 0.35;
      this.vy = Math.max(-3.5, Math.min(3.5, this.vy));
    }
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  getBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius
    };
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    if (this.type === 'crescent') {
      ctx.arc(this.x, this.y, this.radius, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.arc(this.x - 6, this.y, this.radius * 0.7, Math.PI * 0.5, -Math.PI * 0.5, true);
    } else {
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  render(ctx) {
    this.draw(ctx);
  }
}
