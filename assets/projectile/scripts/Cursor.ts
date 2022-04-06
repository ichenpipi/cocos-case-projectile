import { _decorator, Component, Node, Vec3, Quat } from 'cc';
import { EDITOR } from 'cc/env';
import { VectorUtil } from './utils/VectorUtil';

const { ccclass, property } = _decorator;

/**
 * 光标
 */
@ccclass('Cursor')
export class Cursor extends Component {

    @property
    protected _adaptToSurface: boolean = false;
    @property({ displayName: '适应目标表面' })
    public get adaptToSurface() {
        return this._adaptToSurface;
    }
    public set adaptToSurface(value) {
        this._adaptToSurface = value;
        if (!EDITOR && !value) {
            this.node.setWorldRotation(Quat.fromEuler(new Quat, 0, 0, 0));
        }
    }

    @property({ type: Node, displayName: '参照节点（留空则参照世界原点）', visible() { return this.adaptToSurface; } })
    public referNode: Node = null;

    /**
     * 临时工
     */
    protected tempVec3: Vec3 = new Vec3();

    /**
     * 临时工
     */
    protected tempQuat: Quat = new Quat();

    /**
     * 设置光标
     * @param position 位置
     * @param normal 法线
     */
    public set(position: Vec3, normal?: Vec3) {
        // 位置
        this.node.setWorldPosition(position);

        // 旋转
        if (this.adaptToSurface && normal) {
            // 参照位置
            const referPos = this.referNode?.getWorldPosition() ?? Vec3.ZERO;
            // 创建一条从参照位置指向目标位置的方向向量
            const direction = Vec3.subtract(this.tempVec3, position, referPos);

            // 将方向向量投影到法线所表示的平面上，归一化后作为向前向量使用
            const forward = VectorUtil.projectOnPlane(direction, normal).normalize();

            // 以给定的法线作为正上方向，向前向量作为正前方向
            const rotation = Quat.fromViewUp(this.tempQuat, forward, normal);
            this.node.setWorldRotation(rotation);
        }
    }

}
