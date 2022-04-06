import { _decorator, Component, Node, Collider, ICollisionEvent } from 'cc';
import { EffectManger } from './EffectManger';

const { ccclass, property } = _decorator;

/**
 * 炮弹
 */
@ccclass('Bullet')
export class Bullet extends Component {

    /**
     * 是否触发爆炸
     */
    public static triggerExplode: boolean = false;

    /**
     * 碰撞器
     */
    protected collider: Collider = null;

    /**
     * 是否已被触发
     */
    protected triggered: boolean = false;

    /**
     * 生命周期
     */
    protected onLoad() {
        this.collider = this.getComponent(Collider);
        this.collider.on('onCollisionEnter', this.onCollisionEnter, this);
    }

    /**
     * 生命周期
     */
    protected onDestroy() {
        this.collider.off('onCollisionEnter', this.onCollisionEnter, this);
    }

    /**
     * 碰撞回调：开始
     * @param event 
     */
    protected onCollisionEnter(event: ICollisionEvent) {
        if (this.triggered) {
            return;
        }
        this.triggered = true;
        if (Bullet.triggerExplode) {
            this.trigger();
        }
    }

    /**
     * 触发
     */
    protected trigger() {
        // 播放效果
        EffectManger.instance.playBulletExplosion(this.node.getWorldPosition());
        // 销毁自己
        this.node.destroy();
    }

}
