import { _decorator, Component, Node, Vec3, Prefab, instantiate, Color, MeshRenderer, Quat, NodePool } from 'cc';
import { DEV, PREVIEW } from 'cc/env';
import { ProjectileMath } from './ProjectileMath';
import { VectorUtil } from './utils/VectorUtil';

const { ccclass, property } = _decorator;

/**
 * 弹道绘制器
 */
@ccclass('TrajectoryDrawer')
export class TrajectoryDrawer extends Component {

    @property({ type: Prefab, displayName: '轨迹点预制体' })
    protected prefab: Prefab = null;

    @property({ displayName: '固定轨迹点数量' })
    protected fixedQuantity: boolean = false;

    @property({ visible() { return this.fixedQuantity; }, displayName: '轨迹点数量' })
    protected quantity: number = 20;

    /**
     * 节点列表
     */
    protected points: Node[] = [];

    /**
     * 节点池
     */
    protected nodePool: NodePool = new NodePool;

    /**
     * 临时工
     */
    protected tempVec3: Vec3 = new Vec3;

    /**
     * 临时工
     */
    protected tempQuat: Quat = new Quat;

    /**
     * 绘制轨迹
     * @param startPos 开始位置
     * @param targetPos 目标位置
     * @param angle 初始角度
     * @param velocity 初始速度
     * @param fixedDistance 固定水平位移
     */
    public draw(startPos: Vec3, targetPos: Vec3, angle: number, velocity: number, fixedDistance?: number) {
        // 从发射点指向目标点的方向矢量
        const direction = Vec3.subtract(new Vec3, targetPos, startPos);
        // 将方向矢量投影到水平面上
        const directionOnPlane = VectorUtil.projectOnPlane(direction, Vec3.UP);
        // 水平位移
        const distance = (fixedDistance != undefined) ? fixedDistance : directionOnPlane.length();
        // 总时间
        const time = ProjectileMath.calculateTotalTime(distance, angle, velocity);
        // 轨迹点数量
        let count: number;
        if (this.fixedQuantity) {
            count = Math.ceil(this.quantity);
        } else {
            count = Math.max(8, Math.ceil(distance * 3));
        }
        // 轨迹点之间的时间间隔
        const interval = time / count;

        // 生产节点
        this.producePoints(count);

        // 向前矢量
        const forward = directionOnPlane.normalize();
        // 临时变量
        const points = this.points, tempVec3 = this.tempVec3, tempQuat = this.tempQuat;
        // 更新轨迹点的位置和旋转
        for (let i = 0; i < count; i++) {
            // 取得节点
            const node = points[i];
            node.active = true;

            // 位置
            // 计算位移
            const time = (i + 1) * interval;
            const { x, y } = ProjectileMath.calculateDisplacementAtMoment(angle, velocity, time);
            // 发射点位置
            const position = startPos.clone();
            // 叠加水平位移
            position.add(tempVec3.set(forward).multiplyScalar(x));
            // 叠加垂直位移
            position.add(tempVec3.set(Vec3.UP).multiplyScalar(y));
            // 设置轨迹点位置
            node.setWorldPosition(position);

            // 旋转
            // 根据前方向和上方向生成四元数（应用偏航角）
            const rotation = Quat.fromViewUp(tempQuat, forward, Vec3.UP);
            // 计算瞬时运动角度（俯仰角）
            const pitch = -ProjectileMath.calculateAngleAtMoment(angle, velocity, time, true);
            // 基于 x 轴旋转（应用俯仰角）
            Quat.rotateX(rotation, rotation, pitch);
            // 设置轨迹点旋转
            node.setWorldRotation(rotation);
        }
    }

    /**
     * 清除
     */
    public clear() {
        this.producePoints(0);
    }

    /**
     * 设置颜色
     * @param color 颜色
     */
    public setColor(color: Color) {
        // 获取预制体根节点的渲染器
        let renderer: MeshRenderer = this.prefab.data.getComponent(MeshRenderer);
        // 没有的话，获取子节点身上的渲染器
        if (!renderer) {
            renderer = this.prefab.data.getComponentInChildren(MeshRenderer)
        }
        // 改变共享材质的颜色
        if (renderer) {
            renderer.sharedMaterial.setProperty('mainColor', color);
        }
    }

    /**
     * 生产节点
     * @param quantity 数量
     */
    protected producePoints(quantity: number) {
        const points = this.points;
        if (points.length < quantity) {
            let diff = quantity - points.length;
            while (diff > 0) {
                points.push(this.getPoint());
                diff--;
            }
        } else if (points.length > quantity) {
            let diff = points.length - quantity;
            while (diff > 0) {
                this.putPoint(points.pop());
                diff--;
            }
        }
    }

    /**
     * 获取节点
     */
    protected getPoint() {
        let node: Node;
        if (this.nodePool.size() > 0) {
            node = this.nodePool.get();
        } else {
            node = instantiate(this.prefab);
        }
        node.setParent(this.node);
        return node;
    }

    /**
     * 归还节点
     * @param node 节点
     */
    protected putPoint(node: Node) {
        if (this.nodePool.size() < 50) {
            this.nodePool.put(node);
        } else {
            node.destroy();
        }
    }

}
