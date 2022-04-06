import { _decorator, Component, Node, Vec3, Prefab, instantiate, director } from 'cc';

const { ccclass, property, executionOrder } = _decorator;

/**
 * 效果管理器
 */
@ccclass('EffectManger')
@executionOrder(-1)
export class EffectManger extends Component {

    @property({ type: Prefab, displayName:  '炮弹爆炸效果预制体' })
    protected bulletExplosionPrefab: Prefab = null;

    /**
     * 静态实例
     */
    public static get instance() {
        return this._instance;
    }
    private static _instance: EffectManger = null;

    /**
     * 生命周期
     */
    protected onLoad() {
        EffectManger._instance = this;
    }

    /**
     * 生命周期
     */
    protected onDestroy() {
        if (EffectManger._instance === this) {
            EffectManger._instance = null;
        }
    }

    /**
     * 播放炮弹爆炸效果
     * @param pos 
     */
    public playBulletExplosion(pos: Vec3) {
        // 生成节点
        const node = instantiate(this.bulletExplosionPrefab);
        director.getScene().addChild(node);
        node.setWorldPosition(pos);
        // 定时销毁
        this.scheduleOnce(() => node.destroy(), 1);
    }

}
